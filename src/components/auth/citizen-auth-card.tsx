'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, UserPlus, KeyRound, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { SITE_CONFIG } from '@/lib/config/site-config';

export type AuthMode = 'signin' | 'signup' | 'recovery';

export interface CitizenAuthCardProps {
  initialMode?: AuthMode;
  redirectTo?: string;
  authErrorParam?: string | null;
  onAuthenticated?: () => Promise<void> | void;
}

export function sanitizeRedirectPath(path?: string | null, fallback = '/my-requests'): string {
  if (!path) return fallback;
  if (path.startsWith('/') && !path.startsWith('//')) {
    return path;
  }
  return fallback;
}

function getInitialAuthError(authErrorParam?: string | null): string | null {
  if (!authErrorParam) return null;
  if (authErrorParam === 'oauth_cancelled') {
    return 'Google sign-in was cancelled. You can try again or sign in with your email and password.';
  }
  if (authErrorParam === 'oauth_error') {
    return 'Unable to complete Google sign-in. Please verify provider settings or try again.';
  }
  if (authErrorParam === 'verification_failed') {
    return 'Authentication or verification link is invalid or expired. Please try again.';
  }
  return null;
}

function GoogleMarkIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.08.72-2.45 1.16-4.22 1.16-3.24 0-5.99-2.19-6.97-5.14H1.03v3.14C3.05 21.14 7.21 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.03 14.01c-.25-.72-.39-1.49-.39-2.29s.14-1.57.39-2.29V6.29H1.03C.37 7.6 0 9.07 0 10.72s.37 3.12 1.03 4.43l4-1.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.8 0 3.41.62 4.68 1.84l3.51-3.51C18.07 1.19 15.3 0 12 0 7.21 0 3.05 2.86 1.03 7.01l4 3.14c.98-2.95 3.73-5.4 6.97-5.4Z"
      />
    </svg>
  );
}

export function CitizenAuthCard({
  initialMode = 'signin',
  redirectTo = '/my-requests',
  authErrorParam,
  onAuthenticated,
}: CitizenAuthCardProps) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const safeRedirect = sanitizeRedirectPath(redirectTo);

  const [mode, setMode] = React.useState<AuthMode>(initialMode);
  const [authEmail, setAuthEmail] = React.useState('');
  const [authPassword, setAuthPassword] = React.useState('');
  const [signupFullName, setSignupFullName] = React.useState('');
  const [signupPhone, setSignupPhone] = React.useState('');
  const [signupOrg, setSignupOrg] = React.useState('');
  const [signupMarketingOptIn, setSignupMarketingOptIn] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [authMessage, setAuthMessage] = React.useState<string | null>(null);
  const [authError, setAuthError] = React.useState<string | null>(() =>
    getInitialAuthError(authErrorParam)
  );

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setAuthError(null);
    setAuthMessage(null);
  };

  const handleCompleteAuth = async () => {
    if (onAuthenticated) {
      await onAuthenticated();
    } else {
      router.push(safeRedirect);
      router.refresh();
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setAuthError(
        'Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or ANON_KEY) to enable Google sign-in.'
      );
      return;
    }

    setIsGoogleLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : SITE_CONFIG.siteUrl;
      const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(safeRedirect)}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        setIsGoogleLoading(false);
        return;
      }

      if (data?.url && typeof window !== 'undefined') {
        window.location.assign(data.url);
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Unable to start Google sign-in.');
      setIsGoogleLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError(
        'Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or ANON_KEY) to enable authentication.'
      );
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : SITE_CONFIG.siteUrl;

      if (mode === 'recovery') {
        if (!authEmail.trim()) {
          setAuthError('Please enter your email address.');
          return;
        }
        const callbackUrl = `${origin}/auth/callback?next=/auth/update-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), {
          redirectTo: callbackUrl,
        });
        if (error) {
          setAuthError(error.message);
        } else {
          setAuthMessage(
            'If an account exists for that email, a password recovery link has been sent. Open the link to reset your password.'
          );
        }
        return;
      }

      if (!authEmail.trim() || !authPassword) {
        setAuthError('Please provide both email address and password.');
        return;
      }

      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) {
          setAuthError(error.message);
        } else {
          setAuthMessage('Signed in successfully.');
          await handleCompleteAuth();
        }
        return;
      }

      // Sign Up
      const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(safeRedirect)}`;
      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
        options: {
          emailRedirectTo: callbackUrl,
          data: {
            full_name: signupFullName.trim() || undefined,
            phone: signupPhone.trim() || undefined,
            organization: signupOrg.trim() || undefined,
            marketing_opt_in: signupMarketingOptIn,
          },
        },
      });

      if (!error && signupMarketingOptIn) {
        fetch('/api/privacy/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'marketing',
            email: authEmail.trim(),
            granted: true,
            source: 'citizen_signup',
          }),
        }).catch(() => {});
      }

      if (error) {
        setAuthError(error.message);
      } else if (data.session) {
        setAuthMessage('Account created and signed in.');
        await handleCompleteAuth();
      } else {
        setAuthMessage(
          'Registration initiated! Check your email inbox and click the confirmation link to activate your account.'
        );
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting || isGoogleLoading;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="civic-card p-6 sm:p-8 bg-white border border-[#E5DFD5] space-y-5">
        {/* Mode Switcher Tabs (Sign In / Register) */}
        {mode !== 'recovery' && (
          <div className="grid grid-cols-2 gap-1 p-1 rounded-md bg-[#F3EFE8] border border-[#E5DFD5]">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`py-2 px-3 rounded text-xs font-semibold transition-colors ${
                mode === 'signin'
                  ? 'bg-white text-[#1A3B2B] shadow-xs'
                  : 'text-[#615B52] hover:text-[#1C1917]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`py-2 px-3 rounded text-xs font-semibold transition-colors ${
                mode === 'signup'
                  ? 'bg-white text-[#1A3B2B] shadow-xs'
                  : 'text-[#615B52] hover:text-[#1C1917]'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center mx-auto">
            {mode === 'recovery' ? (
              <KeyRound className="w-6 h-6" />
            ) : mode === 'signup' ? (
              <UserPlus className="w-6 h-6" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-xl font-bold text-[#1C1917]">
            {mode === 'signin'
              ? 'Sign In to CivicSpaces'
              : mode === 'signup'
              ? 'Register Citizen Account'
              : 'Reset Your Password'}
          </h2>
          <p className="text-xs text-[#615B52] leading-relaxed">
            {mode === 'recovery'
              ? 'Enter your email address to receive a Supabase password recovery link.'
              : mode === 'signup'
              ? 'Create a citizen account to auto-fill booking requests, track approvals, and manage pending reservations.'
              : 'Sign in with Google or your Supabase account to book community halls faster and manage your requests.'}
          </p>
        </div>

        {authMessage && (
          <Alert variant="info" className="text-xs">
            {authMessage}
          </Alert>
        )}

        {authError && (
          <Alert variant="error" className="text-xs">
            {authError}
          </Alert>
        )}

        {mode !== 'recovery' && (
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              isLoading={isGoogleLoading}
              disabled={isBusy}
              className="w-full text-xs font-semibold gap-2.5 bg-white hover:bg-[#FBF9F5] border-[#CDC5B7] text-[#1C1917]"
            >
              {!isGoogleLoading && <GoogleMarkIcon />}
              <span>{isGoogleLoading ? 'Redirecting to Google...' : 'Continue with Google'}</span>
            </Button>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-[#E5DFD5]" />
              <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-[#8A8275] font-medium">
                or with email
              </span>
              <div className="flex-grow border-t border-[#E5DFD5]" />
            </div>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label htmlFor="signup-name" className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] focus:ring-1 focus:ring-[#1A3B2B]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="signup-phone" className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    id="signup-phone"
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+91 98..."
                    className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>
                <div>
                  <label htmlFor="signup-org" className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Organization (Optional)
                  </label>
                  <input
                    id="signup-org"
                    type="text"
                    value={signupOrg}
                    onChange={(e) => setSignupOrg(e.target.value)}
                    placeholder="Association"
                    className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] focus:ring-1 focus:ring-[#1A3B2B]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-[#1C1917] mb-1">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="citizen@example.com"
              className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] focus:ring-1 focus:ring-[#1A3B2B]"
            />
          </div>

          {mode !== 'recovery' && (
            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-[#1C1917] mb-1">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] bg-[#FBF9F5] focus:ring-1 focus:ring-[#1A3B2B]"
              />
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-2.5 pt-1 text-[11px] text-[#615B52]">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={signupMarketingOptIn}
                  onChange={(e) => setSignupMarketingOptIn(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-[#CDC5B7] text-[#1A3B2B] focus:ring-[#1A3B2B]"
                />
                <span>
                  (Optional) Send me municipal venue updates and seasonal booking notices.{' '}
                  <Link href="/legal/marketing-consent" className="text-[#1A3B2B] underline">
                    Learn more
                  </Link>
                  .
                </span>
              </label>
              <p className="leading-relaxed">
                By creating an account, you acknowledge our{' '}
                <Link href="/legal/privacy-policy" className="text-[#1A3B2B] font-semibold underline">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/legal/terms" className="text-[#1A3B2B] font-semibold underline">
                  Terms &amp; Conditions
                </Link>
                .
              </p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isBusy}
            className="w-full text-xs gap-1.5"
          >
            <span>
              {mode === 'signin'
                ? 'Sign In'
                : mode === 'signup'
                ? 'Create Citizen Account'
                : 'Send Recovery Email'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>

          <div className="flex flex-col items-center gap-2 pt-2 text-xs">
            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => switchMode('recovery')}
                className="text-[#615B52] hover:text-[#1A3B2B] hover:underline"
              >
                Forgot your password?
              </button>
            )}

            {mode === 'recovery' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-[#1A3B2B] hover:underline font-semibold"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </form>

        <div className="border-t border-[#E5DFD5] pt-5 text-center space-y-2">
          <span className="text-xs text-[#8A8275] block">
            Prefer looking up a reference code without signing in?
          </span>
          <Link href="/track">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Track by Reference Number
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
