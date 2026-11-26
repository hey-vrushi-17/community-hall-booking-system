'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  User,
  LogOut,
  ShieldCheck,
  XCircle,
  Save,
} from 'lucide-react';
import { Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { CitizenAuthCard } from '@/components/auth/citizen-auth-card';
import { createClient } from '@/lib/supabase/client';
import { DatabaseBookingRow, mapBookingFromDb } from '@/lib/supabase/types';
import { formatDateInAppTz, formatTimeInAppTz, getTimezoneLabel } from '@/lib/utils/timezone';

interface UserProfileState {
  fullName: string;
  phone: string;
  organization: string;
}

export function MyRequestsClient() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = React.useState<UserProfileState>({
    fullName: '',
    phone: '',
    organization: '',
  });
  const supabase = React.useMemo(() => createClient(), []);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [isLoading, setIsLoading] = React.useState(Boolean(supabase));
  const [authError, setAuthError] = React.useState<string | null>(null);

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
    setAuthError(null);

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
        await refreshUserAndBookings();
      } catch {
        if (active) setAuthError('Unable to verify session status.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadInitialSession();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(() => {
      if (active) {
        refreshUserAndBookings();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, refreshUserAndBookings]);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setBookings([]);
      router.refresh();
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !currentUser) return;
    setIsSavingProfile(true);
    setProfileFeedback(null);
    setAuthError(null);

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
    <CitizenAuthCard
      initialMode="signin"
      redirectTo="/my-requests"
      onAuthenticated={refreshUserAndBookings}
    />
  );
}
