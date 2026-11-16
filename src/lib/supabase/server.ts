import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabaseConfig, getSupabaseServiceRoleKey, isSupabaseConfigured } from './config';

/**
 * Creates a server-side Supabase client using cookie storage for user sessions.
 * Returns null if Supabase environment variables are not configured.
 */
export async function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
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
