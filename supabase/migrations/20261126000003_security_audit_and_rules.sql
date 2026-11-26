-- ==============================================================================
-- CivicSpaces Community Hall Booking & Management System
-- Migration 03: Security Hardening, Audit Completeness, Self-Service Cancellation,
--               Maintenance Creator Tracking, and Storage Policies
-- ==============================================================================

-- 1. Fix handle_new_user() privilege escalation:
--    NEVER read role from user-editable raw_user_meta_data! Always assign 'CITIZEN'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, organization, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), NEW.email),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'organization'), ''),
    'CITIZEN'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Harden is_admin_or_staff() with explicit search_path and safe JWT/profile check
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    (auth.role() = 'service_role') OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('STAFF', 'ADMIN')
    )
  );
END;
$$;

-- Wait: avoid deprecated auth.role() inside RLS helpers where possible; use current_setting/jwt
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    (COALESCE((auth.jwt() ->> 'role'), '') = 'service_role') OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('STAFF', 'ADMIN')
    )
  );
END;
$$;

-- 3. Prevent non-admin users from escalating their own role via UPDATE on profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT (
      COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
      OR current_user IN ('postgres', 'supabase_admin')
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'
      )
    ) THEN
      RAISE EXCEPTION 'INSUFFICIENT_PRIVILEGE: Only an administrator or database service role may change user roles';
    END IF;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role_update ON public.profiles;
CREATE TRIGGER protect_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_escalation();

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- 4. Add created_by (creator) column to maintenance_windows
ALTER TABLE public.maintenance_windows
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_created_by ON public.maintenance_windows(created_by);

-- 5. Allow authenticated users to cancel ONLY their own PENDING bookings
DROP POLICY IF EXISTS "Requesters can cancel own pending bookings" ON public.bookings;
CREATE POLICY "Requesters can cancel own pending bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND status = 'PENDING'
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND status = 'CANCELLED'
  );

-- Ensure admins have both USING and WITH CHECK on bookings UPDATE
DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;
CREATE POLICY "Admins can update bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

-- Ensure Admins can insert audit_events directly when using authenticated session
DROP POLICY IF EXISTS "Admins can insert audit events" ON public.audit_events;
CREATE POLICY "Admins can insert audit events"
  ON public.audit_events FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_staff());

-- Allow authenticated requesters to log their own submission/cancellation audit events
DROP POLICY IF EXISTS "Users can insert own booking audit events" ON public.audit_events;
CREATE POLICY "Users can insert own booking audit events"
  ON public.audit_events FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = (SELECT auth.uid())
    AND entity_type = 'Booking'
    AND action IN ('SUBMIT_BOOKING_REQUEST', 'CANCEL_BOOKING')
  );

-- 6. Upgrade transaction-safe approval function (approve_booking_tx)
--    Verifies caller is admin/staff (or service_role), locks hall + booking rows,
--    blocks approving CANCELLED bookings, checks overlaps with APPROVED bookings and
--    active maintenance windows, records real actor_email in audit_events.
DROP FUNCTION IF EXISTS public.approve_booking_tx(TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.approve_booking_tx(
  p_booking_id TEXT,
  p_admin_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_actor_email TEXT DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_conflict_count INTEGER;
  v_effective_admin_id UUID;
  v_effective_email TEXT;
BEGIN
  -- Authorize caller: must be service_role, postgres, or authenticated STAFF/ADMIN
  IF NOT (
    COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
    OR public.is_admin_or_staff()
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Staff or Administrator privileges are required to approve bookings';
  END IF;

  v_effective_admin_id := COALESCE(p_admin_id, (SELECT auth.uid()));

  -- Resolve actor email safely
  IF p_actor_email IS NOT NULL AND LENGTH(TRIM(p_actor_email)) > 0 THEN
    v_effective_email := TRIM(p_actor_email);
  ELSIF v_effective_admin_id IS NOT NULL THEN
    SELECT email INTO v_effective_email FROM auth.users WHERE id = v_effective_admin_id;
  END IF;
  v_effective_email := COALESCE(v_effective_email, 'admin@civic.example');

  -- Lock the booking row for update
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND: Booking with id % does not exist', p_booking_id;
  END IF;

  IF v_booking.status = 'CANCELLED' THEN
    RAISE EXCEPTION 'CANNOT_APPROVE_CANCELLED: Cancelled booking requests cannot be approved';
  END IF;

  IF v_booking.status = 'APPROVED' THEN
    RETURN v_booking;
  END IF;

  -- Lock the hall row to serialize concurrent approval attempts for the same facility
  PERFORM 1 FROM public.halls WHERE id = v_booking.hall_id FOR UPDATE;

  -- Verify no approved booking overlaps
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.bookings
  WHERE hall_id = v_booking.hall_id
    AND id <> v_booking.id
    AND status = 'APPROVED'
    AND tstzrange(start_time, end_time) && tstzrange(v_booking.start_time, v_booking.end_time);

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'CANNOT_APPROVE_OVERLAP: Hall already has an approved event in this time interval';
  END IF;

  -- Verify no active maintenance window overlaps
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.maintenance_windows
  WHERE hall_id = v_booking.hall_id
    AND status IN ('SCHEDULED', 'IN_PROGRESS')
    AND tstzrange(start_time, end_time) && tstzrange(v_booking.start_time, v_booking.end_time);

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'CANNOT_APPROVE_MAINTENANCE: Hall is reserved for maintenance in this time interval';
  END IF;

  -- Update booking to APPROVED
  UPDATE public.bookings
  SET status = 'APPROVED',
      reviewed_by = v_effective_admin_id,
      reviewed_at = NOW(),
      decision_notes = COALESCE(NULLIF(TRIM(p_notes), ''), 'Approved by municipal facility administrator.'),
      updated_at = NOW()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  -- Log audit record
  INSERT INTO public.audit_events (
    actor_id,
    actor_email,
    action,
    entity_type,
    entity_id,
    summary,
    metadata
  ) VALUES (
    v_effective_admin_id,
    v_effective_email,
    'APPROVE_BOOKING',
    'Booking',
    p_booking_id,
    'Approved booking reference ' || v_booking.reference_number,
    jsonb_build_object(
      'hall_id', v_booking.hall_id,
      'start_time', v_booking.start_time,
      'end_time', v_booking.end_time,
      'notes', v_booking.decision_notes
    )
  );

  RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_booking_tx(TEXT, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_booking_tx(TEXT, UUID, TEXT, TEXT) TO authenticated, service_role;

-- 7. Public-safe availability & reference lookup RPCs (never expose PII to anon)
CREATE OR REPLACE FUNCTION public.get_public_hall_schedule(
  p_hall_id TEXT,
  p_day_start TIMESTAMPTZ,
  p_day_end TIMESTAMPTZ
)
RETURNS TABLE (
  kind TEXT,
  title TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    'APPROVED_BOOKING'::TEXT AS kind,
    b.event_name AS title,
    b.start_time,
    b.end_time,
    b.status
  FROM public.bookings b
  WHERE b.hall_id = p_hall_id
    AND b.status = 'APPROVED'
    AND b.start_time < p_day_end
    AND b.end_time > p_day_start

  UNION ALL

  SELECT
    'MAINTENANCE_WINDOW'::TEXT AS kind,
    m.title,
    m.start_time,
    m.end_time,
    m.status
  FROM public.maintenance_windows m
  WHERE m.hall_id = p_hall_id
    AND m.status IN ('SCHEDULED', 'IN_PROGRESS')
    AND m.start_time < p_day_end
    AND m.end_time > p_day_start;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_hall_schedule(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated, service_role;

-- 8. Storage bucket & RLS policies for Hall Images (if using Supabase Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hall-images', 'hall-images', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view hall images" ON storage.objects;
CREATE POLICY "Public can view hall images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hall-images');

DROP POLICY IF EXISTS "Admins can upload hall images" ON storage.objects;
CREATE POLICY "Admins can upload hall images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'hall-images' AND public.is_admin_or_staff());

DROP POLICY IF EXISTS "Admins can update hall images" ON storage.objects;
CREATE POLICY "Admins can update hall images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'hall-images' AND public.is_admin_or_staff())
  WITH CHECK (bucket_id = 'hall-images' AND public.is_admin_or_staff());

DROP POLICY IF EXISTS "Admins can delete hall images" ON storage.objects;
CREATE POLICY "Admins can delete hall images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'hall-images' AND public.is_admin_or_staff());
