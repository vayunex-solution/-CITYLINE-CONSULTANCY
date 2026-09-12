/**
 * CITYLINE CONSULTANCY — Backend Health Check Automated Test
 * Verifies GET /health and GET /api/v1/health endpoints.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app';

describe('Health Check API Foundation', () => {
  it('GET /health should return 200 with standard health response structure', async () => {
    const res = await request(app).get('/health');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data);
    assert.strictEqual(res.body.data.status, 'ok');
    assert.strictEqual(res.body.data.database, 'unverified');
    assert.strictEqual(res.body.data.version, '1.0.0');
    assert.ok(typeof res.body.data.uptimeSeconds === 'number');
    assert.ok(res.headers['x-request-id']);
  });

  it('GET /api/v1/health should return 200 matching versioned prefix', async () => {
    const res = await request(app).get('/api/v1/health');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'ok');
  });

  it('GET /api/v1/nonexistent should return 404 with standard error envelope', async () => {
    const res = await request(app).get('/api/v1/nonexistent');

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'NOT_FOUND');
    assert.ok(res.body.timestamp);
    assert.ok(res.headers['x-request-id']);
  });
});
