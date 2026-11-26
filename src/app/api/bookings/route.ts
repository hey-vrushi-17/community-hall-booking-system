import { NextRequest, NextResponse } from 'next/server';
import {
  bookingFormSchema,
  validateBookingBusinessRules,
} from '@/lib/validation/booking-schema';
import {
  createBookingRequest,
  getBookingByReference,
  getAllBookings,
  getUserBookings,
} from '@/lib/services/booking-store';
import { checkSlotAvailability } from '@/lib/services/availability-service';
import { DatabaseSetupError, getHallById } from '@/lib/services/hall-service';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured, rethrowNextControlFlowError } from '@/lib/supabase/config';
import { getAdminSession } from '@/lib/auth/admin-auth';
import { zonedLocalToUtcDate } from '@/lib/utils/timezone';
import { Booking } from '@/types';
import { complianceStore } from '@/lib/services/compliance-store';
import { COMPLIANCE_VERSIONS } from '@/lib/config/compliance-config';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '•••@•••';
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function maskPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.length <= 4) return '••••';
  return `${'•'.repeat(Math.max(4, trimmed.length - 4))}${trimmed.slice(-4)}`;
}

function redactBookingForPublicLookup(booking: Booking): Booking {
  return {
    ...booking,
    requesterEmail: maskEmail(booking.requesterEmail),
    requesterPhone: maskPhone(booking.requesterPhone),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = bookingFormSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed. Please correct the highlighted fields.',
          issues: validation.error.issues,
        },
        { status: 422 }
      );
    }

    const data = validation.data;
    const hall = await getHallById(data.hallId);
    const ruleViolations = validateBookingBusinessRules(data, hall);

    if (ruleViolations.length > 0) {
      return NextResponse.json(
        {
          error: ruleViolations[0].message,
          issues: ruleViolations.map((v) => ({ path: [v.field], message: v.message })),
        },
        { status: 422 }
      );
    }

    const startDateTime = zonedLocalToUtcDate(data.bookingDate, data.startTime);
    const endDateTime = zonedLocalToUtcDate(data.bookingDate, data.endTime);
    const availability = await checkSlotAvailability(data.hallId, startDateTime, endDateTime);

    if (!availability.isAvailable) {
      return NextResponse.json(
        {
          error: 'The requested time slot is not available.',
          details: availability.message,
          conflicts: {
            bookings: availability.conflictingBookings.map((b) => ({
              event: b.eventName,
              start: b.startTime,
              end: b.endTime,
            })),
            maintenance: availability.conflictingMaintenance.map((m) => ({
              title: m.title,
              start: m.startTime,
              end: m.endTime,
            })),
          },
        },
        { status: 409 }
      );
    }

    let userId: string | null = null;
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user?.id) {
            userId = authData.user.id;
          }
        }
      } catch {
        // Unauthenticated public requester is supported
      }
    }

    const newBooking = await createBookingRequest(data, userId);

    // Record GDPR Art. 6(1)(b) terms/payment acknowledgement and optional unbundled Art. 6(1)(a) marketing opt-in
    try {
      await complianceStore.recordConsent({
        userId,
        subjectEmail: data.requesterEmail,
        consentType: 'TERMS_AND_PRIVACY',
        granted: true,
        policyVersion: COMPLIANCE_VERSIONS.termsAndConditions,
        source: 'booking_submission',
        legalBasis: 'GDPR Art. 6(1)(b) Pre-contractual & Facility Terms Acceptance',
        metadata: { referenceNumber: newBooking.referenceNumber },
      });

      if (data.marketingOptIn) {
        await complianceStore.recordConsent({
          userId,
          subjectEmail: data.requesterEmail,
          consentType: 'MARKETING_EMAIL',
          granted: true,
          policyVersion: COMPLIANCE_VERSIONS.privacyPolicy,
          source: 'booking_submission_opt_in',
          legalBasis: 'GDPR Art. 6(1)(a) Unbundled Explicit Consent',
          metadata: { referenceNumber: newBooking.referenceNumber },
        });
      }
    } catch {
      // Non-blocking: booking submission succeeds even if optional compliance migration is not yet applied
    }

    return NextResponse.json(
      {
        success: true,
        booking: newBooking,
        message:
          'Booking request successfully submitted. It is now queued for municipal facility review.',
        referenceNumber: newBooking.referenceNumber,
        status: newBooking.status,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    rethrowNextControlFlowError(error);
    if (error instanceof DatabaseSetupError) {
      return NextResponse.json(
        { error: 'Booking service is temporarily unavailable: database schema not ready.', details: error.message },
        { status: 503 }
      );
    }
    console.error('Submit booking error:', error);
    return NextResponse.json(
      { error: 'Failed to process booking submission. Please verify your connection.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref');
    const userOnly = searchParams.get('userOnly') === 'true';

    // 1. Reference number tracking lookup
    if (ref) {
      const booking = await getBookingByReference(ref);
      if (!booking) {
        return NextResponse.json(
          { error: `No booking request found matching reference "${ref}".` },
          { status: 404 }
        );
      }

      // Check if viewer is authorized for unredacted PII (owner or admin)
      let canViewPrivateDetails = false;
      const adminSession = await getAdminSession();
      if (adminSession.isAuthenticated) {
        canViewPrivateDetails = true;
      } else if (isSupabaseConfigured() && booking.userId) {
        const supabase = await createClient();
        const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
        if (authData?.user?.id === booking.userId) {
          canViewPrivateDetails = true;
        }
      }

      return NextResponse.json({
        booking: canViewPrivateDetails ? booking : redactBookingForPublicLookup(booking),
      });
    }

    // 2. Safe requester-scoped query for authenticated user
    if (userOnly) {
      let currentUserId: string | null = null;
      if (isSupabaseConfigured()) {
        const supabase = await createClient();
        if (supabase) {
          const { data: authData } = await supabase.auth.getUser();
          currentUserId = authData?.user?.id || null;
        }
      }

      if (!currentUserId) {
        return NextResponse.json(
          { error: 'Authentication required to view your user booking requests.' },
          { status: 401 }
        );
      }

      const userBookings = await getUserBookings(currentUserId);
      return NextResponse.json({ bookings: userBookings });
    }

    // 3. Admin-only full list
    const adminSession = await getAdminSession();
    if (!adminSession.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized: Provide a booking reference number or sign in.' },
        { status: 403 }
      );
    }

    const bookings = await getAllBookings();
    return NextResponse.json({ bookings });
  } catch (error: unknown) {
    rethrowNextControlFlowError(error);
    if (error instanceof DatabaseSetupError) {
      return NextResponse.json(
        { error: 'Booking records are unavailable: database schema not ready.', details: error.message },
        { status: 503 }
      );
    }
    console.error('Fetch bookings error:', error);
    return NextResponse.json({ error: 'Failed to retrieve bookings' }, { status: 500 });
  }
}
