"use strict";
/**
 * CITYLINE CONSULTANCY — Authentication Guard Middleware (Architectural Placeholder)
 *
 * PHASE 1 ARCHITECTURAL CONTRACT:
 * - This placeholder defines the contract for route-level authentication checks.
 * - Full implementation (JWT / secure session verification) is strictly reserved for Phase 4 (Admin Auth).
 * - Must NOT be attached to active public routes in Phase 1.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuthPlaceholder = requireAuthPlaceholder;
const app_error_1 = require("../utils/app-error");
function requireAuthPlaceholder(_req, _res, next) {
    // Phase 1 Stub: In Phase 4, this middleware will extract Bearer token / session cookie,
    // verify cryptographic signature, validate expiration, and attach authenticated user to req.user.
    // For Phase 1 architecture verification only:
    next(app_error_1.AppError.unauthorized('Authentication subsystem will be activated in Phase 4 (Admin Auth).'));
}
