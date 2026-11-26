import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { sanitizeRedirectPath } from '@/lib/auth/redirect';
import { CitizenAuthCard } from '@/components/auth/citizen-auth-card';

export const metadata: Metadata = {
  title: 'Sign In | CivicSpaces',
  description: 'Sign in to your CivicSpaces citizen account to submit and manage community hall booking requests.',
};

export const instant = false;

interface LoginPageProps {
  searchParams: Promise<{ next?: string; authError?: string }>;
}

async function LoginContent({ searchParams }: LoginPageProps) {
  const { next, authError } = await searchParams;
  const safeNext = sanitizeRedirectPath(next, '/my-requests');

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        redirect(safeNext);
      }
    }
  }

  return (
    <CitizenAuthCard
      initialMode="signin"
      redirectTo={safeNext}
      authErrorParam={authError}
    />
  );
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <div className="py-10 md:py-16">
      <div className="civic-container space-y-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#615B52]">
          <Link href="/" className="hover:text-[#1A3B2B] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#1C1917]">Sign In</span>
        </nav>

        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EBF3EE] text-[#1A3B2B] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Supabase Citizen Authentication</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1C1917] tracking-tight">
            Citizen Portal Sign In
          </h1>
          <p className="text-sm text-[#615B52]">
            Access your saved profile, view booking decisions, and manage pending community hall reservations.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="max-w-md mx-auto civic-card p-10 bg-white border border-[#E5DFD5] text-center text-xs text-[#615B52]">
              Loading sign-in portal...
            </div>
          }
        >
          <LoginContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
