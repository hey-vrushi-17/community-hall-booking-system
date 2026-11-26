import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { approveBookingWithConcurrencyCheck, getBookingById } from '@/lib/services/booking-store';

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
    const decisionNotes =
      typeof body.decisionNotes === 'string' && body.decisionNotes.trim()
        ? body.decisionNotes.trim()
        : 'Approved by municipal facility administrator.';

    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json(
        { error: `Booking request with ID "${id}" was not found.` },
        { status: 404 }
      );
    }

    const result = await approveBookingWithConcurrencyCheck(
      id,
      session.user.email,
      decisionNotes,
      session.user.id
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Cannot approve booking: A scheduling conflict was detected.',
          details:
            'Another event or maintenance window occupies this facility time slot. Approval was blocked to prevent double-booking.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
      message: `Booking request ${booking.referenceNumber} has been officially approved.`,
    });
  } catch (err: unknown) {
    console.error('Admin approval error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred during booking approval.' },
      { status: 500 }
    );
  }
}
