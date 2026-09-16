"use strict";
/**
 * CITYLINE CONSULTANCY — Public Manpower Enquiry Rate Limiter
 * Guards the public employer manpower requirement endpoint against rapid flooding, automated spam, and bot submissions.
 *
 * TRUSTED CLIENT IP & PROXY SECURITY:
 * - This middleware relies strictly on Express `req.ip` (socket remoteAddress).
 * - Under the application's root configuration (`app.set('trust proxy', false)`), Express resolves
 *   `req.ip` directly from the TCP socket remote address and explicitly ignores untrusted
 *   `X-Forwarded-For` or `X-Real-IP` headers supplied by clients. Spoofing these headers cannot bypass the limiter.
 *
 * ARCHITECTURAL SPECIFICATION:
 * - Process-local sliding window algorithm using RateLimitStore Map.
 * - Standard threshold: 5 manpower enquiry submissions per 15-minute window per IP.
 * - Emits standard HTTP 429 RATE_LIMIT_EXCEEDED with Retry-After header.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.manpowerRateLimiter = exports.ManpowerRateLimiter = void 0;
exports.manpowerRateLimitMiddleware = manpowerRateLimitMiddleware;
const app_error_1 = require("../utils/app-error");
class ManpowerRateLimiter {
    records = new Map();
    windowMs;
    maxRequests;
    constructor(windowMs = 15 * 60 * 1000, maxRequests = 5) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }
    setLimits(windowMs, maxRequests) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }
    clear() {
        this.records.clear();
    }
    checkRateLimit(ip) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        let record = this.records.get(ip);
        if (!record) {
            record = { timestamps: [] };
            this.records.set(ip, record);
        }
        // Filter out timestamps older than the sliding window
        record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
        if (record.timestamps.length >= this.maxRequests) {
            const oldest = record.timestamps[0];
            const resetTime = oldest + this.windowMs;
            const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));
            return {
                limited: true,
                retryAfterSeconds,
            };
        }
        record.timestamps.push(now);
        return { limited: false };
    }
}
exports.ManpowerRateLimiter = ManpowerRateLimiter;
exports.manpowerRateLimiter = new ManpowerRateLimiter();
function manpowerRateLimitMiddleware(req, res, next) {
    // Rely strictly on socket-backed req.ip
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const { limited, retryAfterSeconds } = exports.manpowerRateLimiter.checkRateLimit(clientIp);
    if (limited) {
        res.setHeader('Retry-After', String(retryAfterSeconds || 60));
        return next(new app_error_1.AppError('Too many manpower requisitions submitted from this network. Please wait before submitting another requirement.', 429, 'RATE_LIMIT_EXCEEDED'));
    }
    next();
}
