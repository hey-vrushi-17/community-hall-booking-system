'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Building, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Hall } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { getAppTodayDateString, getTimezoneLabel } from '@/lib/utils/timezone';

interface StandaloneBookingFormProps {
  halls: Hall[];
  initialHallId?: string;
  initialDate?: string;
}

export function StandaloneBookingForm({
  halls,
  initialHallId,
  initialDate,
}: StandaloneBookingFormProps) {
  const router = useRouter();
  const defaultHall = halls.find((h) => h.id === initialHallId) || halls[0];
  const tzLabel = getTimezoneLabel();

  const [formData, setFormData] = React.useState({
    hallId: defaultHall?.id || '',
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    requesterOrg: '',
    eventName: '',
    eventType: 'Community Meeting',
    expectedAttendees: defaultHall ? Math.min(50, defaultHall.capacity) : 25,
    bookingDate: initialDate || getAppTodayDateString(),
    startTime: defaultHall?.operatingHours?.open || '10:00',
    endTime: '14:00',
    specialRequests: '',
    agreeToTerms: false,
  });

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const selectedHall = halls.find((h) => h.id === formData.hallId) || defaultHall;

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
    if (isSubmitting || !selectedHall) return;
    setSubmitError(null);
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!formData.requesterName.trim()) errors.requesterName = 'Full name is required';
    if (!formData.requesterEmail.trim()) errors.requesterEmail = 'Email is required';
    if (!formData.requesterPhone.trim()) errors.requesterPhone = 'Phone number is required';
    if (!formData.eventName.trim()) errors.eventName = 'Event title is required';
    if (Number(formData.expectedAttendees) <= 0) {
      errors.expectedAttendees = 'Must be at least 1 guest';
    } else if (Number(formData.expectedAttendees) > selectedHall.capacity) {
      errors.expectedAttendees = `Exceeds maximum capacity of ${selectedHall.capacity}`;
    }
    if (!formData.bookingDate) {
      errors.bookingDate = 'Event date is required';
    } else if (formData.bookingDate < getAppTodayDateString()) {
      errors.bookingDate = 'Booking date cannot be in the past';
    }
    if (!formData.endTime || formData.endTime <= formData.startTime) {
      errors.endTime = 'End time must be after start time';
    }
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the facility usage terms';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expectedAttendees: Number(formData.expectedAttendees),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422 && data.issues) {
          const apiErrors: Record<string, string> = {};
          data.issues.forEach((issue: { path: string[]; message: string }) => {
            if (issue.path[0]) apiErrors[issue.path[0]] = issue.message;
          });
          setFormErrors(apiErrors);
        }
        setSubmitError(data.details || data.error || 'Unable to submit booking request.');
        return;
      }

      router.push(`/request/confirmation?ref=${encodeURIComponent(data.referenceNumber)}`);
    } catch {
      setSubmitError('Network error while submitting request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (halls.length === 0) {
    return (
      <div className="civic-card p-10 bg-white border border-[#E5DFD5] text-center space-y-3">
        <Building className="w-10 h-10 text-[#8A8275] mx-auto" />
        <h2 className="text-base font-bold text-[#1C1917]">No Active Halls Available</h2>
        <p className="text-xs text-[#615B52]">
          No active community halls are available for booking requests right now.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="civic-card p-6 sm:p-8 bg-white border border-[#E5DFD5] space-y-6">
      <Alert variant="info" className="text-xs">
        <strong>Request Review Process:</strong> Submitting this form registers a{' '}
        <strong>PENDING</strong> booking request. Slots are not locked until reviewed and approved by facility staff.
      </Alert>

      {submitError && (
        <Alert variant="error" title="Unable to Submit Request" className="text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        </Alert>
      )}

      {/* Step 1: Hall & Schedule */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#1C1917] border-b border-[#E5DFD5] pb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#1A3B2B]" />
          1. Select Venue &amp; Schedule ({tzLabel})
        </h2>

        <Select
          label="Community Hall"
          name="hallId"
          required
          value={formData.hallId}
          onChange={handleChange}
          options={halls.map((h) => ({
            value: h.id,
            label: `${h.name} — ${h.neighborhood} (Cap. ${h.capacity}, ₹${h.hourlyRate}/hr)`,
          }))}
        />

        {selectedHall && (
          <div className="p-3 rounded-md bg-[#FBF9F5] border border-[#E5DFD5] text-xs text-[#615B52] flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>Hours:</strong> {selectedHall.operatingHours.open} – {selectedHall.operatingHours.close} •{' '}
              <strong>Max Capacity:</strong> {selectedHall.capacity} guests
            </span>
            <Link href={`/halls/${selectedHall.slug}`} className="text-[#1A3B2B] font-semibold hover:underline">
              Inspect full availability calendar →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Event Date"
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

      {/* Step 2: Event Info */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#1C1917] border-b border-[#E5DFD5] pb-2">
          2. Event Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Event Name"
              name="eventName"
              placeholder="e.g. Neighborhood Cultural Gathering"
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
            label={`Expected Attendance${selectedHall ? ` (Max ${selectedHall.capacity})` : ''}`}
            name="expectedAttendees"
            type="number"
            min={1}
            max={selectedHall?.capacity || 2000}
            required
            value={formData.expectedAttendees}
            onChange={handleChange}
            error={formErrors.expectedAttendees}
          />
        </div>
      </div>

      {/* Step 3: Contact Info */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#1C1917] border-b border-[#E5DFD5] pb-2">
          3. Requester Contact Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            name="requesterName"
            required
            value={formData.requesterName}
            onChange={handleChange}
            error={formErrors.requesterName}
          />
          <Input
            label="Email Address"
            name="requesterEmail"
            type="email"
            required
            value={formData.requesterEmail}
            onChange={handleChange}
            error={formErrors.requesterEmail}
          />
          <Input
            label="Phone Number"
            name="requesterPhone"
            type="tel"
            required
            value={formData.requesterPhone}
            onChange={handleChange}
            error={formErrors.requesterPhone}
          />
          <Input
            label="Organization / Group (Optional)"
            name="requesterOrg"
            value={formData.requesterOrg}
            onChange={handleChange}
          />
        </div>

        <Textarea
          label="Notes &amp; Setup Requirements (Optional)"
          name="specialRequests"
          value={formData.specialRequests}
          onChange={handleChange}
          placeholder="Microphone setup, stage chairs, accessibility accommodations..."
        />
      </div>

      <div>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            className="mt-0.5 rounded border-[#CDC5B7] text-[#1A3B2B] focus:ring-[#1A3B2B] h-4 w-4"
          />
          <span className="text-xs text-[#615B52] leading-relaxed">
            I understand that submitting this request does not confirm a reservation until reviewed and approved by the facility administrator.
          </span>
        </label>
        {formErrors.agreeToTerms && (
          <p className="mt-1 text-xs text-[#D92D20] font-medium">{formErrors.agreeToTerms}</p>
        )}
      </div>

      <div className="pt-4 border-t border-[#E5DFD5] flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link href="/halls" className="text-xs text-[#615B52] hover:text-[#1A3B2B]">
          ← Browse All Halls
        </Link>
        <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full sm:w-auto gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>Submit Pending Request</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
