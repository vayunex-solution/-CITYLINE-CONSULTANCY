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

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.config';
import { AppError } from '../utils/app-error';

export interface RateLimitStatus {
  limited: boolean;
  retryAfterSeconds?: number;
}

export interface RateLimitStore {
  isRateLimited(ip: string, identity?: string): RateLimitStatus;
  recordFailure(ip: string, identity?: string): void;
  recordSuccess(ip: string, identity?: string): void;
  clear(): void;
}

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

/**
 * Process-local in-memory implementation of RateLimitStore.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private records = new Map<string, RateLimitRecord>();

  private getKey(ip: string, identity?: string): string {
    if (identity) {
      return `${ip}:${identity.trim().toLowerCase()}`;
    }
    return ip;
  }

  public isRateLimited(ip: string, identity?: string): RateLimitStatus {
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

// Active store instance (swappable for multi-instance production engines)
let activeRateLimitStore: RateLimitStore = new MemoryRateLimitStore();

export function setRateLimitStore(store: RateLimitStore): void {
  activeRateLimitStore = store;
}

export function getRateLimitStore(): RateLimitStore {
  return activeRateLimitStore;
}

export const authRateLimiterStore = {
  isRateLimited: (ip: string, identity?: string) => activeRateLimitStore.isRateLimited(ip, identity),
  recordFailure: (ip: string, identity?: string) => activeRateLimitStore.recordFailure(ip, identity),
  recordSuccess: (ip: string, identity?: string) => activeRateLimitStore.recordSuccess(ip, identity),
  clear: () => activeRateLimitStore.clear(),
};

/**
 * Express middleware checking rate limits before allowing login evaluation.
 * Note: Relies securely on req.ip (governed by Express trust proxy settings).
 */
export function authRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const identity = typeof req.body?.identity === 'string' ? req.body.identity : undefined;

  const status = activeRateLimitStore.isRateLimited(ip, identity);

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
