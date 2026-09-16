"use strict";
/**
 * CITYLINE CONSULTANCY — Authentication Rate Limiting & Brute-Force Defense
 *
 * GOVERNANCE & ARCHITECTURAL LIMITATION NOTE:
 * - Current development/runtime limiter is process-local. Multi-process/global abuse protection
 *   must be validated or upgraded during production deployment/security verification.
 * - This implementation is structured behind the `RateLimitStore` abstraction so that
 *   a distributed store (e.g. Redis or database-backed) can be plugged in seamlessly
 *   during Phase 17 deployment without modifying authentication routes or controllers.
 * - PROXY TRUST: Never trusts raw X-Forwarded-For headers directly; relies on Express req.ip
 *   which respects the deliberate 'trust proxy' configuration of the application.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiterStore = exports.MemoryRateLimitStore = void 0;
exports.setRateLimitStore = setRateLimitStore;
exports.getRateLimitStore = getRateLimitStore;
exports.authRateLimiter = authRateLimiter;
const env_config_1 = require("../config/env.config");
const app_error_1 = require("../utils/app-error");
/**
 * Process-local in-memory implementation of RateLimitStore.
 */
class MemoryRateLimitStore {
    records = new Map();
    getKey(ip, identity) {
        if (identity) {
            return `${ip}:${identity.trim().toLowerCase()}`;
        }
        return ip;
    }
    isRateLimited(ip, identity) {
        const now = Date.now();
        const keysToCheck = [this.getKey(ip)];
        if (identity) {
            keysToCheck.push(this.getKey(ip, identity));
        }
        for (const key of keysToCheck) {
            const record = this.records.get(key);
            if (!record)
                continue;
            // Check if actively locked
            if (record.lockedUntil && now < record.lockedUntil) {
                const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
                return { limited: true, retryAfterSeconds };
            }
            // Check window expiration
            if (now - record.firstAttemptAt > env_config_1.env.AUTH_RATE_LIMIT_WINDOW_MS) {
                this.records.delete(key);
                continue;
            }
            // Check if attempts exceeded threshold
            if (record.attempts >= env_config_1.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS) {
                record.lockedUntil = now + env_config_1.env.AUTH_LOCKOUT_DURATION_MS;
                const retryAfterSeconds = Math.ceil(env_config_1.env.AUTH_LOCKOUT_DURATION_MS / 1000);
                return { limited: true, retryAfterSeconds };
            }
        }
        return { limited: false };
    }
    recordFailure(ip, identity) {
        const now = Date.now();
        const keys = [this.getKey(ip)];
        if (identity) {
            keys.push(this.getKey(ip, identity));
        }
        for (const key of keys) {
            const record = this.records.get(key);
            if (!record || now - record.firstAttemptAt > env_config_1.env.AUTH_RATE_LIMIT_WINDOW_MS) {
                this.records.set(key, {
                    attempts: 1,
                    firstAttemptAt: now,
                    lockedUntil: null,
                });
            }
            else {
                record.attempts += 1;
                if (record.attempts >= env_config_1.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS) {
                    record.lockedUntil = now + env_config_1.env.AUTH_LOCKOUT_DURATION_MS;
                }
            }
        }
    }
    recordSuccess(ip, identity) {
        this.records.delete(this.getKey(ip));
        if (identity) {
            this.records.delete(this.getKey(ip, identity));
        }
    }
    clear() {
        this.records.clear();
    }
}
exports.MemoryRateLimitStore = MemoryRateLimitStore;
// Active store instance (swappable for multi-instance production engines)
let activeRateLimitStore = new MemoryRateLimitStore();
function setRateLimitStore(store) {
    activeRateLimitStore = store;
}
function getRateLimitStore() {
    return activeRateLimitStore;
}
exports.authRateLimiterStore = {
    isRateLimited: (ip, identity) => activeRateLimitStore.isRateLimited(ip, identity),
    recordFailure: (ip, identity) => activeRateLimitStore.recordFailure(ip, identity),
    recordSuccess: (ip, identity) => activeRateLimitStore.recordSuccess(ip, identity),
    clear: () => activeRateLimitStore.clear(),
};
/**
 * Express middleware checking rate limits before allowing login evaluation.
 * Note: Relies securely on req.ip (governed by Express trust proxy settings).
 */
function authRateLimiter(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const identity = typeof req.body?.identity === 'string' ? req.body.identity : undefined;
    const status = activeRateLimitStore.isRateLimited(ip, identity);
    if (status.limited) {
        if (status.retryAfterSeconds) {
            res.setHeader('Retry-After', status.retryAfterSeconds);
        }
        return next(new app_error_1.AppError('Too many failed login attempts. Please try again later.', 429, 'TOO_MANY_REQUESTS'));
    }
    next();
}
