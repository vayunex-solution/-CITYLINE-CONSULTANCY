/**
 * CITYLINE CONSULTANCY — Common Reusable Zod Schemas
 * Foundational validation schemas for pagination and ID parameters.
 */
import { z } from 'zod';
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const uuidParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type UuidParam = z.infer<typeof uuidParamSchema>;
//# sourceMappingURL=common.schemas.d.ts.map