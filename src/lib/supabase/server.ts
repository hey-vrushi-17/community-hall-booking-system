import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabaseConfig, getSupabaseServiceRoleKey, isSupabaseConfigured } from './config';

/**
 * Creates a public server-side Supabase client using the public anon key.
 * Safe to use at build-time, during static generation (generateStaticParams),
 * and in Server Components without requiring request cookies.
 */
export function createPublicClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return createSupabaseJsClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Creates a server-side Supabase client using cookie storage for user sessions.
 * Returns null if Supabase environment variables are not configured.
 * Safely handles build-time contexts where cookies() is not available.
 */
export async function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  try {
    const cookieStore = await cookies();

    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Can happen in Server Components where cookies cannot be set directly
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch {
            // Can happen in Server Components where cookies cannot be set directly
          }
        },
      },
    });
  } catch (err: any) {
    if (err?.digest?.startsWith?.('NEXT_') || err?.digest === 'HANGING_PROMISE_REJECTION') {
      throw err;
    }
    // If called outside of a request context (e.g. static generation), fallback to public client
    return createPublicClient();
  }
}

/**
 * Server-only Admin Supabase client using the Service Role Key.
 * Bypasses RLS for trusted municipal administrative operations and schema seeding.
 *
 * NEVER expose this client to the browser or client components.
 */
export function createAdminClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { supabaseUrl } = getSupabaseConfig();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!serviceRoleKey) {
    return null;
  }

  return createSupabaseJsClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
