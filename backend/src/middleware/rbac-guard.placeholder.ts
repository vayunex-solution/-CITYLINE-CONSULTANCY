/**
 * CITYLINE CONSULTANCY — Role-Based Access Control (RBAC) Guard Middleware (Architectural Placeholder)
 *
 * PHASE 1 ARCHITECTURAL CONTRACT:
 * - This placeholder defines the contract for role-level authorization checks.
 * - Full implementation (role resolution, permission evaluation) is strictly reserved for Phase 5 (RBAC & Portal).
 * - Supported roles defined in @cityline/shared: 'super_admin' | 'operations' | 'agent'
 */

import { Request, Response, NextFunction } from 'express';
import { AdminRole } from '@cityline/shared';
import { AppError } from '../utils/app-error';

export function requireRolePlaceholder(...allowedRoles: AdminRole[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    // Phase 1 Stub: In Phase 5, this evaluates whether req.user.role matches allowedRoles.
    next(
      AppError.forbidden(
        `RBAC authorization subsystem will be activated in Phase 5. Required roles: ${allowedRoles.join(', ')}`
      )
    );
  };
}
