import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured, rethrowNextControlFlowError } from '@/lib/supabase/config';
import { dataDeletionRequestSchema } from '@/lib/validation/compliance-schema';
import { complianceStore } from '@/lib/services/compliance-store';
import { getBookingByReference } from '@/lib/services/booking-store';
import { DatabaseSetupError } from '@/lib/services/hall-service';

async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    return data?.user ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email')?.trim().toLowerCase();
    const refParam = searchParams.get('ref')?.trim().toUpperCase();

    if (user) {
      const requests = await complianceStore.getDeletionRequests({
        userId: user.id,
        email: user.email,
      });
      return NextResponse.json({ requests });
    }

    if (emailParam && refParam) {
      const all = await complianceStore.getDeletionRequests({ email: emailParam });
      const filtered = all.filter((r) => r.referenceCode.toUpperCase() === refParam);
      return NextResponse.json({ requests: filtered });
    }

    return NextResponse.json({ requests: [] });
  } catch (err: unknown) {
    rethrowNextControlFlowError(err);
    if (err instanceof DatabaseSetupError) {
      return NextResponse.json({ requests: [], setupRequired: true });
    }
    return NextResponse.json({ error: 'Unable to retrieve deletion requests.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = dataDeletionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please correct the deletion request fields.', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const user = await getCurrentUser();
    const cleanEmail = parsed.data.requesterEmail.toLowerCase();

    // Verify ownership before immediate self-service execution
    let canExecuteImmediately = false;
    if (parsed.data.executeImmediately) {
      if (user && user.email?.toLowerCase() === cleanEmail) {
        canExecuteImmediately = true;
      } else if (parsed.data.bookingReference) {
        const booking = await getBookingByReference(parsed.data.bookingReference);
        if (booking && booking.requesterEmail.toLowerCase() === cleanEmail) {
          canExecuteImmediately = true;
        }
      }
    }

    const created = await complianceStore.createDeletionRequest({
      userId: user?.id ?? null,
      requesterEmail: cleanEmail,
      requesterName: parsed.data.requesterName,
      bookingReference: parsed.data.bookingReference,
      scope: parsed.data.scope,
      reason: parsed.data.reason,
      executeImmediately: canExecuteImmediately,
    });

    return NextResponse.json(
      {
        success: true,
        request: created,
        message:
          created.status === 'COMPLETED'
            ? `Erasure request ${created.referenceCode} completed immediately. ${created.anonymizedRecordsCount} record(s) anonymized.`
            : `Erasure request ${created.referenceCode} submitted for Data Protection Officer verification within 30 days.`,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    rethrowNextControlFlowError(err);
    if (err instanceof DatabaseSetupError) {
      return NextResponse.json(
        { error: 'Compliance database tables are not initialized yet.', details: err.message },
        { status: 503 }
      );
    }
    console.error('Data deletion request error:', err);
    return NextResponse.json({ error: 'Failed to submit data deletion request.' }, { status: 500 });
  }
}
