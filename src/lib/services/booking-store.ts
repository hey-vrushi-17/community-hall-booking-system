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
import { SAMPLE_HALLS } from '@/lib/data/sample-halls';
import { BookingFormData } from '@/lib/validation/booking-schema';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import {
  mapBookingFromDb,
  mapMaintenanceFromDb,
  DatabaseBookingRow,
  DatabaseMaintenanceRow,
} from '@/lib/supabase/types';
import { getHallById } from './hall-service';

// Helper to mute internal Next.js prerender bail-out exceptions and dev-only fallbacks
function logStoreWarning(msg: string, err: unknown) {
  if ((err as any)?.digest?.startsWith?.('NEXT_') || (err as any)?.digest === 'HANGING_PROMISE_REJECTION') {
    throw err;
  }
  if (process.env.NODE_ENV === 'development') {
    logStoreWarning(msg, err);
  }
}

// In-Memory Fallback Store (Used when Supabase credentials are not configured)
class BookingDataStore {
  private bookings: Booking[] = [...INITIAL_SAMPLE_BOOKINGS];
  private maintenance: MaintenanceWindow[] = [...INITIAL_MAINTENANCE_WINDOWS];
  private auditEvents: AuditEvent[] = [...INITIAL_AUDIT_EVENTS];

  // Per-hall mutex locks to simulate transaction isolation and prevent concurrent overlapping approvals
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

  public async getBookingsForHall(hallId: string): Promise<Booking[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('bookings')
            .select('*, halls(name)')
            .eq('hall_id', hallId);

          if (!error && data) {
            return (data as unknown as DatabaseBookingRow[]).map((r) => mapBookingFromDb(r));
          }
        }
      } catch (err) {
        logStoreWarning('Supabase getBookingsForHall failed, using fallback:', err);
      }
    }
    return this.bookings.filter((b) => b.hallId === hallId);
  }

  public async getMaintenanceForHall(hallId: string): Promise<MaintenanceWindow[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('maintenance_windows')
            .select('*, halls(name)')
            .eq('hall_id', hallId);

          if (!error && data) {
            return (data as unknown as DatabaseMaintenanceRow[]).map((r) => mapMaintenanceFromDb(r));
          }
        }
      } catch (err) {
        logStoreWarning('Supabase getMaintenanceForHall failed, using fallback:', err);
      }
    }
    return this.maintenance.filter((m) => m.hallId === hallId);
  }

  public async getAllMaintenance(): Promise<MaintenanceWindow[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('maintenance_windows')
            .select('*, halls(name)')
            .order('start_time', { ascending: true });

          if (!error && data) {
            return (data as unknown as DatabaseMaintenanceRow[]).map((r) => mapMaintenanceFromDb(r));
          }
        }
      } catch (err) {
        logStoreWarning('Supabase getAllMaintenance failed, using fallback:', err);
      }
    }
    return [...this.maintenance].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  public async getAllBookings(filterStatus?: BookingStatus): Promise<Booking[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          let query = supabase.from('bookings').select('*, halls(name)');
          if (filterStatus) {
            query = query.eq('status', filterStatus);
          }
          const { data, error } = await query.order('created_at', { ascending: false });

          if (!error && data) {
            return (data as unknown as DatabaseBookingRow[]).map((r) => mapBookingFromDb(r));
          }
        }
      } catch (err) {
        logStoreWarning('Supabase getAllBookings failed, using fallback:', err);
      }
    }

    if (filterStatus) {
      return this.bookings.filter((b) => b.status === filterStatus);
    }
    return [...this.bookings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async getBookingByReference(ref: string): Promise<Booking | null> {
    const cleanRef = ref.trim().toUpperCase();
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('bookings')
            .select('*, halls(name)')
            .eq('reference_number', cleanRef)
            .maybeSingle();

          if (!error && data) {
            return mapBookingFromDb(data as unknown as DatabaseBookingRow);
          }
        }
      } catch (err) {
        logStoreWarning('Supabase getBookingByReference failed, using fallback:', err);
      }
    }

    const booking = this.bookings.find(
      (b) => b.referenceNumber.toUpperCase() === cleanRef
    );
    return booking || null;
  }

  public async getBookingById(id: string): Promise<Booking | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('bookings')
            .select('*, halls(name)')
            .eq('id', id)
            .maybeSingle();

          if (!error && data) {
            return mapBookingFromDb(data as unknown as DatabaseBookingRow);
          }
        }
      } catch (err) {
        logStoreWarning('Supabase getBookingById failed, using fallback:', err);
      }
    }

    const booking = this.bookings.find((b) => b.id === id);
    return booking || null;
  }

  /**
   * Safe requester-scoped query: retrieve requests submitted by a specific user.
   */
  public async getUserBookings(userId: string): Promise<Booking[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('bookings')
            .select('*, halls(name)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            return (data as unknown as DatabaseBookingRow[]).map((r) => mapBookingFromDb(r));
          }
        }
      } catch (err) {
        logStoreWarning('Supabase getUserBookings failed, using fallback:', err);
      }
    }

    return this.bookings
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getAuditEvents(): Promise<AuditEvent[]> {
    return [...this.auditEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Submit a new public booking request.
   * Status is initialized to PENDING. A submitted request is never presented as confirmed!
   */
  public async createBookingRequest(
    data: BookingFormData,
    userId?: string | null
  ): Promise<Booking> {
    const hall = await getHallById(data.hallId);
    const hallName = hall ? hall.name : 'Community Hall';

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceNumber = `REQ-2026-${randomSuffix}`;

    const startDateTime = new Date(`${data.bookingDate}T${data.startTime}:00Z`).toISOString();
    const endDateTime = new Date(`${data.bookingDate}T${data.endTime}:00Z`).toISOString();

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const insertPayload = {
            reference_number: referenceNumber,
            hall_id: data.hallId,
            user_id: userId || null,
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
            status: 'PENDING' as const, // Always initialized to PENDING!
          };

          const { data: inserted, error } = await supabase
            .from('bookings')
            .insert(insertPayload)
            .select('*, halls(name)')
            .single();

          if (error) {
            console.error('Failed to insert booking into Supabase:', error);
            throw new Error(`Database error saving booking request: ${error.message}`);
          }

          if (inserted) {
            return mapBookingFromDb(inserted as unknown as DatabaseBookingRow, hallName);
          }
        }
      } catch (err: unknown) {
        logStoreWarning('Supabase booking creation encountered an error, falling back to local store:', err);
      }
    }

    // In-memory fallback persistence
    const newBooking: Booking = {
      id: `bkg-${Date.now()}-${randomSuffix}`,
      referenceNumber,
      hallId: data.hallId,
      hallName,
      userId: userId || null,
      requesterName: data.requesterName,
      requesterEmail: data.requesterEmail,
      requesterPhone: data.requesterPhone,
      requesterOrg: data.requesterOrg || null,
      eventName: data.eventName,
      eventType: data.eventType,
      expectedAttendees: Number(data.expectedAttendees),
      specialRequests: data.specialRequests || null,
      startTime: startDateTime,
      endTime: endDateTime,
      status: 'PENDING',
      reviewedBy: null,
      reviewedAt: null,
      decisionNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.bookings.unshift(newBooking);

    // Record audit event
    this.auditEvents.unshift({
      id: `audit-${Date.now()}`,
      actorId: userId || null,
      actorEmail: data.requesterEmail,
      action: 'SUBMIT_BOOKING_REQUEST',
      entityType: 'Booking',
      entityId: newBooking.id,
      summary: `Booking request ${referenceNumber} submitted for ${hallName}`,
      metadata: {
        eventName: data.eventName,
        attendees: data.expectedAttendees,
        startTime: startDateTime,
        endTime: endDateTime,
      },
      timestamp: new Date().toISOString(),
    });

    return newBooking;
  }

  /**
   * Administrative decision: Approve a booking request with concurrency check.
   */
  public async approveBookingWithConcurrencyCheck(
    bookingId: string,
    reviewedBy: string,
    decisionNotes?: string
  ): Promise<{ success: boolean; booking?: Booking; error?: string; conflictBookings?: Booking[] }> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      return { success: false, error: 'Booking request not found' };
    }

    if (booking.status === 'APPROVED') {
      return { success: true, booking };
    }

    // Concurrency control using per-hall lock
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

      // Check for overlapping approved bookings
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
          error: 'Cannot approve booking: A conflicting approved event already exists for this time slot.',
          conflictBookings,
        };
      }

      // Check for overlapping maintenance
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
          error: 'Cannot approve booking: Facility is scheduled for maintenance during this time slot.',
        };
      }

      booking.status = 'APPROVED';
      booking.reviewedBy = reviewedBy;
      booking.reviewedAt = new Date().toISOString();
      booking.decisionNotes = decisionNotes || 'Approved by municipal facility administrator.';
      booking.updatedAt = new Date().toISOString();

      return { success: true, booking };
    } finally {
      this.releaseHallLock(booking.hallId);
    }
  }

  public async rejectBooking(
    bookingId: string,
    reviewedBy: string,
    decisionNotes?: string
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const booking = await this.getBookingById(bookingId);
    if (!booking) {
      return { success: false, error: 'Booking request not found' };
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('bookings')
            .update({
              status: 'REJECTED',
              reviewed_by: null,
              reviewed_at: new Date().toISOString(),
              decision_notes: decisionNotes || 'Request declined by facility administration.',
              updated_at: new Date().toISOString(),
            })
            .eq('id', bookingId)
            .select('*, halls(name)')
            .single();

          if (!error && data) {
            return { success: true, booking: mapBookingFromDb(data as unknown as DatabaseBookingRow) };
          }
        }
      } catch (err) {
        logStoreWarning('Supabase rejectBooking failed, fallback to local store:', err);
      }
    }

    booking.status = 'REJECTED';
    booking.reviewedBy = reviewedBy;
    booking.reviewedAt = new Date().toISOString();
    booking.decisionNotes = decisionNotes || 'Request declined by facility administration.';
    booking.updatedAt = new Date().toISOString();

    // Record audit event
    this.auditEvents.unshift({
      id: `audit-${Date.now()}`,
      actorId: null,
      actorEmail: reviewedBy,
      action: 'REJECT_BOOKING',
      entityType: 'Booking',
      entityId: booking.id,
      summary: `Booking request ${booking.referenceNumber} was declined`,
      metadata: {
        reason: decisionNotes,
        hallId: booking.hallId,
      },
      timestamp: new Date().toISOString(),
    });

    return { success: true, booking };
  }

  public async getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
    const allBookings = await this.getAllBookings();
    const allMaintenance = await this.getAllMaintenance();
    const { SAMPLE_HALLS } = await import('@/lib/data/sample-halls');

    const pendingRequests = allBookings.filter((b) => b.status === 'PENDING');
    const approvedBookings = allBookings.filter((b) => b.status === 'APPROVED');
    const rejectedBookings = allBookings.filter((b) => b.status === 'REJECTED');
    const activeMaintenance = allMaintenance.filter(
      (m) => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS'
    );

    // Calculate per-hall utilization
    const hallUtilization: HallUtilization[] = SAMPLE_HALLS.map((hall) => {
      const hallBookings = approvedBookings.filter((b) => b.hallId === hall.id);
      let approvedHours = 0;

      for (const b of hallBookings) {
        const start = new Date(b.startTime).getTime();
        const end = new Date(b.endTime).getTime();
        const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
        approvedHours += hours;
      }

      // Standard monthly capacity approx 420 hrs (14 hrs/day * 30 days)
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

  public async createMaintenanceWindow(data: {
    hallId: string;
    title: string;
    reason: string;
    startTime: string;
    endTime: string;
  }): Promise<{ success: boolean; maintenance?: MaintenanceWindow; error?: string; conflicts?: Booking[] }> {
    const startMs = new Date(data.startTime).getTime();
    const endMs = new Date(data.endTime).getTime();

    if (endMs <= startMs) {
      return { success: false, error: 'Maintenance end time must be after start time.' };
    }

    // Server-side conflict verification against approved bookings
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

    const { getHallById } = await import('./hall-service');
    const hall = await getHallById(data.hallId);
    const hallName = hall?.name || 'Community Facility';

    const id = `maint-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newWindow: MaintenanceWindow = {
      id,
      hallId: data.hallId,
      hallName,
      title: data.title.trim(),
      reason: data.reason.trim(),
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      status: 'SCHEDULED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { error } = await supabase.from('maintenance_windows').insert({
            id: newWindow.id,
            hall_id: newWindow.hallId,
            title: newWindow.title,
            reason: newWindow.reason,
            start_time: newWindow.startTime,
            end_time: newWindow.endTime,
            status: newWindow.status,
          });
          if (error) {
            logStoreWarning('Supabase insert maintenance failed, using local store:', error.message);
          }
        }
      } catch (err) {
        logStoreWarning('Supabase createMaintenanceWindow error:', err);
      }
    }

    this.maintenance.unshift(newWindow);

    this.auditEvents.unshift({
      id: `audit-${Date.now()}`,
      actorId: null,
      actorEmail: 'admin@civic.example',
      action: 'SCHEDULE_MAINTENANCE',
      entityType: 'MaintenanceWindow',
      entityId: newWindow.id,
      summary: `Maintenance scheduled for ${hallName}: ${newWindow.title}`,
      metadata: {
        startTime: newWindow.startTime,
        endTime: newWindow.endTime,
        reason: newWindow.reason,
      },
      timestamp: new Date().toISOString(),
    });

    return { success: true, maintenance: newWindow };
  }

  public async updateMaintenanceWindow(
    id: string,
    updates: Partial<MaintenanceWindow>
  ): Promise<{ success: boolean; maintenance?: MaintenanceWindow; error?: string }> {
    const index = this.maintenance.findIndex((m) => m.id === id);
    if (index === -1) {
      return { success: false, error: 'Maintenance record not found' };
    }

    const current = this.maintenance[index];
    const newStart = updates.startTime || current.startTime;
    const newEnd = updates.endTime || current.endTime;

    if (new Date(newEnd).getTime() <= new Date(newStart).getTime()) {
      return { success: false, error: 'End time must be after start time.' };
    }

    // Check conflict if times changed
    if (updates.startTime || updates.endTime) {
      const startMs = new Date(newStart).getTime();
      const endMs = new Date(newEnd).getTime();
      const bookings = await this.getBookingsForHall(current.hallId);
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
        };
      }
    }

    const updated: MaintenanceWindow = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.maintenance[index] = updated;

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const payload: Record<string, unknown> = {};
          if (updates.title) payload.title = updates.title;
          if (updates.reason) payload.reason = updates.reason;
          if (updates.startTime) payload.start_time = updates.startTime;
          if (updates.endTime) payload.end_time = updates.endTime;
          if (updates.status) payload.status = updates.status;
          await supabase.from('maintenance_windows').update(payload).eq('id', id);
        }
      } catch (err) {
        logStoreWarning('Supabase updateMaintenanceWindow error:', err);
      }
    }

    return { success: true, maintenance: updated };
  }

  public async cancelMaintenanceWindow(
    id: string,
    reason?: string
  ): Promise<{ success: boolean; maintenance?: MaintenanceWindow; error?: string }> {
    const result = await this.updateMaintenanceWindow(id, {
      status: 'CANCELLED',
    });

    if (result.success && result.maintenance) {
      this.auditEvents.unshift({
        id: `audit-${Date.now()}`,
        actorId: null,
        actorEmail: 'admin@civic.example',
        action: 'CANCEL_MAINTENANCE',
        entityType: 'MaintenanceWindow',
        entityId: id,
        summary: `Maintenance cancelled for ${result.maintenance.hallName}: ${result.maintenance.title}`,
        metadata: { cancelReason: reason },
        timestamp: new Date().toISOString(),
      });
    }

    return result;
  }
}

export const bookingStore = new BookingDataStore();

export const getBookingsForHall = (hallId: string) => bookingStore.getBookingsForHall(hallId);
export const getMaintenanceForHall = (hallId: string) => bookingStore.getMaintenanceForHall(hallId);
export const getAllMaintenance = () => bookingStore.getAllMaintenance();
export const getAllBookings = (status?: BookingStatus) => bookingStore.getAllBookings(status);
export const getBookingByReference = (ref: string) => bookingStore.getBookingByReference(ref);
export const getBookingById = (id: string) => bookingStore.getBookingById(id);
export const getUserBookings = (userId: string) => bookingStore.getUserBookings(userId);
export const createBookingRequest = (data: BookingFormData, userId?: string | null) =>
  bookingStore.createBookingRequest(data, userId);
export const approveBookingWithConcurrencyCheck = (
  bookingId: string,
  reviewedBy: string,
  decisionNotes?: string
) => bookingStore.approveBookingWithConcurrencyCheck(bookingId, reviewedBy, decisionNotes);
export const rejectBooking = (
  bookingId: string,
  reviewedBy: string,
  decisionNotes?: string
) => bookingStore.rejectBooking(bookingId, reviewedBy, decisionNotes);
export const getAdminDashboardSummary = () => bookingStore.getAdminDashboardSummary();
export const createMaintenanceWindow = (data: {
  hallId: string;
  title: string;
  reason: string;
  startTime: string;
  endTime: string;
}) => bookingStore.createMaintenanceWindow(data);
export const updateMaintenanceWindow = (id: string, updates: Partial<MaintenanceWindow>) =>
  bookingStore.updateMaintenanceWindow(id, updates);
export const cancelMaintenanceWindow = (id: string, reason?: string) =>
  bookingStore.cancelMaintenanceWindow(id, reason);
export const getAuditEvents = () => bookingStore.getAuditEvents();
