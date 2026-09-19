"use strict";
/**
 * CITYLINE CONSULTANCY — Master Data Validation Schemas
 * Defines strict Zod input schemas for managing reference tables.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateIndustrySchema = exports.createIndustrySchema = exports.updateVisaServiceSchema = exports.createVisaServiceSchema = exports.updateLocationSchema = exports.createLocationSchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
// ==========================================
// 1. Job Category Schemas
// ==========================================
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z
        .string({ required_error: 'Category name is required' })
        .trim()
        .min(2, 'Category name must be at least 2 characters')
        .max(100, 'Category name cannot exceed 100 characters'),
    slug: zod_1.z
        .string({ required_error: 'Slug is required' })
        .trim()
        .min(2, 'Slug must be at least 2 characters')
        .max(100, 'Slug cannot exceed 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase alphanumeric characters and hyphens'),
    description: zod_1.z
        .string()
        .trim()
        .max(255, 'Description cannot exceed 255 characters')
        .optional()
        .nullable(),
    displayOrder: zod_1.z.coerce.number().int().min(0).default(0),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100).optional(),
    slug: zod_1.z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
    description: zod_1.z.string().trim().max(255).optional().nullable(),
    displayOrder: zod_1.z.coerce.number().int().min(0).optional(),
    isActive: zod_1.z.boolean().optional(),
});
// ==========================================
// 2. Operational Location Schemas
// ==========================================
exports.createLocationSchema = zod_1.z.object({
    name: zod_1.z
        .string({ required_error: 'Location name is required (e.g. Dubai, UAE)' })
        .trim()
        .min(2, 'Location name must be at least 2 characters')
        .max(100, 'Location name cannot exceed 100 characters'),
    city: zod_1.z
        .string({ required_error: 'City name is required' })
        .trim()
        .min(2, 'City must be at least 2 characters')
        .max(100, 'City cannot exceed 100 characters'),
    country: zod_1.z
        .string()
        .trim()
        .min(2, 'Country must be at least 2 characters')
        .max(100, 'Country cannot exceed 100 characters')
        .default('UAE'),
    displayOrder: zod_1.z.coerce.number().int().min(0).default(0),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateLocationSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100).optional(),
    city: zod_1.z.string().trim().min(2).max(100).optional(),
    country: zod_1.z.string().trim().min(2).max(100).optional(),
    displayOrder: zod_1.z.coerce.number().int().min(0).optional(),
    isActive: zod_1.z.boolean().optional(),
});
// ==========================================
// 3. Visa Service Schemas
// ==========================================
exports.createVisaServiceSchema = zod_1.z.object({
    serviceCode: zod_1.z
        .string({ required_error: 'Service code is required (e.g. golden_visa_10yr)' })
        .trim()
        .min(2, 'Service code must be at least 2 characters')
        .max(50, 'Service code cannot exceed 50 characters')
        .regex(/^[a-z0-9_]+$/, 'Service code may only contain lowercase alphanumeric characters and underscores'),
    title: zod_1.z
        .string({ required_error: 'Service title is required' })
        .trim()
        .min(3, 'Title must be at least 3 characters')
        .max(150, 'Title cannot exceed 150 characters'),
    slug: zod_1.z
        .string({ required_error: 'Slug is required' })
        .trim()
        .min(2, 'Slug must be at least 2 characters')
        .max(150, 'Slug cannot exceed 150 characters')
        .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase alphanumeric characters and hyphens'),
    description: zod_1.z
        .string()
        .trim()
        .max(2000, 'Description cannot exceed 2000 characters')
        .optional()
        .nullable(),
    displayOrder: zod_1.z.coerce.number().int().min(0).default(0),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateVisaServiceSchema = zod_1.z.object({
    serviceCode: zod_1.z.string().trim().min(2).max(50).regex(/^[a-z0-9_]+$/).optional(),
    title: zod_1.z.string().trim().min(3).max(150).optional(),
    slug: zod_1.z.string().trim().min(2).max(150).regex(/^[a-z0-9-]+$/).optional(),
    description: zod_1.z.string().trim().max(2000).optional().nullable(),
    displayOrder: zod_1.z.coerce.number().int().min(0).optional(),
    isActive: zod_1.z.boolean().optional(),
});
// ==========================================
// 4. Industry Sector Schemas
// ==========================================
exports.createIndustrySchema = zod_1.z.object({
    name: zod_1.z
        .string({ required_error: 'Industry sector name is required' })
        .trim()
        .min(2, 'Industry name must be at least 2 characters')
        .max(100, 'Industry name cannot exceed 100 characters'),
    slug: zod_1.z
        .string({ required_error: 'Slug is required' })
        .trim()
        .min(2, 'Slug must be at least 2 characters')
        .max(100, 'Slug cannot exceed 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase alphanumeric characters and hyphens'),
    description: zod_1.z
        .string()
        .trim()
        .max(255, 'Description cannot exceed 255 characters')
        .optional()
        .nullable(),
    displayOrder: zod_1.z.coerce.number().int().min(0).default(0),
    isActive: zod_1.z.boolean().default(true),
});
exports.updateIndustrySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100).optional(),
    slug: zod_1.z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
    description: zod_1.z.string().trim().max(255).optional().nullable(),
    displayOrder: zod_1.z.coerce.number().int().min(0).optional(),
    isActive: zod_1.z.boolean().optional(),
});
