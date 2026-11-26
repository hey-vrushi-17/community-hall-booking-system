'use client';

import * as React from 'react';
import { createClient } from './client';
import { Role } from '@/types';

export interface CitizenUserProfile {
  fullName: string;
  phone: string;
  organization: string;
  role: Role;
  avatarUrl: string | null;
}

export interface AuthenticatedCitizen {
  id: string;
  email: string;
  profile: CitizenUserProfile;
}

const EMPTY_PROFILE: CitizenUserProfile = {
  fullName: '',
  phone: '',
  organization: '',
  role: 'CITIZEN',
  avatarUrl: null,
};

/**
 * React hook for reading and subscribing to the current Supabase Auth user
 * and their matching `public.profiles` row on the client.
 */
export function useSupabaseUser() {
  const supabase = React.useMemo(() => createClient(), []);
  const [user, setUser] = React.useState<AuthenticatedCitizen | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(Boolean(supabase));

  const refresh = React.useCallback(async () => {
    if (!supabase) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        return;
      }

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('full_name, phone, organization, role')
        .eq('id', authUser.id)
        .maybeSingle();

      const meta = (authUser.user_metadata || {}) as Record<string, unknown>;
      const metaFullName =
        (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
        (typeof meta.name === 'string' && meta.name.trim()) ||
        '';
      const metaAvatar =
        (typeof meta.avatar_url === 'string' && meta.avatar_url.trim()) ||
        (typeof meta.picture === 'string' && meta.picture.trim()) ||
        null;

      const dbFullName = profileRow?.full_name?.trim() || '';
      const resolvedName =
        dbFullName && dbFullName !== authUser.email ? dbFullName : metaFullName || dbFullName;

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        profile: profileRow
          ? {
              fullName: resolvedName,
              phone: profileRow.phone || '',
              organization: profileRow.organization || '',
              role: (profileRow.role as Role) || 'CITIZEN',
              avatarUrl: metaAvatar,
            }
          : {
              ...EMPTY_PROFILE,
              fullName: metaFullName,
              avatarUrl: metaAvatar,
            },
      });
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    if (!supabase) return;
    let active = true;

    async function load() {
      if (!active) return;
      await refresh();
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (active) {
        refresh();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, refresh]);

  const signOut = React.useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  return {
    supabase,
    user,
    isLoading,
    refresh,
    signOut,
    isConfigured: Boolean(supabase),
  };
}
