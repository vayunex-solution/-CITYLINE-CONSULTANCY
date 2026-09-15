/**
 * CITYLINE CONSULTANCY — Analytics Ingestion Rate Limiter
 * Guards the public page-view tracking endpoint against flooding, bot storms, and storage abuse.
 *
 * GOVERNANCE:
 * - Uses sliding window tracking based on client IP.
 * - Fails safely with 429 RATE_LIMIT_EXCEEDED.
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.config';
import { AppError } from '../utils/app-error';

interface RequestRecord {
  timestamps: number[];
}

export class AnalyticsRateLimiter {
  private records = new Map<string, RequestRecord>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs?: number, maxRequests?: number) {
    this.windowMs = windowMs || env.ANALYTICS_RATE_LIMIT_WINDOW_MS;
    this.maxRequests = maxRequests || env.ANALYTICS_RATE_LIMIT_MAX_ATTEMPTS;
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

export const analyticsRateLimiter = new AnalyticsRateLimiter();

export function analyticsRateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const result = analyticsRateLimiter.checkRateLimit(clientIp);

  if (result.limited) {
    if (result.retryAfterSeconds) {
      res.setHeader('Retry-After', result.retryAfterSeconds.toString());
    }
    return next(
      new AppError(
        'Too many analytics events. Please slow down.',
        429,
        'RATE_LIMIT_EXCEEDED'
      )
    );
  }

  next();
}
