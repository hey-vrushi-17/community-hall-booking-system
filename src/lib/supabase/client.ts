import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig, isSupabaseConfigured } from './config';

/**
 * Creates a browser-side Supabase client.
 * Returns null if Supabase environment variables are not yet configured.
 */
export function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
