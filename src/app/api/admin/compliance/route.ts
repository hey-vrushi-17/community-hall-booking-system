import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { complianceStore } from '@/lib/services/compliance-store';
import {
  adminDeletionUpdateSchema,
  breachIncidentCreateSchema,
  breachIncidentUpdateSchema,
} from '@/lib/validation/compliance-schema';
import { DatabaseSetupError } from '@/lib/services/hall-service';
import { rethrowNextControlFlowError } from '@/lib/supabase/config';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrator or Staff permissions required.' },
        { status: 403 }
      );
    }

    const [deletionRequests, breachIncidents, consentSummary] = await Promise.all([
      complianceStore.getDeletionRequests(),
      complianceStore.getBreachIncidents(),
      complianceStore.getAllConsentSummary(),
    ]);

    return NextResponse.json({
      deletionRequests,
      breachIncidents,
      consentSummary,
    });
  } catch (err: unknown) {
    rethrowNextControlFlowError(err);
    if (err instanceof DatabaseSetupError) {
      return NextResponse.json(
        {
          error: 'Compliance tables not ready in Supabase. Apply migration 04.',
          details: err.message,
        },
        { status: 503 }
      );
    }
    console.error('Admin compliance GET error:', err);
    return NextResponse.json({ error: 'Failed to load compliance records.' }, { status: 500 });
  }
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
    const parsed = breachIncidentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid breach incident data.', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const incident = await complianceStore.createBreachIncident({
      ...parsed.data,
      reportedBy: session.user.email,
      reporterId: session.user.id,
    });

    return NextResponse.json(
      {
        success: true,
        incident,
        message: `Incident ${incident.incidentCode} logged. 72-hour GDPR Art. 33 deadline set.`,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    rethrowNextControlFlowError(err);
    if (err instanceof DatabaseSetupError) {
      return NextResponse.json(
        { error: 'Compliance database schema not ready.', details: err.message },
        { status: 503 }
      );
    }
    console.error('Admin breach create error:', err);
    return NextResponse.json({ error: 'Failed to create breach incident.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Administrator or Staff permissions required.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (body?.kind === 'deletion') {
      const parsed = adminDeletionUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid deletion update payload.', issues: parsed.error.issues },
          { status: 422 }
        );
      }

      const updated = await complianceStore.processDeletionRequestAdmin({
        requestId: parsed.data.requestId,
        action: parsed.data.action,
        adminEmail: session.user.email,
        adminId: session.user.id,
        resolutionNotes: parsed.data.resolutionNotes,
      });

      if (!updated) {
        return NextResponse.json({ error: 'Deletion request not found.' }, { status: 404 });
      }

      return NextResponse.json({ success: true, request: updated });
    }

    const parsed = breachIncidentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid breach update payload.', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const updated = await complianceStore.updateBreachIncident({
      incidentId: parsed.data.incidentId,
      status: parsed.data.status,
      containmentActions: parsed.data.containmentActions,
      adminEmail: session.user.email,
      adminId: session.user.id,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Breach incident not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, incident: updated });
  } catch (err: unknown) {
    rethrowNextControlFlowError(err);
    if (err instanceof DatabaseSetupError) {
      return NextResponse.json(
        { error: 'Compliance database schema not ready.', details: err.message },
        { status: 503 }
      );
    }
    console.error('Admin compliance PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update compliance record.' }, { status: 500 });
  }
}
