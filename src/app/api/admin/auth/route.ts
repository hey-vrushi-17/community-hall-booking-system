import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/auth/admin-auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const session = await getAdminSession();
  return NextResponse.json({
    isAuthenticated: session.isAuthenticated,
    user: session.user,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, demoAdmin } = body;

    // Handle demo admin login (ideal for testing & development)
    if (demoAdmin) {
      const adminUser = {
        email: email || 'admin@civic.example',
        name: 'Facilities Administrator',
        role: 'ADMIN',
      };

      const cookieStore = await cookies();
      cookieStore.set(ADMIN_SESSION_COOKIE, JSON.stringify(adminUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return NextResponse.json({
        success: true,
        user: adminUser,
        message: 'Signed in as Facilities Administrator (Demo / Development Mode).',
      });
    }

    // Handle Supabase Auth if configured
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
            return NextResponse.json(
              { error: 'Access denied: User account is not registered as Staff or Administrator.' },
              { status: 403 }
            );
          }

          return NextResponse.json({
            success: true,
            user: {
              email: data.user.email,
              name: profile.full_name || 'Staff Member',
              role: profile.role,
            },
          });
        }
      }
    }

    // Default credential check for local development
    if (
      (email === 'admin@civic.example' || email === 'admin') &&
      (!password || password === 'admin123' || password === 'civic2026')
    ) {
      const adminUser = {
        email: 'admin@civic.example',
        name: 'Municipal Facilities Administrator',
        role: 'ADMIN',
      };

      const cookieStore = await cookies();
      cookieStore.set(ADMIN_SESSION_COOKIE, JSON.stringify(adminUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return NextResponse.json({
        success: true,
        user: adminUser,
        message: 'Signed in as Municipal Facilities Administrator.',
      });
    }

    return NextResponse.json(
      { error: 'Invalid credentials. Enter standard administrator credentials.' },
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
