import {
  AvailabilityCheckResult,
  Booking,
  MaintenanceWindow,
  TimeSlot,
} from '@/types';
import { getHallById } from './hall-service';
import { getBookingsForHall, getMaintenanceForHall } from './booking-store';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import {
  mapBookingFromDb,
  mapMaintenanceFromDb,
  DatabaseBookingRow,
  DatabaseMaintenanceRow,
} from '@/lib/supabase/types';

/**
 * Checks whether a requested time interval [requestedStart, requestedEnd] is available.
 *
 * CORE DOMAIN RULES:
 * 1. Maintenance windows (SCHEDULED / IN_PROGRESS) block availability.
 * 2. Approved bookings (status = 'APPROVED') block availability.
 * 3. Submitted requests (status = 'PENDING') do NOT block availability.
 *    (A submitted request is not an approved booking).
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
    try {
      const supabase = await createClient();
      if (supabase) {
        // Query overlapping approved bookings
        const { data: bData, error: bError } = await supabase
          .from('bookings')
          .select('*, halls(name)')
          .eq('hall_id', hallId)
          .eq('status', 'APPROVED')
          .lt('start_time', end.toISOString())
          .gt('end_time', start.toISOString());

        if (!bError && bData) {
          conflictingBookings = (bData as unknown as DatabaseBookingRow[]).map((r) =>
            mapBookingFromDb(r, hall.name)
          );
        }

        // Query overlapping active maintenance
        const { data: mData, error: mError } = await supabase
          .from('maintenance_windows')
          .select('*, halls(name)')
          .eq('hall_id', hallId)
          .in('status', ['SCHEDULED', 'IN_PROGRESS'])
          .lt('start_time', end.toISOString())
          .gt('end_time', start.toISOString());

        if (!mError && mData) {
          conflictingMaintenance = (mData as unknown as DatabaseMaintenanceRow[]).map((r) =>
            mapMaintenanceFromDb(r, hall.name)
          );
        }
      }
    } catch (err) {
      console.warn('Supabase slot availability check error, falling back to in-memory check:', err);
    }
  }

  // Fallback / in-memory check if not Supabase or Supabase query didn't populate
  if (!isSupabaseConfigured() || (conflictingBookings.length === 0 && conflictingMaintenance.length === 0)) {
    const allBookings = await getBookingsForHall(hallId);
    conflictingBookings = allBookings.filter((b) => {
      if (b.status !== 'APPROVED') {
        return false; // Only APPROVED bookings block availability
      }
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return requestedStartMs < bEnd && requestedEndMs > bStart;
    });

    const allMaintenance = await getMaintenanceForHall(hallId);
    conflictingMaintenance = allMaintenance.filter((m) => {
      if (m.status !== 'SCHEDULED' && m.status !== 'IN_PROGRESS') {
        return false;
      }
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
 * Generates an hourly schedule breakdown for a hall on a specific date (YYYY-MM-DD).
 */
export async function getDaySchedule(hallId: string, dateStr: string): Promise<TimeSlot[]> {
  const hall = await getHallById(hallId);
  const openHour = hall?.operatingHours ? parseInt(hall.operatingHours.open.split(':')[0], 10) : 8;
  const closeHour = hall?.operatingHours ? parseInt(hall.operatingHours.close.split(':')[0], 10) : 22;

  const dayStart = new Date(`${dateStr}T00:00:00Z`);
  const dayEnd = new Date(`${dateStr}T23:59:59Z`);

  let approvedBookings: Booking[] = [];
  let activeMaintenance: MaintenanceWindow[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data: bData } = await supabase
          .from('bookings')
          .select('*, halls(name)')
          .eq('hall_id', hallId)
          .eq('status', 'APPROVED')
          .lt('start_time', dayEnd.toISOString())
          .gt('end_time', dayStart.toISOString());

        if (bData) {
          approvedBookings = (bData as unknown as DatabaseBookingRow[]).map((r) =>
            mapBookingFromDb(r)
          );
        }

        const { data: mData } = await supabase
          .from('maintenance_windows')
          .select('*, halls(name)')
          .eq('hall_id', hallId)
          .in('status', ['SCHEDULED', 'IN_PROGRESS'])
          .lt('start_time', dayEnd.toISOString())
          .gt('end_time', dayStart.toISOString());

        if (mData) {
          activeMaintenance = (mData as unknown as DatabaseMaintenanceRow[]).map((r) =>
            mapMaintenanceFromDb(r)
          );
        }
      }
    } catch (err) {
      console.warn('Supabase getDaySchedule error, falling back:', err);
    }
  }

  if (!isSupabaseConfigured() || (approvedBookings.length === 0 && activeMaintenance.length === 0)) {
    const allBookings = await getBookingsForHall(hallId);
    approvedBookings = allBookings.filter((b) => {
      if (b.status !== 'APPROVED') return false;
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return bStart < dayEnd.getTime() && bEnd > dayStart.getTime();
    });

    const allMaintenance = await getMaintenanceForHall(hallId);
    activeMaintenance = allMaintenance.filter((m) => {
      if (m.status !== 'SCHEDULED' && m.status !== 'IN_PROGRESS') return false;
      const mStart = new Date(m.startTime).getTime();
      const mEnd = new Date(m.endTime).getTime();
      return mStart < dayEnd.getTime() && mEnd > dayStart.getTime();
    });
  }

  const slots: TimeSlot[] = [];

  for (let hour = openHour; hour < closeHour; hour++) {
    const slotStartStr = `${hour.toString().padStart(2, '0')}:00`;
    const slotEndStr = `${(hour + 1).toString().padStart(2, '0')}:00`;

    const slotStartMs = new Date(`${dateStr}T${slotStartStr}:00Z`).getTime();
    const slotEndMs = new Date(`${dateStr}T${slotEndStr}:00Z`).getTime();

    // Check conflict with maintenance
    const maintConflict = activeMaintenance.find((m) => {
      const mStart = new Date(m.startTime).getTime();
      const mEnd = new Date(m.endTime).getTime();
      return slotStartMs < mEnd && slotEndMs > mStart;
    });

    // Check conflict with approved bookings
    const bookingConflict = approvedBookings.find((b) => {
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return slotStartMs < bEnd && slotEndMs > bStart;
    });

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
        conflictDetails: `Confirmed Event: ${bookingConflict.eventName}`,
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
