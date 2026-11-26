import { z } from 'zod';
import { Hall } from '@/types';
import { MAX_ADVANCE_BOOKING_DAYS } from '@/lib/config/site-config';
import { getAppTodayDateString } from '@/lib/utils/timezone';

export const bookingFormSchema = z
  .object({
    hallId: z.string().min(1, 'Please select a hall'),
    requesterName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    requesterEmail: z.string().trim().email('Please enter a valid email address'),
    requesterPhone: z
      .string()
      .trim()
      .min(7, 'Please provide a valid phone number (minimum 7 digits)')
      .regex(/^[0-9+()\-.\s]+$/, 'Phone number contains invalid characters'),
    requesterOrg: z.string().trim().max(120, 'Maximum 120 characters').optional(),
    eventName: z.string().trim().min(3, 'Event name must be at least 3 characters').max(150),
    eventType: z.enum(
      [
        'Community Meeting',
        'Cultural & Heritage Celebration',
        'Private Gathering / Banquet',
        'Civic / Non-profit Workshop',
        'Performance / Rehearsal',
        'Educational Seminar',
        'Other Civic Event',
      ],
      { error: 'Please choose an event category' }
    ),
    expectedAttendees: z.coerce
      .number({ error: 'Please enter expected number of attendees' })
      .int('Must be a whole number')
      .positive('Must be greater than 0'),
    bookingDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be HH:MM format'),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be HH:MM format'),
    specialRequests: z.string().trim().max(500, 'Maximum 500 characters').optional(),
    agreeToTerms: z.literal(true, {
      error: 'You must agree to the facility usage policies, Terms & Conditions, and Privacy Policy',
    }),
    marketingOptIn: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return false;
      return data.endTime > data.startTime;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export type BookingFormData = z.infer<typeof bookingFormSchema>;

export const availabilityQuerySchema = z.object({
  hallId: z.string().min(1, 'Hall ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid YYYY-MM-DD date required'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

export type AvailabilityQueryParams = z.infer<typeof availabilityQuerySchema>;

export const maintenanceFormSchema = z
  .object({
    hallId: z.string().min(1, 'Please select a facility'),
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
    reason: z.string().trim().min(3, 'Reason must be at least 3 characters').max(500),
    startTime: z.string().min(1, 'Start timestamp is required'),
    endTime: z.string().min(1, 'End timestamp is required'),
  })
  .refine(
    (data) => new Date(data.endTime).getTime() > new Date(data.startTime).getTime(),
    {
      message: 'Maintenance end time must be after start time',
      path: ['endTime'],
    }
  );

export interface BusinessRuleViolation {
  field: string;
  message: string;
}

/**
 * Validates booking submission against configured hall capacity, operating hours,
 * and booking date rules (not in the past, within advance booking window).
 */
export function validateBookingBusinessRules(
  data: BookingFormData,
  hall: Hall | null,
  options?: { allowPastDatesForTests?: boolean }
): BusinessRuleViolation[] {
  const violations: BusinessRuleViolation[] = [];

  if (!hall) {
    violations.push({
      field: 'hallId',
      message: 'The selected community hall was not found.',
    });
    return violations;
  }

  if (!hall.isActive) {
    violations.push({
      field: 'hallId',
      message: 'This community hall is currently archived and unavailable for new requests.',
    });
  }

  if (data.expectedAttendees > hall.capacity) {
    violations.push({
      field: 'expectedAttendees',
      message: `Expected attendance (${data.expectedAttendees}) exceeds maximum hall capacity of ${hall.capacity} guests.`,
    });
  }

  if (!options?.allowPastDatesForTests) {
    const todayStr = getAppTodayDateString();
    if (data.bookingDate < todayStr) {
      violations.push({
        field: 'bookingDate',
        message: `Booking date (${data.bookingDate}) cannot be in the past.`,
      });
    } else {
      const todayMs = Date.parse(`${todayStr}T00:00:00Z`);
      const targetMs = Date.parse(`${data.bookingDate}T00:00:00Z`);
      const diffDays = (targetMs - todayMs) / (1000 * 60 * 60 * 24);
      if (diffDays > MAX_ADVANCE_BOOKING_DAYS) {
        violations.push({
          field: 'bookingDate',
          message: `Bookings can only be requested up to ${MAX_ADVANCE_BOOKING_DAYS} days in advance.`,
        });
      }
    }
  }

  const openTime = hall.operatingHours?.open || '08:00';
  const closeTime = hall.operatingHours?.close || '22:00';
  if (data.startTime < openTime || data.endTime > closeTime) {
    violations.push({
      field: 'startTime',
      message: `Requested hours (${data.startTime}–${data.endTime}) must fall within facility operating hours (${openTime}–${closeTime}).`,
    });
  }

  return violations;
}
