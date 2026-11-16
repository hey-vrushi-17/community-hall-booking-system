import { z } from 'zod';

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
    requesterOrg: z.string().trim().optional(),
    eventName: z.string().trim().min(3, 'Event name must be at least 3 characters'),
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
      error: 'You must agree to the facility usage policies and terms',
    }),
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
