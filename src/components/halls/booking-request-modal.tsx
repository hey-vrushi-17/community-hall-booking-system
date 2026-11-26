'use client';

import * as React from 'react';
import Link from 'next/link';
import { Clock, CheckCircle2, Copy, ExternalLink, UserCheck, LogIn } from 'lucide-react';
import { Hall } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { getAppTodayDateString, getTimezoneLabel } from '@/lib/utils/timezone';
import { useSupabaseUser } from '@/lib/supabase/use-user';
import { calculateBookingFeeSummary } from '@/lib/config/compliance-config';

export interface BookingRequestModalProps {
  hall: Hall;
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
}

function BookingRequestFormBody({
  hall,
  onClose,
  initialDate,
  initialStartTime,
  initialEndTime,
  onSubmitted,
}: {
  hall: Hall;
  onClose: () => void;
  initialDate: string;
  initialStartTime: string;
  initialEndTime: string;
  onSubmitted: (booking: { referenceNumber: string; eventName: string; status: string }) => void;
}) {
  const [formData, setFormData] = React.useState({
    hallId: hall.id,
    requesterName: null as string | null,
    requesterEmail: null as string | null,
    requesterPhone: null as string | null,
    requesterOrg: null as string | null,
    eventName: '',
    eventType: 'Community Meeting',
    expectedAttendees: Math.min(50, hall.capacity),
    bookingDate: initialDate,
    startTime: initialStartTime,
    endTime: initialEndTime,
    specialRequests: '',
    agreeToTerms: false,
    marketingOptIn: false,
  });

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [conflictError, setConflictError] = React.useState<string | null>(null);
  const tzLabel = getTimezoneLabel();
  const { user, isLoading: isAuthLoading, isConfigured: isSupabaseReady } = useSupabaseUser();

  const requesterName = formData.requesterName ?? user?.profile.fullName ?? '';
  const requesterEmail = formData.requesterEmail ?? user?.email ?? '';
  const requesterPhone = formData.requesterPhone ?? user?.profile.phone ?? '';
  const requesterOrg = formData.requesterOrg ?? user?.profile.organization ?? '';
  const feeSummary = calculateBookingFeeSummary(
    hall.hourlyRate,
    formData.startTime,
    formData.endTime
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setConflictError(null);
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!requesterName.trim()) {
      errors.requesterName = 'Full name is required';
    }
    if (!requesterEmail.trim()) {
      errors.requesterEmail = 'Email address is required';
    }
    if (!requesterPhone.trim()) {
      errors.requesterPhone = 'Contact phone number is required';
    }
    if (!formData.eventName.trim()) {
      errors.eventName = 'Event name is required';
    }
    if (Number(formData.expectedAttendees) <= 0) {
      errors.expectedAttendees = 'Attendee count must be greater than 0';
    } else if (Number(formData.expectedAttendees) > hall.capacity) {
      errors.expectedAttendees = `Exceeds max hall capacity of ${hall.capacity}`;
    }
    if (!formData.bookingDate) {
      errors.bookingDate = 'Please select an event date';
    } else if (formData.bookingDate < getAppTodayDateString()) {
      errors.bookingDate = 'Booking date cannot be in the past';
    }
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }
    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    } else if (formData.endTime <= formData.startTime) {
      errors.endTime = 'End time must be after start time';
    }
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the facility usage policies';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          requesterName,
          requesterEmail,
          requesterPhone,
          requesterOrg,
          expectedAttendees: Number(formData.expectedAttendees),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setConflictError(result.details || result.error || 'Requested time is unavailable.');
        } else if (response.status === 422 && result.issues) {
          const apiErrors: Record<string, string> = {};
          result.issues.forEach((issue: { path: string[]; message: string }) => {
            if (issue.path[0]) apiErrors[issue.path[0]] = issue.message;
          });
          setFormErrors(apiErrors);
          if (Object.keys(apiErrors).length === 0) {
            setConflictError(result.error || 'Validation failed.');
          }
        } else {
          setConflictError(result.error || 'Failed to submit booking request.');
        }
        return;
      }

      onSubmitted({
        referenceNumber: result.referenceNumber,
        eventName: formData.eventName,
        status: result.status,
      });
    } catch {
      setConflictError('Network error. Unable to reach the facility booking service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {conflictError && (
        <Alert variant="error" title="Slot Unavailable">
          {conflictError}
        </Alert>
      )}

      <div className="bg-[#FBF9F5] p-3 rounded-md border border-[#E5DFD5] text-xs text-[#615B52] leading-relaxed">
        <span className="font-semibold text-[#1C1917]">Civic Booking Notice:</span>{' '}
        Submitting this form creates a <strong>PENDING</strong> request for review. It is not a confirmed booking until approved by an administrator.
      </div>

      {isSupabaseReady && !isAuthLoading && (
        user ? (
          <div className="p-3 rounded-md bg-[#EBF3EE] border border-[#CDE3D5] text-xs text-[#1A3B2B] flex items-center gap-2">
            <UserCheck className="w-4 h-4 shrink-0 text-[#1A3B2B]" />
            <span>
              Signed in as <strong>{user.email}</strong> — linked to your My Requests dashboard.
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-md bg-white border border-[#E5DFD5] text-xs text-[#615B52] flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5 text-[#1A3B2B]" />
              <span>Sign in to save this request to your citizen dashboard.</span>
            </span>
            <Link
              href={`/login?next=${encodeURIComponent(`/halls/${hall.slug}`)}`}
              className="text-[#1A3B2B] font-semibold hover:underline"
            >
              Sign In / Register →
            </Link>
          </div>
        )
      )}

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1917] mb-3 pb-1 border-b border-[#E5DFD5]">
          1. Requester Contact Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Full Name"
            name="requesterName"
            placeholder="Aarav Sharma"
            required
            value={requesterName}
            onChange={handleChange}
            error={formErrors.requesterName}
          />
          <Input
            label="Email Address"
            name="requesterEmail"
            type="email"
            placeholder="aarav.sharma@example.org"
            required
            value={requesterEmail}
            onChange={handleChange}
            error={formErrors.requesterEmail}
          />
          <Input
            label="Phone Number"
            name="requesterPhone"
            type="tel"
            placeholder="+91 98110 12345"
            required
            value={requesterPhone}
            onChange={handleChange}
            error={formErrors.requesterPhone}
          />
          <Input
            label="Organization / Group (Optional)"
            name="requesterOrg"
            placeholder="Neighborhood Association, Club, etc."
            value={requesterOrg}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1917] mb-3 pb-1 border-b border-[#E5DFD5]">
          2. Event Specifications
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <Input
              label="Event Title"
              name="eventName"
              placeholder="e.g. Annual Community Forum & General Meeting"
              required
              value={formData.eventName}
              onChange={handleChange}
              error={formErrors.eventName}
            />
          </div>

          <Select
            label="Event Category"
            name="eventType"
            required
            value={formData.eventType}
            onChange={handleChange}
            options={[
              { value: 'Community Meeting', label: 'Community Meeting' },
              { value: 'Cultural & Heritage Celebration', label: 'Cultural & Heritage Celebration' },
              { value: 'Civic / Non-profit Workshop', label: 'Civic / Non-profit Workshop' },
              { value: 'Private Gathering / Banquet', label: 'Private Gathering / Banquet' },
              { value: 'Performance / Rehearsal', label: 'Performance / Rehearsal' },
              { value: 'Educational Seminar', label: 'Educational Seminar' },
              { value: 'Other Civic Event', label: 'Other Civic Event' },
            ]}
          />

          <Input
            label={`Expected Attendees (Max ${hall.capacity})`}
            name="expectedAttendees"
            type="number"
            min={1}
            max={hall.capacity}
            required
            value={formData.expectedAttendees}
            onChange={handleChange}
            error={formErrors.expectedAttendees}
          />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1917] mb-3 pb-1 border-b border-[#E5DFD5]">
          3. Date &amp; Time Window ({tzLabel})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Input
            label="Reservation Date"
            name="bookingDate"
            type="date"
            min={getAppTodayDateString()}
            required
            value={formData.bookingDate}
            onChange={handleChange}
            error={formErrors.bookingDate}
          />
          <Input
            label="Start Time"
            name="startTime"
            type="time"
            required
            value={formData.startTime}
            onChange={handleChange}
            error={formErrors.startTime}
            helperText={`Opens at ${hall.operatingHours.open}`}
          />
          <Input
            label="End Time"
            name="endTime"
            type="time"
            required
            value={formData.endTime}
            onChange={handleChange}
            error={formErrors.endTime}
            helperText={`Closes at ${hall.operatingHours.close}`}
          />
        </div>
      </div>

      <div>
        <Textarea
          label="Special Equipment or Setup Requirements (Optional)"
          name="specialRequests"
          placeholder="e.g. Stage microphone requested, banquet table layout, early load-in needed..."
          value={formData.specialRequests}
          onChange={handleChange}
          helperText="Audio/visual technicians and kitchen access require administrative pre-clearance."
        />
      </div>

      {feeSummary && (
        <div className="p-3.5 rounded-md bg-[#FBF9F5] border border-[#E5DFD5] text-xs space-y-1.5">
          <div className="flex items-center justify-between font-bold text-[#1C1917]">
            <span>Estimated Fee Summary (Due Only Upon Approval)</span>
            <Link href="/legal/payment-terms" target="_blank" className="text-[#1A3B2B] underline font-semibold">
              Payment Terms
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] text-[#615B52]">
            <div>
              Rental ({feeSummary.durationHours}h × ₹{feeSummary.hourlyRate}):{' '}
              <strong className="text-[#1C1917]">₹{feeSummary.baseRentalFee.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              Refundable Deposit:{' '}
              <strong className="text-[#1C1917]">₹{feeSummary.securityDeposit.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              Est. Total on Approval:{' '}
              <strong className="text-[#1A3B2B]">₹{feeSummary.estimatedTotalDueOnApproval.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2 space-y-2.5">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            className="mt-0.5 rounded border-[#CDC5B7] text-[#1A3B2B] focus:ring-[#1A3B2B] h-4 w-4"
          />
          <span className="text-xs text-[#615B52] leading-relaxed">
            I understand this request enters administrative review and is not confirmed until approved. I agree to the{' '}
            <Link href="/legal/terms" target="_blank" className="text-[#1A3B2B] font-semibold underline">
              Terms &amp; Conditions
            </Link>
            ,{' '}
            <Link href="/legal/payment-terms" target="_blank" className="text-[#1A3B2B] font-semibold underline">
              Payment &amp; Refund Terms
            </Link>
            , and{' '}
            <Link href="/legal/privacy-policy" target="_blank" className="text-[#1A3B2B] font-semibold underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {formErrors.agreeToTerms && (
          <p className="mt-1 text-xs text-[#D92D20] font-medium">
            {formErrors.agreeToTerms}
          </p>
        )}

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="marketingOptIn"
            checked={formData.marketingOptIn}
            onChange={handleChange}
            className="mt-0.5 rounded border-[#CDC5B7] text-[#1A3B2B] focus:ring-[#1A3B2B] h-4 w-4"
          />
          <span className="text-[11px] text-[#615B52] leading-relaxed">
            (Optional) Send me seasonal hall availability notices and municipal community updates.{' '}
            <Link href="/legal/marketing-consent" target="_blank" className="text-[#1A3B2B] underline">
              Marketing Consent Policy
            </Link>
          </span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5DFD5]">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="text-xs"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="text-xs"
        >
          Submit Booking Request
        </Button>
      </div>
    </form>
  );
}

export function BookingRequestModal({
  hall,
  isOpen,
  onClose,
  initialDate,
  initialStartTime = '10:00',
  initialEndTime = '15:00',
}: BookingRequestModalProps) {
  const effectiveDate = initialDate || getAppTodayDateString();
  const [submittedBooking, setSubmittedBooking] = React.useState<{
    referenceNumber: string;
    eventName: string;
    status: string;
  } | null>(null);
  const [copiedRef, setCopiedRef] = React.useState(false);

  const handleClose = () => {
    setSubmittedBooking(null);
    setCopiedRef(false);
    onClose();
  };

  const copyRefToClipboard = () => {
    if (submittedBooking?.referenceNumber) {
      navigator.clipboard.writeText(submittedBooking.referenceNumber);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={submittedBooking ? 'Booking Request Submitted' : `Request Booking: ${hall.name}`}
      description={
        submittedBooking
          ? 'Your request is officially queued as PENDING in the review registry.'
          : `Capacity: ${hall.capacity} guests • Rate: ₹${hall.hourlyRate}/hr • ${hall.location}`
      }
      maxWidth="xl"
    >
      {submittedBooking ? (
        <div className="space-y-6 py-2">
          <div className="p-6 rounded-md bg-[#EBF3EE] border border-[#C3D9CB] text-center">
            <CheckCircle2 className="w-12 h-12 text-[#1A3B2B] mx-auto mb-3" />
            <h4 className="text-xl font-bold text-[#1A3B2B] tracking-tight">
              Submission Received &amp; Pending Review
            </h4>
            <p className="text-xs text-[#132B20] mt-1.5 max-w-md mx-auto leading-relaxed">
              Your request for <strong>{submittedBooking.eventName}</strong> has been logged with status{' '}
              <strong>{submittedBooking.status}</strong>. A submitted request does not guarantee access until approved.
            </p>

            <div className="mt-5 p-3 bg-white rounded-md border border-[#C3D9CB] inline-flex items-center gap-3">
              <span className="text-xs text-[#615B52]">Reference Number:</span>
              <span className="font-mono text-base font-bold text-[#1C1917] tracking-wider">
                {submittedBooking.referenceNumber}
              </span>
              <button
                type="button"
                onClick={copyRefToClipboard}
                className="p-1 hover:bg-[#F3EFE8] rounded text-[#1A3B2B] transition-colors"
                title="Copy reference code"
                aria-label="Copy reference code"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copiedRef && (
              <span className="block text-[11px] text-[#1A3B2B] font-semibold mt-1">
                Copied to clipboard!
              </span>
            )}
          </div>

          <div className="bg-[#FBF9F5] p-4 rounded-md border border-[#E5DFD5] space-y-2.5 text-xs text-[#615B52]">
            <h5 className="font-semibold text-[#1C1917] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#1A3B2B]" />
              What Happens Next:
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
              <li>Our facility coordinator verifies room capacity, operating hours, and schedule conflicts.</li>
              <li>Your request status updates once an administrative decision is recorded.</li>
              <li>Check live status anytime on your confirmation page, tracking portal, or My Requests.</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E5DFD5]">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Link
                href={`/request/confirmation?ref=${submittedBooking.referenceNumber}`}
                className="w-full sm:w-auto"
              >
                <Button variant="primary" className="w-full gap-2 text-xs">
                  <span>View Confirmation Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <Link
                href={`/track?ref=${submittedBooking.referenceNumber}`}
                className="w-full sm:w-auto"
              >
                <Button variant="outline" className="w-full gap-2 text-xs">
                  <span>Track Status</span>
                </Button>
              </Link>
            </div>
            <Button variant="secondary" onClick={handleClose} className="w-full sm:w-auto text-xs">
              Close Window
            </Button>
          </div>
        </div>
      ) : (
        <BookingRequestFormBody
          key={`${hall.id}-${effectiveDate}-${initialStartTime}-${initialEndTime}`}
          hall={hall}
          onClose={handleClose}
          initialDate={effectiveDate}
          initialStartTime={initialStartTime}
          initialEndTime={initialEndTime}
          onSubmitted={setSubmittedBooking}
        />
      )}
    </Modal>
  );
}
