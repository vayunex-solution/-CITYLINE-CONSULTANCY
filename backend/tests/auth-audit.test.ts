/**
 * CITYLINE CONSULTANCY — Audit Logging & Redaction Tests
 * Verifies that audit events record operational data and strictly redact sensitive credentials.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { recordAuditEvent } from '../src/auth/audit';

describe('Administrative Audit Logging & Sensitive Data Redaction', () => {
  it('strictly redacts passwords, tokens, and secrets from audit log details', async () => {
    let capturedRow: Record<string, unknown> | null = null;

    // Emulate mock Knex client
    const mockDb = ((tableName: string) => {
      assert.equal(tableName, 'audit_logs');
      return {
        insert: async (row: Record<string, unknown>) => {
          capturedRow = row;
        },
      };
    }) as any;

    mockDb.fn = { now: () => new Date() };

    await recordAuditEvent({
      actorAdminId: '550e8400-e29b-41d4-a716-446655440000',
      action: 'login_failed',
      resourceType: 'auth',
      requestId: 'test-trace-id',
      clientIp: '127.0.0.1',
      details: {
        username: 'admin_test',
        password: 'PlainTextSecretPassword123!',
        password_hash: '$argon2id$v=19$m=19456,t=2,p=1$abc$xyz',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token',
        secret: 'super_secret_key',
        cookie: 'clc_admin_token=secret',
        safeProperty: 'legitimate_audit_context',
      },
      trx: mockDb,
    });

    assert.ok(capturedRow, 'Audit log row must be captured');
    assert.equal(capturedRow.actor_admin_id, '550e8400-e29b-41d4-a716-446655440000');
    assert.equal(capturedRow.action, 'login_failed');

    const details = JSON.parse(capturedRow.details_json as string);

    // Verify redactions
    assert.equal(details.password, '[REDACTED]');
    assert.equal(details.password_hash, '[REDACTED]');
    assert.equal(details.token, '[REDACTED]');
    assert.equal(details.secret, '[REDACTED]');
    assert.equal(details.cookie, '[REDACTED]');

    // Verify safe properties preserved
    assert.equal(details.username, 'admin_test');
    assert.equal(details.safeProperty, 'legitimate_audit_context');
  });

  it('propagates database errors when executing inside a transaction', async () => {
    const failingDb = ((_tableName: string) => {
      return {
        insert: async () => {
          throw new Error('Database transaction connection aborted');
        },
      };
    }) as any;
    failingDb.fn = { now: () => new Date() };

    await assert.rejects(
      async () => {
        await recordAuditEvent({
          action: 'login_success',
          trx: failingDb,
        });
      },
      /Database transaction connection aborted/
    );
  });
});
