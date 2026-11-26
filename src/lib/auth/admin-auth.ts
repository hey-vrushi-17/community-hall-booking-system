import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { isSupabaseConfigured, rethrowNextControlFlowError } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { Role } from '@/types';

export const ADMIN_SESSION_COOKIE = 'civic_admin_session';

export interface AdminUser {
  id?: string;
  email: string;
  name: string;
  role: Role;
}

export interface AdminSessionResult {
  isAuthenticated: boolean;
  user: AdminUser | null;
}

function getSessionSecret(): string | null {
  const configured =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (configured && configured.length >= 16) {
    return configured;
  }

  // Never allow a static fallback secret in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return 'civic-spaces-dev-only-session-secret';
}

export function isDemoAdminEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_DEMO_ADMIN === 'true'
  );
}

export function signAdminSessionToken(user: AdminUser): string | null {
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  const payload = Buffer.from(
    JSON.stringify({
      email: user.email,
      name: user.name,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    }),
    'utf8'
  ).toString('base64url');

  const sig = createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');

  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string): AdminUser | null {
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payload, sig] = parts;
  if (!payload || !sig) {
    return null;
  }

  const expectedSig = createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      email?: string;
      name?: string;
      role?: Role;
      exp?: number;
    };

    if (!parsed.exp || Date.now() > parsed.exp) {
      return null;
    }

    if (parsed.role === 'ADMIN' || parsed.role === 'STAFF') {
      return {
        email: parsed.email || 'admin@civic.example',
        name: parsed.name || 'Facilities Administrator',
        role: parsed.role,
      };
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Validates whether the current request is authenticated as an Administrator or Staff member.
 * Prioritizes Supabase Auth + public.profiles.role IN ('STAFF', 'ADMIN').
 * Falls back to signed dev session cookie ONLY when demo admin mode is enabled.
 */
export async function getAdminSession(): Promise<AdminSessionResult> {
  // 1. Check Supabase session if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, full_name')
            .eq('id', user.id)
            .maybeSingle();

          if (profile && (profile.role === 'ADMIN' || profile.role === 'STAFF')) {
            return {
              isAuthenticated: true,
              user: {
                id: user.id,
                email: user.email || 'staff@civic.example',
                name: profile.full_name || 'Municipal Facility Staff',
                role: profile.role as Role,
              },
            };
          }
        }
      }
    } catch (err: unknown) {
      rethrowNextControlFlowError(err);
      if (process.env.NODE_ENV === 'development') {
        console.warn('Supabase admin session check error:', err);
      }
    }
  }

  // 2. Signed dev/configured admin cookie (only when demo mode or explicit secret is enabled)
  if (isDemoAdminEnabled() || Boolean(process.env.ADMIN_SESSION_SECRET?.trim())) {
    try {
      const cookieStore = await cookies();
      const adminCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

      if (adminCookie?.value) {
        const verifiedUser = verifyAdminSessionToken(adminCookie.value);
        if (verifiedUser) {
          return {
            isAuthenticated: true,
            user: verifiedUser,
          };
        }
      }
    } catch (err: unknown) {
      rethrowNextControlFlowError(err);
    }
  }

  return {
    isAuthenticated: false,
    user: null,
  };
}
