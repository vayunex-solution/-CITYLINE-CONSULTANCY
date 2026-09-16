"use strict";
/**
 * CITYLINE CONSULTANCY — Public Visa Enquiry Rate Limiter
 * Guards the public submission endpoint against flooding, credential scanning, and automated upload abuse.
 *
 * GOVERNANCE:
 * - Uses Express req.ip (strictly respects proxy trust setting).
 * - Implements sliding window rate limiting.
 * - Configurable via VISA_ENQUIRY_RATE_LIMIT_WINDOW_MS and VISA_ENQUIRY_RATE_LIMIT_MAX_ATTEMPTS.
 * - Emits standard 429 RATE_LIMIT_EXCEEDED with Retry-After header.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.visaEnquiryRateLimiter = exports.visaEnquiryRateLimiterInstance = exports.VisaEnquiryRateLimiter = void 0;
const env_config_1 = require("../config/env.config");
const app_error_1 = require("../utils/app-error");
class VisaEnquiryRateLimiter {
    records = new Map();
    windowMs;
    maxRequests;
    constructor(windowMs, maxRequests) {
        this.windowMs = windowMs || env_config_1.env.VISA_ENQUIRY_RATE_LIMIT_WINDOW_MS;
        this.maxRequests = maxRequests || env_config_1.env.VISA_ENQUIRY_RATE_LIMIT_MAX_ATTEMPTS;
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
        // Filter out timestamps older than current sliding window
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
exports.VisaEnquiryRateLimiter = VisaEnquiryRateLimiter;
exports.visaEnquiryRateLimiterInstance = new VisaEnquiryRateLimiter();
const visaEnquiryRateLimiter = (req, res, next) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const { limited, retryAfterSeconds } = exports.visaEnquiryRateLimiterInstance.checkRateLimit(clientIp);
    if (limited && retryAfterSeconds) {
        res.setHeader('Retry-After', retryAfterSeconds.toString());
        return next(new app_error_1.AppError(`Too many enquiry submissions from this connection. Please wait ${retryAfterSeconds} seconds before submitting again.`, 429, 'RATE_LIMIT_EXCEEDED'));
    }
    next();
};
exports.visaEnquiryRateLimiter = visaEnquiryRateLimiter;
