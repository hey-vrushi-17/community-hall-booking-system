import { cookies } from 'next/headers';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { Role } from '@/types';

export const ADMIN_SESSION_COOKIE = 'civic_admin_session';

export interface AdminUser {
  email: string;
  name: string;
  role: Role;
}

export interface AdminSessionResult {
  isAuthenticated: boolean;
  user: AdminUser | null;
}

/**
 * Validates whether the current request is authenticated as an Administrator or Staff member.
 * Checks both Supabase Auth profiles and municipal staff session cookies.
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
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profile && (profile.role === 'ADMIN' || profile.role === 'STAFF')) {
            return {
              isAuthenticated: true,
              user: {
                email: user.email || 'admin@civic.example',
                name: profile.full_name || 'Municipal Facility Staff',
                role: profile.role as Role,
              },
            };
          }
        }
      }
    } catch (err) {
      console.warn('Supabase admin session check error:', err);
    }
  }

  // 2. Check municipal admin session cookie
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

    if (adminCookie && adminCookie.value) {
      try {
        const parsed = JSON.parse(adminCookie.value);
        if (parsed && (parsed.role === 'ADMIN' || parsed.role === 'STAFF')) {
          return {
            isAuthenticated: true,
            user: {
              email: parsed.email || 'admin@civic.example',
              name: parsed.name || 'Facilities Administrator',
              role: parsed.role,
            },
          };
        }
      } catch {
        if (adminCookie.value === 'active' || adminCookie.value === 'true') {
          return {
            isAuthenticated: true,
            user: {
              email: 'admin@civic.example',
              name: 'Municipal Facilities Administrator',
              role: 'ADMIN',
            },
          };
        }
      }
    }
  } catch (err) {
    console.debug('Cookie check outside request context:', err);
  }

  return {
    isAuthenticated: false,
    user: null,
  };
}
