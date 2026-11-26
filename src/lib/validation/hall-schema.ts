import { z } from 'zod';

/**
 * Zod schema for creating/updating a hall (admin side).
 * Supports both camelCase (UI payload) and snake_case fields cleanly.
 */
export const HallAdminInputSchema = z.object({
  name: z.string().trim().min(2, 'Facility name must be at least 2 characters.'),
  slug: z.string().trim().min(2).optional(),
  tagline: z.string().trim().optional().default(''),
  description: z.string().trim().min(10, 'Description must be at least 10 characters.'),
  hourlyRate: z.coerce.number().nonnegative('Hourly rate cannot be negative.').default(0),
  capacity: z.coerce.number().int('Capacity must be an integer.').positive('Capacity must be greater than 0.'),
  location: z.string().trim().min(2, 'Location is required.'),
  address: z.string().trim().min(4, 'Address is required.'),
  neighborhood: z.string().trim().min(2, 'City / District is required.'),
  amenities: z.array(z.string().trim().min(1)).default([]),
  images: z
    .array(
      z.object({
        url: z.string().url('Image URL must be a valid URL.'),
        alt: z.string().optional().default('Community hall view'),
        credit: z.string().optional(),
      })
    )
    .default([]),
  featured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  rulesAndPolicies: z.array(z.string().trim().min(1)).optional(),
  operatingHours: z
    .object({
      open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Open time must be HH:MM'),
      close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Close time must be HH:MM'),
      days: z.string().min(1),
    })
    .optional(),
});

export type HallAdminInput = z.infer<typeof HallAdminInputSchema>;
