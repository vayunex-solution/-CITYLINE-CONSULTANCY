/**
 * CITYLINE CONSULTANCY — CSRF Protection Tests
 * Verifies Double-Submit Cookie CSRF validation on mutating HTTP requests.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { csrfProtection } from '../src/middleware/csrf.middleware';
import { generateCsrfToken } from '../src/auth/token';
import { errorHandlerMiddleware } from '../src/middleware/error-handler.middleware';
import { env } from '../src/config/env.config';

describe('CSRF Double-Submit Protection Middleware', () => {
  const testApp = express();
  testApp.use(cookieParser());
  testApp.use(csrfProtection);

  testApp.get('/test-safe', (_req, res) => {
    res.json({ ok: true });
  });

  testApp.post('/test-mutate', (_req, res) => {
    res.json({ success: true, mutated: true });
  });

  // Emulate public login path exemption
  testApp.post(`${env.API_PREFIX}/admin/auth/login`, (_req, res) => {
    res.json({ success: true, loggedIn: true });
  });

  testApp.use(errorHandlerMiddleware);

  it('permits safe GET requests without any CSRF tokens', async () => {
    const res = await request(testApp).get('/test-safe');
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it('permits public login route without CSRF token (session establishment)', async () => {
    const res = await request(testApp).post(`${env.API_PREFIX}/admin/auth/login`);
    assert.equal(res.status, 200);
    assert.equal(res.body.loggedIn, true);
  });

  it('rejects POST request when CSRF cookie or header is missing', async () => {
    // Missing both
    const res1 = await request(testApp).post('/test-mutate');
    assert.equal(res1.status, 403);
    assert.equal(res1.body.error.code, 'CSRF_TOKEN_INVALID');

    // Cookie present, header missing
    const csrfToken = generateCsrfToken();
    const res2 = await request(testApp)
      .post('/test-mutate')
      .set('Cookie', [`${env.AUTH_CSRF_COOKIE_NAME}=${csrfToken}`]);

    assert.equal(res2.status, 403);
    assert.equal(res2.body.error.code, 'CSRF_TOKEN_INVALID');

    // Header present, cookie missing
    const res3 = await request(testApp)
      .post('/test-mutate')
      .set('X-CSRF-Token', csrfToken);

    assert.equal(res3.status, 403);
    assert.equal(res3.body.error.code, 'CSRF_TOKEN_INVALID');
  });

  it('rejects POST request when header token does not match cookie token', async () => {
    const cookieToken = generateCsrfToken();
    const attackerToken = generateCsrfToken();

    const res = await request(testApp)
      .post('/test-mutate')
      .set('Cookie', [`${env.AUTH_CSRF_COOKIE_NAME}=${cookieToken}`])
      .set('X-CSRF-Token', attackerToken);

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'CSRF_TOKEN_INVALID');
  });

  it('permits POST request when header token matches cookie token exactly', async () => {
    const validToken = generateCsrfToken();

    const res = await request(testApp)
      .post('/test-mutate')
      .set('Cookie', [`${env.AUTH_CSRF_COOKIE_NAME}=${validToken}`])
      .set('X-CSRF-Token', validToken);

    assert.equal(res.status, 200);
    assert.equal(res.body.mutated, true);
  });
});
