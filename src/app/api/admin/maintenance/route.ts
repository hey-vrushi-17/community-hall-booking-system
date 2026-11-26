import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { getAllMaintenance, createMaintenanceWindow } from '@/lib/services/booking-store';
import { maintenanceFormSchema } from '@/lib/validation/booking-schema';

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAuthenticated || !session.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const maintenance = await getAllMaintenance();
  return NextResponse.json({ maintenance });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = maintenanceFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || 'Invalid maintenance schedule details.',
          issues: parsed.error.issues,
        },
        { status: 422 }
      );
    }

    const result = await createMaintenanceWindow(parsed.data, {
      id: session.user.id,
      email: session.user.email,
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
