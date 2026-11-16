'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  MapPin,
  Calendar,
  Users,
  FileText,
  Mail,
  Phone,
  Building,
  ShieldAlert,
  ArrowRight,
  Search,
} from 'lucide-react';
import { Booking } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';

interface ConfirmationClientProps {
  initialBooking: Booking | null;
  refParam?: string;
}

export function ConfirmationClient({ initialBooking, refParam }: ConfirmationClientProps) {
  const [booking, setBooking] = React.useState<Booking | null>(initialBooking);
  const [copied, setCopied] = React.useState(false);
  const [lookupRef, setLookupRef] = React.useState(refParam || '');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const copyRefToClipboard = () => {
    if (booking?.referenceNumber) {
      navigator.clipboard.writeText(booking.referenceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupRef.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/bookings?ref=${encodeURIComponent(lookupRef.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'No matching booking request found.');
        setBooking(null);
      } else {
        setBooking(data.booking);
      }
    } catch {
      setErrorMessage('Failed to look up booking request. Please check your network connection.');
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });
    } catch {
      return isoString;
    }
  };

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="civic-card p-8 bg-white border border-[#E5DFD5] text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#F3EFE8] text-[#8A8275] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#1C1917]">Find Your Booking Confirmation</h2>
          <p className="text-sm text-[#615B52] max-w-md mx-auto">
            Enter your booking reference number (e.g. REQ-2026-1042) to view your submitted reservation request details.
          </p>

          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
            <input
              type="text"
              value={lookupRef}
              onChange={(e) => setLookupRef(e.target.value)}
              placeholder="e.g. REQ-2026-1042"
              className="flex-1 text-sm font-mono px-3.5 py-2.5 rounded-md border border-[#E5DFD5] uppercase focus:ring-1 focus:ring-[#1A3B2B]"
            />
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Locating...' : 'Retrieve Confirmation'}
            </Button>
          </form>

          {errorMessage && (
            <Alert variant="danger" className="text-left mt-4 text-xs">
              {errorMessage}
            </Alert>
          )}

          <div className="pt-4 border-t border-[#E5DFD5]">
            <Link href="/halls" className="text-xs text-[#1A3B2B] hover:underline font-semibold">
              ← Return to Halls Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Official Status Header */}
      <div className="civic-card p-6 sm:p-8 bg-white border border-[#E5DFD5] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E5DFD5] pb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#FFF8EB] border border-[#F5D998] text-[#8C5800] text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>REQUEST STATUS: PENDING MUNICIPAL REVIEW</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight pt-1">
              Reservation Request Received
            </h1>
            <p className="text-xs sm:text-sm text-[#615B52]">
              Submitted for <span className="font-semibold text-[#1C1917]">{booking.hallName || 'Community Facility'}</span>
            </p>
          </div>

          {/* Reference Number Badge */}
          <div className="bg-[#FBF9F5] p-3.5 rounded-lg border border-[#E5DFD5] self-start shrink-0">
            <span className="block text-[11px] font-semibold text-[#8A8275] uppercase tracking-wider">
              Reference Code
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-lg font-bold text-[#1A3B2B]">
                {booking.referenceNumber}
              </span>
              <button
                type="button"
                onClick={copyRefToClipboard}
                title="Copy Reference Code"
                className="p-1 rounded text-[#8A8275] hover:text-[#1A3B2B] hover:bg-[#EBF3EE] transition-colors"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-[#1A3B2B]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            {copied && (
              <span className="text-[10px] text-[#1A3B2B] font-medium block mt-0.5">
                Copied to clipboard
              </span>
            )}
          </div>
        </div>

        {/* Civic Transparency Notice */}
        <Alert variant="warning" className="text-xs leading-relaxed">
          <strong>Important Municipal Notice:</strong> This request has been safely recorded in the queue, but it is <strong>not an approved booking</strong>.
          Community facilities remain available to the public until municipal administrative staff review the application, verify facility safety requirements, and formally issue an approval notice.
        </Alert>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Schedule & Event Column */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold text-[#8A8275] tracking-wider border-b border-[#E5DFD5] pb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1A3B2B]" />
              Event & Timing Details
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[#8A8275] block">Event Name:</span>
                <span className="font-semibold text-[#1C1917] text-sm">{booking.eventName}</span>
              </div>

              <div>
                <span className="text-[#8A8275] block">Category:</span>
                <span className="font-medium text-[#1C1917]">{booking.eventType}</span>
              </div>

              <div>
                <span className="text-[#8A8275] block">Requested Date:</span>
                <span className="font-semibold text-[#1C1917]">{formatDate(booking.startTime)}</span>
              </div>

              <div>
                <span className="text-[#8A8275] block">Requested Time Slot (UTC):</span>
                <span className="font-mono text-[#1C1917]">
                  {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                </span>
              </div>

              <div>
                <span className="text-[#8A8275] block">Expected Attendance:</span>
                <span className="font-medium text-[#1C1917]">{booking.expectedAttendees} attendees</span>
              </div>
            </div>
          </div>

          {/* Requester Column */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold text-[#8A8275] tracking-wider border-b border-[#E5DFD5] pb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#1A3B2B]" />
              Requester Information
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[#8A8275] block">Contact Person:</span>
                <span className="font-semibold text-[#1C1917]">{booking.requesterName}</span>
              </div>

              <div>
                <span className="text-[#8A8275] block">Email Address:</span>
                <span className="font-mono text-[#1C1917]">{booking.requesterEmail}</span>
              </div>

              <div>
                <span className="text-[#8A8275] block">Phone:</span>
                <span className="font-medium text-[#1C1917]">{booking.requesterPhone}</span>
              </div>

              {booking.requesterOrg && (
                <div>
                  <span className="text-[#8A8275] block">Organization:</span>
                  <span className="font-medium text-[#1C1917]">{booking.requesterOrg}</span>
                </div>
              )}

              {booking.specialRequests && (
                <div className="pt-1">
                  <span className="text-[#8A8275] block">Special Equipment / Setup Notes:</span>
                  <p className="text-[#615B52] italic bg-[#FBF9F5] p-2 rounded border border-[#E5DFD5] mt-1">
                    &ldquo;{booking.specialRequests}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Process Next Steps Timeline */}
        <div className="border-t border-[#E5DFD5] pt-6 space-y-3">
          <h3 className="text-xs uppercase font-bold text-[#8A8275] tracking-wider">
            What Happens Next?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#FBF9F5] p-3 rounded border border-[#E5DFD5] space-y-1">
              <span className="font-bold text-[#1A3B2B] block">1. Administrative Review</span>
              <p className="text-[#615B52] text-[11px]">
                Facility staff reviews application requirements, insurance, and capacity within 2 business days.
              </p>
            </div>
            <div className="bg-[#FBF9F5] p-3 rounded border border-[#E5DFD5] space-y-1">
              <span className="font-bold text-[#1A3B2B] block">2. Status Notification</span>
              <p className="text-[#615B52] text-[11px]">
                You will receive confirmation via email once the booking decision is recorded.
              </p>
            </div>
            <div className="bg-[#FBF9F5] p-3 rounded border border-[#E5DFD5] space-y-1">
              <span className="font-bold text-[#1A3B2B] block">3. Access Instructions</span>
              <p className="text-[#615B52] text-[11px]">
                If approved, key pickup codes and venue check-in checklists will be provided.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-[#E5DFD5] pt-6 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/track?ref=${booking.referenceNumber}`}>
            <Button variant="primary" className="gap-2 text-xs">
              <Search className="w-3.5 h-3.5" />
              Track Status in Real-Time
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/my-requests">
              <Button variant="outline" size="sm" className="text-xs">
                View My Requests
              </Button>
            </Link>
            <Link href="/halls">
              <Button variant="secondary" size="sm" className="text-xs">
                Browse More Halls
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
