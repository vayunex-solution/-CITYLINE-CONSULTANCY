"use strict";
/**
 * CITYLINE CONSULTANCY — Public Job Application Rate Limiter
 * Guards the public candidate application endpoint against rapid flooding, automated spam, and bot submissions.
 *
 * TRUSTED CLIENT IP & PROXY SECURITY:
 * - This middleware relies strictly on Express `req.ip` (or socket remoteAddress).
 * - Under the application's root configuration (`app.set('trust proxy', false)`), Express resolves
 *   `req.ip` directly from the TCP socket remote address and explicitly ignores raw, untrusted
 *   `X-Forwarded-For` or `X-Real-IP` headers supplied by clients. Spoofing these headers cannot bypass the limiter.
 *
 * ARCHITECTURAL LIMITATION NOTE:
 * - This implementation operates in process-local memory using a sliding window algorithm.
 * - In a multi-process Passenger / PM2 cluster or across distributed nodes, each process maintains
 *   its own local sliding window. For horizontally scaled distributed deployments (Phase 17+),
 *   this can be backed by a shared Redis / MariaDB store without altering the middleware interface.
 * - Standard threshold: 5 application submissions per 15-minute window per IP.
 * - Emits standard 429 RATE_LIMIT_EXCEEDED with Retry-After header.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobApplicationRateLimiter = exports.jobApplicationRateLimiterInstance = exports.JobApplicationRateLimiter = void 0;
const app_error_1 = require("../utils/app-error");
class JobApplicationRateLimiter {
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
            const retryAfterMs = oldest + this.windowMs - now;
            const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
            return { limited: true, retryAfterSeconds };
        }
        // Record this attempt
        record.timestamps.push(now);
        return { limited: false };
    }
}
exports.JobApplicationRateLimiter = JobApplicationRateLimiter;
exports.jobApplicationRateLimiterInstance = new JobApplicationRateLimiter();
const jobApplicationRateLimiter = (req, res, next) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const { limited, retryAfterSeconds } = exports.jobApplicationRateLimiterInstance.checkRateLimit(clientIp);
    if (limited && retryAfterSeconds) {
        res.setHeader('Retry-After', retryAfterSeconds.toString());
        return next(new app_error_1.AppError(`Too many job applications received from this connection. Please wait ${retryAfterSeconds} seconds before submitting again.`, 429, 'RATE_LIMIT_EXCEEDED'));
    }
    next();
};
exports.jobApplicationRateLimiter = jobApplicationRateLimiter;
