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

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

interface RequestRecord {
  timestamps: number[];
}

export class ManpowerRateLimiter {
  private records = new Map<string, RequestRecord>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 5) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
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

export const manpowerRateLimiter = new ManpowerRateLimiter();

export function manpowerRateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Rely strictly on socket-backed req.ip
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

  const { limited, retryAfterSeconds } = manpowerRateLimiter.checkRateLimit(clientIp);

  if (limited) {
    res.setHeader('Retry-After', String(retryAfterSeconds || 60));
    return next(
      new AppError(
        'Too many manpower requisitions submitted from this network. Please wait before submitting another requirement.',
        429,
        'RATE_LIMIT_EXCEEDED'
      )
    );
  }

  next();
}
