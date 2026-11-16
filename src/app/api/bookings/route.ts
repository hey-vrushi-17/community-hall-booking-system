import { NextRequest, NextResponse } from 'next/server';
import { bookingFormSchema } from '@/lib/validation/booking-schema';
import {
  createBookingRequest,
  getBookingByReference,
  getAllBookings,
  getUserBookings,
} from '@/lib/services/booking-store';
import { checkSlotAvailability } from '@/lib/services/availability-service';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = bookingFormSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed. Please correct the highlighted fields.',
          issues: validation.error.issues,
        },
        { status: 422 }
      );
    }

    const data = validation.data;

    // Check slot availability at submission time to ensure requester is informed
    const startDateTime = new Date(`${data.bookingDate}T${data.startTime}:00Z`);
    const endDateTime = new Date(`${data.bookingDate}T${data.endTime}:00Z`);
    const availability = await checkSlotAvailability(data.hallId, startDateTime, endDateTime);

    if (!availability.isAvailable) {
      return NextResponse.json(
        {
          error: 'The requested time slot is not available.',
          details: availability.message,
          conflicts: {
            bookings: availability.conflictingBookings.map((b) => ({
              event: b.eventName,
              start: b.startTime,
              end: b.endTime,
            })),
            maintenance: availability.conflictingMaintenance.map((m) => ({
              title: m.title,
              start: m.startTime,
              end: m.endTime,
            })),
          },
        },
        { status: 409 }
      );
    }

    // Identify if the request comes from an authenticated user
    let userId: string | null = null;
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user?.id) {
            userId = authData.user.id;
          }
        }
      } catch (authErr) {
        // Unauthenticated public requester is supported and welcome
        console.debug('Public unauthenticated request submission:', authErr);
      }
    }

    // Persist as a PENDING request - never confirmed automatically
    const newBooking = await createBookingRequest(data, userId);

    return NextResponse.json(
      {
        success: true,
        booking: newBooking,
        message:
          'Booking request successfully submitted. It is now queued for municipal facility review.',
        referenceNumber: newBooking.referenceNumber,
        status: newBooking.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit booking error:', error);
    return NextResponse.json(
      { error: 'Failed to process booking submission. Please verify your connection.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref');
    const userOnly = searchParams.get('userOnly') === 'true';

    // 1. Reference number tracking lookup
    if (ref) {
      const booking = await getBookingByReference(ref);
      if (!booking) {
        return NextResponse.json(
          { error: `No booking request found matching reference "${ref}".` },
          { status: 404 }
        );
      }
      return NextResponse.json({ booking });
    }

    // 2. Safe requester-scoped query for authenticated user
    if (userOnly) {
      let currentUserId: string | null = null;
      if (isSupabaseConfigured()) {
        const supabase = await createClient();
        if (supabase) {
          const { data: authData } = await supabase.auth.getUser();
          currentUserId = authData?.user?.id || null;
        }
      }

      if (!currentUserId) {
        return NextResponse.json(
          { error: 'Authentication required to view your user booking requests.' },
          { status: 401 }
        );
      }

      const userBookings = await getUserBookings(currentUserId);
      return NextResponse.json({ bookings: userBookings });
    }

    // 3. Fallback general list
    const bookings = await getAllBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    return NextResponse.json({ error: 'Failed to retrieve bookings' }, { status: 500 });
  }
}
