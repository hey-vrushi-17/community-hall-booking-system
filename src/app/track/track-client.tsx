'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Building, Calendar, Users } from 'lucide-react';
import { Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { formatDateInAppTz, formatTimeInAppTz, getTimezoneLabel } from '@/lib/utils/timezone';

export function TrackRequestClient() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  const [refInput, setRefInput] = React.useState(initialRef);
  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [isLoading, setIsLoading] = React.useState(Boolean(initialRef));
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [hasSearched, setHasSearched] = React.useState(Boolean(initialRef));
  const tzLabel = getTimezoneLabel();

  const fetchBooking = React.useCallback(async (code: string) => {
    if (!code.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/bookings?ref=${encodeURIComponent(code.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'No matching booking request found.');
        setBooking(null);
      } else {
        setBooking(data.booking);
      }
    } catch {
      setErrorMessage('Network error occurred while fetching tracking details.');
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!initialRef) return;
    let active = true;
    fetch(`/api/bookings?ref=${encodeURIComponent(initialRef.trim())}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!active) return;
        if (!ok) {
          setErrorMessage(data.error || 'No matching booking request found.');
          setBooking(null);
        } else {
          setBooking(data.booking);
        }
      })
      .catch(() => {
        if (!active) return;
        setErrorMessage('Network error occurred while fetching tracking details.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooking(refInput);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="civic-card p-4 bg-white border border-[#E5DFD5]">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8A8275] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder="Enter reference number (e.g. REQ-2026-8041)"
              aria-label="Booking Reference Number"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-md border border-[#E5DFD5] bg-[#FBF9F5] uppercase tracking-wider text-[#1C1917] placeholder:normal-case placeholder:tracking-normal focus:ring-1 focus:ring-[#1A3B2B] focus:border-[#1A3B2B]"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="text-xs shrink-0"
          >
            Track Status
          </Button>
        </div>
      </form>

      {!hasSearched && (
        <div className="p-4 rounded-md bg-[#F5F2EB] border border-[#E5DFD5] text-xs text-[#615B52]">
          <span className="font-semibold text-[#1C1917] block mb-1.5">
            Sample Reference Codes (for Local / Seeded Exploration):
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { ref: 'REQ-2026-8041', label: 'REQ-2026-8041 (Approved)' },
              { ref: 'REQ-2026-8150', label: 'REQ-2026-8150 (Approved)' },
              { ref: 'REQ-2026-8302', label: 'REQ-2026-8302 (Pending Review)' },
            ].map((item) => (
              <button
                key={item.ref}
                type="button"
                onClick={() => {
                  setRefInput(item.ref);
                  fetchBooking(item.ref);
                }}
                className="font-mono text-[11px] px-2.5 py-1 rounded bg-white border border-[#E5DFD5] text-[#1A3B2B] hover:border-[#1A3B2B] transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {errorMessage && (
        <Alert variant="error" title="Record Lookup Notice">
          {errorMessage}
        </Alert>
      )}

      {booking && (
        <div className="civic-card bg-white border border-[#E5DFD5] divide-y divide-[#E5DFD5] overflow-hidden">
          <div className="p-6 bg-[#FBF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[#8A8275] font-semibold uppercase">Reference</span>
                <span className="font-mono text-base font-bold text-[#1C1917] tracking-wider">
                  {booking.referenceNumber}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">
                {booking.eventName}
              </h2>
            </div>
            <Badge status={booking.status} className="text-xs py-1 px-3 self-start sm:self-auto" />
          </div>

          <div className="p-4 bg-white">
            {booking.status === 'APPROVED' ? (
              <Alert variant="success" title="Booking Confirmed & Locked">
                This reservation has been officially reviewed and approved by the Facilities
                Division. The requested facility and time window are reserved.
              </Alert>
            ) : booking.status === 'PENDING' ? (
              <Alert variant="warning" title="Awaiting Administrative Review">
                Your request is currently queued with facility staff. Submitting a
                request does not lock the venue until an administrative approval is issued.
              </Alert>
            ) : booking.status === 'REJECTED' ? (
              <Alert variant="error" title="Request Not Accommodated">
                This booking request could not be accommodated. Reason:{' '}
                {booking.decisionNotes || 'Schedule or facility constraints.'}
              </Alert>
            ) : (
              <Alert variant="info" title="Reservation Cancelled">
                This booking request was cancelled. {booking.decisionNotes}
              </Alert>
            )}
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#1C1917]">
            <div className="space-y-4">
              <div>
                <span className="text-[#8A8275] uppercase font-semibold block mb-1">
                  Facility
                </span>
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Building className="w-4 h-4 text-[#1A3B2B]" />
                  <span>{booking.hallName || 'Community Hall'}</span>
                </div>
              </div>

              <div>
                <span className="text-[#8A8275] uppercase font-semibold block mb-1">
                  Requested Date &amp; Time Window ({tzLabel})
                </span>
                <div className="flex items-center gap-2 font-medium">
                  <Calendar className="w-4 h-4 text-[#1A3B2B]" />
                  <span>
                    {formatDateInAppTz(booking.startTime, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    ({formatTimeInAppTz(booking.startTime)} – {formatTimeInAppTz(booking.endTime)})
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#8A8275] uppercase font-semibold block mb-1">
                  Event Category &amp; Attendees
                </span>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1A3B2B]" />
                  <span>
                    {booking.eventType} • {booking.expectedAttendees} expected guests
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[#8A8275] uppercase font-semibold block mb-1">
                  Requester Contact
                </span>
                <p>
                  <strong>{booking.requesterName}</strong>
                  {booking.requesterOrg && <span> ({booking.requesterOrg})</span>}
                </p>
                <p className="text-[#615B52] font-mono">{booking.requesterEmail}</p>
                <p className="text-[#615B52]">{booking.requesterPhone}</p>
              </div>

              <div>
                <span className="text-[#8A8275] uppercase font-semibold block mb-1">
                  Review Details
                </span>
                {booking.reviewedAt ? (
                  <div className="space-y-1">
                    <p className="text-[#615B52]">
                      Decided: {formatDateInAppTz(booking.reviewedAt)}
                    </p>
                    {booking.decisionNotes && (
                      <p className="text-[#615B52] italic">
                        Notes: &ldquo;{booking.decisionNotes}&rdquo;
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[#8A8275] italic">
                    Assigned to Facilities Intake Queue (Estimated review: 1–2 business days)
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#FBF9F5] flex items-center justify-between">
            <span className="text-[11px] text-[#8A8275]">
              Submitted on {formatDateInAppTz(booking.createdAt)}
            </span>
            <Link href="/halls">
              <Button variant="outline" size="sm" className="text-xs">
                Browse Other Halls
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
