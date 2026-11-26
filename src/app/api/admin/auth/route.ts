import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getAdminSession,
  ADMIN_SESSION_COOKIE,
  isDemoAdminEnabled,
  signAdminSessionToken,
  AdminUser,
} from '@/lib/auth/admin-auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const session = await getAdminSession();
  return NextResponse.json({
    isAuthenticated: session.isAuthenticated,
    user: session.user,
    demoEnabled: isDemoAdminEnabled(),
  });
}

async function setSignedAdminCookie(adminUser: AdminUser): Promise<boolean> {
  const token = signAdminSessionToken(adminUser);
  if (!token) {
    return false;
  }
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const demoAdmin = Boolean(body.demoAdmin);

    // 1. Handle demo admin login (development or explicitly enabled via ENABLE_DEMO_ADMIN=true)
    if (demoAdmin) {
      if (!isDemoAdminEnabled()) {
        return NextResponse.json(
          { error: 'Demo administrator sign-in is disabled in production.' },
          { status: 403 }
        );
      }

      const adminUser: AdminUser = {
        email: email || 'admin@civic.example',
        name: 'Facilities Administrator',
        role: 'ADMIN',
      };

      const cookieSet = await setSignedAdminCookie(adminUser);
      if (!cookieSet) {
        return NextResponse.json(
          { error: 'ADMIN_SESSION_SECRET is not configured in production.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        user: adminUser,
        message: 'Signed in as Facilities Administrator (Demo Mode).',
      });
    }

    // 2. Check configured production admin credentials (optional fallback when no Supabase staff user is provisioned)
    const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim();
    const configuredAdminPassword = process.env.ADMIN_PASSWORD;
    if (
      configuredAdminEmail &&
      configuredAdminPassword &&
      email.toLowerCase() === configuredAdminEmail.toLowerCase() &&
      password === configuredAdminPassword
    ) {
      const adminUser: AdminUser = {
        email: configuredAdminEmail,
        name: 'Municipal Facilities Administrator',
        role: 'ADMIN',
      };

      const cookieSet = await setSignedAdminCookie(adminUser);
      if (!cookieSet) {
        return NextResponse.json(
          { error: 'ADMIN_SESSION_SECRET is not configured in production.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        user: adminUser,
        message: 'Signed in as Municipal Facilities Administrator.',
      });
    }

    // 3. Handle Supabase Auth if configured
    if (isSupabaseConfigured() && email && password) {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'STAFF')) {
            await supabase.auth.signOut();
            return NextResponse.json(
              { error: 'Access denied: User account is not registered as Staff or Administrator.' },
              { status: 403 }
            );
          }

          return NextResponse.json({
            success: true,
            user: {
              id: data.user.id,
              email: data.user.email,
              name: profile.full_name || 'Staff Member',
              role: profile.role,
            },
          });
        }
      }
    }

    // 4. Default credential check for local development / demo mode only
    if (
      isDemoAdminEnabled() &&
      (email === 'admin@civic.example' || email === 'admin') &&
      (!password || password === 'admin123' || password === 'civic2026')
    ) {
      const adminUser: AdminUser = {
        email: 'admin@civic.example',
        name: 'Municipal Facilities Administrator',
        role: 'ADMIN',
      };

      const cookieSet = await setSignedAdminCookie(adminUser);
      if (!cookieSet) {
        return NextResponse.json(
          { error: 'ADMIN_SESSION_SECRET is not configured in production.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        user: adminUser,
        message: 'Signed in as Municipal Facilities Administrator.',
      });
    }

    return NextResponse.json(
      { error: 'Invalid credentials. Enter authorized staff credentials.' },
      { status: 401 }
    );
  } catch (err: unknown) {
    console.error('Admin login error:', err);
    return NextResponse.json(
      { error: 'An error occurred during authentication.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_SESSION_COOKIE);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.debug('Supabase sign out error:', err);
      }
    }

    return NextResponse.json({ success: true, message: 'Signed out of administrator session.' });
  } catch (err: unknown) {
    console.error('Sign out error:', err);
    return NextResponse.json({ error: 'Failed to clear session.' }, { status: 500 });
  }
}
