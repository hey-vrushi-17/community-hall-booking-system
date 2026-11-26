'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileText,
  Lock,
  Search,
  User,
  LogOut,
  ShieldCheck,
  XCircle,
  KeyRound,
  Save,
} from 'lucide-react';
import { Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { createClient } from '@/lib/supabase/client';
import { DatabaseBookingRow, mapBookingFromDb } from '@/lib/supabase/types';
import { formatDateInAppTz, formatTimeInAppTz, getTimezoneLabel } from '@/lib/utils/timezone';
import { SITE_CONFIG } from '@/lib/config/site-config';

type AuthMode = 'signin' | 'signup' | 'recovery';

interface UserProfileState {
  fullName: string;
  phone: string;
  organization: string;
}

export function MyRequestsClient() {
  const [currentUser, setCurrentUser] = React.useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = React.useState<UserProfileState>({
    fullName: '',
    phone: '',
    organization: '',
  });
  const supabase = React.useMemo(() => createClient(), []);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [isLoading, setIsLoading] = React.useState(Boolean(supabase));

  const [authEmail, setAuthEmail] = React.useState('');
  const [authPassword, setAuthPassword] = React.useState('');
  const [signupFullName, setSignupFullName] = React.useState('');
  const [signupPhone, setSignupPhone] = React.useState('');
  const [signupOrg, setSignupOrg] = React.useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = React.useState(false);
  const [authMessage, setAuthMessage] = React.useState<string | null>(null);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<AuthMode>('signin');

  // Profile saving
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [profileFeedback, setProfileFeedback] = React.useState<string | null>(null);

  // Cancellation modal state
  const [cancelTarget, setCancelTarget] = React.useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = React.useState('');
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);
  const [actionBanner, setActionBanner] = React.useState<string | null>(null);

  const tzLabel = getTimezoneLabel();

  const refreshUserAndBookings = React.useCallback(async () => {
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCurrentUser(null);
      setBookings([]);
      return;
    }

    setCurrentUser({ id: user.id, email: user.email || '' });

    const [{ data: profileRow }, { data: bookingRows, error: bookingError }] = await Promise.all([
      supabase.from('profiles').select('full_name, phone, organization').eq('id', user.id).maybeSingle(),
      supabase
        .from('bookings')
        .select('*, halls(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (profileRow) {
      setProfile({
        fullName: profileRow.full_name || '',
        phone: profileRow.phone || '',
        organization: profileRow.organization || '',
      });
    }

    if (bookingError) {
      setAuthError(`Failed to load your booking requests: ${bookingError.message}`);
    } else if (bookingRows) {
      setBookings(
        (bookingRows as unknown as DatabaseBookingRow[]).map((row) => mapBookingFromDb(row))
      );
    }
  }, [supabase]);

  React.useEffect(() => {
    let active = true;
    const client = supabase;
    if (!client) {
      return;
    }

    async function loadInitialSession() {
      if (!client) return;
      try {
        const {
          data: { user },
        } = await client.auth.getUser();

        if (!active) return;

        if (!user) {
          setCurrentUser(null);
          setBookings([]);
          return;
        }

        setCurrentUser({ id: user.id, email: user.email || '' });

        const [{ data: profileRow }, { data: bookingRows, error: bookingError }] = await Promise.all([
          client.from('profiles').select('full_name, phone, organization').eq('id', user.id).maybeSingle(),
          client
            .from('bookings')
            .select('*, halls(name)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
        ]);

        if (!active) return;

        if (profileRow) {
          setProfile({
            fullName: profileRow.full_name || '',
            phone: profileRow.phone || '',
            organization: profileRow.organization || '',
          });
        }

        if (bookingError) {
          setAuthError(`Failed to load your booking requests: ${bookingError.message}`);
        } else if (bookingRows) {
          setBookings(
            (bookingRows as unknown as DatabaseBookingRow[]).map((row) => mapBookingFromDb(row))
          );
        }
      } catch {
        if (active) setAuthError('Unable to verify session status.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadInitialSession();
    return () => {
      active = false;
    };
  }, [supabase]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError(
        'Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable authentication.'
      );
      return;
    }

    setIsSubmittingAuth(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      if (mode === 'recovery') {
        const redirectTo = `${window.location.origin || SITE_CONFIG.siteUrl}/auth/callback?next=/auth/update-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), {
          redirectTo,
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

      if (!authEmail || !authPassword) {
        setAuthError('Please provide both email and password.');
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
          await refreshUserAndBookings();
        }
      } else {
        const redirectTo = `${window.location.origin || SITE_CONFIG.siteUrl}/auth/callback?next=/my-requests`;
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: signupFullName.trim() || undefined,
              phone: signupPhone.trim() || undefined,
              organization: signupOrg.trim() || undefined,
            },
          },
        });
        if (error) {
          setAuthError(error.message);
        } else if (data.session) {
          setAuthMessage('Account created and signed in.');
          await refreshUserAndBookings();
        } else {
          setAuthMessage(
            'Registration initiated! Check your email inbox to confirm your account before signing in.'
          );
        }
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setBookings([]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !currentUser) return;
    setIsSavingProfile(true);
    setProfileFeedback(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.fullName.trim() || null,
        phone: profile.phone.trim() || null,
        organization: profile.organization.trim() || null,
      })
      .eq('id', currentUser.id);

    setIsSavingProfile(false);
    if (error) {
      setAuthError(`Failed to update profile: ${error.message}`);
    } else {
      setProfileFeedback('Contact profile saved.');
      setTimeout(() => setProfileFeedback(null), 4000);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget || isCancelling) return;
    setIsCancelling(true);
    setCancelError(null);

    try {
      const res = await fetch(`/api/bookings/${cancelTarget.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelReason.trim() || 'Cancelled by requester.',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error || 'Unable to cancel this request.');
        return;
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === cancelTarget.id ? data.booking : b))
      );
      setActionBanner(`Request ${cancelTarget.referenceNumber} has been cancelled.`);
      setCancelTarget(null);
      setCancelReason('');
    } catch {
      setCancelError('Network error while cancelling request.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="civic-card p-12 bg-white border border-[#E5DFD5] text-center text-xs text-[#615B52]">
        <div className="w-8 h-8 border-2 border-[#1A3B2B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Checking authenticated citizen session...
      </div>
    );
  }

  if (currentUser) {
    return (
      <div className="space-y-6">
        {actionBanner && (
          <Alert variant="success" className="text-xs">
            {actionBanner}
          </Alert>
        )}
        {authError && (
          <Alert variant="error" className="text-xs">
            {authError}
          </Alert>
        )}

        {/* User Profile Bar */}
        <div className="civic-card p-5 bg-white border border-[#E5DFD5] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[#8A8275] block font-semibold uppercase">
                  Authenticated Citizen Account
                </span>
                <span className="text-sm font-bold text-[#1C1917]">
                  {profile.fullName ? `${profile.fullName} (${currentUser.email})` : currentUser.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/request">
                <Button variant="primary" size="sm" className="text-xs">
                  Submit New Request
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-1.5 text-xs text-[#615B52]"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="pt-3 border-t border-[#E5DFD5] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label htmlFor="profile-name" className="block text-[11px] font-semibold text-[#615B52] mb-1">
                Display Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="Your full name"
                className="w-full text-xs px-2.5 py-1.5 rounded border border-[#E5DFD5] bg-[#FBF9F5]"
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="block text-[11px] font-semibold text-[#615B52] mb-1">
                Phone
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+91 ..."
                className="w-full text-xs px-2.5 py-1.5 rounded border border-[#E5DFD5] bg-[#FBF9F5]"
              />
            </div>
            <div>
              <label htmlFor="profile-org" className="block text-[11px] font-semibold text-[#615B52] mb-1">
                Organization
              </label>
              <input
                id="profile-org"
                type="text"
                value={profile.organization}
                onChange={(e) => setProfile((p) => ({ ...p, organization: e.target.value }))}
                placeholder="Optional group/association"
                className="w-full text-xs px-2.5 py-1.5 rounded border border-[#E5DFD5] bg-[#FBF9F5]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="outline" size="sm" isLoading={isSavingProfile} className="text-xs gap-1.5 w-full sm:w-auto">
                <Save className="w-3.5 h-3.5" />
                Save Profile
              </Button>
              {profileFeedback && <span className="text-[11px] text-[#1A3B2B] font-semibold">{profileFeedback}</span>}
            </div>
          </form>
        </div>

        <div className="bg-[#EBF3EE] border border-[#CDE3D5] rounded-md p-3.5 text-xs text-[#1A3B2B] flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#1A3B2B]" />
          <span>
            <strong>Row Level Security Protected:</strong> You are viewing only booking requests linked to your account. You may cancel any request still in <strong>PENDING</strong> status.
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="civic-card p-12 bg-white border border-[#E5DFD5] text-center space-y-3">
            <FileText className="w-10 h-10 text-[#8A8275] mx-auto" />
            <h3 className="text-base font-bold text-[#1C1917]">No Booking Requests Found</h3>
            <p className="text-xs text-[#615B52] max-w-md mx-auto">
              You haven&apos;t submitted any community hall reservation requests while signed in with this account yet.
            </p>
            <div className="pt-2">
              <Link href="/halls">
                <Button variant="primary" size="sm">
                  Browse Community Halls
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#1C1917]">
              Your Booking Requests ({bookings.length})
            </h2>

            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="civic-card p-5 bg-white border border-[#E5DFD5] hover:border-[#1A3B2B] transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5DFD5] pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1A3B2B]">
                          {b.referenceNumber}
                        </span>
                        <Badge status={b.status} />
                      </div>
                      <h3 className="text-base font-bold text-[#1C1917]">{b.eventName}</h3>
                      <p className="text-xs text-[#615B52]">{b.hallName}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                      <Link href={`/request/confirmation?ref=${b.referenceNumber}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          View Details
                        </Button>
                      </Link>
                      {b.status === 'PENDING' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setCancelTarget(b);
                            setCancelReason('');
                            setCancelError(null);
                          }}
                          className="text-xs gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel Request
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#615B52]">
                    <div>
                      <span className="block text-[11px] text-[#8A8275]">Event Date</span>
                      <span className="font-medium text-[#1C1917]">{formatDateInAppTz(b.startTime)}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#8A8275]">Time ({tzLabel})</span>
                      <span className="font-medium text-[#1C1917]">
                        {formatTimeInAppTz(b.startTime)} – {formatTimeInAppTz(b.endTime)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#8A8275]">Attendees</span>
                      <span className="font-medium text-[#1C1917]">{b.expectedAttendees} guests</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#8A8275]">Submitted On</span>
                      <span className="font-medium text-[#1C1917]">{formatDateInAppTz(b.createdAt)}</span>
                    </div>
                  </div>

                  {b.decisionNotes && (
                    <div className="p-2.5 rounded bg-[#FBF9F5] border border-[#E5DFD5] text-xs text-[#615B52]">
                      <strong className="text-[#1C1917]">Decision / Status Note:</strong> {b.decisionNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancel Pending Request Confirmation Modal */}
        <Modal
          isOpen={Boolean(cancelTarget)}
          onClose={() => setCancelTarget(null)}
          title="Cancel Pending Booking Request"
          description={cancelTarget ? `${cancelTarget.referenceNumber} • ${cancelTarget.eventName}` : ''}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {cancelError && <Alert variant="error">{cancelError}</Alert>}
            <p className="text-[#615B52] leading-relaxed">
              Are you sure you want to withdraw this pending booking request? Cancelled requests cannot be re-opened; you can submit a new request anytime.
            </p>
            <div>
              <label htmlFor="cancel-reason" className="block font-semibold text-[#1C1917] mb-1">
                Cancellation Note (Optional)
              </label>
              <input
                id="cancel-reason"
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Event date changed"
                className="w-full px-3 py-2 rounded border border-[#E5DFD5] bg-[#FBF9F5]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5DFD5]">
              <Button variant="outline" size="sm" onClick={() => setCancelTarget(null)} disabled={isCancelling}>
                Keep Request
              </Button>
              <Button variant="destructive" size="sm" onClick={handleConfirmCancel} isLoading={isCancelling}>
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="civic-card p-6 sm:p-8 bg-white border border-[#E5DFD5] space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center mx-auto">
            {mode === 'recovery' ? <KeyRound className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-bold text-[#1C1917]">
            {mode === 'signin'
              ? 'Sign In to Your Account'
              : mode === 'signup'
              ? 'Register Citizen Account'
              : 'Reset Your Password'}
          </h2>
          <p className="text-xs text-[#615B52]">
            {mode === 'recovery'
              ? 'Enter your email address to receive a Supabase password recovery link.'
              : 'View and manage your community hall booking requests securely under Row Level Security.'}
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
                  className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] focus:ring-1 focus:ring-[#1A3B2B]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] focus:ring-1 focus:ring-[#1A3B2B]"
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
                    className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] focus:ring-1 focus:ring-[#1A3B2B]"
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
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="citizen@example.com"
              className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] focus:ring-1 focus:ring-[#1A3B2B]"
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
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] focus:ring-1 focus:ring-[#1A3B2B]"
              />
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full text-xs"
            disabled={isSubmittingAuth}
          >
            {isSubmittingAuth
              ? 'Processing...'
              : mode === 'signin'
              ? 'Sign In to View Requests'
              : mode === 'signup'
              ? 'Create Citizen Account'
              : 'Send Recovery Email'}
          </Button>

          <div className="flex flex-col items-center gap-2 pt-2 text-xs">
            {mode === 'signin' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMode('recovery');
                    setAuthError(null);
                    setAuthMessage(null);
                  }}
                  className="text-[#615B52] hover:text-[#1A3B2B] hover:underline"
                >
                  Forgot your password?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setAuthError(null);
                    setAuthMessage(null);
                  }}
                  className="text-[#1A3B2B] hover:underline font-semibold"
                >
                  Don&apos;t have an account yet? Register here
                </button>
              </>
            )}

            {mode !== 'signin' && (
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setAuthError(null);
                  setAuthMessage(null);
                }}
                className="text-[#1A3B2B] hover:underline font-semibold"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </form>

        <div className="border-t border-[#E5DFD5] pt-5 text-center space-y-2">
          <span className="text-xs text-[#8A8275] block">
            Prefer looking up a reference code directly?
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
