import { NextRequest, NextResponse } from 'next/server';
import {
  checkSlotAvailability,
  getDaySchedule,
} from '@/lib/services/availability-service';
import { availabilityQuerySchema } from '@/lib/validation/booking-schema';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hallId = searchParams.get('hallId');
    const date = searchParams.get('date');
    const startTime = searchParams.get('startTime') || undefined;
    const endTime = searchParams.get('endTime') || undefined;

    const validation = availabilityQuerySchema.safeParse({
      hallId,
      date,
      startTime,
      endTime,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { hallId: validHallId, date: validDate, startTime: validStart, endTime: validEnd } =
      validation.data;

    // Retrieve the full day schedule breakdown
    const schedule = await getDaySchedule(validHallId, validDate);

    // If specific time range was requested, evaluate slot availability
    let slotCheck = null;
    if (validStart && validEnd) {
      const startDateTime = new Date(`${validDate}T${validStart}:00Z`);
      const endDateTime = new Date(`${validDate}T${validEnd}:00Z`);
      slotCheck = await checkSlotAvailability(validHallId, startDateTime, endDateTime);
    }

    const isLive = isSupabaseConfigured();

    return NextResponse.json({
      hallId: validHallId,
      date: validDate,
      schedule,
      slotCheck,
      dataSource: isLive ? 'LIVE_DATABASE' : 'ISOLATED_SAMPLE_STORE',
      notice: isLive
        ? 'Live Supabase schedule: Approved bookings and active maintenance windows block availability. Submitted requests remain pending and do not block dates.'
        : 'Development sample schedule: Approved bookings and active maintenance windows block availability. Submitted requests remain pending and do not block dates.',
    });
  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'An error occurred while evaluating facility availability' },
      { status: 500 }
    );
  }
}
