import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { rejectBooking, getBookingById } from '@/lib/services/booking-store';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrator or Staff permissions required.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const decisionNotes = body.decisionNotes || 'Request declined by municipal facility administration.';

    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json(
        { error: `Booking request with ID "${id}" was not found.` },
        { status: 404 }
      );
    }

    const result = await rejectBooking(id, session.user.email, decisionNotes);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update booking status.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
      message: `Booking request ${booking.referenceNumber} has been rejected.`,
    });
  } catch (err: unknown) {
    console.error('Admin rejection error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred during booking rejection.' },
      { status: 500 }
    );
  }
}
