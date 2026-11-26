import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { getAllHallsAdmin, createHall } from '@/lib/services/hall-service';
import { HallAdminInputSchema } from '@/lib/validation/hall-schema';

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAuthenticated || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized: Administrator or Staff permissions required.' },
      { status: 403 }
    );
  }

  const halls = await getAllHallsAdmin(true);
  return NextResponse.json({ halls });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrator or Staff permissions required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = HallAdminInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || 'Invalid hall details.',
          issues: parsed.error.issues,
        },
        { status: 422 }
      );
    }

    const newHall = await createHall(parsed.data, {
      id: session.user.id,
      email: session.user.email,
    });
    return NextResponse.json(
      { success: true, hall: newHall, message: 'Facility created successfully.' },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('Create hall error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create community facility.' },
      { status: 500 }
    );
  }
}
