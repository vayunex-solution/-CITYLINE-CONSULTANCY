/**
 * CITYLINE CONSULTANCY — HTTP Pipeline & Security Middleware Test Suite
 * Validates request correlation, centralized error handling, 404 responses,
 * body size limits, malformed JSON defense, and CORS policies.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app';

describe('HTTP Pipeline & Middleware Baseline', () => {
  it('GET /api/v1/health returns minimal 200 { status: "ok" } without sensitive data', async () => {
    const res = await request(app).get('/api/v1/health');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.deepStrictEqual(res.body.data, { status: 'ok' });

    // Assert zero internal system disclosures
    assert.strictEqual(res.body.data.environment, undefined);
    assert.strictEqual(res.body.data.database, undefined);
    assert.strictEqual(res.body.data.version, undefined);
    assert.strictEqual(res.body.data.storage, undefined);
    assert.strictEqual(res.body.data.host, undefined);

    assert.ok(res.headers['x-request-id']);
  });

  it('Generates a unique UUID request ID when none is supplied', async () => {
    const res = await request(app).get('/api/v1/health');

    const reqId = res.headers['x-request-id'];
    assert.ok(reqId, 'X-Request-ID must be present on response');
    // UUIDv4 format check
    assert.match(
      reqId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      'Generated request ID must be a valid UUIDv4'
    );
  });

  it('Preserves and forwards a trusted, well-formed X-Request-ID header', async () => {
    const trustedId = 'client-trace-id-abc12345';
    const res = await request(app)
      .get('/api/v1/health')
      .set('x-request-id', trustedId);

    assert.strictEqual(res.headers['x-request-id'], trustedId);
  });

  it('Replaces a malformed or oversized X-Request-ID with a fresh UUID', async () => {
    const malformedId = 'bad/characters!@#$%^&*()_+' + 'a'.repeat(100);
    const res = await request(app)
      .get('/api/v1/health')
      .set('x-request-id', malformedId);

    const resultingId = res.headers['x-request-id'];
    assert.notStrictEqual(resultingId, malformedId);
    assert.match(
      resultingId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('Centralized 404 handler returns standard safe error envelope for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown-endpoint');

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'NOT_FOUND');
    assert.ok(res.body.error.message.includes('/api/v1/unknown-endpoint'));
    assert.ok(res.body.timestamp);
    assert.ok(res.headers['x-request-id']);
  });

  it('Rejects malformed JSON payloads with 400 MALFORMED_JSON', async () => {
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{ "invalidJson": missing_quotes }');

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'MALFORMED_JSON');
    assert.strictEqual(res.body.error.message, 'Request body contains invalid JSON syntax');
  });

  it('Enforces 100kb body limit, rejecting oversized JSON payloads with 413 PAYLOAD_TOO_LARGE', async () => {
    // Generate payload larger than 100kb
    const largeString = 'x'.repeat(105 * 1024);
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ data: largeString }));

    assert.strictEqual(res.status, 413);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'PAYLOAD_TOO_LARGE');
  });

  it('Applies Helmet security headers on all responses', async () => {
    const res = await request(app).get('/api/v1/health');

    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    assert.ok(res.headers['x-frame-options'] || res.headers['content-security-policy']);
  });

  it('Sets controlled CORS headers for allowed client origin', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:3000');

    assert.strictEqual(res.headers['access-control-allow-origin'], 'http://localhost:3000');
    assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
  });
});
