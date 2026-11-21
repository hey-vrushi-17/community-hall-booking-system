'use client';

import * as React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Building,
  User,
  Users,
} from 'lucide-react';
import { Booking } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

interface DecisionModalProps {
  booking: Booking | null;
  mode: 'approve' | 'reject' | null;
  onClose: () => void;
  onSuccess: (updatedBooking: Booking) => void;
}

export function DecisionModal({
  booking,
  mode,
  onClose,
  onSuccess,
}: DecisionModalProps) {
  const [decisionNotes, setDecisionNotes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [conflictError, setConflictError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (booking && mode) {
      setConflictError(null);
      if (mode === 'approve') {
        setDecisionNotes('Approved by municipal facility administrator. Requirements verified.');
      } else {
        setDecisionNotes('');
      }
    }
  }, [booking, mode]);

  if (!booking || !mode) return null;

  const isApprove = mode === 'approve';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setConflictError(null);

    const endpoint = isApprove
      ? `/api/admin/bookings/${booking.id}/approve`
      : `/api/admin/bookings/${booking.id}/reject`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionNotes }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setConflictError(
            data.error ||
              'Cannot approve booking: A conflicting approved event or maintenance window exists for this time slot.'
          );
        } else {
          setConflictError(data.error || 'Failed to process administrative decision.');
        }
        return;
      }

      onSuccess(data.booking);
      onClose();
    } catch {
      setConflictError('Network error while processing administrative decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short',
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

  return (
    <Modal
      isOpen={Boolean(mode)}
      onClose={onClose}
      title={isApprove ? 'Approve Booking Request' : 'Decline Booking Request'}
      description={`Reference: ${booking.referenceNumber} • ${booking.hallName || 'Community Hall'}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {conflictError && (
          <Alert variant="error" title="Schedule Conflict Detected">
            <div className="space-y-1">
              <p>{conflictError}</p>
              <p className="text-[11px] opacity-90">
                The server re-checked slot availability before approval to ensure race conditions do not cause double-bookings.
              </p>
            </div>
          </Alert>
        )}

        {/* Event Snapshot Card */}
        <div className="civic-card p-4 bg-[#FBF9F5] border border-[#E5DFD5] space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-2">
            <span className="font-bold text-[#1C1917] text-sm">{booking.eventName}</span>
            <span className="text-[#615B52] bg-white px-2 py-0.5 rounded border border-[#E5DFD5] text-[11px]">
              {booking.eventType}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[#615B52]">
            <div>
              <span className="text-[11px] text-[#8A8275] block">Facility:</span>
              <span className="font-medium text-[#1C1917]">{booking.hallName}</span>
            </div>
            <div>
              <span className="text-[11px] text-[#8A8275] block">Requester:</span>
              <span className="font-medium text-[#1C1917]">
                {booking.requesterName} ({booking.requesterEmail})
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#8A8275] block">Date:</span>
              <span className="font-medium text-[#1C1917]">{formatDate(booking.startTime)}</span>
            </div>
            <div>
              <span className="text-[11px] text-[#8A8275] block">Time Window (UTC):</span>
              <span className="font-mono font-medium text-[#1C1917]">
                {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Warning / Explanation banner */}
        {isApprove ? (
          <Alert variant="info" className="text-xs">
            <strong>Server Availability Verification:</strong> Approving this request will verify that no other approved event or maintenance overlaps with this slot, assign <strong>APPROVED</strong> status, lock the venue, and log the action in the municipal audit registry.
          </Alert>
        ) : (
          <Alert variant="warning" className="text-xs">
            <strong>Decline Action Notice:</strong> Declining will set status to <strong>REJECTED</strong>. The requester will be able to see the reason on their tracking receipt.
          </Alert>
        )}

        {/* Notes / Reason input */}
        <div>
          <label className="block text-xs font-semibold text-[#1C1917] mb-1">
            {isApprove ? 'Approval Notes / Conditions (Optional)' : 'Rejection Reason (Visible to Requester)'}
          </label>
          <textarea
            rows={3}
            required={!isApprove}
            value={decisionNotes}
            onChange={(e) => setDecisionNotes(e.target.value)}
            placeholder={
              isApprove
                ? 'e.g. Approved. Verified insurance certificate and room layout...'
                : 'e.g. Facility is reserved for scheduled maintenance, or event size exceeds capacity limits...'
            }
            className="w-full text-xs p-2.5 rounded-md border border-[#E5DFD5] bg-white text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B] focus:border-[#1A3B2B]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5DFD5]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={isApprove ? 'primary' : 'destructive'}
            size="sm"
            disabled={isSubmitting}
            className="text-xs"
          >
            {isSubmitting
              ? 'Processing...'
              : isApprove
              ? 'Confirm Official Approval'
              : 'Confirm Rejection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
