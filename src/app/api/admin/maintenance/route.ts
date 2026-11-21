import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { getAllMaintenance, createMaintenanceWindow } from '@/lib/services/booking-store';

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const maintenance = await getAllMaintenance();
  return NextResponse.json({ maintenance });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const { hallId, title, reason, startTime, endTime } = body;

    if (!hallId || !title || !reason || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'All fields (hall, title, reason, start time, end time) are required.' },
        { status: 400 }
      );
    }

    const result = await createMaintenanceWindow({
      hallId,
      title,
      reason,
      startTime,
      endTime,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to schedule maintenance.',
          conflicts: result.conflicts,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        maintenance: result.maintenance,
        message: 'Maintenance window scheduled successfully. Public calendar updated.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Schedule maintenance error:', err);
    return NextResponse.json({ error: 'Failed to schedule maintenance.' }, { status: 500 });
  }
}
