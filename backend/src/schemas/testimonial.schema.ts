/**
 * CITYLINE CONSULTANCY — Testimonials Zod Validation Schemas
 * Strict validation preventing mass assignment, rejecting unknown fields, and enforcing integrity.
 */

import { z } from 'zod';

export const createTestimonialSchema = z
  .object({
    clientName: z
      .string({ required_error: 'Client name is required' })
      .trim()
      .min(2, 'Client name must be at least 2 characters')
      .max(150, 'Client name cannot exceed 150 characters'),
    clientDesignation: z
      .string()
      .trim()
      .max(150, 'Designation cannot exceed 150 characters')
      .optional()
      .nullable(),
    companyName: z
      .string()
      .trim()
      .max(150, 'Company name cannot exceed 150 characters')
      .optional()
      .nullable(),
    clientLocation: z
      .string()
      .trim()
      .max(150, 'Location cannot exceed 150 characters')
      .optional()
      .nullable(),
    serviceCategory: z
      .string()
      .trim()
      .max(100, 'Service category cannot exceed 100 characters')
      .optional()
      .nullable(),
    testimonialText: z
      .string({ required_error: 'Testimonial text is required' })
      .trim()
      .min(10, 'Testimonial text must be at least 10 characters')
      .max(2000, 'Testimonial text cannot exceed 2000 characters'),
    rating: z
      .number()
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5')
      .optional()
      .nullable(),
    displayOrder: z
      .number()
      .int('Display order must be an integer')
      .min(0, 'Display order must be 0 or positive')
      .max(10000, 'Display order is out of bounds')
      .default(0),
    isPublished: z.boolean().default(false),
    documentId: z.string().uuid('Invalid document UUID').optional().nullable(),
  })
  .strict();

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;

export const updateTestimonialSchema = z
  .object({
    clientName: z
      .string()
      .trim()
      .min(2, 'Client name must be at least 2 characters')
      .max(150, 'Client name cannot exceed 150 characters')
      .optional(),
    clientDesignation: z
      .string()
      .trim()
      .max(150, 'Designation cannot exceed 150 characters')
      .optional()
      .nullable(),
    companyName: z
      .string()
      .trim()
      .max(150, 'Company name cannot exceed 150 characters')
      .optional()
      .nullable(),
    clientLocation: z
      .string()
      .trim()
      .max(150, 'Location cannot exceed 150 characters')
      .optional()
      .nullable(),
    serviceCategory: z
      .string()
      .trim()
      .max(100, 'Service category cannot exceed 100 characters')
      .optional()
      .nullable(),
    testimonialText: z
      .string()
      .trim()
      .min(10, 'Testimonial text must be at least 10 characters')
      .max(2000, 'Testimonial text cannot exceed 2000 characters')
      .optional(),
    rating: z
      .number()
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5')
      .optional()
      .nullable(),
    displayOrder: z
      .number()
      .int('Display order must be an integer')
      .min(0, 'Display order must be 0 or positive')
      .max(10000, 'Display order is out of bounds')
      .optional(),
    isPublished: z.boolean().optional(),
    documentId: z.string().uuid('Invalid document UUID').optional().nullable(),
  })
  .strict();

export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;

export const reorderTestimonialsSchema = z
  .object({
    items: z
      .array(
        z.object({
          id: z.coerce.number().int().positive('Invalid testimonial ID'),
          displayOrder: z.coerce.number().int().min(0, 'Display order must be 0 or positive'),
        }).strict()
      )
      .min(1, 'At least one item is required to reorder'),
  })
  .strict();

export type ReorderTestimonialsInput = z.infer<typeof reorderTestimonialsSchema>;

export const testimonialQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['published', 'unpublished', 'all']).default('all'),
  search: z.string().trim().optional(),
});

export type TestimonialQueryParams = z.infer<typeof testimonialQuerySchema>;
