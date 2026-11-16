'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  Mail,
  Search,
  ExternalLink,
  Calendar,
  Building,
  User,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';

export function MyRequestsClient() {
  const [currentUser, setCurrentUser] = React.useState<{ id: string; email: string } | null>(null);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [authEmail, setAuthEmail] = React.useState('');
  const [authPassword, setAuthPassword] = React.useState('');
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [authMessage, setAuthMessage] = React.useState<string | null>(null);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');

  // Supabase client instance
  const supabase = React.useMemo(() => createClient(), []);

  // Fetch current authenticated user and their requests
  const loadUserData = React.useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);

    if (!supabase) {
      // Supabase unconfigured state: explain setup or fallback
      setIsLoading(false);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUser({ id: user.id, email: user.email || '' });

        // Query user's own bookings safely enforced by RLS
        const { data, error } = await supabase
          .from('bookings')
          .select('*, halls(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching user requests:', error);
          setAuthError('Failed to fetch your requests: ' + error.message);
        } else if (data) {
          const mapped: Booking[] = data.map((r: any) => ({
            id: r.id,
            referenceNumber: r.reference_number,
            hallId: r.hall_id,
            hallName: r.halls?.name || 'Community Facility',
            userId: r.user_id,
            requesterName: r.requester_name,
            requesterEmail: r.requester_email,
            requesterPhone: r.requester_phone,
            requesterOrg: r.requester_org,
            eventName: r.event_name,
            eventType: r.event_type,
            expectedAttendees: r.expected_attendees,
            specialRequests: r.special_requests,
            startTime: r.start_time,
            endTime: r.end_time,
            status: r.status,
            reviewedBy: r.reviewed_by,
            reviewedAt: r.reviewed_at,
            decisionNotes: r.decision_notes,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));
          setBookings(mapped);
        }
      } else {
        setCurrentUser(null);
        setBookings([]);
      }
    } catch (err: unknown) {
      console.warn('Session verification error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError('Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable authentication.');
      return;
    }

    if (!authEmail || !authPassword) {
      setAuthError('Please provide both email and password.');
      return;
    }

    setIsSigningIn(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) {
          setAuthError(error.message);
        } else {
          setAuthMessage('Signed in successfully.');
          await loadUserData();
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) {
          setAuthError(error.message);
        } else {
          setAuthMessage('Account registration initiated! Check your email inbox to verify your account.');
        }
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setBookings([]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="approved">APPROVED</Badge>;
      case 'REJECTED':
        return <Badge variant="rejected">REJECTED</Badge>;
      case 'CANCELLED':
        return <Badge variant="cancelled">CANCELLED</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="pending">PENDING REVIEW</Badge>;
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });
    } catch {
      return iso;
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

  // State A: User is Authenticated - show only their own requests
  if (currentUser) {
    return (
      <div className="space-y-6">
        {/* User Profile Bar */}
        <div className="civic-card p-5 bg-white border border-[#E5DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[#8A8275] block font-semibold uppercase">
                Citizen Portal Session
              </span>
              <span className="text-sm font-bold text-[#1C1917]">{currentUser.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/halls">
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

        {/* Security & RLS Notice */}
        <div className="bg-[#EBF3EE] border border-[#CDE3D5] rounded-md p-3.5 text-xs text-[#1A3B2B] flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#1A3B2B]" />
          <span>
            <strong>Row Level Security Protected:</strong> You are viewing only the reservation requests submitted by your account.
          </span>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="civic-card p-12 bg-white border border-[#E5DFD5] text-center space-y-3">
            <FileText className="w-10 h-10 text-[#8A8275] mx-auto" />
            <h3 className="text-base font-bold text-[#1C1917]">No Booking Requests Found</h3>
            <p className="text-xs text-[#615B52] max-w-md mx-auto">
              You haven&apos;t submitted any community hall reservation requests with this account yet.
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
                  className="civic-card p-5 bg-white border border-[#E5DFD5] hover:border-[#1A3B2B] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5DFD5] pb-3 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1A3B2B]">
                          {b.referenceNumber}
                        </span>
                        {getStatusBadge(b.status)}
                      </div>
                      <h3 className="text-base font-bold text-[#1C1917]">{b.eventName}</h3>
                      <p className="text-xs text-[#615B52]">{b.hallName}</p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Link href={`/request/confirmation?ref=${b.referenceNumber}`}>
                        <Button variant="outline" size="sm" className="text-xs gap-1.5">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/track?ref=${b.referenceNumber}`}>
                        <Button variant="secondary" size="sm" className="text-xs gap-1.5">
                          Track Status
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#615B52]">
                    <div>
                      <span className="block text-[11px] text-[#8A8275]">Event Date</span>
                      <span className="font-medium text-[#1C1917]">{formatDate(b.startTime)}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#8A8275]">Time (UTC)</span>
                      <span className="font-medium text-[#1C1917]">
                        {formatTime(b.startTime)} – {formatTime(b.endTime)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#8A8275]">Attendees</span>
                      <span className="font-medium text-[#1C1917]">{b.expectedAttendees} guests</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#8A8275]">Submitted On</span>
                      <span className="font-medium text-[#1C1917]">{formatDate(b.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // State B: Unauthenticated citizen - provide login or quick tracking
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="civic-card p-6 sm:p-8 bg-white border border-[#E5DFD5] space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#EBF3EE] text-[#1A3B2B] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#1C1917]">
            {mode === 'signin' ? 'Sign In to Your Account' : 'Register Citizen Account'}
          </h2>
          <p className="text-xs text-[#615B52]">
            View and manage your community hall booking requests securely under Row Level Security.
          </p>
        </div>

        {authMessage && (
          <Alert variant="info" className="text-xs">
            {authMessage}
          </Alert>
        )}

        {authError && (
          <Alert variant="danger" className="text-xs">
            {authError}
          </Alert>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="citizen@example.com"
              className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] focus:ring-1 focus:ring-[#1A3B2B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs px-3 py-2 rounded-md border border-[#E5DFD5] focus:ring-1 focus:ring-[#1A3B2B]"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full text-xs"
            disabled={isSigningIn}
          >
            {isSigningIn
              ? 'Authenticating...'
              : mode === 'signin'
              ? 'Sign In to View Requests'
              : 'Create Citizen Account'}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setAuthError(null);
                setAuthMessage(null);
              }}
              className="text-xs text-[#1A3B2B] hover:underline font-semibold"
            >
              {mode === 'signin'
                ? "Don't have an account yet? Register here"
                : 'Already have an account? Sign in here'}
            </button>
          </div>
        </form>

        {/* Alternative: Lookup without signin */}
        <div className="border-t border-[#E5DFD5] pt-5 text-center space-y-2">
          <span className="text-xs text-[#8A8275] block">
            Don&apos;t want to sign in?
          </span>
          <Link href="/track">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Track by Reference Number (e.g. REQ-2026-XXXX)
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
