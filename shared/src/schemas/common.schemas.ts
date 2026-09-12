/**
 * CITYLINE CONSULTANCY — Common Reusable Zod Schemas
 * Foundational validation schemas for pagination and ID parameters.
 */

import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid identifier format; must be a valid UUIDv4' }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type UuidParam = z.infer<typeof uuidParamSchema>;
