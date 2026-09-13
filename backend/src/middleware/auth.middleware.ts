/**
 * CITYLINE CONSULTANCY — Administrative Authentication & RBAC Guards
 * Enforces session validity, user active status, and role-based permissions.
 *
 * GOVERNANCE:
 * - Replaces placeholder RBAC guards with production authentication enforcement.
 * - Queries the database on every authenticated request to verify account is_active state.
 * - Emits audit logs on authorization denial.
 * - Provides IDOR guard helpers for downstream resource access.
 */

import { Request, Response, NextFunction } from 'express';
import { AdminRole } from '@cityline/shared';
import { env } from '../config/env.config';
import { verifyAdminToken } from '../auth/token';
import { tokenRevocationStore } from '../auth/token-revocation';
import { adminUserRepository } from '../repositories/admin-user.repository';
import { recordAuditEvent } from '../auth/audit';
import { AppError } from '../utils/app-error';
import { AuthenticatedAdminContext } from '../auth/types';

/**
 * Middleware ensuring incoming request has a valid, unexpired, and active administrative token.
 */
export async function requireAuthenticatedAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
  // 1. Extract token from cookie or Authorization header
  let token: string | undefined = req.cookies?.[env.AUTH_COOKIE_NAME];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7).trim();
  }

  if (!token) {
    return next(new AppError('Authentication required.', 401, 'AUTHENTICATION_REQUIRED'));
  }

  // 2. Verify signature, expiration, and revocation status
  const claims = verifyAdminToken(token);
  if (!claims) {
    return next(new AppError('Invalid or expired authentication token.', 401, 'AUTHENTICATION_FAILED'));
  }

  try {
    // 3. Check persistent token revocation in database
    const isRevoked = await tokenRevocationStore.isRevoked(claims.jti);
    if (isRevoked) {
      return next(new AppError('Authentication token has been revoked.', 401, 'AUTHENTICATION_FAILED'));
    }

    // 4. Query database to verify user existence and active status
    const user = await adminUserRepository.findByIdWithRole(claims.sub);

    if (!user) {
      return next(new AppError('Administrative account not found.', 401, 'AUTHENTICATION_FAILED'));
    }

    if (!user.is_active) {
      // Audit disabled account attempt
      void recordAuditEvent({
        actorAdminId: user.id,
        action: 'account_disabled_login_attempt',
        resourceType: 'admin_user',
        resourceId: user.id,
        requestId: req.requestId,
        clientIp: req.ip,
        details: { username: user.username, reason: 'Inactive account access attempt' },
      });

      return next(new AppError('Administrative account is deactivated.', 401, 'AUTHENTICATION_FAILED'));
    }

    // 5. Attach verified context to request
    req.admin = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role_key,
      roleId: user.role_id,
      tokenJti: claims.jti,
      tokenExp: claims.exp,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Higher-order middleware restricting route access to specified administrative roles.
 */
export function requireRole(...allowedRoles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin) {
      return next(new AppError('Authentication required.', 401, 'AUTHENTICATION_REQUIRED'));
    }

    if (!allowedRoles.includes(req.admin.role)) {
      void recordAuditEvent({
        actorAdminId: req.admin.id,
        action: 'authorization_denied',
        resourceType: 'route_rbac',
        resourceId: req.path,
        requestId: req.requestId,
        clientIp: req.ip,
        details: {
          requiredRoles: allowedRoles,
          userRole: req.admin.role,
          path: req.originalUrl,
        },
      });

      return next(
        new AppError(
          'Access denied: Insufficient administrative privileges.',
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}

/**
 * Reusable IDOR protection helper for downstream controllers.
 * - Super admin has global read/write access.
 * - Admin operator can only access resources assigned to them or unassigned triage leads.
 */
export function assertAdminResourceAccess(
  admin: AuthenticatedAdminContext,
  resourceAssignedAdminId?: string | null
): boolean {
  if (admin.role === 'super_admin') {
    return true;
  }

  // Operator can access unassigned resources or resources assigned specifically to them
  if (!resourceAssignedAdminId || resourceAssignedAdminId === admin.id) {
    return true;
  }

  return false;
}
