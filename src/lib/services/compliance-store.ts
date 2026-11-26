import {
  BreachIncident,
  BreachSeverity,
  BreachStatus,
  ConsentRecord,
  ConsentType,
  DataDeletionRequest,
} from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient, getTrustedServerClient } from '@/lib/supabase/server';
import { DatabaseSetupError } from './hall-service';
import {
  anonymizePiiForSubject,
  getBookingsByEmail,
  getUserBookings,
  recordAuditEvent,
} from './booking-store';
import { COMPLIANCE_VERSIONS } from '@/lib/config/compliance-config';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toNullableUuid(value?: string | null): string | null {
  return value && UUID_REGEX.test(value) ? value : null;
}

interface DatabaseConsentRow {
  id: string;
  user_id: string | null;
  subject_email: string | null;
  consent_type: ConsentType;
  granted: boolean;
  policy_version: string;
  source: string;
  legal_basis: string;
  recorded_at: string;
  metadata: Record<string, unknown> | null;
}

interface DatabaseDeletionRow {
  id: string;
  reference_code: string;
  user_id: string | null;
  requester_email: string;
  requester_name: string | null;
  booking_reference: string | null;
  scope: 'FULL_ACCOUNT' | 'BOOKING_PII' | 'MARKETING_DATA';
  reason: string | null;
  status: 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED';
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  anonymized_records_count: number;
  created_at: string;
  updated_at: string;
}

interface DatabaseBreachRow {
  id: string;
  incident_code: string;
  title: string;
  severity: BreachSeverity;
  status: BreachStatus;
  affected_data_categories: string[];
  estimated_affected_subjects: number;
  summary: string;
  containment_actions: string;
  detected_at: string;
  notification_deadline_at: string;
  authority_notified_at: string | null;
  subjects_notified_at: string | null;
  reported_by: string;
  created_at: string;
  updated_at: string;
}

function mapConsentFromDb(row: DatabaseConsentRow): ConsentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    subjectEmail: row.subject_email,
    consentType: row.consent_type,
    granted: Boolean(row.granted),
    policyVersion: row.policy_version,
    source: row.source,
    legalBasis: row.legal_basis,
    recordedAt: row.recorded_at,
    metadata: row.metadata ?? undefined,
  };
}

function mapDeletionFromDb(row: DatabaseDeletionRow): DataDeletionRequest {
  return {
    id: row.id,
    referenceCode: row.reference_code,
    userId: row.user_id,
    requesterEmail: row.requester_email,
    requesterName: row.requester_name,
    bookingReference: row.booking_reference,
    scope: row.scope,
    reason: row.reason,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    resolutionNotes: row.resolution_notes,
    anonymizedRecordsCount: Number(row.anonymized_records_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBreachFromDb(row: DatabaseBreachRow): BreachIncident {
  return {
    id: row.id,
    incidentCode: row.incident_code,
    title: row.title,
    severity: row.severity,
    status: row.status,
    affectedDataCategories: Array.isArray(row.affected_data_categories)
      ? row.affected_data_categories
      : [],
    estimatedAffectedSubjects: Number(row.estimated_affected_subjects || 0),
    summary: row.summary,
    containmentActions: row.containment_actions,
    detectedAt: row.detected_at,
    notificationDeadlineAt: row.notification_deadline_at,
    authorityNotifiedAt: row.authority_notified_at,
    subjectsNotifiedAt: row.subjects_notified_at,
    reportedBy: row.reported_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const INITIAL_DELETION_REQUESTS: DataDeletionRequest[] = [
  {
    id: 'del-sample-01',
    referenceCode: 'DEL-2026-4102',
    userId: null,
    requesterEmail: 'past-organizer@example.org',
    requesterName: 'Former Event Organizer',
    bookingReference: null,
    scope: 'MARKETING_DATA',
    reason: 'Opting out and requesting erasure of outreach contact details.',
    status: 'COMPLETED',
    reviewedBy: 'admin@civic.example',
    reviewedAt: '2026-11-12T09:30:00Z',
    resolutionNotes: 'Marketing consent revoked and contact details purged.',
    anonymizedRecordsCount: 1,
    createdAt: '2026-11-11T14:20:00Z',
    updatedAt: '2026-11-12T09:30:00Z',
  },
];

const INITIAL_BREACH_INCIDENTS: BreachIncident[] = [
  {
    id: 'inc-sample-01',
    incidentCode: 'INC-2026-001',
    title: 'Sample Drill: Unauthorized Admin Login Attempt Alert (No Data Exfiltration)',
    severity: 'LOW',
    status: 'RESOLVED',
    affectedDataCategories: ['Authentication Logs (No Citizen PII Exposed)'],
    estimatedAffectedSubjects: 0,
    summary:
      'Tabletop incident simulation verifying 72-hour GDPR Art. 33 triage workflow, HMAC session invalidation, and audit trail logging.',
    containmentActions:
      'Verified rate limiting, rotated dev session secret, confirmed zero unauthorized data reads via Supabase Postgres audit logs.',
    detectedAt: '2026-11-05T10:00:00Z',
    notificationDeadlineAt: '2026-11-08T10:00:00Z',
    authorityNotifiedAt: null,
    subjectsNotifiedAt: null,
    reportedBy: 'security-drill@civic.example',
    createdAt: '2026-11-05T10:05:00Z',
    updatedAt: '2026-11-05T16:30:00Z',
  },
];

class ComplianceDataStore {
  private consentRecords: ConsentRecord[] = [];
  private deletionRequests: DataDeletionRequest[] = [...INITIAL_DELETION_REQUESTS];
  private breachIncidents: BreachIncident[] = [...INITIAL_BREACH_INCIDENTS];

  public async recordConsent(input: {
    userId?: string | null;
    subjectEmail?: string | null;
    consentType: ConsentType;
    granted: boolean;
    policyVersion: string;
    source: string;
    legalBasis: string;
    metadata?: Record<string, unknown>;
  }): Promise<ConsentRecord> {
    const nowIso = new Date().toISOString();
    const id = `cns-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`;
    const cleanEmail = input.subjectEmail?.trim().toLowerCase() || null;
    const cleanUserId = toNullableUuid(input.userId);

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      const supabase = adminClient ?? (await getTrustedServerClient());
      if (!supabase) {
        throw new DatabaseSetupError('Supabase client is unavailable.');
      }

      const { data, error } = await supabase
        .from('consent_records')
        .insert({
          id,
          user_id: cleanUserId,
          subject_email: cleanEmail,
          consent_type: input.consentType,
          granted: input.granted,
          policy_version: input.policyVersion,
          source: input.source,
          legal_basis: input.legalBasis,
          metadata: input.metadata ?? {},
          recorded_at: nowIso,
        })
        .select('*')
        .single();

      if (error || !data) {
        throw new DatabaseSetupError(
          `Failed to record consent (${error?.code || 'DB_ERROR'}): ${error?.message || 'Unknown error'}`,
          error?.code || 'DB_ERROR'
        );
      }

      if (cleanUserId && input.consentType === 'MARKETING_EMAIL') {
        await supabase
          .from('profiles')
          .update({
            marketing_opt_in: input.granted,
            consent_updated_at: nowIso,
          })
          .eq('id', cleanUserId);
      }

      await recordAuditEvent({
        actorId: cleanUserId,
        actorEmail: cleanEmail || 'anonymous-visitor@civic.local',
        action: input.granted ? 'GRANT_CONSENT' : 'WITHDRAW_CONSENT',
        entityType: 'Consent',
        entityId: id,
        summary: `${input.consentType} ${input.granted ? 'granted' : 'withdrawn'} via ${input.source} (v${input.policyVersion})`,
        metadata: { consentType: input.consentType, source: input.source, granted: input.granted },
      });

      return mapConsentFromDb(data as unknown as DatabaseConsentRow);
    }

    const record: ConsentRecord = {
      id,
      userId: cleanUserId,
      subjectEmail: cleanEmail,
      consentType: input.consentType,
      granted: input.granted,
      policyVersion: input.policyVersion,
      source: input.source,
      legalBasis: input.legalBasis,
      recordedAt: nowIso,
      metadata: input.metadata,
    };
    this.consentRecords.unshift(record);

    await recordAuditEvent({
      actorId: cleanUserId,
      actorEmail: cleanEmail || 'anonymous-visitor@civic.local',
      action: input.granted ? 'GRANT_CONSENT' : 'WITHDRAW_CONSENT',
      entityType: 'Consent',
      entityId: id,
      summary: `${input.consentType} ${input.granted ? 'granted' : 'withdrawn'} via ${input.source} (v${input.policyVersion})`,
      metadata: { consentType: input.consentType, source: input.source, granted: input.granted },
    });

    return record;
  }

  public async getConsentHistory(params: {
    userId?: string | null;
    email?: string | null;
  }): Promise<ConsentRecord[]> {
    const cleanUserId = toNullableUuid(params.userId);
    const cleanEmail = params.email?.trim().toLowerCase() || null;

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      const supabase = adminClient ?? (await getTrustedServerClient());
      if (!supabase) {
        throw new DatabaseSetupError('Supabase client is unavailable.');
      }

      let query = supabase
        .from('consent_records')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (cleanUserId && cleanEmail) {
        query = query.or(`user_id.eq.${cleanUserId},subject_email.eq.${cleanEmail}`);
      } else if (cleanUserId) {
        query = query.eq('user_id', cleanUserId);
      } else if (cleanEmail) {
        query = query.eq('subject_email', cleanEmail);
      } else {
        return [];
      }

      const { data, error } = await query;
      if (error) {
        throw new DatabaseSetupError(
          `Failed to load consent history (${error.code || 'DB_ERROR'}): ${error.message}`,
          error.code || 'DB_ERROR'
        );
      }
      return ((data || []) as unknown as DatabaseConsentRow[]).map(mapConsentFromDb);
    }

    return this.consentRecords.filter((r) => {
      if (cleanUserId && r.userId === cleanUserId) return true;
      if (cleanEmail && r.subjectEmail === cleanEmail) return true;
      return false;
    });
  }

  public async getAllConsentSummary(): Promise<{
    totalReceipts: number;
    marketingOptIns: number;
    analyticsOptIns: number;
    recentReceipts: ConsentRecord[];
  }> {
    let records: ConsentRecord[] = [];
    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) throw new DatabaseSetupError('Supabase client is unavailable.');
      const { data, error } = await supabase
        .from('consent_records')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(200);
      if (error) {
        throw new DatabaseSetupError(
          `Failed to query consent records (${error.code || 'DB_ERROR'}): ${error.message}`,
          error.code || 'DB_ERROR'
        );
      }
      records = ((data || []) as unknown as DatabaseConsentRow[]).map(mapConsentFromDb);
    } else {
      records = [...this.consentRecords];
    }

    return {
      totalReceipts: records.length,
      marketingOptIns: records.filter((r) => r.consentType === 'MARKETING_EMAIL' && r.granted).length,
      analyticsOptIns: records.filter((r) => r.consentType === 'COOKIE_ANALYTICS' && r.granted).length,
      recentReceipts: records.slice(0, 25),
    };
  }

  public async createDeletionRequest(input: {
    userId?: string | null;
    requesterEmail: string;
    requesterName?: string | null;
    bookingReference?: string | null;
    scope: DataDeletionRequest['scope'];
    reason?: string | null;
    executeImmediately?: boolean;
  }): Promise<DataDeletionRequest> {
    const nowIso = new Date().toISOString();
    const year = new Date().getUTCFullYear();
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const referenceCode = `DEL-${year}-${suffix}`;
    const id = `del-${Date.now().toString(36)}-${suffix}`;
    const cleanEmail = input.requesterEmail.trim().toLowerCase();
    const cleanUserId = toNullableUuid(input.userId);

    let status: DataDeletionRequest['status'] = 'PENDING';
    let anonymizedCount = 0;
    let reviewedBy: string | null = null;
    let reviewedAt: string | null = null;
    let resolutionNotes: string | null = null;

    if (input.executeImmediately && (cleanUserId || input.bookingReference)) {
      if (input.scope === 'MARKETING_DATA') {
        await this.recordConsent({
          userId: cleanUserId,
          subjectEmail: cleanEmail,
          consentType: 'MARKETING_EMAIL',
          granted: false,
          policyVersion: COMPLIANCE_VERSIONS.privacyPolicy,
          source: 'self_service_erasure',
          legalBasis: 'GDPR Art. 17 & Art. 7(3) Withdrawal/Erasure',
        });
        anonymizedCount = 1;
      } else {
        anonymizedCount = await anonymizePiiForSubject({
          userId: cleanUserId,
          email: cleanEmail,
          bookingReference: input.scope === 'BOOKING_PII' ? input.bookingReference : null,
        });
      }
      status = 'COMPLETED';
      reviewedBy = 'self-service-gdpr-art17';
      reviewedAt = nowIso;
      resolutionNotes =
        'Self-service GDPR Art. 17 erasure executed immediately; personal contact identifiers redacted while preserving statutory ledger integrity.';
    }

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      const supabase = adminClient ?? (await getTrustedServerClient());
      if (!supabase) throw new DatabaseSetupError('Supabase client is unavailable.');

      const { data, error } = await supabase
        .from('data_deletion_requests')
        .insert({
          id,
          reference_code: referenceCode,
          user_id: cleanUserId,
          requester_email: cleanEmail,
          requester_name: input.requesterName?.trim() || null,
          booking_reference: input.bookingReference?.trim().toUpperCase() || null,
          scope: input.scope,
          reason: input.reason?.trim() || null,
          status,
          reviewed_by: reviewedBy,
          reviewed_at: reviewedAt,
          resolution_notes: resolutionNotes,
          anonymized_records_count: anonymizedCount,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select('*')
        .single();

      if (error || !data) {
        throw new DatabaseSetupError(
          `Failed to save deletion request (${error?.code || 'DB_ERROR'}): ${error?.message || 'Unknown error'}`,
          error?.code || 'DB_ERROR'
        );
      }

      await recordAuditEvent({
        actorId: cleanUserId,
        actorEmail: status === 'COMPLETED' ? 'gdpr-erased-subject@civic.local' : cleanEmail,
        action: status === 'COMPLETED' ? 'EXECUTE_DATA_DELETION' : 'REQUEST_DATA_DELETION',
        entityType: 'DeletionRequest',
        entityId: id,
        summary: `GDPR Art. 17 request ${referenceCode} (${input.scope}) — ${status}`,
        metadata: { scope: input.scope, anonymizedCount },
      });

      return mapDeletionFromDb(data as unknown as DatabaseDeletionRow);
    }

    const reqRecord: DataDeletionRequest = {
      id,
      referenceCode,
      userId: cleanUserId,
      requesterEmail: cleanEmail,
      requesterName: input.requesterName?.trim() || null,
      bookingReference: input.bookingReference?.trim().toUpperCase() || null,
      scope: input.scope,
      reason: input.reason?.trim() || null,
      status,
      reviewedBy,
      reviewedAt,
      resolutionNotes,
      anonymizedRecordsCount: anonymizedCount,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.deletionRequests.unshift(reqRecord);

    await recordAuditEvent({
      actorId: cleanUserId,
      actorEmail: status === 'COMPLETED' ? 'gdpr-erased-subject@civic.local' : cleanEmail,
      action: status === 'COMPLETED' ? 'EXECUTE_DATA_DELETION' : 'REQUEST_DATA_DELETION',
      entityType: 'DeletionRequest',
      entityId: id,
      summary: `GDPR Art. 17 request ${referenceCode} (${input.scope}) — ${status}`,
      metadata: { scope: input.scope, anonymizedCount },
    });

    return reqRecord;
  }

  public async getDeletionRequests(filters?: {
    userId?: string | null;
    email?: string | null;
  }): Promise<DataDeletionRequest[]> {
    const cleanUserId = toNullableUuid(filters?.userId);
    const cleanEmail = filters?.email?.trim().toLowerCase() || null;

    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) throw new DatabaseSetupError('Supabase client is unavailable.');

      let query = supabase
        .from('data_deletion_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (cleanUserId && cleanEmail) {
        query = query.or(`user_id.eq.${cleanUserId},requester_email.eq.${cleanEmail}`);
      } else if (cleanUserId) {
        query = query.eq('user_id', cleanUserId);
      } else if (cleanEmail) {
        query = query.eq('requester_email', cleanEmail);
      }

      const { data, error } = await query;
      if (error) {
        throw new DatabaseSetupError(
          `Failed to load deletion requests (${error.code || 'DB_ERROR'}): ${error.message}`,
          error.code || 'DB_ERROR'
        );
      }
      return ((data || []) as unknown as DatabaseDeletionRow[]).map(mapDeletionFromDb);
    }

    let list = [...this.deletionRequests];
    if (cleanUserId || cleanEmail) {
      list = list.filter(
        (r) =>
          (cleanUserId && r.userId === cleanUserId) ||
          (cleanEmail && r.requesterEmail.toLowerCase() === cleanEmail)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async processDeletionRequestAdmin(input: {
    requestId: string;
    action: 'APPROVE_AND_ANONYMIZE' | 'MARK_IN_REVIEW' | 'REJECT';
    adminEmail: string;
    adminId?: string | null;
    resolutionNotes?: string;
  }): Promise<DataDeletionRequest | null> {
    const nowIso = new Date().toISOString();
    const existingList = await this.getDeletionRequests();
    const target = existingList.find((r) => r.id === input.requestId);
    if (!target) return null;

    let nextStatus: DataDeletionRequest['status'] = 'IN_REVIEW';
    let anonymizedCount = target.anonymizedRecordsCount;

    if (input.action === 'APPROVE_AND_ANONYMIZE') {
      if (target.scope === 'MARKETING_DATA') {
        await this.recordConsent({
          userId: target.userId,
          subjectEmail: target.requesterEmail,
          consentType: 'MARKETING_EMAIL',
          granted: false,
          policyVersion: COMPLIANCE_VERSIONS.privacyPolicy,
          source: 'admin_erasure_execution',
          legalBasis: 'GDPR Art. 17 Erasure',
        });
        anonymizedCount = 1;
      } else {
        anonymizedCount = await anonymizePiiForSubject({
          userId: target.userId,
          email: target.requesterEmail,
          bookingReference: target.scope === 'BOOKING_PII' ? target.bookingReference : null,
        });
      }
      nextStatus = 'COMPLETED';
    } else if (input.action === 'REJECT') {
      nextStatus = 'REJECTED';
    }

    const notes =
      input.resolutionNotes?.trim() ||
      (nextStatus === 'COMPLETED'
        ? `PII anonymized across ${anonymizedCount} record(s) under GDPR Art. 17.`
        : nextStatus === 'REJECTED'
        ? 'Request declined due to verification mismatch or overriding statutory retention obligation.'
        : 'Assigned to Data Protection Officer for verification.');

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      const supabase = adminClient ?? (await getTrustedServerClient());
      if (!supabase) throw new DatabaseSetupError('Supabase client is unavailable.');

      const { data, error } = await supabase
        .from('data_deletion_requests')
        .update({
          status: nextStatus,
          reviewed_by: input.adminEmail,
          reviewed_at: nowIso,
          resolution_notes: notes,
          anonymized_records_count: anonymizedCount,
          updated_at: nowIso,
        })
        .eq('id', input.requestId)
        .select('*')
        .single();

      if (error || !data) {
        throw new DatabaseSetupError(
          `Failed to update deletion request (${error?.code || 'DB_ERROR'}): ${error?.message || 'Unknown error'}`,
          error?.code || 'DB_ERROR'
        );
      }

      await recordAuditEvent({
        actorId: toNullableUuid(input.adminId),
        actorEmail: input.adminEmail,
        action: `DELETION_${nextStatus}`,
        entityType: 'DeletionRequest',
        entityId: target.id,
        summary: `GDPR deletion ${target.referenceCode} updated to ${nextStatus} (${anonymizedCount} records anonymized)`,
        metadata: { scope: target.scope, anonymizedCount },
      });

      return mapDeletionFromDb(data as unknown as DatabaseDeletionRow);
    }

    const updated: DataDeletionRequest = {
      ...target,
      status: nextStatus,
      reviewedBy: input.adminEmail,
      reviewedAt: nowIso,
      resolutionNotes: notes,
      anonymizedRecordsCount: anonymizedCount,
      updatedAt: nowIso,
    };

    this.deletionRequests = this.deletionRequests.map((r) =>
      r.id === target.id ? updated : r
    );

    await recordAuditEvent({
      actorId: toNullableUuid(input.adminId),
      actorEmail: input.adminEmail,
      action: `DELETION_${nextStatus}`,
      entityType: 'DeletionRequest',
      entityId: target.id,
      summary: `GDPR deletion ${target.referenceCode} updated to ${nextStatus} (${anonymizedCount} records anonymized)`,
      metadata: { scope: target.scope, anonymizedCount },
    });

    return updated;
  }

  public async exportPersonalData(params: {
    userId?: string | null;
    email?: string | null;
    profile?: Record<string, unknown> | null;
  }) {
    const cleanUserId = toNullableUuid(params.userId);
    const cleanEmail = params.email?.trim().toLowerCase() || null;

    const [userBookings, emailBookings, consents, deletionReqs] = await Promise.all([
      cleanUserId ? getUserBookings(cleanUserId) : Promise.resolve([]),
      cleanEmail ? getBookingsByEmail(cleanEmail) : Promise.resolve([]),
      this.getConsentHistory({ userId: cleanUserId, email: cleanEmail }),
      this.getDeletionRequests({ userId: cleanUserId, email: cleanEmail }),
    ]);

    const seenBookingIds = new Set<string>();
    const combinedBookings = [...userBookings, ...emailBookings].filter((b) => {
      if (seenBookingIds.has(b.id)) return false;
      seenBookingIds.add(b.id);
      return true;
    });

    return {
      exportedAt: new Date().toISOString(),
      gdprBasis: 'GDPR Article 15 (Right of Access) & Article 20 (Right to Data Portability)',
      policyVersions: COMPLIANCE_VERSIONS,
      dataSubject: {
        userId: cleanUserId,
        email: cleanEmail,
        profile: params.profile ?? null,
      },
      bookings: combinedBookings,
      consentHistory: consents,
      deletionRequests: deletionReqs,
    };
  }

  public async getBreachIncidents(): Promise<BreachIncident[]> {
    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) throw new DatabaseSetupError('Supabase client is unavailable.');

      const { data, error } = await supabase
        .from('breach_incidents')
        .select('*')
        .order('detected_at', { ascending: false });

      if (error) {
        throw new DatabaseSetupError(
          `Failed to load breach incidents (${error.code || 'DB_ERROR'}): ${error.message}`,
          error.code || 'DB_ERROR'
        );
      }

      return ((data || []) as unknown as DatabaseBreachRow[]).map(mapBreachFromDb);
    }

    return [...this.breachIncidents].sort(
      (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    );
  }

  public async createBreachIncident(input: {
    title: string;
    severity: BreachSeverity;
    affectedDataCategories: string[];
    estimatedAffectedSubjects: number;
    summary: string;
    containmentActions: string;
    detectedAt?: string;
    reportedBy: string;
    reporterId?: string | null;
  }): Promise<BreachIncident> {
    const now = new Date();
    const detectedDate = input.detectedAt ? new Date(input.detectedAt) : now;
    const safeDetected = Number.isNaN(detectedDate.getTime()) ? now : detectedDate;
    const deadline = new Date(safeDetected.getTime() + 72 * 60 * 60 * 1000);
    const suffix = Math.floor(100 + Math.random() * 900);
    const incidentCode = `INC-${safeDetected.getUTCFullYear()}-${suffix}`;
    const id = `inc-${Date.now().toString(36)}-${suffix}`;
    const nowIso = now.toISOString();

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      const supabase = adminClient ?? (await getTrustedServerClient());
      if (!supabase) throw new DatabaseSetupError('Supabase client is unavailable.');

      const { data, error } = await supabase
        .from('breach_incidents')
        .insert({
          id,
          incident_code: incidentCode,
          title: input.title.trim(),
          severity: input.severity,
          status: 'DETECTED',
          affected_data_categories: input.affectedDataCategories,
          estimated_affected_subjects: input.estimatedAffectedSubjects,
          summary: input.summary.trim(),
          containment_actions: input.containmentActions.trim(),
          detected_at: safeDetected.toISOString(),
          notification_deadline_at: deadline.toISOString(),
          reported_by: input.reportedBy,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select('*')
        .single();

      if (error || !data) {
        throw new DatabaseSetupError(
          `Failed to log breach incident (${error?.code || 'DB_ERROR'}): ${error?.message || 'Unknown error'}`,
          error?.code || 'DB_ERROR'
        );
      }

      await recordAuditEvent({
        actorId: toNullableUuid(input.reporterId),
        actorEmail: input.reportedBy,
        action: 'LOG_BREACH_INCIDENT',
        entityType: 'BreachIncident',
        entityId: id,
        summary: `Security incident ${incidentCode} (${input.severity}) logged — 72h GDPR Art. 33 deadline ${deadline.toISOString()}`,
        metadata: { severity: input.severity, affectedSubjects: input.estimatedAffectedSubjects },
      });

      return mapBreachFromDb(data as unknown as DatabaseBreachRow);
    }

    const incident: BreachIncident = {
      id,
      incidentCode,
      title: input.title.trim(),
      severity: input.severity,
      status: 'DETECTED',
      affectedDataCategories: input.affectedDataCategories,
      estimatedAffectedSubjects: input.estimatedAffectedSubjects,
      summary: input.summary.trim(),
      containmentActions: input.containmentActions.trim(),
      detectedAt: safeDetected.toISOString(),
      notificationDeadlineAt: deadline.toISOString(),
      authorityNotifiedAt: null,
      subjectsNotifiedAt: null,
      reportedBy: input.reportedBy,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.breachIncidents.unshift(incident);

    await recordAuditEvent({
      actorId: toNullableUuid(input.reporterId),
      actorEmail: input.reportedBy,
      action: 'LOG_BREACH_INCIDENT',
      entityType: 'BreachIncident',
      entityId: id,
      summary: `Security incident ${incidentCode} (${input.severity}) logged — 72h GDPR Art. 33 deadline ${deadline.toISOString()}`,
      metadata: { severity: input.severity, affectedSubjects: input.estimatedAffectedSubjects },
    });

    return incident;
  }

  public async updateBreachIncident(input: {
    incidentId: string;
    status: BreachStatus;
    containmentActions?: string;
    adminEmail: string;
    adminId?: string | null;
  }): Promise<BreachIncident | null> {
    const nowIso = new Date().toISOString();
    const list = await this.getBreachIncidents();
    const target = list.find((i) => i.id === input.incidentId);
    if (!target) return null;

    const authorityNotifiedAt =
      input.status === 'NOTIFIED_AUTHORITY' && !target.authorityNotifiedAt
        ? nowIso
        : target.authorityNotifiedAt ?? null;
    const subjectsNotifiedAt =
      input.status === 'NOTIFIED_SUBJECTS' && !target.subjectsNotifiedAt
        ? nowIso
        : target.subjectsNotifiedAt ?? null;
    const containmentActions = input.containmentActions?.trim() || target.containmentActions;

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      const supabase = adminClient ?? (await getTrustedServerClient());
      if (!supabase) throw new DatabaseSetupError('Supabase client is unavailable.');

      const { data, error } = await supabase
        .from('breach_incidents')
        .update({
          status: input.status,
          containment_actions: containmentActions,
          authority_notified_at: authorityNotifiedAt,
          subjects_notified_at: subjectsNotifiedAt,
          updated_at: nowIso,
        })
        .eq('id', input.incidentId)
        .select('*')
        .single();

      if (error || !data) {
        throw new DatabaseSetupError(
          `Failed to update breach incident (${error?.code || 'DB_ERROR'}): ${error?.message || 'Unknown error'}`,
          error?.code || 'DB_ERROR'
        );
      }

      await recordAuditEvent({
        actorId: toNullableUuid(input.adminId),
        actorEmail: input.adminEmail,
        action: 'UPDATE_BREACH_INCIDENT',
        entityType: 'BreachIncident',
        entityId: target.id,
        summary: `Security incident ${target.incidentCode} transitioned to ${input.status}`,
        metadata: { status: input.status },
      });

      return mapBreachFromDb(data as unknown as DatabaseBreachRow);
    }

    const updated: BreachIncident = {
      ...target,
      status: input.status,
      containmentActions,
      authorityNotifiedAt,
      subjectsNotifiedAt,
      updatedAt: nowIso,
    };
    this.breachIncidents = this.breachIncidents.map((i) =>
      i.id === target.id ? updated : i
    );

    await recordAuditEvent({
      actorId: toNullableUuid(input.adminId),
      actorEmail: input.adminEmail,
      action: 'UPDATE_BREACH_INCIDENT',
      entityType: 'BreachIncident',
      entityId: target.id,
      summary: `Security incident ${target.incidentCode} transitioned to ${input.status}`,
      metadata: { status: input.status },
    });

    return updated;
  }
}

export const complianceStore = new ComplianceDataStore();
