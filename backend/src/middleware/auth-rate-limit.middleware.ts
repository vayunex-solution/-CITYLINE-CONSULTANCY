/**
 * CITYLINE CONSULTANCY — Authentication Rate Limiting & Brute-Force Defense
 * Implements sliding-window and temporary lockout tracking for login endpoints.
 *
 * GOVERNANCE:
 * - Throttles both by client IP and compound key (IP + normalized identity).
 * - Avoids permanent account lockouts (preventing denial-of-service against administrators).
 * - Returns 429 TOO_MANY_REQUESTS with Retry-After header.
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.config';
import { AppError } from '../utils/app-error';

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

class AuthRateLimiterStore {
  private records = new Map<string, RateLimitRecord>();

  private getKey(ip: string, identity?: string): string {
    if (identity) {
      return `${ip}:${identity.trim().toLowerCase()}`;
    }
    return ip;
  }

  public isRateLimited(ip: string, identity?: string): { limited: boolean; retryAfterSeconds?: number } {
    const now = Date.now();
    const keysToCheck = [this.getKey(ip)];
    if (identity) {
      keysToCheck.push(this.getKey(ip, identity));
    }

    for (const key of keysToCheck) {
      const record = this.records.get(key);
      if (!record) continue;

      // Check if actively locked
      if (record.lockedUntil && now < record.lockedUntil) {
        const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
        return { limited: true, retryAfterSeconds };
      }

      // Check window expiration
      if (now - record.firstAttemptAt > env.AUTH_RATE_LIMIT_WINDOW_MS) {
        this.records.delete(key);
        continue;
      }

      // Check if attempts exceeded threshold
      if (record.attempts >= env.AUTH_RATE_LIMIT_MAX_ATTEMPTS) {
        record.lockedUntil = now + env.AUTH_LOCKOUT_DURATION_MS;
        const retryAfterSeconds = Math.ceil(env.AUTH_LOCKOUT_DURATION_MS / 1000);
        return { limited: true, retryAfterSeconds };
      }
    }

    return { limited: false };
  }

  public recordFailure(ip: string, identity?: string): void {
    const now = Date.now();
    const keys = [this.getKey(ip)];
    if (identity) {
      keys.push(this.getKey(ip, identity));
    }

    for (const key of keys) {
      const record = this.records.get(key);
      if (!record || now - record.firstAttemptAt > env.AUTH_RATE_LIMIT_WINDOW_MS) {
        this.records.set(key, {
          attempts: 1,
          firstAttemptAt: now,
          lockedUntil: null,
        });
      } else {
        record.attempts += 1;
        if (record.attempts >= env.AUTH_RATE_LIMIT_MAX_ATTEMPTS) {
          record.lockedUntil = now + env.AUTH_LOCKOUT_DURATION_MS;
        }
      }
    }
  }

  public recordSuccess(ip: string, identity?: string): void {
    this.records.delete(this.getKey(ip));
    if (identity) {
      this.records.delete(this.getKey(ip, identity));
    }
  }

  public clear(): void {
    this.records.clear();
  }
}

export const authRateLimiterStore = new AuthRateLimiterStore();

/**
 * Express middleware checking rate limits before allowing login evaluation.
 */
export function authRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.ip || req.socket.remoteAddress || 'unknown-ip';

  const identity = typeof req.body?.identity === 'string' ? req.body.identity : undefined;

  const status = authRateLimiterStore.isRateLimited(ip, identity);

  if (status.limited) {
    if (status.retryAfterSeconds) {
      res.setHeader('Retry-After', status.retryAfterSeconds);
    }
    return next(
      new AppError(
        'Too many failed login attempts. Please try again later.',
        429,
        'TOO_MANY_REQUESTS'
      )
    );
  }

  next();
}
