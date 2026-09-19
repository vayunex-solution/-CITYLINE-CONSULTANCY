/**
 * CITYLINE CONSULTANCY — Administrative Authentication Controller
 * Handles login with timing-safe verification, secure logout with token revocation,
 * and authenticated identity inspection (/me).
 *
 * GOVERNANCE:
 * - Constant-time timing mitigation for non-existent users.
 * - Uniform error responses prevent account enumeration.
 * - Strict credential redaction in all responses and audit records.
 * - Transport via HttpOnly, Secure, SameSite=Lax cookies.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { env } from '../config/env.config';
import { adminUserRepository } from '../repositories/admin-user.repository';
import { verifyPassword, verifyDummyPassword, validatePasswordPolicy } from '../auth/password';
import {
  createAdminToken,
  generateCsrfToken,
  getAuthCookieOptions,
  getCsrfCookieOptions,
} from '../auth/token';
import { tokenRevocationStore } from '../auth/token-revocation';
import { authRateLimiterStore } from '../middleware/auth-rate-limit.middleware';
import { recordAuditEvent } from '../auth/audit';
import { AppError } from '../utils/app-error';

const loginSchema = z.object({
  identity: z.string().min(3, 'Identity must be at least 3 characters.').max(255),
  password: z.string().min(1, 'Password is required.'),
});

export class AuthController {
  /**
   * POST /api/v1/admin/auth/login
   */
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(
        new AppError(
          'Invalid credentials provided.',
          400,
          'VALIDATION_ERROR',
          parseResult.error.issues
        )
      );
    }

    const { identity, password } = parseResult.data;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const normalizedIdentity = identity.trim().toLowerCase();

    // Enforce password policy constraints on login input to reject malformed/oversized payloads
    const policy = validatePasswordPolicy(password);
    if (!policy.valid) {
      authRateLimiterStore.recordFailure(clientIp, normalizedIdentity);
      void recordAuditEvent({
        action: 'login_failed',
        requestId: req.requestId,
        clientIp,
        details: { identity: normalizedIdentity, reason: 'policy_rejection' },
      });
      return next(new AppError('Invalid credentials.', 401, 'AUTHENTICATION_FAILED'));
    }

    try {
      // 1. Retrieve admin user by username or email
      const user = await adminUserRepository.findByIdentity(normalizedIdentity);

      // 2. Timing attack defense: if user not found, evaluate dummy password
      if (!user) {
        await verifyDummyPassword(password);
        authRateLimiterStore.recordFailure(clientIp, normalizedIdentity);

        void recordAuditEvent({
          action: 'login_failed',
          requestId: req.requestId,
          clientIp,
          details: { identity: normalizedIdentity, reason: 'unknown_account' },
        });

        return next(new AppError('Invalid credentials.', 401, 'AUTHENTICATION_FAILED'));
      }

      // 3. Check account active status (with dummy evaluation to equalize response time)
      if (!user.is_active) {
        await verifyDummyPassword(password);
        authRateLimiterStore.recordFailure(clientIp, normalizedIdentity);

        void recordAuditEvent({
          actorAdminId: user.id,
          action: 'account_disabled_login_attempt',
          resourceType: 'admin_user',
          resourceId: user.id,
          requestId: req.requestId,
          clientIp,
          details: { username: user.username },
        });

        // Generic failure message prevents enumeration of account active state
        return next(new AppError('Invalid credentials.', 401, 'AUTHENTICATION_FAILED'));
      }

      // 4. Verify password with Argon2id
      const isValidPassword = await verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        authRateLimiterStore.recordFailure(clientIp, normalizedIdentity);

        void recordAuditEvent({
          actorAdminId: user.id,
          action: 'login_failed',
          resourceType: 'admin_user',
          resourceId: user.id,
          requestId: req.requestId,
          clientIp,
          details: { username: user.username, reason: 'wrong_password' },
        });

        return next(new AppError('Invalid credentials.', 401, 'AUTHENTICATION_FAILED'));
      }

      // 5. Successful authentication
      authRateLimiterStore.recordSuccess(clientIp, normalizedIdentity);
      await adminUserRepository.updateLastLogin(user.id);

      // 6. Generate signed JWT and CSRF token
      const { token } = createAdminToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role_key,
        roleId: user.role_id,
      });

      const csrfToken = generateCsrfToken();

      // 7. Set secure cookies
      res.cookie(env.AUTH_COOKIE_NAME, token, getAuthCookieOptions());
      res.cookie(env.AUTH_CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());

      // 8. Prevent caching of sensitive response
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');

      // 9. Write audit record
      void recordAuditEvent({
        actorAdminId: user.id,
        action: 'login_success',
        resourceType: 'admin_user',
        resourceId: user.id,
        requestId: req.requestId,
        clientIp,
        details: { username: user.username, role: user.role_key },
      });

      res.status(200).json({
        success: true,
        data: {
          admin: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            role: user.role_key,
          },
          csrfToken,
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/auth/logout
   */
  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = req.admin;

      if (admin) {
        // 1. Persist revocation record in database (must succeed before reporting successful logout)
        const expiresAt = admin.tokenExp || Math.floor(Date.now() / 1000) + 1800;
        await tokenRevocationStore.revoke(admin.tokenJti, expiresAt);

        // 2. Record audit event
        void recordAuditEvent({
          actorAdminId: admin.id,
          action: 'logout',
          resourceType: 'admin_user',
          resourceId: admin.id,
          requestId: req.requestId,
          clientIp: req.ip,
          details: { username: admin.username },
        });
      }

      // Clear authentication and CSRF cookies
      res.clearCookie(env.AUTH_COOKIE_NAME, { path: '/' });
      res.clearCookie(env.AUTH_CSRF_COOKIE_NAME, { path: '/' });

      res.setHeader('Cache-Control', 'no-store, no-cache');

      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully.',
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/auth/me
   */
  public async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admin = req.admin;
      if (!admin) {
        return next(new AppError('Authentication required.', 401, 'AUTHENTICATION_REQUIRED'));
      }

      // Ensure client has active CSRF token
      let csrfToken = req.cookies?.[env.AUTH_CSRF_COOKIE_NAME];
      if (!csrfToken) {
        csrfToken = generateCsrfToken();
        res.cookie(env.AUTH_CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions());
      }

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');

      res.status(200).json({
        success: true,
        data: {
          admin: {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            fullName: admin.fullName,
            role: admin.role,
          },
          csrfToken,
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
