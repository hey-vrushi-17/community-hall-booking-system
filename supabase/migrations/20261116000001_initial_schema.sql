-- ==============================================================================
-- CivicSpaces Community Hall Booking & Management System
-- Migration 01: Initial Schema, Constraints, Stored Procedures, and RLS Policies
-- ==============================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Profiles table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'CITIZEN' CHECK (role IN ('CITIZEN', 'STAFF', 'ADMIN')),
  full_name TEXT,
  phone TEXT,
  organization TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to create profile row upon auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'CITIZEN')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Halls table
CREATE TABLE IF NOT EXISTS public.halls (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  rules_and_policies TEXT[] NOT NULL DEFAULT '{}',
  operating_hours JSONB NOT NULL DEFAULT '{"open": "08:00", "close": "22:00", "days": "Monday through Sunday"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reference_number TEXT UNIQUE NOT NULL,
  hall_id TEXT NOT NULL REFERENCES public.halls(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Requester Information
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  requester_org TEXT,
  
  -- Event Details
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  expected_attendees INTEGER NOT NULL CHECK (expected_attendees > 0),
  special_requests TEXT,
  
  -- Schedule Range
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  CONSTRAINT check_booking_times CHECK (end_time > start_time),
  
  -- Decision & Review Status
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  decision_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Database-Level Overlap Exclusion Constraint:
-- Ensures that NO TWO APPROVED bookings can ever overlap in time for the same hall!
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS no_overlapping_approved_bookings;
ALTER TABLE public.bookings
  ADD CONSTRAINT no_overlapping_approved_bookings
  EXCLUDE USING gist (
    hall_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
  WHERE (status = 'APPROVED');

-- 5. Maintenance Windows table
CREATE TABLE IF NOT EXISTS public.maintenance_windows (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  hall_id TEXT NOT NULL REFERENCES public.halls(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  reason TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT check_maintenance_times CHECK (end_time > start_time),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Database-Level Overlap Exclusion Constraint for Maintenance
ALTER TABLE public.maintenance_windows
  DROP CONSTRAINT IF EXISTS no_overlapping_active_maintenance;
ALTER TABLE public.maintenance_windows
  ADD CONSTRAINT no_overlapping_active_maintenance
  EXCLUDE USING gist (
    hall_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
  WHERE (status IN ('SCHEDULED', 'IN_PROGRESS'));

-- 6. Audit Events table
CREATE TABLE IF NOT EXISTS public.audit_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. High-Performance Query Indexes
CREATE INDEX IF NOT EXISTS idx_halls_slug ON public.halls(slug);
CREATE INDEX IF NOT EXISTS idx_halls_is_active ON public.halls(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_hall_id ON public.bookings(hall_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_time_range ON public.bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(reference_number);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_hall_id ON public.maintenance_windows(hall_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_time_range ON public.maintenance_windows(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_events(timestamp DESC);

-- 8. Transaction-Safe Database Functions

-- Check slot availability in a single atomic database query
CREATE OR REPLACE FUNCTION public.check_slot_availability(
  p_hall_id TEXT,
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
  v_conflicting_bookings_count INTEGER;
  v_conflicting_maintenance_count INTEGER;
  v_result JSONB;
BEGIN
  -- Check for overlapping approved bookings
  SELECT COUNT(*)
  INTO v_conflicting_bookings_count
  FROM public.bookings
  WHERE hall_id = p_hall_id
    AND status = 'APPROVED'
    AND tstzrange(start_time, end_time) && tstzrange(p_start, p_end);

  -- Check for overlapping active maintenance windows
  SELECT COUNT(*)
  INTO v_conflicting_maintenance_count
  FROM public.maintenance_windows
  WHERE hall_id = p_hall_id
    AND status IN ('SCHEDULED', 'IN_PROGRESS')
    AND tstzrange(start_time, end_time) && tstzrange(p_start, p_end);

  v_result := jsonb_build_object(
    'is_available', (v_conflicting_bookings_count = 0 AND v_conflicting_maintenance_count = 0),
    'approved_conflicts_count', v_conflicting_bookings_count,
    'maintenance_conflicts_count', v_conflicting_maintenance_count
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Concurrency-safe booking approval function with row locking
CREATE OR REPLACE FUNCTION public.approve_booking_tx(
  p_booking_id TEXT,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.bookings AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_conflict_count INTEGER;
BEGIN
  -- Lock the booking row for update
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking with id % does not exist', p_booking_id;
  END IF;

  IF v_booking.status = 'APPROVED' THEN
    RETURN v_booking; -- Already approved
  END IF;

  -- Lock all active rows for this hall to serialize concurrent approval attempts
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

  -- Verify no maintenance window overlaps
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
      reviewed_by = p_admin_id,
      reviewed_at = NOW(),
      decision_notes = p_notes,
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
    p_admin_id,
    'admin@civic.local',
    'APPROVE_BOOKING',
    'Booking',
    p_booking_id,
    'Approved booking reference ' || v_booking.reference_number,
    jsonb_build_object('hall_id', v_booking.hall_id, 'start_time', v_booking.start_time, 'end_time', v_booking.end_time)
  );

  RETURN v_booking;
END;
$$ LANGUAGE plpgsql;

-- 9. Row Level Security (RLS) Policies

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Helper to check if current authenticated user has administrative privileges
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'role' = 'service_role') OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('STAFF', 'ADMIN')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- HALLS Policies
-- Public users can view active facilities
DROP POLICY IF EXISTS "Public can view active halls" ON public.halls;
CREATE POLICY "Public can view active halls"
  ON public.halls FOR SELECT
  USING (is_active = TRUE OR public.is_admin_or_staff());

-- Only administrative staff can insert, update, or delete halls
DROP POLICY IF EXISTS "Admins can manage halls" ON public.halls;
CREATE POLICY "Admins can manage halls"
  ON public.halls FOR ALL
  USING (public.is_admin_or_staff());

-- BOOKINGS Policies
-- Public can submit new booking requests, strictly initialized with 'PENDING' status
DROP POLICY IF EXISTS "Public can submit pending booking requests" ON public.bookings;
CREATE POLICY "Public can submit pending booking requests"
  ON public.bookings FOR INSERT
  WITH CHECK (status = 'PENDING');

-- Requesters can view only their own booking requests; Admins/Staff can view all
DROP POLICY IF EXISTS "Requesters can view own bookings" ON public.bookings;
CREATE POLICY "Requesters can view own bookings"
  ON public.bookings FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    public.is_admin_or_staff()
  );

-- Only administrative staff can update booking status (approve/reject)
DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;
CREATE POLICY "Admins can update bookings"
  ON public.bookings FOR UPDATE
  USING (public.is_admin_or_staff());

-- MAINTENANCE WINDOWS Policies
-- Public users can view maintenance schedules so they understand unavailable dates
DROP POLICY IF EXISTS "Public can view maintenance windows" ON public.maintenance_windows;
CREATE POLICY "Public can view maintenance windows"
  ON public.maintenance_windows FOR SELECT
  USING (TRUE);

-- Only administrative staff can manage maintenance windows
DROP POLICY IF EXISTS "Admins can manage maintenance" ON public.maintenance_windows;
CREATE POLICY "Admins can manage maintenance"
  ON public.maintenance_windows FOR ALL
  USING (public.is_admin_or_staff());

-- AUDIT EVENTS Policies
DROP POLICY IF EXISTS "Admins can view audit events" ON public.audit_events;
CREATE POLICY "Admins can view audit events"
  ON public.audit_events FOR SELECT
  USING (public.is_admin_or_staff());
