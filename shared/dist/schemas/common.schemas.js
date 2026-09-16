"use strict";
/**
 * CITYLINE CONSULTANCY — Common Reusable Zod Schemas
 * Foundational validation schemas for pagination and ID parameters.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidParamSchema = exports.paginationQuerySchema = void 0;
const zod_1 = require("zod");
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
exports.uuidParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid({ message: 'Invalid identifier format; must be a valid UUIDv4' }),
});
//# sourceMappingURL=common.schemas.js.map