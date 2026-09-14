/**
 * CITYLINE CONSULTANCY — Phase 9 Manpower Enquiry Validation Schemas
 * Defines strict Zod input schemas for public employer manpower submissions,
 * status transitions, administrative updates, and canonical request fingerprinting.
 *
 * GOVERNANCE:
 * - Rejects sensitive business identifiers (trade license, TRN).
 * - Enforces the 8 locked canonical job categories.
 * - Restricts positions array (1 to 10) and headcount per position (1 to 500).
 * - Excludes transport headers and idempotencyKey from business fingerprint hash.
 */

import { z } from 'zod';
import crypto from 'crypto';

export const LOCKED_JOB_CATEGORIES = [
  'hotel-staff',
  'cleaning',
  'mason',
  'steel-fixer',
  'carpenter',
  'bike-rider-delivery',
  'taxi-driver',
  'truck-driver',
] as const;

export type LockedJobCategorySlug = (typeof LOCKED_JOB_CATEGORIES)[number];

export const MANPOWER_STATUSES = [
  'new',
  'reviewing',
  'contacted',
  'qualified',
  'processing',
  'fulfilled',
  'rejected',
  'closed',
] as const;

export type ManpowerStatus = (typeof MANPOWER_STATUSES)[number];

export const ALLOWED_MANPOWER_STATUS_TRANSITIONS: Record<ManpowerStatus, ManpowerStatus[]> = {
  new: ['reviewing', 'rejected', 'closed'],
  reviewing: ['contacted', 'rejected', 'closed'],
  contacted: ['qualified', 'rejected', 'closed'],
  qualified: ['processing', 'rejected', 'closed'],
  processing: ['fulfilled', 'closed'],
  fulfilled: ['closed'],
  rejected: ['closed'],
  closed: [], // Terminal state
};

// --- Position Input Schema ---
export const manpowerPositionInputSchema = z
  .object({
    categorySlug: z.enum(LOCKED_JOB_CATEGORIES, {
      errorMap: () => ({
        message:
          'Invalid job category. Must match one of the 8 canonical categories (e.g. hotel-staff, cleaning, mason, etc.).',
      }),
    }),
    roleTitle: z
      .string({ required_error: 'Role title is required' })
      .trim()
      .min(2, 'Role title must be at least 2 characters')
      .max(150, 'Role title cannot exceed 150 characters'),
    headcount: z
      .number({ required_error: 'Headcount quantity is required' })
      .int('Headcount must be a whole number')
      .min(1, 'Minimum headcount is 1')
      .max(500, 'Maximum headcount per role is 500'),
    experienceYearsRequired: z
      .number()
      .int('Experience years must be an integer')
      .min(0, 'Experience years cannot be negative')
      .max(30, 'Experience years cannot exceed 30')
      .optional()
      .nullable(),
    qualification: z.string().trim().max(255).optional().nullable(),
    genderRequirement: z.enum(['any', 'male', 'female']).optional().nullable(),
    languageRequirements: z.string().trim().max(255).optional().nullable(),
    salaryOffered: z.string().trim().max(100).optional().nullable(),
    accommodationProvided: z.enum(['provided', 'allowance', 'not_provided']).optional().nullable(),
    transportProvided: z.enum(['provided', 'allowance', 'not_provided']).optional().nullable(),
    foodProvided: z.enum(['provided', 'allowance', 'not_provided']).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .strict();

export type ManpowerPositionInput = z.infer<typeof manpowerPositionInputSchema>;

// --- Public Employer Manpower Enquiry Schema ---
export const manpowerEnquiryInputSchema = z
  .object({
    companyName: z
      .string({ required_error: 'Company name is required' })
      .trim()
      .min(2, 'Company name must be at least 2 characters')
      .max(255, 'Company name cannot exceed 255 characters'),
    contactPerson: z
      .string({ required_error: 'Contact person name is required' })
      .trim()
      .min(2, 'Contact person name must be at least 2 characters')
      .max(150, 'Contact person name cannot exceed 150 characters'),
    contactDesignation: z.string().trim().max(150).optional().nullable(),
    email: z
      .string({ required_error: 'Corporate email is required' })
      .trim()
      .email('A valid corporate email address is required')
      .max(255, 'Email cannot exceed 255 characters')
      .toLowerCase(),
    phone: z
      .string({ required_error: 'Contact phone number is required' })
      .trim()
      .min(7, 'Phone number must be at least 7 characters')
      .max(30, 'Phone number cannot exceed 30 characters'),
    whatsapp: z.string().trim().max(30).optional().nullable(),
    city: z
      .string({ required_error: 'UAE city/emirate is required' })
      .trim()
      .min(2, 'City must be at least 2 characters')
      .max(100, 'City cannot exceed 100 characters'),
    website: z.string().trim().max(255).optional().nullable(),
    industry: z.string().trim().max(100).optional().nullable(),
    preferredTimeline: z
      .enum(['immediate', '30-days', '60-days', 'ongoing'])
      .optional()
      .nullable(),
    deploymentLocation: z.string().trim().max(150).optional().nullable(),
    specialRequirements: z.string().trim().max(2000).optional().nullable(),
    positions: z
      .array(manpowerPositionInputSchema)
      .min(1, 'At least one manpower role position is required')
      .max(10, 'Cannot exceed 10 positions per enquiry submission'),
    idempotencyKey: z.string().trim().max(100).optional().nullable(),
  })
  .strict(); // Rejects trade_license_number, trn, country, or any arbitrary fields

export type ManpowerEnquiryInput = z.infer<typeof manpowerEnquiryInputSchema>;

// --- Admin Update Status Schema ---
export const adminUpdateManpowerStatusSchema = z
  .object({
    status: z.enum(MANPOWER_STATUSES, {
      required_error: 'Valid status is required',
    }),
    notes: z.string().trim().max(2000).optional().nullable(),
  })
  .strict();

export type AdminUpdateManpowerStatusInput = z.infer<typeof adminUpdateManpowerStatusSchema>;

// --- Admin Generic Update Schema (Tightly Restricted) ---
export const adminUpdateManpowerEnquirySchema = z
  .object({
    adminNotes: z.string().trim().max(2000).optional().nullable(),
    deploymentLocation: z.string().trim().max(150).optional().nullable(),
    preferredTimeline: z
      .enum(['immediate', '30-days', '60-days', 'ongoing'])
      .optional()
      .nullable(),
    specialRequirements: z.string().trim().max(2000).optional().nullable(),
  })
  .strict(); // Rejects status, company_name, email, phone, reference_number, etc.

export type AdminUpdateManpowerEnquiryInput = z.infer<typeof adminUpdateManpowerEnquirySchema>;

// --- Query Parameters Schema ---
export const manpowerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(MANPOWER_STATUSES).optional(),
  search: z.string().trim().optional(),
  city: z.string().trim().optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
});

export type ManpowerQueryParams = z.infer<typeof manpowerQuerySchema>;

// --- Canonical Request Fingerprint Generator ---

/**
 * Normalizes a single position into a canonical representation with alphabetical key ordering.
 */
export function serializeCanonicalPosition(pos: ManpowerPositionInput): string {
  const canonicalObj = {
    accommodationProvided: pos.accommodationProvided || null,
    categorySlug: pos.categorySlug.toLowerCase().trim(),
    experienceYearsRequired: pos.experienceYearsRequired ?? null,
    foodProvided: pos.foodProvided || null,
    genderRequirement: pos.genderRequirement || null,
    headcount: pos.headcount,
    languageRequirements: pos.languageRequirements?.trim() || null,
    notes: pos.notes?.trim() || null,
    qualification: pos.qualification?.trim() || null,
    roleTitle: pos.roleTitle.trim(),
    salaryOffered: pos.salaryOffered?.trim() || null,
    transportProvided: pos.transportProvided || null,
  };

  // Deterministically sort keys
  return JSON.stringify(canonicalObj, Object.keys(canonicalObj).sort());
}

function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, any> = {};
  for (const key of sortedKeys) {
    result[key] = sortObjectKeys(obj[key]);
  }
  return result;
}

/**
 * Computes a deterministic SHA-256 canonical request hash for a manpower enquiry submission.
 * - Normalizes all business fields.
 * - Sorts serialized positions lexicographically (eliminating array order dependency).
 * - Excludes idempotencyKey and transport metadata.
 */
export function computeCanonicalRequestHash(input: ManpowerEnquiryInput): string {
  // 1. Serialize and lexicographically sort positions
  const sortedSerializedPositions = input.positions
    .map(serializeCanonicalPosition)
    .sort();

  // 2. Assemble canonical request object with normalized values
  const canonicalRequest = {
    city: input.city.trim(),
    companyName: input.companyName.trim().toLowerCase(),
    contactDesignation: input.contactDesignation?.trim() || null,
    contactPerson: input.contactPerson.trim(),
    country: 'United Arab Emirates',
    deploymentLocation: input.deploymentLocation?.trim() || null,
    email: input.email.trim().toLowerCase(),
    industry: input.industry?.trim() || null,
    phone: input.phone.trim(),
    positions: sortedSerializedPositions.map((s) => JSON.parse(s)),
    preferredTimeline: input.preferredTimeline?.trim() || null,
    specialRequirements: input.specialRequirements?.trim() || null,
    website: input.website?.trim() || null,
    whatsapp: input.whatsapp?.trim() || null,
  };

  // 3. Serialize deterministic JSON with keys sorted recursively
  const serialized = JSON.stringify(sortObjectKeys(canonicalRequest));

  // 4. Compute SHA-256 digest
  return crypto.createHash('sha256').update(serialized).digest('hex');
}
