"use strict";
/**
 * CITYLINE CONSULTANCY — Analytics Ingestion Rate Limiter
 * Guards the public page-view tracking endpoint against flooding, bot storms, and storage abuse.
 *
 * GOVERNANCE:
 * - Uses sliding window tracking based on client IP.
 * - Fails safely with 429 RATE_LIMIT_EXCEEDED.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRateLimiter = exports.AnalyticsRateLimiter = void 0;
exports.analyticsRateLimitMiddleware = analyticsRateLimitMiddleware;
const env_config_1 = require("../config/env.config");
const app_error_1 = require("../utils/app-error");
class AnalyticsRateLimiter {
    records = new Map();
    windowMs;
    maxRequests;
    constructor(windowMs, maxRequests) {
        this.windowMs = windowMs || env_config_1.env.ANALYTICS_RATE_LIMIT_WINDOW_MS;
        this.maxRequests = maxRequests || env_config_1.env.ANALYTICS_RATE_LIMIT_MAX_ATTEMPTS;
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
        // Retain only timestamps within the sliding window
        record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
        if (record.timestamps.length >= this.maxRequests) {
            const oldest = record.timestamps[0];
            const retryAfterMs = oldest + this.windowMs - now;
            const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
            return { limited: true, retryAfterSeconds };
        }
        record.timestamps.push(now);
        return { limited: false };
    }
}
exports.AnalyticsRateLimiter = AnalyticsRateLimiter;
exports.analyticsRateLimiter = new AnalyticsRateLimiter();
function analyticsRateLimitMiddleware(req, res, next) {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const result = exports.analyticsRateLimiter.checkRateLimit(clientIp);
    if (result.limited) {
        if (result.retryAfterSeconds) {
            res.setHeader('Retry-After', result.retryAfterSeconds.toString());
        }
        return next(new app_error_1.AppError('Too many analytics events. Please slow down.', 429, 'RATE_LIMIT_EXCEEDED'));
    }
    next();
}
