import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured, rethrowNextControlFlowError } from '@/lib/supabase/config';
import { complianceStore } from '@/lib/services/compliance-store';
import { getBookingByReference } from '@/lib/services/booking-store';
import { COMPLIANCE_VERSIONS } from '@/lib/config/compliance-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref')?.trim();
    const emailParam = searchParams.get('email')?.trim().toLowerCase();
    const download = searchParams.get('download') === '1';

    let userId: string | null = null;
    let userEmail: string | null = null;
    let profile: Record<string, unknown> | null = null;

    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          userEmail = user.email ?? null;
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('id, role, full_name, phone, organization, created_at, updated_at')
            .eq('id', user.id)
            .maybeSingle();
          profile = profileRow ?? null;
        }
      }
    }

    // Authenticated citizen export
    if (userId || userEmail) {
      const exportPayload = await complianceStore.exportPersonalData({
        userId,
        email: userEmail,
        profile,
      });

      return new NextResponse(JSON.stringify(exportPayload, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...(download
            ? {
                'Content-Disposition':
                  'attachment; filename="civicspaces-gdpr-data-export.json"',
              }
            : {}),
        },
      });
    }

    // Unauthenticated requester verified by exact booking reference + requester email match
    if (ref && emailParam) {
      const booking = await getBookingByReference(ref);
      if (!booking || booking.requesterEmail.toLowerCase() !== emailParam) {
        return NextResponse.json(
          {
            error:
              'Verification failed. The booking reference and email address must match an existing record.',
          },
          { status: 403 }
        );
      }

      const [consents, deletionRequests] = await Promise.all([
        complianceStore.getConsentHistory({ email: emailParam }).catch(() => []),
        complianceStore.getDeletionRequests({ email: emailParam }).catch(() => []),
      ]);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        gdprBasis: 'GDPR Article 15 (Right of Access) & Article 20 (Right to Data Portability)',
        policyVersions: COMPLIANCE_VERSIONS,
        dataSubject: {
          verificationMethod: 'BOOKING_REFERENCE_AND_EMAIL',
          email: emailParam,
        },
        bookings: [booking],
        consentHistory: consents,
        deletionRequests,
      };

      return new NextResponse(JSON.stringify(exportPayload, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...(download
            ? {
                'Content-Disposition': `attachment; filename="civicspaces-export-${booking.referenceNumber}.json"`,
              }
            : {}),
        },
      });
    }

    return NextResponse.json(
      {
        error:
          'Sign in to export your account data, or provide both a matching booking reference (?ref=) and email (?email=).',
      },
      { status: 401 }
    );
  } catch (err: unknown) {
    rethrowNextControlFlowError(err);
    console.error('GDPR export error:', err);
    return NextResponse.json({ error: 'Failed to generate personal data export.' }, { status: 500 });
  }
}
