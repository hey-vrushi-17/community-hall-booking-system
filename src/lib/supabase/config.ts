/**
 * Supabase Configuration & Environment Utilities
 *
 * Checks presence of environment variables and safely provides
 * configuration without ever leaking the service role key to the client.
 */

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConfigured: boolean;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();

  return Boolean(
    url &&
    anonKey &&
    url.length > 0 &&
    anonKey.length > 0 &&
    !url.includes('your-project-ref') &&
    url.startsWith('https://')
  );
}

export function getSupabaseConfig(): SupabaseConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim() || '';

  return {
    supabaseUrl,
    supabaseAnonKey,
    isConfigured: isSupabaseConfigured(),
  };
}

/**
 * Server-only check for the privileged Service Role Key.
 * NEVER call or export this in client-side code.
 */
export function getSupabaseServiceRoleKey(): string | null {
  if (typeof window !== 'undefined') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must never be accessed from client-side code.');
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key && key.length > 0 ? key : null;
}
