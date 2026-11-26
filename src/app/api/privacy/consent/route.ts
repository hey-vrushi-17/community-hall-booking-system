import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  COMPLIANCE_VERSIONS,
  COOKIE_CONSENT_COOKIE_NAME,
} from '@/lib/config/compliance-config';
import {
  cookiePreferencesSchema,
  marketingConsentSchema,
} from '@/lib/validation/compliance-schema';
import { complianceStore } from '@/lib/services/compliance-store';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured, rethrowNextControlFlowError } from '@/lib/supabase/config';
import { CookiePreferences } from '@/types';

async function getCurrentAuthUser() {
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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(COOKIE_CONSENT_COOKIE_NAME)?.value;
    let preferences: CookiePreferences | null = null;
    if (rawCookie) {
      try {
        preferences = JSON.parse(decodeURIComponent(rawCookie)) as CookiePreferences;
      } catch {
        preferences = null;
      }
    }

    const user = await getCurrentAuthUser();
    let history = [] as Awaited<ReturnType<typeof complianceStore.getConsentHistory>>;
    if (user) {
      try {
        history = await complianceStore.getConsentHistory({
          userId: user.id,
          email: user.email,
        });
      } catch {
        history = [];
      }
    }

    return NextResponse.json({
      preferences,
      history,
      policyVersion: COMPLIANCE_VERSIONS.cookiePolicy,
    });
  } catch (err: unknown) {
    rethrowNextControlFlowError(err);
    return NextResponse.json({ error: 'Unable to read consent preferences.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode = body?.mode === 'marketing' ? 'marketing' : 'cookies';
    const user = await getCurrentAuthUser();

    if (mode === 'marketing') {
      const parsed = marketingConsentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid marketing consent payload.', issues: parsed.error.issues },
          { status: 422 }
        );
      }

      const targetEmail = user?.email || parsed.data.email;
      if (!targetEmail) {
        return NextResponse.json(
          { error: 'Please sign in or provide an email address to record marketing consent.' },
          { status: 400 }
        );
      }

      let receipt = null;
      try {
        receipt = await complianceStore.recordConsent({
          userId: user?.id ?? null,
          subjectEmail: targetEmail,
          consentType: 'MARKETING_EMAIL',
          granted: parsed.data.granted,
          policyVersion: COMPLIANCE_VERSIONS.privacyPolicy,
          source: parsed.data.source,
          legalBasis: 'GDPR Art. 6(1)(a) Explicit Consent',
        });
      } catch {
        // Allow preference update to succeed gracefully if optional compliance table migration is pending
      }

      return NextResponse.json({
        success: true,
        granted: parsed.data.granted,
        email: targetEmail,
        receipt,
        message: parsed.data.granted
          ? 'Opt-in marketing consent recorded.'
          : 'Marketing consent withdrawn. You will not receive promotional updates.',
      });
    }

    const parsed = cookiePreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid cookie preferences payload.', issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const prefs: CookiePreferences = {
      necessary: true,
      functional: parsed.data.functional,
      analytics: parsed.data.analytics,
      marketing: parsed.data.marketing,
      version: COMPLIANCE_VERSIONS.cookiePolicy,
      updatedAt: new Date().toISOString(),
    };

    try {
      await complianceStore.recordConsent({
        userId: user?.id ?? null,
        subjectEmail: user?.email ?? null,
        consentType: 'COOKIE_ANALYTICS',
        granted: prefs.analytics,
        policyVersion: COMPLIANCE_VERSIONS.cookiePolicy,
        source: parsed.data.source,
        legalBasis: 'GDPR Art. 6(1)(a) & ePrivacy Art. 5(3)',
        metadata: {
          functional: prefs.functional,
          analytics: prefs.analytics,
          marketing: prefs.marketing,
        },
      });
    } catch {
      // Cookie persistence still succeeds even when DB compliance migration is not yet applied
    }

    const response = NextResponse.json({
      success: true,
      preferences: prefs,
    });

    response.cookies.set(COOKIE_CONSENT_COOKIE_NAME, encodeURIComponent(JSON.stringify(prefs)), {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 180, // 180 days
    });

    return response;
  } catch (err: unknown) {
    rethrowNextControlFlowError(err);
    return NextResponse.json({ error: 'Failed to save consent preferences.' }, { status: 500 });
  }
}
