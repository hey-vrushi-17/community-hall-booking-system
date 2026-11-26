import { z } from 'zod';

export const cookiePreferencesSchema = z.object({
  necessary: z.literal(true).default(true),
  functional: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean().default(false),
  source: z.string().trim().max(80).default('cookie_banner'),
});

export const marketingConsentSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address').optional(),
  granted: z.boolean(),
  source: z.string().trim().max(80).default('privacy_center'),
});

export const dataDeletionRequestSchema = z.object({
  requesterEmail: z.string().trim().email('Please enter a valid email address'),
  requesterName: z.string().trim().max(120).optional(),
  bookingReference: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((val) => (val ? val.toUpperCase() : undefined)),
  scope: z.enum(['FULL_ACCOUNT', 'BOOKING_PII', 'MARKETING_DATA']),
  reason: z.string().trim().max(500).optional(),
  executeImmediately: z.boolean().optional(),
});

export const breachIncidentCreateSchema = z.object({
  title: z.string().trim().min(5, 'Incident title must be at least 5 characters').max(180),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  affectedDataCategories: z
    .array(z.string().trim().min(1))
    .min(1, 'Select at least one affected data category'),
  estimatedAffectedSubjects: z.coerce.number().int().min(0).default(0),
  summary: z.string().trim().min(10, 'Provide a clear incident summary').max(2000),
  containmentActions: z.string().trim().min(5, 'Describe immediate containment actions').max(2000),
  detectedAt: z.string().optional(),
});

export const breachIncidentUpdateSchema = z.object({
  incidentId: z.string().min(1),
  status: z.enum([
    'DETECTED',
    'CONTAINED',
    'ASSESSING',
    'NOTIFIED_AUTHORITY',
    'NOTIFIED_SUBJECTS',
    'RESOLVED',
  ]),
  containmentActions: z.string().trim().max(2000).optional(),
});

export const adminDeletionUpdateSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(['APPROVE_AND_ANONYMIZE', 'MARK_IN_REVIEW', 'REJECT']),
  resolutionNotes: z.string().trim().max(500).optional(),
});
