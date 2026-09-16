"use strict";
/**
 * CITYLINE CONSULTANCY — Phase 11 Admin Dashboard & Management Schemas
 * Strict Zod validation for administrative dashboard, visa enquiries,
 * notification operations, and audit log queries.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuditLogQuerySchema = exports.adminNotificationQuerySchema = exports.adminVisaQuerySchema = exports.adminUpdateVisaStatusSchema = void 0;
const zod_1 = require("zod");
exports.adminUpdateVisaStatusSchema = zod_1.z
    .object({
    status: zod_1.z.enum(['new', 'in_progress', 'contacted', 'completed', 'archived', 'rejected'], {
        required_error: 'Status is required',
    }),
    adminNotes: zod_1.z.string().trim().max(1000).optional(),
})
    .strict();
exports.adminVisaQuerySchema = zod_1.z
    .object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    status: zod_1.z.enum(['all', 'new', 'in_progress', 'contacted', 'completed', 'archived', 'rejected']).default('all'),
    search: zod_1.z.string().trim().optional(),
})
    .strict();
exports.adminNotificationQuerySchema = zod_1.z
    .object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    status: zod_1.z.enum(['all', 'pending', 'processing', 'sent', 'failed', 'exhausted']).default('all'),
    search: zod_1.z.string().trim().optional(),
})
    .strict();
exports.adminAuditLogQuerySchema = zod_1.z
    .object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    action: zod_1.z.string().trim().optional(),
    resourceType: zod_1.z.string().trim().optional(),
    resource_type: zod_1.z.string().trim().optional(),
    search: zod_1.z.string().trim().optional(),
})
    .strict()
    .transform((data) => ({
    page: data.page,
    limit: data.limit,
    action: data.action,
    resourceType: data.resourceType || data.resource_type,
    search: data.search,
}));
