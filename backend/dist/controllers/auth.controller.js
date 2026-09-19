"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const zod_1 = require("zod");
const env_config_1 = require("../config/env.config");
const admin_user_repository_1 = require("../repositories/admin-user.repository");
const password_1 = require("../auth/password");
const token_1 = require("../auth/token");
const token_revocation_1 = require("../auth/token-revocation");
const auth_rate_limit_middleware_1 = require("../middleware/auth-rate-limit.middleware");
const audit_1 = require("../auth/audit");
const app_error_1 = require("../utils/app-error");
const loginSchema = zod_1.z.object({
    identity: zod_1.z.string().min(3, 'Identity must be at least 3 characters.').max(255),
    password: zod_1.z.string().min(1, 'Password is required.'),
});
class AuthController {
    /**
     * POST /api/v1/admin/auth/login
     */
    async login(req, res, next) {
        const parseResult = loginSchema.safeParse(req.body);
        if (!parseResult.success) {
            return next(new app_error_1.AppError('Invalid credentials provided.', 400, 'VALIDATION_ERROR', parseResult.error.issues));
        }
        const { identity, password } = parseResult.data;
        const clientIp = req.ip || req.socket.remoteAddress || 'unknown-ip';
        const normalizedIdentity = identity.trim().toLowerCase();
        // Enforce password policy constraints on login input to reject malformed/oversized payloads
        const policy = (0, password_1.validatePasswordPolicy)(password);
        if (!policy.valid) {
            auth_rate_limit_middleware_1.authRateLimiterStore.recordFailure(clientIp, normalizedIdentity);
            void (0, audit_1.recordAuditEvent)({
                action: 'login_failed',
                requestId: req.requestId,
                clientIp,
                details: { identity: normalizedIdentity, reason: 'policy_rejection' },
            });
            return next(new app_error_1.AppError('Invalid credentials.', 401, 'AUTHENTICATION_FAILED'));
        }
        try {
            // 1. Retrieve admin user by username or email
            const user = await admin_user_repository_1.adminUserRepository.findByIdentity(normalizedIdentity);
            // 2. Timing attack defense: if user not found, evaluate dummy password
            if (!user) {
                await (0, password_1.verifyDummyPassword)(password);
                auth_rate_limit_middleware_1.authRateLimiterStore.recordFailure(clientIp, normalizedIdentity);
                void (0, audit_1.recordAuditEvent)({
                    action: 'login_failed',
                    requestId: req.requestId,
                    clientIp,
                    details: { identity: normalizedIdentity, reason: 'unknown_account' },
                });
                return next(new app_error_1.AppError('Invalid credentials.', 401, 'AUTHENTICATION_FAILED'));
            }
            // 3. Check account active status (with dummy evaluation to equalize response time)
            if (!user.is_active) {
                await (0, password_1.verifyDummyPassword)(password);
                auth_rate_limit_middleware_1.authRateLimiterStore.recordFailure(clientIp, normalizedIdentity);
                void (0, audit_1.recordAuditEvent)({
                    actorAdminId: user.id,
                    action: 'account_disabled_login_attempt',
                    resourceType: 'admin_user',
                    resourceId: user.id,
                    requestId: req.requestId,
                    clientIp,
                    details: { username: user.username },
                });
                // Generic failure message prevents enumeration of account active state
                return next(new app_error_1.AppError('Invalid credentials.', 401, 'AUTHENTICATION_FAILED'));
            }
            // 4. Verify password with Argon2id
            const isValidPassword = await (0, password_1.verifyPassword)(password, user.password_hash);
            if (!isValidPassword) {
                auth_rate_limit_middleware_1.authRateLimiterStore.recordFailure(clientIp, normalizedIdentity);
                void (0, audit_1.recordAuditEvent)({
                    actorAdminId: user.id,
                    action: 'login_failed',
                    resourceType: 'admin_user',
                    resourceId: user.id,
                    requestId: req.requestId,
                    clientIp,
                    details: { username: user.username, reason: 'wrong_password' },
                });
                return next(new app_error_1.AppError('Invalid credentials.', 401, 'AUTHENTICATION_FAILED'));
            }
            // 5. Successful authentication
            auth_rate_limit_middleware_1.authRateLimiterStore.recordSuccess(clientIp, normalizedIdentity);
            await admin_user_repository_1.adminUserRepository.updateLastLogin(user.id);
            // 6. Generate signed JWT and CSRF token
            const { token } = (0, token_1.createAdminToken)({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role_key,
                roleId: user.role_id,
            });
            const csrfToken = (0, token_1.generateCsrfToken)();
            // 7. Set secure cookies
            res.cookie(env_config_1.env.AUTH_COOKIE_NAME, token, (0, token_1.getAuthCookieOptions)());
            res.cookie(env_config_1.env.AUTH_CSRF_COOKIE_NAME, csrfToken, (0, token_1.getCsrfCookieOptions)());
            // 8. Prevent caching of sensitive response
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            // 9. Write audit record
            void (0, audit_1.recordAuditEvent)({
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/v1/admin/auth/logout
     */
    async logout(req, res, next) {
        try {
            const admin = req.admin;
            if (admin) {
                // 1. Persist revocation record in database (must succeed before reporting successful logout)
                const expiresAt = admin.tokenExp || Math.floor(Date.now() / 1000) + 1800;
                await token_revocation_1.tokenRevocationStore.revoke(admin.tokenJti, expiresAt);
                // 2. Record audit event
                void (0, audit_1.recordAuditEvent)({
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
            res.clearCookie(env_config_1.env.AUTH_COOKIE_NAME, { path: '/' });
            res.clearCookie(env_config_1.env.AUTH_CSRF_COOKIE_NAME, { path: '/' });
            res.setHeader('Cache-Control', 'no-store, no-cache');
            res.status(200).json({
                success: true,
                data: {
                    message: 'Logged out successfully.',
                },
                timestamp: new Date().toISOString(),
                requestId: req.requestId,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/v1/admin/auth/me
     */
    async me(req, res, next) {
        try {
            const admin = req.admin;
            if (!admin) {
                return next(new app_error_1.AppError('Authentication required.', 401, 'AUTHENTICATION_REQUIRED'));
            }
            // Ensure client has active CSRF token
            let csrfToken = req.cookies?.[env_config_1.env.AUTH_CSRF_COOKIE_NAME];
            if (!csrfToken) {
                csrfToken = (0, token_1.generateCsrfToken)();
                res.cookie(env_config_1.env.AUTH_CSRF_COOKIE_NAME, csrfToken, (0, token_1.getCsrfCookieOptions)());
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
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
