import { z } from 'zod';

/**
 * Zod schema for creating/updating a hall (admin side).
 * Mirrors the columns in the `halls` table.
 */
export const HallSchema = z.object({
  name: z.string().min(1, { message: 'Facility name is required.' }),
  slug: z.string().min(1).optional(), // will be generated if omitted
  tagline: z.string().optional(),
  description: z.string().min(1, { message: 'Description is required.' }),
  hourly_rate: z
    .number({ invalid_type_error: 'Hourly rate must be a number.' })
    .nonnegative({ message: 'Hourly rate cannot be negative.' })
    .optional()
    .default(0),
  capacity: z
    .number({ invalid_type_error: 'Capacity must be a number.' })
    .int({ message: 'Capacity must be an integer.' })
    .positive({ message: 'Capacity must be greater than 0.' }),
  location: z.string().min(1, { message: 'Location is required.' }),
  address: z.string().min(1, { message: 'Address is required.' }),
  neighborhood: z.string().optional(),
  amenities: z.array(z.string()).optional().default([]),
  images: z.array(z.object({ url: z.string().url() })).optional().default([]),
  featured: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  rules_and_policies: z.array(z.string()).optional().default([]),
  operating_hours: z
    .object({
      open: z.string(),
      close: z.string(),
      days: z.string(),
    })
    .optional()
    .default({ open: '08:00', close: '22:00', days: 'Monday through Sunday' })
});
