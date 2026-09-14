/**
 * CITYLINE CONSULTANCY — Public Job Application Rate Limiter
 * Guards the public candidate application endpoint against rapid flooding, automated spam, and bot submissions.
 *
 * ARCHITECTURE NOTE:
 * - This implementation operates in process-local memory using a sliding window algorithm.
 * - In a multi-process Passenger / PM2 cluster or across distributed nodes, each process maintains
 *   its own local sliding window. For horizontally scaled distributed deployments (Phase 17+),
 *   this can be backed by a shared Redis / MariaDB store without altering the middleware interface.
 * - Standard threshold: 5 application submissions per 15-minute window per IP.
 * - Emits standard 429 RATE_LIMIT_EXCEEDED with Retry-After header.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

interface RequestRecord {
  timestamps: number[];
}

export class JobApplicationRateLimiter {
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
      const retryAfterMs = oldest + this.windowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
      return { limited: true, retryAfterSeconds };
    }

    // Record this attempt
    record.timestamps.push(now);
    return { limited: false };
  }
}

export const jobApplicationRateLimiterInstance = new JobApplicationRateLimiter();

export const jobApplicationRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const { limited, retryAfterSeconds } = jobApplicationRateLimiterInstance.checkRateLimit(clientIp);

  if (limited && retryAfterSeconds) {
    res.setHeader('Retry-After', retryAfterSeconds.toString());
    return next(
      new AppError(
        `Too many job applications received from this connection. Please wait ${retryAfterSeconds} seconds before submitting again.`,
        429,
        'RATE_LIMIT_EXCEEDED'
      )
    );
  }

  next();
};
