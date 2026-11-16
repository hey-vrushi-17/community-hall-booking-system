'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Hall } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';

export interface BookingRequestModalProps {
  hall: Hall;
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
}

export function BookingRequestModal({
  hall,
  isOpen,
  onClose,
  initialDate = '2026-11-28',
  initialStartTime = '10:00',
  initialEndTime = '15:00',
}: BookingRequestModalProps) {
  // Form state
  const [formData, setFormData] = React.useState({
    hallId: hall.id,
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    requesterOrg: '',
    eventName: '',
    eventType: 'Community Meeting',
    expectedAttendees: Math.min(50, hall.capacity),
    bookingDate: initialDate,
    startTime: initialStartTime,
    endTime: initialEndTime,
    specialRequests: '',
    agreeToTerms: false,
  });

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [conflictError, setConflictError] = React.useState<string | null>(null);
  const [submittedBooking, setSubmittedBooking] = React.useState<{
    referenceNumber: string;
    eventName: string;
    status: string;
  } | null>(null);
  const [copiedRef, setCopiedRef] = React.useState(false);

  // Sync initial props when opened
  React.useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        hallId: hall.id,
        bookingDate: initialDate || prev.bookingDate,
        startTime: initialStartTime || prev.startTime,
        endTime: initialEndTime || prev.endTime,
      }));
      setSubmittedBooking(null);
      setConflictError(null);
      setFormErrors({});
    }
  }, [isOpen, hall.id, initialDate, initialStartTime, initialEndTime]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error on field change
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
    setConflictError(null);
    setFormErrors({});

    // Client validation
    const errors: Record<string, string> = {};
    if (!formData.requesterName.trim()) {
      errors.requesterName = 'Full name is required';
    }
    if (!formData.requesterEmail.trim()) {
      errors.requesterEmail = 'Email address is required';
    }
    if (!formData.requesterPhone.trim()) {
      errors.requesterPhone = 'Contact phone number is required';
    }
    if (!formData.eventName.trim()) {
      errors.eventName = 'Event name is required';
    }
    if (formData.expectedAttendees <= 0) {
      errors.expectedAttendees = 'Attendee count must be greater than 0';
    } else if (formData.expectedAttendees > hall.capacity) {
      errors.expectedAttendees = `Exceeds max hall capacity of ${hall.capacity}`;
    }
    if (!formData.bookingDate) {
      errors.bookingDate = 'Please select an event date';
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
        } else {
          setConflictError(result.error || 'Failed to submit booking request.');
        }
        return;
      }

      setSubmittedBooking({
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
      onClose={onClose}
      title={submittedBooking ? 'Booking Request Submitted' : `Request Booking: ${hall.name}`}
      description={
        submittedBooking
          ? 'Your request is officially queued in the municipal review registry.'
          : `Capacity: ${hall.capacity} guests • Rate: $${hall.hourlyRate}/hr • ${hall.location}`
      }
      maxWidth="xl"
    >
      {submittedBooking ? (
        <div className="space-y-6 py-2">
          <div className="p-6 rounded-md bg-[#EBF3EE] border border-[#C3D9CB] text-center">
            <CheckCircle2 className="w-12 h-12 text-[#1A3B2B] mx-auto mb-3" />
            <h4 className="text-xl font-bold text-[#1A3B2B] tracking-tight">
              Submission Received & Queued
            </h4>
            <p className="text-xs text-[#132B20] mt-1.5 max-w-md mx-auto leading-relaxed">
              Your request for <strong>{submittedBooking.eventName}</strong> has been logged.
              A submitted request does not guarantee access until approved by the Facilities Division.
            </p>

            {/* Reference Badge */}
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

          {/* Next Steps Card */}
          <div className="bg-[#FBF9F5] p-4 rounded-md border border-[#E5DFD5] space-y-2.5 text-xs text-[#615B52]">
            <h5 className="font-semibold text-[#1C1917] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#1A3B2B]" />
              What Happens Next:
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
              <li>Our facility coordinator verifies room configuration, quiet hours compliance, and staffing requirements.</li>
              <li>You will receive an email within 2 business days indicating approval, conditional requirements, or fee invoice.</li>
              <li>You can check the live decision status anytime using your reference code.</li>
            </ol>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E5DFD5]">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <Link
                href={`/request/confirmation?ref=${submittedBooking.referenceNumber}`}
                className="w-full sm:w-auto"
              >
                <Button variant="primary" className="w-full gap-2 text-xs">
                  <span>View Official Confirmation</span>
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
            <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto text-xs">
              Close Window
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {conflictError && (
            <Alert variant="error" title="Slot Unavailable">
              {conflictError}
            </Alert>
          )}

          <div className="bg-[#FBF9F5] p-3 rounded-md border border-[#E5DFD5] text-xs text-[#615B52] leading-relaxed">
            <span className="font-semibold text-[#1C1917]">Civic Booking Notice:</span> Submission of this request registers your event for facility review. Availability is confirmed only upon official administrative approval.
          </div>

          {/* Requester Information Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1917] mb-3 pb-1 border-b border-[#E5DFD5]">
              1. Requester Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Full Name"
                name="requesterName"
                placeholder="Jane Doe"
                required
                value={formData.requesterName}
                onChange={handleChange}
                error={formErrors.requesterName}
              />
              <Input
                label="Email Address"
                name="requesterEmail"
                type="email"
                placeholder="jane.doe@example.org"
                required
                value={formData.requesterEmail}
                onChange={handleChange}
                error={formErrors.requesterEmail}
              />
              <Input
                label="Phone Number"
                name="requesterPhone"
                type="tel"
                placeholder="(555) 012-3456"
                required
                value={formData.requesterPhone}
                onChange={handleChange}
                error={formErrors.requesterPhone}
              />
              <Input
                label="Organization / Group (Optional)"
                name="requesterOrg"
                placeholder="Neighborhood Association, Club, etc."
                value={formData.requesterOrg}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Event Details Section */}
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

          {/* Schedule Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1917] mb-3 pb-1 border-b border-[#E5DFD5]">
              3. Date & Time Window
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <Input
                label="Reservation Date"
                name="bookingDate"
                type="date"
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
              />
              <Input
                label="End Time"
                name="endTime"
                type="time"
                required
                value={formData.endTime}
                onChange={handleChange}
                error={formErrors.endTime}
              />
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <Textarea
              label="Special Equipment or Setup Requirements (Optional)"
              name="specialRequests"
              placeholder="e.g. Stage microphone requested, banquet table layout, early load-in needed..."
              value={formData.specialRequests}
              onChange={handleChange}
              helperText="Note: Audio/visual technicians and kitchen access require administrative pre-clearance."
            />
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="mt-0.5 rounded border-[#CDC5B7] text-[#1A3B2B] focus:ring-[#1A3B2B] h-4 w-4"
              />
              <span className="text-xs text-[#615B52] leading-relaxed">
                I understand that this request is subject to administrative review under Municipal Civic Bylaw No. 410-B. I agree to abide by facility quiet hours, cleanup regulations, and safety protocols.
              </span>
            </label>
            {formErrors.agreeToTerms && (
              <p className="mt-1 text-xs text-[#D92D20] font-medium">
                {formErrors.agreeToTerms}
              </p>
            )}
          </div>

          {/* Submit Actions */}
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
      )}
    </Modal>
  );
}
