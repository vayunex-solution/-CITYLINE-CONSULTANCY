/**
 * CITYLINE CONSULTANCY — Master Data Validation Schemas
 * Defines strict Zod input schemas for managing reference tables.
 */

import { z } from 'zod';

// ==========================================
// 1. Job Category Schemas
// ==========================================
export const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'Category name is required' })
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name cannot exceed 100 characters'),
  slug: z
    .string({ required_error: 'Slug is required' })
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug cannot exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase alphanumeric characters and hyphens'),
  description: z
    .string()
    .trim()
    .max(255, 'Description cannot exceed 255 characters')
    .optional()
    .nullable(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().trim().max(255).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ==========================================
// 2. Operational Location Schemas
// ==========================================
export const createLocationSchema = z.object({
  name: z
    .string({ required_error: 'Location name is required (e.g. Dubai, UAE)' })
    .trim()
    .min(2, 'Location name must be at least 2 characters')
    .max(100, 'Location name cannot exceed 100 characters'),
  city: z
    .string({ required_error: 'City name is required' })
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City cannot exceed 100 characters'),
  country: z
    .string()
    .trim()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country cannot exceed 100 characters')
    .default('UAE'),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export const updateLocationSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  city: z.string().trim().min(2).max(100).optional(),
  country: z.string().trim().min(2).max(100).optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

// ==========================================
// 3. Visa Service Schemas
// ==========================================
export const createVisaServiceSchema = z.object({
  serviceCode: z
    .string({ required_error: 'Service code is required (e.g. golden_visa_10yr)' })
    .trim()
    .min(2, 'Service code must be at least 2 characters')
    .max(50, 'Service code cannot exceed 50 characters')
    .regex(/^[a-z0-9_]+$/, 'Service code may only contain lowercase alphanumeric characters and underscores'),
  title: z
    .string({ required_error: 'Service title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(150, 'Title cannot exceed 150 characters'),
  slug: z
    .string({ required_error: 'Slug is required' })
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(150, 'Slug cannot exceed 150 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase alphanumeric characters and hyphens'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional()
    .nullable(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CreateVisaServiceInput = z.infer<typeof createVisaServiceSchema>;

export const updateVisaServiceSchema = z.object({
  serviceCode: z.string().trim().min(2).max(50).regex(/^[a-z0-9_]+$/).optional(),
  title: z.string().trim().min(3).max(150).optional(),
  slug: z.string().trim().min(2).max(150).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateVisaServiceInput = z.infer<typeof updateVisaServiceSchema>;

// ==========================================
// 4. Industry Sector Schemas
// ==========================================
export const createIndustrySchema = z.object({
  name: z
    .string({ required_error: 'Industry sector name is required' })
    .trim()
    .min(2, 'Industry name must be at least 2 characters')
    .max(100, 'Industry name cannot exceed 100 characters'),
  slug: z
    .string({ required_error: 'Slug is required' })
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug cannot exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase alphanumeric characters and hyphens'),
  description: z
    .string()
    .trim()
    .max(255, 'Description cannot exceed 255 characters')
    .optional()
    .nullable(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CreateIndustryInput = z.infer<typeof createIndustrySchema>;

export const updateIndustrySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().trim().max(255).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateIndustryInput = z.infer<typeof updateIndustrySchema>;
