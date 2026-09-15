/**
 * CITYLINE CONSULTANCY — Phase 11 Admin Dashboard & Management Schemas
 * Strict Zod validation for administrative dashboard, visa enquiries,
 * notification operations, and audit log queries.
 */

import { z } from 'zod';

export const adminUpdateVisaStatusSchema = z
  .object({
    status: z.enum(['new', 'in_progress', 'contacted', 'completed', 'archived', 'rejected'], {
      required_error: 'Status is required',
    }),
    adminNotes: z.string().trim().max(1000).optional(),
  })
  .strict();

export type AdminUpdateVisaStatusInput = z.infer<typeof adminUpdateVisaStatusSchema>;

export const adminVisaQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['all', 'new', 'in_progress', 'contacted', 'completed', 'archived', 'rejected']).default('all'),
    search: z.string().trim().optional(),
  })
  .strict();

export type AdminVisaQueryParams = z.infer<typeof adminVisaQuerySchema>;

export const adminNotificationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['all', 'pending', 'processing', 'sent', 'failed', 'exhausted']).default('all'),
    search: z.string().trim().optional(),
  })
  .strict();

export type AdminNotificationQueryParams = z.infer<typeof adminNotificationQuerySchema>;

export const adminAuditLogQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    action: z.string().trim().optional(),
    resourceType: z.string().trim().optional(),
    resource_type: z.string().trim().optional(),
    search: z.string().trim().optional(),
  })
  .strict()
  .transform((data) => ({
    page: data.page,
    limit: data.limit,
    action: data.action,
    resourceType: data.resourceType || data.resource_type,
    search: data.search,
  }));

export type AdminAuditLogQueryParams = z.infer<typeof adminAuditLogQuerySchema>;
