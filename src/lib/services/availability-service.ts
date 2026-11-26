import {
  AvailabilityCheckResult,
  Booking,
  MaintenanceWindow,
  TimeSlot,
} from '@/types';
import { DatabaseSetupError, getAllHalls, getHallById } from './hall-service';
import { getBookingsForHall, getMaintenanceForHall } from './booking-store';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient, createPublicClient } from '@/lib/supabase/server';
import {
  mapBookingFromDb,
  mapMaintenanceFromDb,
  DatabaseBookingRow,
  DatabaseMaintenanceRow,
} from '@/lib/supabase/types';
import { zonedLocalToUtcDate } from '@/lib/utils/timezone';

interface PublicScheduleEntry {
  kind: 'APPROVED_BOOKING' | 'MAINTENANCE_WINDOW';
  title: string;
  start_time: string;
  end_time: string;
  status: string;
}

/**
 * Checks whether a requested time interval [requestedStart, requestedEnd] is available.
 *
 * CORE DOMAIN RULES:
 * 1. Maintenance windows (SCHEDULED / IN_PROGRESS) block availability.
 * 2. Approved bookings (status = 'APPROVED') block availability.
 * 3. Submitted requests (status = 'PENDING') do NOT block availability.
 * 4. Cancelled or Rejected bookings never block availability.
 */
export async function checkSlotAvailability(
  hallId: string,
  start: Date,
  end: Date
): Promise<AvailabilityCheckResult> {
  const hall = await getHallById(hallId);
  const dataSource = isSupabaseConfigured() ? 'LIVE_DATABASE' : 'ISOLATED_SAMPLE_STORE';

  if (!hall) {
    return {
      isAvailable: false,
      hallId,
      requestedStart: start.toISOString(),
      requestedEnd: end.toISOString(),
      conflictingBookings: [],
      conflictingMaintenance: [],
      message: 'Specified hall does not exist or is inactive.',
      dataSource,
    };
  }

  const requestedStartMs = start.getTime();
  const requestedEndMs = end.getTime();

  if (requestedEndMs <= requestedStartMs) {
    return {
      isAvailable: false,
      hallId,
      requestedStart: start.toISOString(),
      requestedEnd: end.toISOString(),
      conflictingBookings: [],
      conflictingMaintenance: [],
      message: 'End time must be later than start time.',
      dataSource,
    };
  }

  let conflictingBookings: Booking[] = [];
  let conflictingMaintenance: MaintenanceWindow[] = [];

  if (isSupabaseConfigured()) {
    const adminClient = createAdminClient();
    if (adminClient) {
      const [{ data: bData, error: bError }, { data: mData, error: mError }] = await Promise.all([
        adminClient
          .from('bookings')
          .select('*, halls(name)')
          .eq('hall_id', hallId)
          .eq('status', 'APPROVED')
          .lt('start_time', end.toISOString())
          .gt('end_time', start.toISOString()),
        adminClient
          .from('maintenance_windows')
          .select('*, halls(name)')
          .eq('hall_id', hallId)
          .in('status', ['SCHEDULED', 'IN_PROGRESS'])
          .lt('start_time', end.toISOString())
          .gt('end_time', start.toISOString()),
      ]);

      if (bError) {
        throw new DatabaseSetupError(`Availability query failed: ${bError.message}`, bError.code);
      }
      if (mError) {
        throw new DatabaseSetupError(`Maintenance query failed: ${mError.message}`, mError.code);
      }

      conflictingBookings = ((bData || []) as unknown as DatabaseBookingRow[]).map((r) =>
        mapBookingFromDb(r, hall.name)
      );
      conflictingMaintenance = ((mData || []) as unknown as DatabaseMaintenanceRow[]).map((r) =>
        mapMaintenanceFromDb(r, hall.name)
      );
    } else {
      // Public client uses privacy-preserving RPC (does not expose requester PII)
      const publicClient = createPublicClient();
      if (!publicClient) {
        throw new DatabaseSetupError('Supabase client is unavailable.');
      }
      const { data: scheduleRows, error: rpcError } = await publicClient.rpc(
        'get_public_hall_schedule',
        {
          p_hall_id: hallId,
          p_day_start: start.toISOString(),
          p_day_end: end.toISOString(),
        }
      );

      if (rpcError) {
        throw new DatabaseSetupError(
          `Supabase availability RPC failed (${rpcError.code || 'DB_ERROR'}): ${rpcError.message}`,
          rpcError.code || 'DB_ERROR'
        );
      }

      const entries = (scheduleRows || []) as PublicScheduleEntry[];
      conflictingBookings = entries
        .filter((e) => e.kind === 'APPROVED_BOOKING')
        .map((e, idx) => ({
          id: `conflict-b-${idx}`,
          referenceNumber: 'RESERVED',
          hallId,
          hallName: hall.name,
          requesterName: 'Reserved',
          requesterEmail: '',
          requesterPhone: '',
          eventName: e.title,
          eventType: 'Reserved Event',
          expectedAttendees: 0,
          startTime: e.start_time,
          endTime: e.end_time,
          status: 'APPROVED',
          createdAt: e.start_time,
          updatedAt: e.start_time,
        }));

      conflictingMaintenance = entries
        .filter((e) => e.kind === 'MAINTENANCE_WINDOW')
        .map((e, idx) => ({
          id: `conflict-m-${idx}`,
          hallId,
          hallName: hall.name,
          title: e.title,
          reason: 'Scheduled Maintenance',
          startTime: e.start_time,
          endTime: e.end_time,
          status: (e.status as MaintenanceWindow['status']) || 'SCHEDULED',
          createdAt: e.start_time,
          updatedAt: e.start_time,
        }));
    }
  } else {
    const [allBookings, allMaintenance] = await Promise.all([
      getBookingsForHall(hallId),
      getMaintenanceForHall(hallId),
    ]);

    conflictingBookings = allBookings.filter((b) => {
      if (b.status !== 'APPROVED') return false;
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return requestedStartMs < bEnd && requestedEndMs > bStart;
    });

    conflictingMaintenance = allMaintenance.filter((m) => {
      if (m.status !== 'SCHEDULED' && m.status !== 'IN_PROGRESS') return false;
      const mStart = new Date(m.startTime).getTime();
      const mEnd = new Date(m.endTime).getTime();
      return requestedStartMs < mEnd && requestedEndMs > mStart;
    });
  }

  const isAvailable =
    conflictingBookings.length === 0 && conflictingMaintenance.length === 0;

  let message = 'This time slot is available for booking requests.';
  if (conflictingBookings.length > 0 && conflictingMaintenance.length > 0) {
    message = `Unavailable: Overlaps with an approved event (${conflictingBookings[0].eventName}) and scheduled maintenance.`;
  } else if (conflictingBookings.length > 0) {
    message = `Unavailable: An approved event (${conflictingBookings[0].eventName}) is already confirmed for this time.`;
  } else if (conflictingMaintenance.length > 0) {
    message = `Unavailable: Facility maintenance (${conflictingMaintenance[0].title}) is scheduled during this time.`;
  }

  return {
    isAvailable,
    hallId,
    requestedStart: start.toISOString(),
    requestedEnd: end.toISOString(),
    conflictingBookings,
    conflictingMaintenance,
    message,
    dataSource,
  };
}

/**
 * Generates an hourly schedule breakdown for a hall on a specific local date (YYYY-MM-DD).
 */
export async function getDaySchedule(hallId: string, dateStr: string): Promise<TimeSlot[]> {
  const hall = await getHallById(hallId);
  if (!hall) {
    return [];
  }

  const openHour = hall.operatingHours ? parseInt(hall.operatingHours.open.split(':')[0], 10) : 8;
  const closeHour = hall.operatingHours ? parseInt(hall.operatingHours.close.split(':')[0], 10) : 22;

  const dayStart = zonedLocalToUtcDate(dateStr, '00:00');
  const dayEnd = zonedLocalToUtcDate(dateStr, '23:59');

  let approvedRanges: { startMs: number; endMs: number; title: string }[] = [];
  let maintRanges: { startMs: number; endMs: number; title: string }[] = [];

  if (isSupabaseConfigured()) {
    const adminClient = createAdminClient();
    if (adminClient) {
      const [{ data: bData, error: bError }, { data: mData, error: mError }] = await Promise.all([
        adminClient
          .from('bookings')
          .select('event_name, start_time, end_time')
          .eq('hall_id', hallId)
          .eq('status', 'APPROVED')
          .lt('start_time', dayEnd.toISOString())
          .gt('end_time', dayStart.toISOString()),
        adminClient
          .from('maintenance_windows')
          .select('title, start_time, end_time')
          .eq('hall_id', hallId)
          .in('status', ['SCHEDULED', 'IN_PROGRESS'])
          .lt('start_time', dayEnd.toISOString())
          .gt('end_time', dayStart.toISOString()),
      ]);

      if (bError) {
        throw new DatabaseSetupError(`Schedule query failed: ${bError.message}`, bError.code);
      }
      if (mError) {
        throw new DatabaseSetupError(`Maintenance schedule query failed: ${mError.message}`, mError.code);
      }

      approvedRanges = (bData || []).map((b) => ({
        startMs: new Date(b.start_time).getTime(),
        endMs: new Date(b.end_time).getTime(),
        title: b.event_name,
      }));
      maintRanges = (mData || []).map((m) => ({
        startMs: new Date(m.start_time).getTime(),
        endMs: new Date(m.end_time).getTime(),
        title: m.title,
      }));
    } else {
      const publicClient = createPublicClient();
      if (!publicClient) {
        throw new DatabaseSetupError('Supabase client is unavailable.');
      }
      const { data: scheduleRows, error: rpcError } = await publicClient.rpc(
        'get_public_hall_schedule',
        {
          p_hall_id: hallId,
          p_day_start: dayStart.toISOString(),
          p_day_end: dayEnd.toISOString(),
        }
      );

      if (rpcError) {
        throw new DatabaseSetupError(
          `Supabase schedule RPC failed (${rpcError.code || 'DB_ERROR'}): ${rpcError.message}`,
          rpcError.code || 'DB_ERROR'
        );
      }

      const entries = (scheduleRows || []) as PublicScheduleEntry[];
      approvedRanges = entries
        .filter((e) => e.kind === 'APPROVED_BOOKING')
        .map((e) => ({
          startMs: new Date(e.start_time).getTime(),
          endMs: new Date(e.end_time).getTime(),
          title: e.title,
        }));
      maintRanges = entries
        .filter((e) => e.kind === 'MAINTENANCE_WINDOW')
        .map((e) => ({
          startMs: new Date(e.start_time).getTime(),
          endMs: new Date(e.end_time).getTime(),
          title: e.title,
        }));
    }
  } else {
    const [allBookings, allMaintenance] = await Promise.all([
      getBookingsForHall(hallId),
      getMaintenanceForHall(hallId),
    ]);

    approvedRanges = allBookings
      .filter((b) => b.status === 'APPROVED')
      .map((b) => ({
        startMs: new Date(b.startTime).getTime(),
        endMs: new Date(b.endTime).getTime(),
        title: b.eventName,
      }))
      .filter((r) => r.startMs < dayEnd.getTime() && r.endMs > dayStart.getTime());

    maintRanges = allMaintenance
      .filter((m) => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS')
      .map((m) => ({
        startMs: new Date(m.startTime).getTime(),
        endMs: new Date(m.endTime).getTime(),
        title: m.title,
      }))
      .filter((r) => r.startMs < dayEnd.getTime() && r.endMs > dayStart.getTime());
  }

  const slots: TimeSlot[] = [];

  for (let hour = openHour; hour < closeHour; hour++) {
    const slotStartStr = `${hour.toString().padStart(2, '0')}:00`;
    const slotEndStr = `${(hour + 1).toString().padStart(2, '0')}:00`;

    const slotStartMs = zonedLocalToUtcDate(dateStr, slotStartStr).getTime();
    const slotEndMs = zonedLocalToUtcDate(dateStr, slotEndStr).getTime();

    const maintConflict = maintRanges.find(
      (m) => slotStartMs < m.endMs && slotEndMs > m.startMs
    );

    const bookingConflict = approvedRanges.find(
      (b) => slotStartMs < b.endMs && slotEndMs > b.startMs
    );

    if (maintConflict) {
      slots.push({
        startTime: slotStartStr,
        endTime: slotEndStr,
        isAvailable: false,
        conflictReason: 'MAINTENANCE_WINDOW',
        conflictDetails: `Facility Maintenance: ${maintConflict.title}`,
      });
    } else if (bookingConflict) {
      slots.push({
        startTime: slotStartStr,
        endTime: slotEndStr,
        isAvailable: false,
        conflictReason: 'APPROVED_BOOKING',
        conflictDetails: `Confirmed Event: ${bookingConflict.title}`,
        bookingStatus: 'APPROVED',
      });
    } else {
      slots.push({
        startTime: slotStartStr,
        endTime: slotEndStr,
        isAvailable: true,
      });
    }
  }

  return slots;
}

/**
 * Evaluates date availability across all active halls for directory filtering.
 * Returns a map of hallId -> { availableSlots, totalSlots, hasAvailability }.
 */
export async function getHallsAvailabilityForDate(
  dateStr: string
): Promise<Record<string, { availableHours: number; totalHours: number; hasAvailability: boolean }>> {
  const halls = await getAllHalls();
  const entries = await Promise.all(
    halls.map(async (hall) => {
      const slots = await getDaySchedule(hall.id, dateStr);
      const availableHours = slots.filter((s) => s.isAvailable).length;
      return [
        hall.id,
        {
          availableHours,
          totalHours: slots.length,
          hasAvailability: availableHours > 0,
        },
      ] as const;
    })
  );

  return Object.fromEntries(entries);
}
