import { NextRequest, NextResponse } from 'next/server';
import {
  checkSlotAvailability,
  getDaySchedule,
  getHallsAvailabilityForDate,
} from '@/lib/services/availability-service';
import { DatabaseSetupError } from '@/lib/services/hall-service';
import { availabilityQuerySchema } from '@/lib/validation/booking-schema';
import { isSupabaseConfigured, rethrowNextControlFlowError } from '@/lib/supabase/config';
import { zonedLocalToUtcDate } from '@/lib/utils/timezone';
import { APP_TIMEZONE_LABEL } from '@/lib/config/site-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hallId = searchParams.get('hallId');
    const date = searchParams.get('date');
    const startTime = searchParams.get('startTime') || undefined;
    const endTime = searchParams.get('endTime') || undefined;

    // Directory-level date availability query (all active halls for a given date)
    if (!hallId && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const summary = await getHallsAvailabilityForDate(date);
      return NextResponse.json({
        date,
        timezone: APP_TIMEZONE_LABEL,
        hallsAvailability: summary,
      });
    }

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

    const schedule = await getDaySchedule(validHallId, validDate);

    let slotCheck = null;
    if (validStart && validEnd) {
      const startDateTime = zonedLocalToUtcDate(validDate, validStart);
      const endDateTime = zonedLocalToUtcDate(validDate, validEnd);
      slotCheck = await checkSlotAvailability(validHallId, startDateTime, endDateTime);
    }

    const isLive = isSupabaseConfigured();

    return NextResponse.json({
      hallId: validHallId,
      date: validDate,
      timezone: APP_TIMEZONE_LABEL,
      schedule,
      slotCheck,
      dataSource: isLive ? 'LIVE_DATABASE' : 'ISOLATED_SAMPLE_STORE',
      notice: isLive
        ? `Live Supabase schedule (${APP_TIMEZONE_LABEL}): Approved bookings and active maintenance windows block availability. Submitted requests remain pending and do not block dates.`
        : `Development sample schedule (${APP_TIMEZONE_LABEL}): Approved bookings and active maintenance windows block availability. Submitted requests remain pending and do not block dates.`,
    });
  } catch (error: unknown) {
    rethrowNextControlFlowError(error);
    if (error instanceof DatabaseSetupError) {
      return NextResponse.json(
        {
          error: 'Real availability data is currently unavailable.',
          details: error.message,
          code: error.code,
        },
        { status: 503 }
      );
    }
    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'An error occurred while evaluating facility availability' },
      { status: 500 }
    );
  }
}
