"use strict";
/**
 * CITYLINE CONSULTANCY — Testimonials Zod Validation Schemas
 * Strict validation preventing mass assignment, rejecting unknown fields, and enforcing integrity.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testimonialQuerySchema = exports.reorderTestimonialsSchema = exports.updateTestimonialSchema = exports.createTestimonialSchema = void 0;
const zod_1 = require("zod");
exports.createTestimonialSchema = zod_1.z
    .object({
    clientName: zod_1.z
        .string({ required_error: 'Client name is required' })
        .trim()
        .min(2, 'Client name must be at least 2 characters')
        .max(150, 'Client name cannot exceed 150 characters'),
    clientDesignation: zod_1.z
        .string()
        .trim()
        .max(150, 'Designation cannot exceed 150 characters')
        .optional()
        .nullable(),
    companyName: zod_1.z
        .string()
        .trim()
        .max(150, 'Company name cannot exceed 150 characters')
        .optional()
        .nullable(),
    clientLocation: zod_1.z
        .string()
        .trim()
        .max(150, 'Location cannot exceed 150 characters')
        .optional()
        .nullable(),
    serviceCategory: zod_1.z
        .string()
        .trim()
        .max(100, 'Service category cannot exceed 100 characters')
        .optional()
        .nullable(),
    testimonialText: zod_1.z
        .string({ required_error: 'Testimonial text is required' })
        .trim()
        .min(10, 'Testimonial text must be at least 10 characters')
        .max(2000, 'Testimonial text cannot exceed 2000 characters'),
    rating: zod_1.z
        .number()
        .int('Rating must be an integer')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot exceed 5')
        .optional()
        .nullable(),
    displayOrder: zod_1.z
        .number()
        .int('Display order must be an integer')
        .min(0, 'Display order must be 0 or positive')
        .max(10000, 'Display order is out of bounds')
        .default(0),
    isPublished: zod_1.z.boolean().default(false),
    documentId: zod_1.z.string().uuid('Invalid document UUID').optional().nullable(),
})
    .strict();
exports.updateTestimonialSchema = zod_1.z
    .object({
    clientName: zod_1.z
        .string()
        .trim()
        .min(2, 'Client name must be at least 2 characters')
        .max(150, 'Client name cannot exceed 150 characters')
        .optional(),
    clientDesignation: zod_1.z
        .string()
        .trim()
        .max(150, 'Designation cannot exceed 150 characters')
        .optional()
        .nullable(),
    companyName: zod_1.z
        .string()
        .trim()
        .max(150, 'Company name cannot exceed 150 characters')
        .optional()
        .nullable(),
    clientLocation: zod_1.z
        .string()
        .trim()
        .max(150, 'Location cannot exceed 150 characters')
        .optional()
        .nullable(),
    serviceCategory: zod_1.z
        .string()
        .trim()
        .max(100, 'Service category cannot exceed 100 characters')
        .optional()
        .nullable(),
    testimonialText: zod_1.z
        .string()
        .trim()
        .min(10, 'Testimonial text must be at least 10 characters')
        .max(2000, 'Testimonial text cannot exceed 2000 characters')
        .optional(),
    rating: zod_1.z
        .number()
        .int('Rating must be an integer')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot exceed 5')
        .optional()
        .nullable(),
    displayOrder: zod_1.z
        .number()
        .int('Display order must be an integer')
        .min(0, 'Display order must be 0 or positive')
        .max(10000, 'Display order is out of bounds')
        .optional(),
    isPublished: zod_1.z.boolean().optional(),
    documentId: zod_1.z.string().uuid('Invalid document UUID').optional().nullable(),
})
    .strict();
exports.reorderTestimonialsSchema = zod_1.z
    .object({
    items: zod_1.z
        .array(zod_1.z.object({
        id: zod_1.z.coerce.number().int().positive('Invalid testimonial ID'),
        displayOrder: zod_1.z.coerce.number().int().min(0, 'Display order must be 0 or positive'),
    }).strict())
        .min(1, 'At least one item is required to reorder'),
})
    .strict();
exports.testimonialQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    status: zod_1.z.enum(['published', 'unpublished', 'all']).default('all'),
    search: zod_1.z.string().trim().optional(),
});
