'use client';

import * as React from 'react';
import { Booking } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { formatDateInAppTz, formatTimeInAppTz, getTimezoneLabel } from '@/lib/utils/timezone';

interface DecisionModalProps {
  booking: Booking | null;
  mode: 'approve' | 'reject' | null;
  onClose: () => void;
  onSuccess: (updatedBooking: Booking) => void;
}

function DecisionFormBody({
  booking,
  mode,
  onClose,
  onSuccess,
}: {
  booking: Booking;
  mode: 'approve' | 'reject';
  onClose: () => void;
  onSuccess: (updatedBooking: Booking) => void;
}) {
  const isApprove = mode === 'approve';
  const [decisionNotes, setDecisionNotes] = React.useState(
    isApprove ? 'Approved by municipal facility administrator. Requirements verified.' : ''
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [conflictError, setConflictError] = React.useState<string | null>(null);
  const tzLabel = getTimezoneLabel();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-1">
      {conflictError && (
        <Alert variant="error" title="Unable to Complete Decision">
          <div className="space-y-1">
            <p>{conflictError}</p>
            <p className="text-[11px] opacity-90">
              The server checks slot availability transactionally before confirming approvals to prevent double-bookings.
            </p>
          </div>
        </Alert>
      )}

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
            <span className="font-medium text-[#1C1917]">
              {formatDateInAppTz(booking.startTime, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#8A8275] block">Time Window ({tzLabel}):</span>
            <span className="font-mono font-medium text-[#1C1917]">
              {formatTimeInAppTz(booking.startTime)} – {formatTimeInAppTz(booking.endTime)}
            </span>
          </div>
        </div>
      </div>

      {isApprove ? (
        <Alert variant="info" className="text-xs">
          <strong>Transactional Approval Check:</strong> Approving verifies no overlapping approved bookings or maintenance windows exist, assigns <strong>APPROVED</strong> status, and records an audit event.
        </Alert>
      ) : (
        <Alert variant="warning" className="text-xs">
          <strong>Decline Action Notice:</strong> Declining sets status to <strong>REJECTED</strong>. The requester will see the rejection reason on their status view.
        </Alert>
      )}

      <div>
        <label htmlFor="decision-notes" className="block text-xs font-semibold text-[#1C1917] mb-1">
          {isApprove ? 'Approval Notes / Conditions (Optional)' : 'Rejection Reason (Required, Visible to Requester)'}
        </label>
        <textarea
          id="decision-notes"
          rows={3}
          required={!isApprove}
          minLength={isApprove ? undefined : 3}
          value={decisionNotes}
          onChange={(e) => setDecisionNotes(e.target.value)}
          placeholder={
            isApprove
              ? 'e.g. Approved. Verified room setup and capacity requirements.'
              : 'e.g. Facility reserved for scheduled maintenance, or event exceeds hall capacity...'
          }
          className="w-full text-xs p-2.5 rounded-md border border-[#E5DFD5] bg-white text-[#1C1917] focus:ring-1 focus:ring-[#1A3B2B] focus:border-[#1A3B2B]"
        />
      </div>

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
  );
}

export function DecisionModal({
  booking,
  mode,
  onClose,
  onSuccess,
}: DecisionModalProps) {
  if (!booking || !mode) return null;

  const isApprove = mode === 'approve';

  return (
    <Modal
      isOpen={Boolean(mode)}
      onClose={onClose}
      title={isApprove ? 'Approve Booking Request' : 'Decline Booking Request'}
      description={`Reference: ${booking.referenceNumber} • ${booking.hallName || 'Community Hall'}`}
      maxWidth="lg"
    >
      <DecisionFormBody
        key={`${booking.id}-${mode}`}
        booking={booking}
        mode={mode}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}
