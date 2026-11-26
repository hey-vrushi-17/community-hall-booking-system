import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

function sanitizeNext(nextParam: string | null): string {
  if (!nextParam) return '/my-requests';
  if (nextParam.startsWith('/') && !nextParam.startsWith('//')) {
    return nextParam;
  }
  return '/my-requests';
}

function resolveRedirectOrigin(request: NextRequest, fallbackOrigin: string): string {
  if (process.env.NODE_ENV === 'development') {
    return fallbackOrigin;
  }

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const proto = forwardedProto === 'http' ? 'http' : 'https';

  if (forwardedHost && /^[a-z0-9.-]+(:\d+)?$/i.test(forwardedHost)) {
    return `${proto}://${forwardedHost}`;
  }

  return fallbackOrigin;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const oauthError = searchParams.get('error');
  const safeNext = sanitizeNext(searchParams.get('next'));
  const redirectOrigin = resolveRedirectOrigin(request, origin);

  // Handle explicit OAuth cancellation or provider error (e.g. user clicked Cancel on Google)
  if (oauthError) {
    const mappedCode = oauthError === 'access_denied' ? 'oauth_cancelled' : 'oauth_error';
    return NextResponse.redirect(
      `${redirectOrigin}/login?authError=${mappedCode}&next=${encodeURIComponent(safeNext)}`
    );
  }

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          return NextResponse.redirect(`${redirectOrigin}${safeNext}`);
        }
      } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash: tokenHash,
        });
        if (!error) {
          return NextResponse.redirect(`${redirectOrigin}${safeNext}`);
        }
      }
    }
  }

  return NextResponse.redirect(
    `${redirectOrigin}/login?authError=verification_failed&next=${encodeURIComponent(safeNext)}`
  );
}
