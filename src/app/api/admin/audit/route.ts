import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { getAuditEvents } from '@/lib/services/booking-store';
import { DatabaseSetupError } from '@/lib/services/hall-service';
import { rethrowNextControlFlowError } from '@/lib/supabase/config';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrator or Staff permissions required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const events = await getAuditEvents({
      entityType: searchParams.get('entityType') || undefined,
      action: searchParams.get('action') || undefined,
      search: searchParams.get('search') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
    });

    return NextResponse.json({ events });
  } catch (err: unknown) {
    rethrowNextControlFlowError(err);
    if (err instanceof DatabaseSetupError) {
      return NextResponse.json(
        { error: 'Audit log unavailable: database schema not ready.', details: err.message },
        { status: 503 }
      );
    }
    console.error('Audit events fetch error:', err);
    return NextResponse.json({ error: 'Failed to retrieve audit history.' }, { status: 500 });
  }
}
