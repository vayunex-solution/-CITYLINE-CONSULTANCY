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

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.config';
import { AppError } from '../utils/app-error';

interface RequestRecord {
  timestamps: number[];
}

export class VisaEnquiryRateLimiter {
  private records = new Map<string, RequestRecord>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs?: number, maxRequests?: number) {
    this.windowMs = windowMs || env.VISA_ENQUIRY_RATE_LIMIT_WINDOW_MS;
    this.maxRequests = maxRequests || env.VISA_ENQUIRY_RATE_LIMIT_MAX_ATTEMPTS;
  }

  public setLimits(windowMs: number, maxRequests: number): void {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  public clear(): void {
    this.records.clear();
  }

  public checkRateLimit(ip: string): { limited: boolean; retryAfterSeconds?: number } {
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

export const visaEnquiryRateLimiterInstance = new VisaEnquiryRateLimiter();

export const visaEnquiryRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const { limited, retryAfterSeconds } = visaEnquiryRateLimiterInstance.checkRateLimit(clientIp);

  if (limited && retryAfterSeconds) {
    res.setHeader('Retry-After', retryAfterSeconds.toString());
    return next(
      new AppError(
        `Too many enquiry submissions from this connection. Please wait ${retryAfterSeconds} seconds before submitting again.`,
        429,
        'RATE_LIMIT_EXCEEDED'
      )
    );
  }

  next();
};
