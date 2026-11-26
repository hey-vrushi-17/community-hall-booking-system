-- ==============================================================================
-- CivicSpaces Community Hall Booking & Management System
-- Migration 04: GDPR Compliance, Consent Receipts, Data Deletion & Breach Logs
-- ==============================================================================

-- 1. Extend profiles with unbundled marketing consent tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_updated_at TIMESTAMPTZ;

-- 2. Extend bookings with policy/consent metadata
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS terms_version TEXT NOT NULL DEFAULT '2026.1',
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Consent Records table (GDPR Art. 7 accountability log)
CREATE TABLE IF NOT EXISTS public.consent_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_email TEXT,
  consent_type TEXT NOT NULL CHECK (
    consent_type IN (
      'COOKIE_ESSENTIAL',
      'COOKIE_FUNCTIONAL',
      'COOKIE_ANALYTICS',
      'MARKETING_EMAIL',
      'TERMS_AND_PRIVACY',
      'PAYMENT_TERMS'
    )
  ),
  granted BOOLEAN NOT NULL,
  policy_version TEXT NOT NULL,
  source TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON public.consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_email ON public.consent_records(subject_email);
CREATE INDEX IF NOT EXISTS idx_consent_records_recorded_at ON public.consent_records(recorded_at DESC);

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consent records" ON public.consent_records;
CREATE POLICY "Users can view own consent records"
  ON public.consent_records FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Users can record own consent" ON public.consent_records;
CREATE POLICY "Users can record own consent"
  ON public.consent_records FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR (SELECT auth.uid()) = user_id);

-- 4. Data Deletion Requests table (GDPR Art. 17 Right to Erasure)
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reference_code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_email TEXT NOT NULL,
  requester_name TEXT,
  booking_reference TEXT,
  scope TEXT NOT NULL CHECK (scope IN ('FULL_ACCOUNT', 'BOOKING_PII', 'MARKETING_DATA')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  anonymized_records_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON public.data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_email ON public.data_deletion_requests(requester_email);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON public.data_deletion_requests(status);

ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own deletion requests" ON public.data_deletion_requests;
CREATE POLICY "Users can view own deletion requests"
  ON public.data_deletion_requests FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id OR public.is_admin_or_staff());

DROP POLICY IF EXISTS "Users can submit own deletion requests" ON public.data_deletion_requests;
CREATE POLICY "Users can submit own deletion requests"
  ON public.data_deletion_requests FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND status = 'PENDING');

DROP POLICY IF EXISTS "Admins can update deletion requests" ON public.data_deletion_requests;
CREATE POLICY "Admins can update deletion requests"
  ON public.data_deletion_requests FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());

-- 5. Breach Incidents table (GDPR Art. 33 & 34 72-Hour Incident Register)
CREATE TABLE IF NOT EXISTS public.breach_incidents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  incident_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'DETECTED' CHECK (
    status IN (
      'DETECTED',
      'CONTAINED',
      'ASSESSING',
      'NOTIFIED_AUTHORITY',
      'NOTIFIED_SUBJECTS',
      'RESOLVED'
    )
  ),
  affected_data_categories TEXT[] NOT NULL DEFAULT '{}',
  estimated_affected_subjects INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL,
  containment_actions TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notification_deadline_at TIMESTAMPTZ NOT NULL,
  authority_notified_at TIMESTAMPTZ,
  subjects_notified_at TIMESTAMPTZ,
  reported_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_breach_incidents_status ON public.breach_incidents(status);
CREATE INDEX IF NOT EXISTS idx_breach_incidents_detected_at ON public.breach_incidents(detected_at DESC);

ALTER TABLE public.breach_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage breach incidents" ON public.breach_incidents;
CREATE POLICY "Admins can manage breach incidents"
  ON public.breach_incidents FOR ALL
  TO authenticated
  USING (public.is_admin_or_staff())
  WITH CHECK (public.is_admin_or_staff());
