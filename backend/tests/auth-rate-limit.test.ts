/**
 * CITYLINE CONSULTANCY — Authentication Rate Limiting & Brute-Force Tests
 * Verifies attempt tracking, lockout activation, and reset behavior.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { authRateLimiterStore } from '../src/middleware/auth-rate-limit.middleware';
import { env } from '../src/config/env.config';

describe('Authentication Rate Limiter & Brute-Force Protection', () => {
  beforeEach(() => {
    authRateLimiterStore.clear();
  });

  it('permits initial attempts below the configured threshold', () => {
    const ip = '192.168.1.100';
    const status = authRateLimiterStore.isRateLimited(ip, 'admin');
    assert.equal(status.limited, false);
  });

  it('triggers temporary lockout after reaching the max failed attempt threshold', () => {
    const ip = '192.168.1.101';
    const identity = 'admin_target';

    // Record 4 failed attempts (still permitted)
    for (let i = 0; i < 4; i++) {
      authRateLimiterStore.recordFailure(ip, identity);
      const status = authRateLimiterStore.isRateLimited(ip, identity);
      assert.equal(status.limited, false, `Attempt ${i + 1} should not be locked`);
    }

    // 5th failed attempt triggers rate limit
    authRateLimiterStore.recordFailure(ip, identity);
    const status = authRateLimiterStore.isRateLimited(ip, identity);
    assert.equal(status.limited, true, '5th failure must trigger rate limiting');
    assert.ok(status.retryAfterSeconds && status.retryAfterSeconds > 0);
  });

  it('resets failure records upon successful authentication', () => {
    const ip = '192.168.1.102';
    const identity = 'valid_admin';

    // Record 3 failed attempts
    for (let i = 0; i < 3; i++) {
      authRateLimiterStore.recordFailure(ip, identity);
    }

    // Record success
    authRateLimiterStore.recordSuccess(ip, identity);

    // Rate limiter should now show 0 recorded failures for this key
    const status = authRateLimiterStore.isRateLimited(ip, identity);
    assert.equal(status.limited, false);
  });

  it('isolates rate limiting between different client IP addresses', () => {
    const ip1 = '10.0.0.1';
    const ip2 = '10.0.0.2';
    const identity = 'shared_target';

    // Max out attempts for IP 1
    for (let i = 0; i < env.AUTH_RATE_LIMIT_MAX_ATTEMPTS; i++) {
      authRateLimiterStore.recordFailure(ip1, identity);
    }

    assert.equal(authRateLimiterStore.isRateLimited(ip1, identity).limited, true);
    // IP 2 must still be unaffected
    assert.equal(authRateLimiterStore.isRateLimited(ip2, identity).limited, false);
  });

  it('supports replaceable RateLimitStore implementations via setRateLimitStore', () => {
    let customCalled = false;
    const customStore = {
      isRateLimited: () => {
        customCalled = true;
        return { limited: false };
      },
      recordFailure: () => {},
      recordSuccess: () => {},
      clear: () => {},
    };

    const { setRateLimitStore, MemoryRateLimitStore } = require('../src/middleware/auth-rate-limit.middleware');
    setRateLimitStore(customStore);

    authRateLimiterStore.isRateLimited('1.1.1.1', 'test');
    assert.equal(customCalled, true, 'Pluggable store must intercept calls');

    // Restore standard store
    setRateLimitStore(new MemoryRateLimitStore());
  });

  it('prevents spoofed X-Forwarded-For headers from bypassing rate limiting under untrusted proxy configuration', async () => {
    const express = require('express');
    const request = require('supertest');
    const { authRateLimiter } = require('../src/middleware/auth-rate-limit.middleware');

    const app = express();
    app.set('trust proxy', false); // Deliberate untrusted proxy setting
    app.use(express.json());
    app.post('/test-login', authRateLimiter, (_req: any, res: any) => {
      // Simulate failed login attempt
      authRateLimiterStore.recordFailure(_req.ip || _req.socket.remoteAddress, _req.body?.identity);
      res.status(401).json({ success: false });
    });

    // Make 5 requests with spoofed rotating X-Forwarded-For headers
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/test-login')
        .set('X-Forwarded-For', `203.0.113.${i + 1}`) // Spoofed rotating IP
        .send({ identity: 'target_user' });
    }

    // 6th request with yet another spoofed IP must STILL be rate-limited because socket IP is identical
    const blockedRes = await request(app)
      .post('/test-login')
      .set('X-Forwarded-For', '203.0.113.99')
      .send({ identity: 'target_user' });

    assert.equal(blockedRes.status, 429, 'Spoofed X-Forwarded-For must not bypass rate limit');
  });
});
