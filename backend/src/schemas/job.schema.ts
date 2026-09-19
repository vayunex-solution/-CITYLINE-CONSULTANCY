/**
 * CITYLINE CONSULTANCY — Job & Application Validation Schemas
 * Standardized Zod schemas for public job querying, candidate applications, and administrative management.
 */

import { z } from 'zod';

/**
 * Public Job Search & Filter Query Schema
 */
export const jobQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, 'Search query cannot exceed 100 characters')
    .optional(),
  category: z
    .string()
    .trim()
    .max(100, 'Category filter cannot exceed 100 characters')
    .optional(),
  location: z
    .string()
    .trim()
    .max(100, 'Location filter cannot exceed 100 characters')
    .optional(),
  employmentType: z
    .string()
    .trim()
    .max(50, 'Employment type cannot exceed 50 characters')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type JobQueryInput = z.infer<typeof jobQuerySchema>;

/**
 * Public Job Candidate Application Input Schema
 */
export const jobApplicationInputSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(150, 'Full name cannot exceed 150 characters'),
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  phone: z
    .string({ required_error: 'Contact phone number is required' })
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(50, 'Phone number cannot exceed 50 characters')
    .regex(/^[+0-9\s\-()]+$/, 'Phone number contains invalid characters'),
  whatsapp: z
    .string()
    .trim()
    .max(50, 'WhatsApp number cannot exceed 50 characters')
    .regex(/^[+0-9\s\-()]*$/, 'WhatsApp number contains invalid characters')
    .optional()
    .nullable(),
  nationality: z
    .string()
    .trim()
    .min(2, 'Nationality must be at least 2 characters')
    .max(100, 'Nationality cannot exceed 100 characters')
    .default('Indian'),
  currentLocation: z
    .string({ required_error: 'Current location is required' })
    .trim()
    .min(2, 'Current location must be at least 2 characters')
    .max(100, 'Current location cannot exceed 100 characters'),
  yearsExperience: z.coerce
    .number({ invalid_type_error: 'Years of experience must be a number' })
    .int('Years of experience must be an integer')
    .min(0, 'Years of experience cannot be negative')
    .max(50, 'Years of experience cannot exceed 50')
    .default(0),
  qualification: z
    .string()
    .trim()
    .max(255, 'Qualification cannot exceed 255 characters')
    .optional()
    .nullable(),
  coverLetter: z
    .string()
    .trim()
    .max(2000, 'Cover letter or notes cannot exceed 2000 characters')
    .optional()
    .nullable(),
  consent: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true' || val === '1')
    .refine((val) => val === true, {
      message: 'You must consent to candidate profile processing',
    }),
  idempotencyKey: z
    .string()
    .trim()
    .max(100, 'Idempotency key cannot exceed 100 characters')
    .optional()
    .nullable(),
});

export type JobApplicationInput = z.infer<typeof jobApplicationInputSchema>;

/**
 * Admin Job Creation Schema
 */
export const adminCreateJobSchema = z.object({
  categoryId: z.coerce.number().int().positive('Valid category ID is required').default(1),
  title: z
    .string({ required_error: 'Job title is required' })
    .trim()
    .min(3, 'Job title must be at least 3 characters')
    .max(255, 'Job title cannot exceed 255 characters'),
  slug: z
    .string({ required_error: 'Slug is required' })
    .trim()
    .min(3, 'Slug must be at least 3 characters')
    .max(255, 'Slug cannot exceed 255 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase alphanumeric characters and hyphens'),
  location: z
    .string()
    .trim()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location cannot exceed 100 characters')
    .default('Dubai, UAE'),
  employmentType: z
    .string()
    .trim()
    .max(50, 'Employment type cannot exceed 50 characters')
    .default('Full-time'),
  description: z
    .string({ required_error: 'Job description is required' })
    .trim()
    .min(3, 'Description must be at least 3 characters')
    .transform((val) => (val.length < 10 ? `${val} — operational role details.` : val)),
  requirements: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) =>
      !val || val.trim().length === 0
        ? 'Relevant experience and legal UAE documentation.'
        : val.trim().length < 10
        ? `${val.trim()} — legal UAE documentation.`
        : val.trim()
    ),
  shortDescription: z
    .string()
    .trim()
    .max(500, 'Short description cannot exceed 500 characters')
    .optional()
    .nullable(),
  responsibilities: z
    .string()
    .trim()
    .optional()
    .nullable(),
  qualification: z
    .string()
    .trim()
    .max(255, 'Qualification cannot exceed 255 characters')
    .optional()
    .nullable(),
  experienceYearsRequired: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .nullable(),
  salaryRange: z
    .string()
    .trim()
    .max(100, 'Salary range cannot exceed 100 characters')
    .optional()
    .nullable(),
  benefits: z
    .string()
    .trim()
    .optional()
    .nullable(),
  visaSponsorship: z
    .string()
    .trim()
    .max(150, 'Visa sponsorship cannot exceed 150 characters')
    .optional()
    .nullable(),
  workShift: z
    .string()
    .trim()
    .max(150, 'Work shift cannot exceed 150 characters')
    .optional()
    .nullable(),
  status: z
    .enum(['draft', 'active', 'published', 'paused', 'closed', 'archived'])
    .default('draft'),
  isFeatured: z.boolean().default(false),
});

export type AdminCreateJobInput = z.infer<typeof adminCreateJobSchema>;

/**
 * Admin Job Update Schema
 */
export const adminUpdateJobSchema = adminCreateJobSchema.partial();
export type AdminUpdateJobInput = z.infer<typeof adminUpdateJobSchema>;

/**
 * Admin Application Status Update Schema
 */
export const adminUpdateApplicationStatusSchema = z.object({
  status: z.enum(['new', 'reviewed', 'shortlisted', 'rejected', 'hired', 'closed']),
  adminNotes: z
    .string()
    .trim()
    .max(2000, 'Admin notes cannot exceed 2000 characters')
    .optional()
    .nullable(),
});

export type AdminUpdateApplicationStatusInput = z.infer<typeof adminUpdateApplicationStatusSchema>;
