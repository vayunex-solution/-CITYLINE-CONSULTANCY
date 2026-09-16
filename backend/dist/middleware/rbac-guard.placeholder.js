"use strict";
/**
 * CITYLINE CONSULTANCY — Role-Based Access Control (RBAC) Guard Middleware (Architectural Placeholder)
 *
 * PHASE 1 ARCHITECTURAL CONTRACT:
 * - This placeholder defines the contract for role-level authorization checks.
 * - Full implementation (role resolution, permission evaluation) is strictly reserved for Phase 4 (Admin Auth & Security) / Phase 11 (Admin Dashboard & Management).
 * - Supported roles defined in @cityline/shared: 'super_admin' | 'operations' | 'agent'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRolePlaceholder = requireRolePlaceholder;
const app_error_1 = require("../utils/app-error");
function requireRolePlaceholder(...allowedRoles) {
    return (_req, _res, next) => {
        // Architectural Stub: In Phase 4 / Phase 11, this evaluates whether req.user.role matches allowedRoles.
        next(app_error_1.AppError.forbidden(`RBAC authorization subsystem will be activated in Phase 4 / Phase 11. Required roles: ${allowedRoles.join(', ')}`));
    };
}
