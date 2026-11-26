import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabaseConfig, getSupabaseServiceRoleKey, isSupabaseConfigured, rethrowNextControlFlowError } from './config';

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
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component where cookies cannot be mutated directly.
            // src/proxy.ts handles refreshing user sessions on requests.
          }
        },
      },
    });
  } catch (err: unknown) {
    rethrowNextControlFlowError(err);
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

/**
 * Returns the Service Role admin client when available, falling back to the
 * request-scoped Supabase client. Used for trusted server-side route/service operations.
 */
export async function getTrustedServerClient() {
  return createAdminClient() ?? (await createClient());
}
