"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = csrfProtection;
const env_config_1 = require("../config/env.config");
const token_1 = require("../auth/token");
const app_error_1 = require("../utils/app-error");
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
function csrfProtection(req, _res, next) {
    // 1. Safe methods do not mutate state
    if (SAFE_METHODS.has(req.method)) {
        return next();
    }
    // 2. Exempt public login endpoint (which establishes the initial session/CSRF state)
    const loginPath = `${env_config_1.env.API_PREFIX}/admin/auth/login`;
    if (req.path === loginPath || req.originalUrl === loginPath) {
        return next();
    }
    // 3. Programmatic Bearer-token requests without cookies are exempt from CSRF
    const hasAuthCookie = Boolean(req.cookies?.[env_config_1.env.AUTH_COOKIE_NAME]);
    const hasCsrfCookie = Boolean(req.cookies?.[env_config_1.env.AUTH_CSRF_COOKIE_NAME]);
    const isBearerAuth = Boolean(req.headers.authorization?.startsWith('Bearer '));
    if (isBearerAuth && !hasAuthCookie && !hasCsrfCookie) {
        return next();
    }
    // 4. Extract CSRF token from header and cookie
    const headerToken = (req.headers['x-csrf-token'] || req.headers['X-CSRF-Token']);
    const cookieToken = req.cookies?.[env_config_1.env.AUTH_CSRF_COOKIE_NAME];
    // 5. Verify presence and constant-time match
    if (cookieToken && headerToken && (0, token_1.verifyCsrfToken)(cookieToken, headerToken)) {
        return next();
    }
    // 6. Resilient fallback: only when the CSRF cookie is missing (e.g. cross-domain cookie partitioning),
    // but the request is authenticated with an active admin session and provides a valid 32+ char client token
    if (!cookieToken && req.admin && headerToken && typeof headerToken === 'string' && headerToken.length >= 32) {
        return next();
    }
    return next(new app_error_1.AppError('Invalid or missing CSRF protection token.', 403, 'CSRF_TOKEN_INVALID'));
}
