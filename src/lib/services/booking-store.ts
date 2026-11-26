import {
  Booking,
  MaintenanceWindow,
  AuditEvent,
  BookingStatus,
  AdminDashboardSummary,
  HallUtilization,
} from '@/types';
import {
  INITIAL_SAMPLE_BOOKINGS,
  INITIAL_MAINTENANCE_WINDOWS,
  INITIAL_AUDIT_EVENTS,
} from '@/lib/data/sample-bookings';
import { BookingFormData } from '@/lib/validation/booking-schema';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient, getTrustedServerClient } from '@/lib/supabase/server';
import {
  mapBookingFromDb,
  mapMaintenanceFromDb,
  mapAuditEventFromDb,
  DatabaseBookingRow,
  DatabaseMaintenanceRow,
  DatabaseAuditEventRow,
} from '@/lib/supabase/types';
import {
  ActorInfo,
  DatabaseSetupError,
  getAllHallsAdmin,
  getHallById,
} from './hall-service';
import { zonedLocalToUtcIso } from '@/lib/utils/timezone';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toNullableUuid(value?: string | null): string | null {
  return value && UUID_REGEX.test(value) ? value : null;
}

export interface AuditFilters {
  entityType?: string;
  action?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

class BookingDataStore {
  private bookings: Booking[] = [...INITIAL_SAMPLE_BOOKINGS];
  private maintenance: MaintenanceWindow[] = [...INITIAL_MAINTENANCE_WINDOWS];
  private auditEvents: AuditEvent[] = [...INITIAL_AUDIT_EVENTS];
  private hallLocks: Map<string, boolean> = new Map();

  private async acquireHallLock(hallId: string, maxWaitMs = 3000): Promise<boolean> {
    const start = Date.now();
    while (this.hallLocks.get(hallId)) {
      if (Date.now() - start > maxWaitMs) {
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    this.hallLocks.set(hallId, true);
    return true;
  }

  private releaseHallLock(hallId: string) {
    this.hallLocks.delete(hallId);
  }

  public async recordAuditEvent(event: {
    actorId?: string | null;
    actorEmail: string;
    action: string;
    entityType: AuditEvent['entityType'];
    entityId: string;
    summary: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) return;
      const { error } = await supabase.from('audit_events').insert({
        actor_id: toNullableUuid(event.actorId),
        actor_email: event.actorEmail,
        action: event.action,
        entity_type: event.entityType,
        entity_id: event.entityId,
        summary: event.summary,
        metadata: event.metadata ?? {},
      });
      if (error && process.env.NODE_ENV === 'development') {
        console.warn('Audit event insert skipped or failed:', error.message);
      }
      return;
    }

    this.auditEvents.unshift({
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorId: toNullableUuid(event.actorId),
      actorEmail: event.actorEmail,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      summary: event.summary,
      metadata: event.metadata,
      timestamp: nowIso,
    });
  }

  public async getBookingsForHall(hallId: string): Promise<Booking[]> {
    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) {
        throw new DatabaseSetupError('Supabase client is unavailable.');
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('*, halls(name)')
        .eq('hall_id', hallId);

      if (error) {
        throw new DatabaseSetupError(
          `Supabase bookings query failed (${error.code || 'DB_ERROR'}): ${error.message}`,
          error.code || 'DB_ERROR'
        );
      }

      return ((data || []) as unknown as DatabaseBookingRow[]).map((r) => mapBookingFromDb(r));
    }

    return this.bookings.filter((b) => b.hallId === hallId);
  }

  public async getMaintenanceForHall(hallId: string): Promise<MaintenanceWindow[]> {
    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) {
        throw new DatabaseSetupError('Supabase client is unavailable.');
      }

      const { data, error } = await supabase
        .from('maintenance_windows')
        .select('*, halls(name)')
        .eq('hall_id', hallId);

      if (error) {
        throw new DatabaseSetupError(
          `Supabase maintenance query failed (${error.code || 'DB_ERROR'}): ${error.message}`,
          error.code || 'DB_ERROR'
        );
      }

      return ((data || []) as unknown as DatabaseMaintenanceRow[]).map((r) =>
        mapMaintenanceFromDb(r)
      );
    }

    return this.maintenance.filter((m) => m.hallId === hallId);
  }

  public async getAllMaintenance(): Promise<MaintenanceWindow[]> {
    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) {
        throw new DatabaseSetupError('Supabase client is unavailable.');
      }

      const { data, error } = await supabase
        .from('maintenance_windows')
        .select('*, halls(name)')
        .order('start_time', { ascending: true });

      if (error) {
        throw new DatabaseSetupError(
          `Supabase maintenance query failed (${error.code || 'DB_ERROR'}): ${error.message}`,
          error.code || 'DB_ERROR'
        );
      }

      return ((data || []) as unknown as DatabaseMaintenanceRow[]).map((r) =>
        mapMaintenanceFromDb(r)
      );
    }

    return [...this.maintenance].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  public async getAllBookings(filterStatus?: BookingStatus): Promise<Booking[]> {
    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) {
        throw new DatabaseSetupError('Supabase client is unavailable.');
      }

      let query = supabase.from('bookings').select('*, halls(name)');
      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseSetupError(
          `Supabase bookings query failed (${error.code || 'DB_ERROR'}): ${error.message}`,
          error.code || 'DB_ERROR'
        );
      }

      return ((data || []) as unknown as DatabaseBookingRow[]).map((r) => mapBookingFromDb(r));
    }

    const list = filterStatus
      ? this.bookings.filter((b) => b.status === filterStatus)
      : [...this.bookings];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getBookingByReference(ref: string): Promise<Booking | null> {
    const cleanRef = ref.trim().toUpperCase();
    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) {
        throw new DatabaseSetupError('Supabase client is unavailable.');
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('*, halls(name)')
        .eq('reference_number', cleanRef)
        .maybeSingle();

      if (error) {
        throw new DatabaseSetupError(
          `Supabase booking lookup failed (${error.code || 'DB_ERROR'}): ${error.message}`,
          error.code || 'DB_ERROR'
        );
      }

      return data ? mapBookingFromDb(data as unknown as DatabaseBookingRow) : null;
    }

    return this.bookings.find((b) => b.referenceNumber.toUpperCase() === cleanRef) || null;
  }

  public async getBookingById(id: string): Promise<Booking | null> {
    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) {
        throw new DatabaseSetupError('Supabase client is unavailable.');
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('*, halls(name)')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new DatabaseSetupError(
          `Supabase booking lookup failed (${error.code || 'DB_ERROR'}): ${error.message}`,
          error.code || 'DB_ERROR'
        );
      }

      return data ? mapBookingFromDb(data as unknown as DatabaseBookingRow) : null;
    }

    return this.bookings.find((b) => b.id === id) || null;
  }

  public async getUserBookings(userId: string): Promise<Booking[]> {
    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) {
        throw new DatabaseSetupError('Supabase client is unavailable.');
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('*, halls(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseSetupError(
          `Supabase user bookings query failed (${error.code || 'DB_ERROR'}): ${error.message}`,
          error.code || 'DB_ERROR'
        );
      }

      return ((data || []) as unknown as DatabaseBookingRow[]).map((r) => mapBookingFromDb(r));
    }

    return this.bookings
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getAuditEvents(filters?: AuditFilters): Promise<AuditEvent[]> {
    let events: AuditEvent[] = [];

    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) {
        throw new DatabaseSetupError('Supabase client is unavailable.');
      }

      let query = supabase
        .from('audit_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);

      if (filters?.entityType && filters.entityType !== 'ALL') {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters?.action && filters.action !== 'ALL') {
        query = query.eq('action', filters.action);
      }
      if (filters?.fromDate) {
        query = query.gte('timestamp', `${filters.fromDate}T00:00:00Z`);
      }
      if (filters?.toDate) {
        query = query.lte('timestamp', `${filters.toDate}T23:59:59Z`);
      }

      const { data, error } = await query;
      if (error) {
        throw new DatabaseSetupError(
          `Supabase audit events query failed (${error.code || 'DB_ERROR'}): ${error.message}`,
          error.code || 'DB_ERROR'
        );
      }

      events = ((data || []) as unknown as DatabaseAuditEventRow[]).map(mapAuditEventFromDb);
    } else {
      events = [...this.auditEvents].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      if (filters?.entityType && filters.entityType !== 'ALL') {
        events = events.filter((e) => e.entityType === filters.entityType);
      }
      if (filters?.action && filters.action !== 'ALL') {
        events = events.filter((e) => e.action === filters.action);
      }
      if (filters?.fromDate) {
        events = events.filter((e) => e.timestamp.slice(0, 10) >= filters.fromDate!);
      }
      if (filters?.toDate) {
        events = events.filter((e) => e.timestamp.slice(0, 10) <= filters.toDate!);
      }
    }

    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      events = events.filter(
        (e) =>
          e.summary.toLowerCase().includes(q) ||
          e.actorEmail.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.entityId.toLowerCase().includes(q)
      );
    }

    return events;
  }

  /**
   * Submit a new public booking request.
   * Status is strictly initialized to PENDING.
   */
  public async createBookingRequest(
    data: BookingFormData,
    userId?: string | null
  ): Promise<Booking> {
    const hall = await getHallById(data.hallId);
    const hallName = hall ? hall.name : 'Community Hall';

    const year = new Date().getUTCFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceNumber = `REQ-${year}-${randomSuffix}`;
    const generatedId = `bkg-${Date.now().toString(36)}-${randomSuffix}`;

    const startDateTime = zonedLocalToUtcIso(data.bookingDate, data.startTime);
    const endDateTime = zonedLocalToUtcIso(data.bookingDate, data.endTime);

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      const supabase = adminClient ?? (await getTrustedServerClient());
      if (!supabase) {
        throw new DatabaseSetupError('Supabase client is unavailable.');
      }

      const insertPayload = {
        id: generatedId,
        reference_number: referenceNumber,
        hall_id: data.hallId,
        user_id: toNullableUuid(userId),
        requester_name: data.requesterName.trim(),
        requester_email: data.requesterEmail.trim().toLowerCase(),
        requester_phone: data.requesterPhone.trim(),
        requester_org: data.requesterOrg?.trim() || null,
        event_name: data.eventName.trim(),
        event_type: data.eventType,
        expected_attendees: Number(data.expectedAttendees),
        special_requests: data.specialRequests?.trim() || null,
        start_time: startDateTime,
        end_time: endDateTime,
        status: 'PENDING' as const,
      };

      // If using service_role or authenticated user, we can select the row back;
      // if unauthenticated anon without service_role, insert without .select() to respect strict SELECT RLS.
      if (adminClient || toNullableUuid(userId)) {
        const { data: inserted, error } = await supabase
          .from('bookings')
          .insert(insertPayload)
          .select('*, halls(name)')
          .single();

        if (error || !inserted) {
          throw new Error(`Database error saving booking request: ${error?.message || 'Unknown error'}`);
        }

        const created = mapBookingFromDb(inserted as unknown as DatabaseBookingRow, hallName);
        await this.recordAuditEvent({
          actorId: toNullableUuid(userId),
          actorEmail: insertPayload.requester_email,
          action: 'SUBMIT_BOOKING_REQUEST',
          entityType: 'Booking',
          entityId: created.id,
          summary: `Booking request ${referenceNumber} submitted for ${hallName}`,
          metadata: {
            eventName: insertPayload.event_name,
            attendees: insertPayload.expected_attendees,
            startTime: startDateTime,
            endTime: endDateTime,
          },
        });
        return created;
      }

      const { error } = await supabase.from('bookings').insert(insertPayload);
      if (error) {
        throw new Error(`Database error saving booking request: ${error.message}`);
      }

      const nowIso = new Date().toISOString();
      return {
        id: generatedId,
        referenceNumber,
        hallId: data.hallId,
        hallName,
        userId: null,
        requesterName: insertPayload.requester_name,
        requesterEmail: insertPayload.requester_email,
        requesterPhone: insertPayload.requester_phone,
        requesterOrg: insertPayload.requester_org,
        eventName: insertPayload.event_name,
        eventType: insertPayload.event_type,
        expectedAttendees: insertPayload.expected_attendees,
        specialRequests: insertPayload.special_requests,
        startTime: startDateTime,
        endTime: endDateTime,
        status: 'PENDING',
        reviewedBy: null,
        reviewedAt: null,
        decisionNotes: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
    }

    const nowIso = new Date().toISOString();
    const newBooking: Booking = {
      id: generatedId,
      referenceNumber,
      hallId: data.hallId,
      hallName,
      userId: userId || null,
      requesterName: data.requesterName.trim(),
      requesterEmail: data.requesterEmail.trim().toLowerCase(),
      requesterPhone: data.requesterPhone.trim(),
      requesterOrg: data.requesterOrg?.trim() || null,
      eventName: data.eventName.trim(),
      eventType: data.eventType,
      expectedAttendees: Number(data.expectedAttendees),
      specialRequests: data.specialRequests?.trim() || null,
      startTime: startDateTime,
      endTime: endDateTime,
      status: 'PENDING',
      reviewedBy: null,
      reviewedAt: null,
      decisionNotes: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.bookings.unshift(newBooking);

    await this.recordAuditEvent({
      actorId: userId || null,
      actorEmail: newBooking.requesterEmail,
      action: 'SUBMIT_BOOKING_REQUEST',
      entityType: 'Booking',
      entityId: newBooking.id,
      summary: `Booking request ${referenceNumber} submitted for ${hallName}`,
      metadata: {
        eventName: newBooking.eventName,
        attendees: newBooking.expectedAttendees,
        startTime: startDateTime,
        endTime: endDateTime,
      },
    });

    return newBooking;
  }

  /**
   * Requester self-service cancellation for own PENDING booking.
   */
  public async cancelOwnPendingBooking(
    bookingId: string,
    userId: string,
    userEmail: string,
    reason?: string
  ): Promise<{ success: boolean; booking?: Booking; error?: string; statusCode?: number }> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      return { success: false, error: 'Booking request not found.', statusCode: 404 };
    }

    if (!booking.userId || booking.userId !== userId) {
      return {
        success: false,
        error: 'Forbidden: You may only cancel booking requests created by your account.',
        statusCode: 403,
      };
    }

    if (booking.status !== 'PENDING') {
      return {
        success: false,
        error: `Only PENDING requests can be self-cancelled. This request is currently ${booking.status}.`,
        statusCode: 409,
      };
    }

    const nowIso = new Date().toISOString();
    const cancelNote = reason?.trim() || 'Cancelled by requester prior to administrative review.';

    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) {
        return { success: false, error: 'Supabase client is unavailable.', statusCode: 503 };
      }

      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'CANCELLED',
          decision_notes: cancelNote,
          updated_at: nowIso,
        })
        .eq('id', bookingId)
        .eq('user_id', userId)
        .eq('status', 'PENDING')
        .select('*, halls(name)')
        .maybeSingle();

      if (error || !data) {
        return {
          success: false,
          error: error?.message || 'Unable to cancel booking request.',
          statusCode: 400,
        };
      }

      const updated = mapBookingFromDb(data as unknown as DatabaseBookingRow, booking.hallName);
      await this.recordAuditEvent({
        actorId: userId,
        actorEmail: userEmail,
        action: 'CANCEL_BOOKING',
        entityType: 'Booking',
        entityId: bookingId,
        summary: `Requester cancelled pending request ${booking.referenceNumber}`,
        metadata: { reason: cancelNote, hallId: booking.hallId },
      });

      return { success: true, booking: updated };
    }

    booking.status = 'CANCELLED';
    booking.decisionNotes = cancelNote;
    booking.updatedAt = nowIso;

    await this.recordAuditEvent({
      actorId: userId,
      actorEmail: userEmail,
      action: 'CANCEL_BOOKING',
      entityType: 'Booking',
      entityId: bookingId,
      summary: `Requester cancelled pending request ${booking.referenceNumber}`,
      metadata: { reason: cancelNote, hallId: booking.hallId },
    });

    return { success: true, booking };
  }

  /**
   * Administrative decision: Approve a booking request.
   * Uses transaction-safe PostgreSQL RPC `approve_booking_tx` + GIST exclusion constraint
   * when Supabase is configured, and per-hall mutex lock in development sample mode.
   */
  public async approveBookingWithConcurrencyCheck(
    bookingId: string,
    reviewedBy: string,
    decisionNotes?: string,
    reviewerId?: string | null
  ): Promise<{ success: boolean; booking?: Booking; error?: string; conflictBookings?: Booking[] }> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      return { success: false, error: 'Booking request not found' };
    }

    if (booking.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Cannot approve a booking request that was cancelled by the requester.',
      };
    }

    if (booking.status === 'APPROVED') {
      return { success: true, booking };
    }

    const notes = decisionNotes?.trim() || 'Approved by municipal facility administrator.';

    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) {
        return { success: false, error: 'Supabase client is unavailable.' };
      }

      const { data: rpcRow, error: rpcError } = await supabase.rpc('approve_booking_tx', {
        p_booking_id: bookingId,
        p_admin_id: toNullableUuid(reviewerId),
        p_notes: notes,
        p_actor_email: reviewedBy,
      });

      if (rpcError) {
        const msg = rpcError.message || '';
        if (
          msg.includes('CANNOT_APPROVE_OVERLAP') ||
          rpcError.code === '23P01' ||
          msg.includes('no_overlapping_approved_bookings')
        ) {
          return {
            success: false,
            error:
              'Cannot approve booking: A conflicting approved event already exists for this time slot.',
          };
        }
        if (msg.includes('CANNOT_APPROVE_MAINTENANCE')) {
          return {
            success: false,
            error:
              'Cannot approve booking: Facility is scheduled for maintenance during this time slot.',
          };
        }
        if (msg.includes('CANNOT_APPROVE_CANCELLED')) {
          return {
            success: false,
            error: 'Cannot approve booking: Request has already been cancelled.',
          };
        }
        return {
          success: false,
          error: `Database approval failed: ${msg}`,
        };
      }

      const approvedRow = Array.isArray(rpcRow) ? rpcRow[0] : rpcRow;
      if (approvedRow) {
        return {
          success: true,
          booking: mapBookingFromDb(approvedRow as DatabaseBookingRow, booking.hallName),
        };
      }

      const refreshed = await this.getBookingById(bookingId);
      return refreshed
        ? { success: true, booking: refreshed }
        : { success: false, error: 'Approved booking could not be reloaded.' };
    }

    // In-memory development store with mutex lock
    const lockAcquired = await this.acquireHallLock(booking.hallId);
    if (!lockAcquired) {
      return {
        success: false,
        error: 'System is currently processing another request for this facility. Please try again.',
      };
    }

    try {
      const bStart = new Date(booking.startTime).getTime();
      const bEnd = new Date(booking.endTime).getTime();

      const existingBookings = await this.getBookingsForHall(booking.hallId);
      const conflictBookings = existingBookings.filter((existing) => {
        if (existing.id === booking.id || existing.status !== 'APPROVED') {
          return false;
        }
        const existingStart = new Date(existing.startTime).getTime();
        const existingEnd = new Date(existing.endTime).getTime();
        return bStart < existingEnd && bEnd > existingStart;
      });

      if (conflictBookings.length > 0) {
        return {
          success: false,
          error:
            'Cannot approve booking: A conflicting approved event already exists for this time slot.',
          conflictBookings,
        };
      }

      const maintenanceWindows = await this.getMaintenanceForHall(booking.hallId);
      const hasMaintConflict = maintenanceWindows.some((m) => {
        if (m.status !== 'SCHEDULED' && m.status !== 'IN_PROGRESS') {
          return false;
        }
        const mStart = new Date(m.startTime).getTime();
        const mEnd = new Date(m.endTime).getTime();
        return bStart < mEnd && bEnd > mStart;
      });

      if (hasMaintConflict) {
        return {
          success: false,
          error:
            'Cannot approve booking: Facility is scheduled for maintenance during this time slot.',
        };
      }

      const nowIso = new Date().toISOString();
      booking.status = 'APPROVED';
      booking.reviewedBy = reviewedBy;
      booking.reviewedAt = nowIso;
      booking.decisionNotes = notes;
      booking.updatedAt = nowIso;

      await this.recordAuditEvent({
        actorId: toNullableUuid(reviewerId),
        actorEmail: reviewedBy,
        action: 'APPROVE_BOOKING',
        entityType: 'Booking',
        entityId: booking.id,
        summary: `Approved booking request ${booking.referenceNumber}`,
        metadata: {
          hallId: booking.hallId,
          startTime: booking.startTime,
          endTime: booking.endTime,
          notes,
        },
      });

      return { success: true, booking };
    } finally {
      this.releaseHallLock(booking.hallId);
    }
  }

  public async rejectBooking(
    bookingId: string,
    reviewedBy: string,
    decisionNotes?: string,
    reviewerId?: string | null
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      return { success: false, error: 'Booking request not found' };
    }

    if (booking.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Cannot decline a booking request that was already cancelled.',
      };
    }

    const nowIso = new Date().toISOString();
    const notes = decisionNotes?.trim() || 'Request declined by facility administration.';

    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) {
        return { success: false, error: 'Supabase client is unavailable.' };
      }

      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'REJECTED',
          reviewed_by: toNullableUuid(reviewerId),
          reviewed_at: nowIso,
          decision_notes: notes,
          updated_at: nowIso,
        })
        .eq('id', bookingId)
        .select('*, halls(name)')
        .single();

      if (error || !data) {
        return {
          success: false,
          error: `Failed to reject booking in database: ${error?.message || 'Unknown error'}`,
        };
      }

      await this.recordAuditEvent({
        actorId: toNullableUuid(reviewerId),
        actorEmail: reviewedBy,
        action: 'REJECT_BOOKING',
        entityType: 'Booking',
        entityId: booking.id,
        summary: `Booking request ${booking.referenceNumber} was declined`,
        metadata: { reason: notes, hallId: booking.hallId },
      });

      return { success: true, booking: mapBookingFromDb(data as unknown as DatabaseBookingRow) };
    }

    booking.status = 'REJECTED';
    booking.reviewedBy = reviewedBy;
    booking.reviewedAt = nowIso;
    booking.decisionNotes = notes;
    booking.updatedAt = nowIso;

    await this.recordAuditEvent({
      actorId: toNullableUuid(reviewerId),
      actorEmail: reviewedBy,
      action: 'REJECT_BOOKING',
      entityType: 'Booking',
      entityId: booking.id,
      summary: `Booking request ${booking.referenceNumber} was declined`,
      metadata: { reason: notes, hallId: booking.hallId },
    });

    return { success: true, booking };
  }

  public async getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
    const [allBookings, allMaintenance, allHalls] = await Promise.all([
      this.getAllBookings(),
      this.getAllMaintenance(),
      getAllHallsAdmin(true),
    ]);

    const pendingRequests = allBookings.filter((b) => b.status === 'PENDING');
    const approvedBookings = allBookings.filter((b) => b.status === 'APPROVED');
    const rejectedBookings = allBookings.filter((b) => b.status === 'REJECTED');
    const activeMaintenance = allMaintenance.filter(
      (m) => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS'
    );

    const hallUtilization: HallUtilization[] = allHalls.map((hall) => {
      const hallBookings = approvedBookings.filter((b) => b.hallId === hall.id);
      let approvedHours = 0;

      for (const b of hallBookings) {
        const start = new Date(b.startTime).getTime();
        const end = new Date(b.endTime).getTime();
        approvedHours += Math.max(0, (end - start) / (1000 * 60 * 60));
      }

      const standardMonthlyCapacityHours = 420;
      const rate = Math.min(100, Math.round((approvedHours / standardMonthlyCapacityHours) * 100));

      return {
        hallId: hall.id,
        hallName: hall.name,
        capacity: hall.capacity,
        totalBookings: hallBookings.length,
        approvedHours: Math.round(approvedHours * 10) / 10,
        utilizationRate: rate,
      };
    });

    return {
      pendingCount: pendingRequests.length,
      approvedCount: approvedBookings.length,
      rejectedCount: rejectedBookings.length,
      activeMaintenanceCount: activeMaintenance.length,
      totalBookingsCount: allBookings.length,
      hallUtilization,
      recentPendingRequests: pendingRequests.slice(0, 5),
      upcomingApprovedBookings: approvedBookings.slice(0, 5),
      activeMaintenance: activeMaintenance.slice(0, 5),
    };
  }

  public async createMaintenanceWindow(
    data: {
      hallId: string;
      title: string;
      reason: string;
      startTime: string;
      endTime: string;
    },
    actor?: ActorInfo
  ): Promise<{ success: boolean; maintenance?: MaintenanceWindow; error?: string; conflicts?: Booking[] }> {
    const startMs = new Date(data.startTime).getTime();
    const endMs = new Date(data.endTime).getTime();

    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      return { success: false, error: 'Maintenance end time must be after start time.' };
    }

    const bookings = await this.getBookingsForHall(data.hallId);
    const conflicts = bookings.filter((b) => {
      if (b.status !== 'APPROVED') return false;
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return startMs < bEnd && endMs > bStart;
    });

    if (conflicts.length > 0) {
      return {
        success: false,
        error: `Cannot schedule maintenance: Overlaps with confirmed event "${conflicts[0].eventName}" (${conflicts[0].referenceNumber}).`,
        conflicts,
      };
    }

    // Check overlapping active maintenance windows
    const existingMaint = await this.getMaintenanceForHall(data.hallId);
    const maintOverlap = existingMaint.find((m) => {
      if (m.status !== 'SCHEDULED' && m.status !== 'IN_PROGRESS') return false;
      const mStart = new Date(m.startTime).getTime();
      const mEnd = new Date(m.endTime).getTime();
      return startMs < mEnd && endMs > mStart;
    });
    if (maintOverlap) {
      return {
        success: false,
        error: `Cannot schedule maintenance: Overlaps with existing maintenance window "${maintOverlap.title}".`,
      };
    }

    const hall = await getHallById(data.hallId);
    const hallName = hall?.name || 'Community Facility';
    const actorEmail = actor?.email || 'admin@civic.example';
    const actorId = toNullableUuid(actor?.id);

    const id = `maint-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowIso = new Date().toISOString();
    const newWindow: MaintenanceWindow = {
      id,
      hallId: data.hallId,
      hallName,
      title: data.title.trim(),
      reason: data.reason.trim(),
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      status: 'SCHEDULED',
      createdBy: actorId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) {
        return { success: false, error: 'Supabase client is unavailable.' };
      }

      const { data: inserted, error } = await supabase
        .from('maintenance_windows')
        .insert({
          id: newWindow.id,
          hall_id: newWindow.hallId,
          title: newWindow.title,
          reason: newWindow.reason,
          start_time: newWindow.startTime,
          end_time: newWindow.endTime,
          status: newWindow.status,
          created_by: actorId,
        })
        .select('*, halls(name)')
        .single();

      if (error || !inserted) {
        if (error?.code === '23P01') {
          return {
            success: false,
            error: 'Cannot schedule maintenance: Overlaps with an active maintenance window.',
          };
        }
        return {
          success: false,
          error: `Failed to schedule maintenance in database: ${error?.message || 'Unknown error'}`,
        };
      }

      await this.recordAuditEvent({
        actorId,
        actorEmail,
        action: 'SCHEDULE_MAINTENANCE',
        entityType: 'MaintenanceWindow',
        entityId: newWindow.id,
        summary: `Maintenance scheduled for ${hallName}: ${newWindow.title}`,
        metadata: {
          startTime: newWindow.startTime,
          endTime: newWindow.endTime,
          reason: newWindow.reason,
        },
      });

      return {
        success: true,
        maintenance: mapMaintenanceFromDb(inserted as unknown as DatabaseMaintenanceRow, hallName),
      };
    }

    this.maintenance.unshift(newWindow);

    await this.recordAuditEvent({
      actorId,
      actorEmail,
      action: 'SCHEDULE_MAINTENANCE',
      entityType: 'MaintenanceWindow',
      entityId: newWindow.id,
      summary: `Maintenance scheduled for ${hallName}: ${newWindow.title}`,
      metadata: {
        startTime: newWindow.startTime,
        endTime: newWindow.endTime,
        reason: newWindow.reason,
      },
    });

    return { success: true, maintenance: newWindow };
  }

  public async updateMaintenanceWindow(
    id: string,
    updates: Partial<MaintenanceWindow>,
    actor?: ActorInfo
  ): Promise<{ success: boolean; maintenance?: MaintenanceWindow; error?: string; conflicts?: Booking[] }> {
    const actorEmail = actor?.email || 'admin@civic.example';
    const actorId = toNullableUuid(actor?.id);

    if (isSupabaseConfigured()) {
      const supabase = await getTrustedServerClient();
      if (!supabase) {
        return { success: false, error: 'Supabase client is unavailable.' };
      }

      const { data: existingRow, error: fetchError } = await supabase
        .from('maintenance_windows')
        .select('*, halls(name)')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        return { success: false, error: `Failed to look up maintenance window: ${fetchError.message}` };
      }
      if (!existingRow) {
        return { success: false, error: 'Maintenance record not found' };
      }

      const current = mapMaintenanceFromDb(existingRow as unknown as DatabaseMaintenanceRow);
      const targetHallId = updates.hallId || current.hallId;
      const newStart = updates.startTime || current.startTime;
      const newEnd = updates.endTime || current.endTime;

      if (new Date(newEnd).getTime() <= new Date(newStart).getTime()) {
        return { success: false, error: 'End time must be after start time.' };
      }

      if (updates.status !== 'CANCELLED' && (updates.startTime || updates.endTime || updates.hallId)) {
        const startMs = new Date(newStart).getTime();
        const endMs = new Date(newEnd).getTime();
        const bookings = await this.getBookingsForHall(targetHallId);
        const conflicts = bookings.filter((b) => {
          if (b.status !== 'APPROVED') return false;
          const bStart = new Date(b.startTime).getTime();
          const bEnd = new Date(b.endTime).getTime();
          return startMs < bEnd && endMs > bStart;
        });

        if (conflicts.length > 0) {
          return {
            success: false,
            error: `Cannot update maintenance: Overlaps with confirmed event "${conflicts[0].eventName}".`,
            conflicts,
          };
        }
      }

      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.hallId !== undefined) payload.hall_id = updates.hallId;
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.reason !== undefined) payload.reason = updates.reason;
      if (updates.startTime !== undefined) payload.start_time = new Date(updates.startTime).toISOString();
      if (updates.endTime !== undefined) payload.end_time = new Date(updates.endTime).toISOString();
      if (updates.status !== undefined) payload.status = updates.status;

      const { data: updatedRow, error: updateError } = await supabase
        .from('maintenance_windows')
        .update(payload)
        .eq('id', id)
        .select('*, halls(name)')
        .single();

      if (updateError || !updatedRow) {
        return {
          success: false,
          error: `Failed to update maintenance in database: ${updateError?.message || 'Unknown error'}`,
        };
      }

      const mapped = mapMaintenanceFromDb(updatedRow as unknown as DatabaseMaintenanceRow);
      if (updates.status !== 'CANCELLED') {
        await this.recordAuditEvent({
          actorId,
          actorEmail,
          action: 'UPDATE_MAINTENANCE',
          entityType: 'MaintenanceWindow',
          entityId: id,
          summary: `Updated maintenance window "${mapped.title}" for ${mapped.hallName}`,
          metadata: { startTime: mapped.startTime, endTime: mapped.endTime, status: mapped.status },
        });
      }

      return { success: true, maintenance: mapped };
    }

    const index = this.maintenance.findIndex((m) => m.id === id);
    if (index === -1) {
      return { success: false, error: 'Maintenance record not found' };
    }

    const current = this.maintenance[index];
    const targetHallId = updates.hallId || current.hallId;
    const newStart = updates.startTime || current.startTime;
    const newEnd = updates.endTime || current.endTime;

    if (new Date(newEnd).getTime() <= new Date(newStart).getTime()) {
      return { success: false, error: 'End time must be after start time.' };
    }

    if (updates.status !== 'CANCELLED' && (updates.startTime || updates.endTime || updates.hallId)) {
      const startMs = new Date(newStart).getTime();
      const endMs = new Date(newEnd).getTime();
      const bookings = await this.getBookingsForHall(targetHallId);
      const conflicts = bookings.filter((b) => {
        if (b.status !== 'APPROVED') return false;
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();
        return startMs < bEnd && endMs > bStart;
      });

      if (conflicts.length > 0) {
        return {
          success: false,
          error: `Cannot update maintenance: Overlaps with confirmed event "${conflicts[0].eventName}".`,
          conflicts,
        };
      }
    }

    const hall = updates.hallId ? await getHallById(updates.hallId) : null;
    const updated: MaintenanceWindow = {
      ...current,
      ...updates,
      hallName: hall?.name || current.hallName,
      updatedAt: new Date().toISOString(),
    };

    this.maintenance[index] = updated;

    if (updates.status !== 'CANCELLED') {
      await this.recordAuditEvent({
        actorId,
        actorEmail,
        action: 'UPDATE_MAINTENANCE',
        entityType: 'MaintenanceWindow',
        entityId: id,
        summary: `Updated maintenance window "${updated.title}" for ${updated.hallName}`,
        metadata: { startTime: updated.startTime, endTime: updated.endTime, status: updated.status },
      });
    }

    return { success: true, maintenance: updated };
  }

  public async cancelMaintenanceWindow(
    id: string,
    reason?: string,
    actor?: ActorInfo
  ): Promise<{ success: boolean; maintenance?: MaintenanceWindow; error?: string }> {
    const result = await this.updateMaintenanceWindow(
      id,
      { status: 'CANCELLED' },
      actor
    );

    if (result.success && result.maintenance) {
      await this.recordAuditEvent({
        actorId: toNullableUuid(actor?.id),
        actorEmail: actor?.email || 'admin@civic.example',
        action: 'CANCEL_MAINTENANCE',
        entityType: 'MaintenanceWindow',
        entityId: id,
        summary: `Maintenance cancelled for ${result.maintenance.hallName}: ${result.maintenance.title}`,
        metadata: { cancelReason: reason },
      });
    }

    return result;
  }

  public async getBookingsByEmail(email: string): Promise<Booking[]> {
    const cleanEmail = email.trim().toLowerCase();
    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      const supabase = adminClient ?? (await getTrustedServerClient());
      if (!supabase) {
        throw new DatabaseSetupError('Supabase client is unavailable.');
      }

      const { data, error } = await supabase
        .from('bookings')
        .select('*, halls(name)')
        .eq('requester_email', cleanEmail)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseSetupError(
          `Supabase bookings lookup failed (${error.code || 'DB_ERROR'}): ${error.message}`,
          error.code || 'DB_ERROR'
        );
      }

      return ((data || []) as unknown as DatabaseBookingRow[]).map((r) => mapBookingFromDb(r));
    }

    return this.bookings
      .filter((b) => b.requesterEmail.toLowerCase() === cleanEmail)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async anonymizePiiForSubject(params: {
    userId?: string | null;
    email?: string | null;
    bookingReference?: string | null;
  }): Promise<number> {
    const cleanEmail = params.email?.trim().toLowerCase() || null;
    const cleanRef = params.bookingReference?.trim().toUpperCase() || null;
    const cleanUserId = toNullableUuid(params.userId);
    const anonymizedEmail = `erased-${Date.now().toString(36)}@anonymized.local`;

    if (isSupabaseConfigured()) {
      const adminClient = createAdminClient();
      if (!adminClient) {
        throw new DatabaseSetupError(
          'Service role key is required to execute server-side PII anonymization.'
        );
      }

      let query = adminClient
        .from('bookings')
        .update({
          requester_name: 'Redacted User (GDPR Art. 17)',
          requester_email: anonymizedEmail,
          requester_phone: 'REDACTED',
          requester_org: null,
          special_requests: null,
          user_id: null,
          updated_at: new Date().toISOString(),
        });

      if (cleanRef) {
        query = query.eq('reference_number', cleanRef);
      } else if (cleanUserId && cleanEmail) {
        query = query.or(`user_id.eq.${cleanUserId},requester_email.eq.${cleanEmail}`);
      } else if (cleanUserId) {
        query = query.eq('user_id', cleanUserId);
      } else if (cleanEmail) {
        query = query.eq('requester_email', cleanEmail);
      } else {
        return 0;
      }

      const { data, error } = await query.select('id');
      if (error) {
        throw new DatabaseSetupError(
          `Failed to anonymize booking records (${error.code || 'DB_ERROR'}): ${error.message}`,
          error.code || 'DB_ERROR'
        );
      }

      if (cleanUserId) {
        await adminClient
          .from('profiles')
          .update({
            full_name: 'Deleted Citizen',
            phone: null,
            organization: null,
            marketing_opt_in: false,
            consent_updated_at: new Date().toISOString(),
          })
          .eq('id', cleanUserId);
      }

      return Array.isArray(data) ? data.length : 0;
    }

    let count = 0;
    this.bookings = this.bookings.map((b) => {
      const matchesRef = cleanRef && b.referenceNumber.toUpperCase() === cleanRef;
      const matchesUser = cleanUserId && b.userId === cleanUserId;
      const matchesEmail = cleanEmail && b.requesterEmail.toLowerCase() === cleanEmail;
      if (matchesRef || (!cleanRef && (matchesUser || matchesEmail))) {
        count += 1;
        return {
          ...b,
          userId: null,
          requesterName: 'Redacted User (GDPR Art. 17)',
          requesterEmail: anonymizedEmail,
          requesterPhone: 'REDACTED',
          requesterOrg: null,
          specialRequests: null,
          updatedAt: new Date().toISOString(),
        };
      }
      return b;
    });

    return count;
  }
}

export const bookingStore = new BookingDataStore();

export const recordAuditEvent = (event: Parameters<BookingDataStore['recordAuditEvent']>[0]) =>
  bookingStore.recordAuditEvent(event);
export const getBookingsForHall = (hallId: string) => bookingStore.getBookingsForHall(hallId);
export const getMaintenanceForHall = (hallId: string) => bookingStore.getMaintenanceForHall(hallId);
export const getAllMaintenance = () => bookingStore.getAllMaintenance();
export const getAllBookings = (status?: BookingStatus) => bookingStore.getAllBookings(status);
export const getBookingByReference = (ref: string) => bookingStore.getBookingByReference(ref);
export const getBookingById = (id: string) => bookingStore.getBookingById(id);
export const getUserBookings = (userId: string) => bookingStore.getUserBookings(userId);
export const createBookingRequest = (data: BookingFormData, userId?: string | null) =>
  bookingStore.createBookingRequest(data, userId);
export const cancelOwnPendingBooking = (
  bookingId: string,
  userId: string,
  userEmail: string,
  reason?: string
) => bookingStore.cancelOwnPendingBooking(bookingId, userId, userEmail, reason);
export const approveBookingWithConcurrencyCheck = (
  bookingId: string,
  reviewedBy: string,
  decisionNotes?: string,
  reviewerId?: string | null
) => bookingStore.approveBookingWithConcurrencyCheck(bookingId, reviewedBy, decisionNotes, reviewerId);
export const rejectBooking = (
  bookingId: string,
  reviewedBy: string,
  decisionNotes?: string,
  reviewerId?: string | null
) => bookingStore.rejectBooking(bookingId, reviewedBy, decisionNotes, reviewerId);
export const getAdminDashboardSummary = () => bookingStore.getAdminDashboardSummary();
export const createMaintenanceWindow = (
  data: {
    hallId: string;
    title: string;
    reason: string;
    startTime: string;
    endTime: string;
  },
  actor?: ActorInfo
) => bookingStore.createMaintenanceWindow(data, actor);
export const updateMaintenanceWindow = (
  id: string,
  updates: Partial<MaintenanceWindow>,
  actor?: ActorInfo
) => bookingStore.updateMaintenanceWindow(id, updates, actor);
export const cancelMaintenanceWindow = (id: string, reason?: string, actor?: ActorInfo) =>
  bookingStore.cancelMaintenanceWindow(id, reason, actor);
export const getAuditEvents = (filters?: AuditFilters) => bookingStore.getAuditEvents(filters);
export const getBookingsByEmail = (email: string) => bookingStore.getBookingsByEmail(email);
export const anonymizePiiForSubject = (params: {
  userId?: string | null;
  email?: string | null;
  bookingReference?: string | null;
}) => bookingStore.anonymizePiiForSubject(params);
