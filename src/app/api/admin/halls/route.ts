import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { getAllHallsAdmin, createHall } from '@/lib/services/hall-service';

export async function GET() {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
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
    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrator or Staff permissions required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Facility name is required.' },
        { status: 400 }
      );
    }

    if (!body.capacity || Number(body.capacity) <= 0) {
      return NextResponse.json(
        { error: 'Capacity must be greater than 0.' },
        { status: 400 }
      );
    }

    const newHall = await createHall(body);
    return NextResponse.json(
      { success: true, hall: newHall, message: 'Facility created successfully.' },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('Create hall error:', err);
    return NextResponse.json(
      { error: 'Failed to create community facility.' },
      { status: 500 }
    );
  }
}
