"use strict";
/**
 * CITYLINE CONSULTANCY — Admin Authentication Token & CSRF Service
 * Manages signed stateless JWT access tokens, cryptographic CSRF tokens, and secure cookie configurations.
 *
 * GOVERNANCE:
 * - Transport: HttpOnly, Secure (in production), SameSite=Lax cookie.
 * - Storage: Inaccessible to JavaScript (never stored in localStorage).
 * - CSRF: Double-Submit pattern using separate non-HttpOnly readable cookie.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminToken = createAdminToken;
exports.verifyAdminToken = verifyAdminToken;
exports.generateCsrfToken = generateCsrfToken;
exports.verifyCsrfToken = verifyCsrfToken;
exports.getAuthCookieOptions = getAuthCookieOptions;
exports.getCsrfCookieOptions = getCsrfCookieOptions;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = require("../config/env.config");
/**
 * Creates a signed JWT access token for an authenticated administrator.
 */
function createAdminToken(admin) {
    const jti = crypto_1.default.randomUUID();
    const token = jsonwebtoken_1.default.sign({
        sub: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        roleId: admin.roleId,
        jti,
    }, env_config_1.env.AUTH_TOKEN_SECRET, {
        algorithm: 'HS256',
        expiresIn: env_config_1.env.AUTH_TOKEN_TTL,
    });
    const decoded = jsonwebtoken_1.default.decode(token);
    return {
        token,
        jti,
        exp: decoded.exp,
    };
}
/**
 * Verifies a candidate JWT access token.
 * Validates cryptographic signature authenticity and exp expiration claim.
 * Note: Database-backed token revocation is evaluated separately via tokenRevocationStore.
 * Returns decoded claims if signature and claims are valid; returns null otherwise.
 */
function verifyAdminToken(token) {
    if (!token)
        return null;
    try {
        const claims = jsonwebtoken_1.default.verify(token, env_config_1.env.AUTH_TOKEN_SECRET, {
            algorithms: ['HS256'],
        });
        return claims;
    }
    catch {
        return null;
    }
}
/**
 * Generates a cryptographically strong 32-byte hexadecimal CSRF token.
 */
function generateCsrfToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
/**
 * Compares incoming CSRF token from header with the cookie value using constant-time comparison.
 */
function verifyCsrfToken(cookieToken, headerToken) {
    if (!cookieToken || !headerToken) {
        return false;
    }
    if (typeof cookieToken !== 'string' || typeof headerToken !== 'string') {
        return false;
    }
    const bufCookie = Buffer.from(cookieToken);
    const bufHeader = Buffer.from(headerToken);
    if (bufCookie.length !== bufHeader.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(bufCookie, bufHeader);
}
/**
 * Returns standard Express cookie options for the administrative auth token.
 */
function getAuthCookieOptions(maxAgeMs) {
    const isProd = env_config_1.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        domain: isProd ? '.citylineconsultancy.com' : undefined,
        path: '/',
        maxAge: maxAgeMs ?? 30 * 60 * 1000, // Default 30 minutes
    };
}
/**
 * Returns standard Express cookie options for the readable CSRF token.
 */
function getCsrfCookieOptions(maxAgeMs) {
    const isProd = env_config_1.env.NODE_ENV === 'production';
    return {
        httpOnly: false, // Must be readable by client JS to set X-CSRF-Token header
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        domain: isProd ? '.citylineconsultancy.com' : undefined,
        path: '/',
        maxAge: maxAgeMs ?? 30 * 60 * 1000,
    };
}
