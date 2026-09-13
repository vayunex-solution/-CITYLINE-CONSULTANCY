/**
 * CITYLINE CONSULTANCY — Cross-Site Request Forgery (CSRF) Guard Middleware
 * Implements the Double-Submit Cookie pattern for state-changing administrative requests.
 *
 * GOVERNANCE:
 * - Mutating methods (POST, PUT, PATCH, DELETE) require a valid X-CSRF-Token header.
 * - Header token must match the value stored in the clc_csrf_token cookie.
 * - Compares tokens using constant-time evaluation to prevent timing attacks.
 * - Safe methods (GET, HEAD, OPTIONS) are exempt.
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.config';
import { verifyCsrfToken } from '../auth/token';
import { AppError } from '../utils/app-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  // 1. Safe methods do not mutate state
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // 2. Exempt public login endpoint (which establishes the initial session/CSRF state)
  const loginPath = `${env.API_PREFIX}/admin/auth/login`;
  if (req.path === loginPath || req.originalUrl === loginPath) {
    return next();
  }

  // 3. Extract CSRF token from header and cookie
  const headerToken = (req.headers['x-csrf-token'] || req.headers['X-CSRF-Token']) as string | undefined;
  const cookieToken = req.cookies?.[env.AUTH_CSRF_COOKIE_NAME] as string | undefined;

  // 4. Verify presence and constant-time match
  if (!cookieToken || !headerToken || !verifyCsrfToken(cookieToken, headerToken)) {
    return next(
      new AppError(
        'Invalid or missing CSRF protection token.',
        403,
        'CSRF_TOKEN_INVALID'
      )
    );
  }

  next();
}
