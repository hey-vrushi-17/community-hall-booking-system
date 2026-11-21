import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { getHallById, updateHall, archiveHall } from '@/lib/services/hall-service';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const { id } = await context.params;
  const hall = await getHallById(id);
  if (!hall) {
    return NextResponse.json({ error: 'Hall not found' }, { status: 404 });
  }

  return NextResponse.json({ hall });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const updated = await updateHall(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Facility not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      hall: updated,
      message: 'Facility updated successfully.',
    });
  } catch (err) {
    console.error('Update hall error:', err);
    return NextResponse.json({ error: 'Failed to update facility.' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const shouldArchive = Boolean(body.archive);

    const updated = await archiveHall(id, shouldArchive);
    if (!updated) {
      return NextResponse.json({ error: 'Facility not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      hall: updated,
      message: shouldArchive
        ? 'Facility archived. Existing booking records preserved.'
        : 'Facility unarchived and restored to active public directory.',
    });
  } catch (err) {
    console.error('Archive hall error:', err);
    return NextResponse.json({ error: 'Failed to change archive status.' }, { status: 500 });
  }
}
