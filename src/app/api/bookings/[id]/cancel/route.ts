import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured, rethrowNextControlFlowError } from '@/lib/supabase/config';
import { cancelOwnPendingBooking } from '@/lib/services/booking-store';
import { DatabaseSetupError } from '@/lib/services/hall-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'User authentication is required to cancel booking requests.' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Authentication service unavailable.' }, { status: 503 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to cancel your pending booking request.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason : undefined;

    const result = await cancelOwnPendingBooking(
      id,
      user.id,
      user.email || 'citizen@example.org',
      reason
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Unable to cancel booking request.' },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
      message: `Booking request ${result.booking?.referenceNumber} has been cancelled.`,
    });
  } catch (error: unknown) {
    rethrowNextControlFlowError(error);
    if (error instanceof DatabaseSetupError) {
      return NextResponse.json(
        { error: 'Database unavailable.', details: error.message },
        { status: 503 }
      );
    }
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while cancelling the request.' },
      { status: 500 }
    );
  }
}
