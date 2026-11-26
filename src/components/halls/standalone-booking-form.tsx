'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Building, ArrowRight, CheckCircle2, AlertCircle, UserCheck, LogIn } from 'lucide-react';
import { Hall } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { getAppTodayDateString, getTimezoneLabel } from '@/lib/utils/timezone';
import { useSupabaseUser } from '@/lib/supabase/use-user';
import { calculateBookingFeeSummary } from '@/lib/config/compliance-config';

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
    requesterName: null as string | null,
    requesterEmail: null as string | null,
    requesterPhone: null as string | null,
    requesterOrg: null as string | null,
    eventName: '',
    eventType: 'Community Meeting',
    expectedAttendees: defaultHall ? Math.min(50, defaultHall.capacity) : 25,
    bookingDate: initialDate || getAppTodayDateString(),
    startTime: defaultHall?.operatingHours?.open || '10:00',
    endTime: '14:00',
    specialRequests: '',
    agreeToTerms: false,
    marketingOptIn: false,
  });

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { user, isLoading: isAuthLoading, isConfigured: isSupabaseReady } = useSupabaseUser();

  const requesterName = formData.requesterName ?? user?.profile.fullName ?? '';
  const requesterEmail = formData.requesterEmail ?? user?.email ?? '';
  const requesterPhone = formData.requesterPhone ?? user?.profile.phone ?? '';
  const requesterOrg = formData.requesterOrg ?? user?.profile.organization ?? '';

  const selectedHall = halls.find((h) => h.id === formData.hallId) || defaultHall;
  const feeSummary = selectedHall
    ? calculateBookingFeeSummary(selectedHall.hourlyRate, formData.startTime, formData.endTime)
    : null;

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
    if (!requesterName.trim()) errors.requesterName = 'Full name is required';
    if (!requesterEmail.trim()) errors.requesterEmail = 'Email is required';
    if (!requesterPhone.trim()) errors.requesterPhone = 'Phone number is required';
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
          requesterName,
          requesterEmail,
          requesterPhone,
          requesterOrg,
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

      {isSupabaseReady && !isAuthLoading && (
        user ? (
          <div className="p-3.5 rounded-md bg-[#EBF3EE] border border-[#CDE3D5] text-xs text-[#1A3B2B] flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 shrink-0 text-[#1A3B2B]" />
            <span>
              Signed in as <strong>{user.email}</strong>. Your profile details are pre-filled and this request will be linked to your{' '}
              <Link href="/my-requests" className="underline font-semibold">
                My Requests
              </Link>{' '}
              dashboard.
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-md bg-[#FBF9F5] border border-[#E5DFD5] text-xs text-[#615B52] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <LogIn className="w-4 h-4 shrink-0 text-[#1A3B2B]" />
              <span>
                Have a citizen account? Sign in to pre-fill your contact info and manage pending requests.
              </span>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/login?next=/request">
                <Button type="button" variant="outline" size="sm" className="text-xs">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup?next=/request">
                <Button type="button" variant="secondary" size="sm" className="text-xs">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        )
      )}

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
            value={requesterName}
            onChange={handleChange}
            error={formErrors.requesterName}
          />
          <Input
            label="Email Address"
            name="requesterEmail"
            type="email"
            required
            value={requesterEmail}
            onChange={handleChange}
            error={formErrors.requesterEmail}
          />
          <Input
            label="Phone Number"
            name="requesterPhone"
            type="tel"
            required
            value={requesterPhone}
            onChange={handleChange}
            error={formErrors.requesterPhone}
          />
          <Input
            label="Organization / Group (Optional)"
            name="requesterOrg"
            value={requesterOrg}
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

      {feeSummary && (
        <div className="p-4 rounded-md bg-[#FBF9F5] border border-[#E5DFD5] text-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-[#1C1917]">
            <span>Estimated Fee &amp; Deposit Summary (Payable Only After Approval)</span>
            <Link href="/legal/payment-terms" target="_blank" className="text-[#1A3B2B] underline font-semibold">
              View Payment &amp; Refund Terms →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[#615B52]">
            <div>
              Base Rental ({feeSummary.durationHours}h × ₹{feeSummary.hourlyRate}/hr):{' '}
              <strong className="text-[#1C1917]">₹{feeSummary.baseRentalFee.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              Refundable Security Deposit:{' '}
              <strong className="text-[#1C1917]">₹{feeSummary.securityDeposit.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              Est. Total on Approval:{' '}
              <strong className="text-[#1A3B2B]">₹{feeSummary.estimatedTotalDueOnApproval.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            className="mt-0.5 rounded border-[#CDC5B7] text-[#1A3B2B] focus:ring-[#1A3B2B] h-4 w-4"
          />
          <span className="text-xs text-[#615B52] leading-relaxed">
            I understand that submitting this request does not confirm a reservation until reviewed and approved by the facility administrator, and I agree to the{' '}
            <Link href="/legal/terms" target="_blank" className="text-[#1A3B2B] font-semibold underline">
              Terms &amp; Conditions
            </Link>
            ,{' '}
            <Link href="/legal/payment-terms" target="_blank" className="text-[#1A3B2B] font-semibold underline">
              Payment &amp; Subscription Terms
            </Link>
            , and{' '}
            <Link href="/legal/privacy-policy" target="_blank" className="text-[#1A3B2B] font-semibold underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {formErrors.agreeToTerms && (
          <p className="mt-1 text-xs text-[#D92D20] font-medium">{formErrors.agreeToTerms}</p>
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
            (Optional) Receive municipal hall availability announcements and community programming updates.{' '}
            <Link href="/legal/marketing-consent" target="_blank" className="text-[#1A3B2B] underline">
              Learn more
            </Link>
          </span>
        </label>
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
