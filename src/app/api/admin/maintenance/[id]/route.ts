import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { updateMaintenanceWindow, cancelMaintenanceWindow } from '@/lib/services/booking-store';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const result = await updateMaintenanceWindow(id, body, {
      id: session.user.id,
      email: session.user.email,
    });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update maintenance.', conflicts: result.conflicts },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      maintenance: result.maintenance,
      message: 'Maintenance window updated successfully.',
    });
  } catch (err) {
    console.error('Update maintenance error:', err);
    return NextResponse.json({ error: 'Failed to update maintenance.' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const result = await cancelMaintenanceWindow(id, body.reason, {
      id: session.user.id,
      email: session.user.email,
    });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to cancel maintenance.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      maintenance: result.maintenance,
      message: 'Maintenance window cancelled. Venue availability restored.',
    });
  } catch (err) {
    console.error('Cancel maintenance error:', err);
    return NextResponse.json({ error: 'Failed to cancel maintenance.' }, { status: 500 });
  }
}
