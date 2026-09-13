/**
 * CITYLINE CONSULTANCY — Visa Enquiry Request Validation Schema
 * Authoritative server-side schema enforcing strict data types, lengths, and formats.
 */

import { z } from 'zod';

export const visaEnquirySchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(150, 'Full name must not exceed 150 characters'),

  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .email('Please provide a valid email address')
    .max(255, 'Email address must not exceed 255 characters')
    .toLowerCase(),

  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(50, 'Phone number must not exceed 50 characters')
    .regex(/^[+0-9\s\-()]+$/, 'Phone number contains invalid characters'),

  whatsapp: z
    .string()
    .trim()
    .max(50, 'WhatsApp number must not exceed 50 characters')
    .regex(/^[+0-9\s\-()]+$/, 'WhatsApp number contains invalid characters')
    .optional()
    .or(z.literal('')),

  visaType: z
    .string({ required_error: 'Please select a valid visa service' })
    .trim()
    .min(2, 'Visa service identifier is required')
    .max(100, 'Visa service identifier is too long'),

  nationality: z
    .string({ required_error: 'Please specify your nationality' })
    .trim()
    .min(2, 'Nationality must be at least 2 characters')
    .max(100, 'Nationality must not exceed 100 characters'),

  timeline: z
    .string()
    .trim()
    .max(100, 'Timeline must not exceed 100 characters')
    .optional()
    .or(z.literal('')),

  applicantCount: z.coerce
    .number()
    .int()
    .min(1, 'Applicant count must be at least 1')
    .max(20, 'Applicant count cannot exceed 20 per enquiry')
    .default(1),

  details: z
    .string()
    .trim()
    .max(2000, 'Additional details must not exceed 2000 characters')
    .optional()
    .or(z.literal('')),

  consent: z.preprocess(
    (val) => val === true || val === 'true' || val === '1' || val === 1,
    z.literal(true, {
      errorMap: () => ({ message: 'You must provide consent to submit an enquiry' }),
    })
  ),
});

export type VisaEnquiryInput = z.infer<typeof visaEnquirySchema>;
