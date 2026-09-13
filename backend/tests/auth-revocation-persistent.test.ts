/**
 * CITYLINE CONSULTANCY — Persistent Token Revocation Tests
 * Validates persistent database storage of revoked JWT identifiers,
 * survival across connection/service re-creations, and bounded expiration purges.
 *
 * GOVERNANCE:
 * - Uses a persistent disk-backed database file to strictly verify cross-process/restart persistence.
 * - Does NOT use in-memory Maps to fake persistence.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import knex, { Knex } from 'knex';
import jwt from 'jsonwebtoken';
import { DatabaseTokenRevocationStore } from '../src/auth/token-revocation';
import { createAdminToken, verifyAdminToken } from '../src/auth/token';
import { up } from '../src/database/migrations/20260913000001_create_revoked_tokens';

describe('Persistent Token Revocation Architecture', () => {
  const testDbFile = path.resolve(__dirname, './test-persistent-revocation.sqlite');
  let db1: Knex;

  before(async () => {
    // Clean up any stale test database file
    if (fs.existsSync(testDbFile)) {
      fs.unlinkSync(testDbFile);
    }

    // Initialize Knex with persistent disk-backed SQLite file
    db1 = knex({
      client: 'sqlite3',
      connection: { filename: testDbFile },
      useNullAsDefault: true,
    });

    // Run the production migration on the test database
    await up(db1);
  });

  after(async () => {
    if (db1) {
      await db1.destroy();
    }
    if (fs.existsSync(testDbFile)) {
      fs.unlinkSync(testDbFile);
    }
  });

  const sampleAdmin = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'test_admin',
    email: 'admin@citylineconsultancy.ae',
    role: 'super_admin' as const,
    roleId: 1,
  };

  it('1. Token is valid before revocation', async () => {
    const store = new DatabaseTokenRevocationStore(db1);
    const { token, jti } = createAdminToken(sampleAdmin);

    const verified = verifyAdminToken(token);
    assert.ok(verified, 'Token signature and claims must be valid');

    const isRevoked = await store.isRevoked(jti);
    assert.equal(isRevoked, false, 'Fresh token must not be revoked');
  });

  it('2. Token becomes invalid after persistent revocation', async () => {
    const store = new DatabaseTokenRevocationStore(db1);
    const { jti, exp } = createAdminToken(sampleAdmin);

    // Revoke token
    await store.revoke(jti, exp);

    const isRevoked = await store.isRevoked(jti);
    assert.equal(isRevoked, true, 'Revoked token must be identified as revoked');
  });

  it('3. Revoked token remains invalid after creating a fresh DB connection', async () => {
    const { jti, exp } = createAdminToken(sampleAdmin);

    // Revoke with Connection 1
    const store1 = new DatabaseTokenRevocationStore(db1);
    await store1.revoke(jti, exp);

    // Open a completely new and separate Knex DB connection to the persistent file
    const db2 = knex({
      client: 'sqlite3',
      connection: { filename: testDbFile },
      useNullAsDefault: true,
    });

    try {
      const store2 = new DatabaseTokenRevocationStore(db2);
      const isRevokedOnFreshConnection = await store2.isRevoked(jti);
      assert.equal(
        isRevokedOnFreshConnection,
        true,
        'Revocation record must persist across separate database connections'
      );
    } finally {
      await db2.destroy();
    }
  });

  it('4. Revoked token remains invalid after recreating the auth service instance', async () => {
    const { jti, exp } = createAdminToken(sampleAdmin);

    // Revoke with first service instance
    const service1 = new DatabaseTokenRevocationStore(db1);
    await service1.revoke(jti, exp);

    // Recreate service instance from scratch with a new client
    const freshDb = knex({
      client: 'sqlite3',
      connection: { filename: testDbFile },
      useNullAsDefault: true,
    });

    try {
      const service2 = new DatabaseTokenRevocationStore(freshDb);
      assert.equal(
        await service2.isRevoked(jti),
        true,
        'Revocation must survive application/service re-instantiation'
      );
    } finally {
      await freshDb.destroy();
    }
  });

  it('5. Revocation is keyed strictly by jti without collateral invalidation', async () => {
    const store = new DatabaseTokenRevocationStore(db1);
    const tokenA = createAdminToken(sampleAdmin);
    const tokenB = createAdminToken(sampleAdmin);

    assert.notEqual(tokenA.jti, tokenB.jti, 'Different tokens must have distinct jti values');

    // Revoke only token A
    await store.revoke(tokenA.jti, tokenA.exp);

    assert.equal(await store.isRevoked(tokenA.jti), true, 'Token A must be revoked');
    assert.equal(await store.isRevoked(tokenB.jti), false, 'Token B must remain valid');
  });

  it('6. Expired revocation records can be safely pruned while active records remain', async () => {
    const store = new DatabaseTokenRevocationStore(db1);

    // Record an expired revocation (expired 10 seconds ago)
    const expiredJti = '00000000-0000-0000-0000-000000000001';
    const pastTimestamp = Math.floor(Date.now() / 1000) - 10;
    await store.revoke(expiredJti, pastTimestamp);

    // Record an active revocation (expires in 1800 seconds)
    const activeJti = '00000000-0000-0000-0000-000000000002';
    const futureTimestamp = Math.floor(Date.now() / 1000) + 1800;
    await store.revoke(activeJti, futureTimestamp);

    // Purge expired records
    const purgedCount = await store.purgeExpired();
    assert.ok(purgedCount >= 1, 'At least one expired record must be pruned');

    // Verify active record still exists in database
    const activeExists = await db1('revoked_tokens').where({ jti: activeJti }).first();
    assert.ok(activeExists, 'Active revocation record must remain after purge');

    // Verify expired record was pruned from database
    const expiredExists = await db1('revoked_tokens').where({ jti: expiredJti }).first();
    assert.equal(expiredExists, undefined, 'Expired record must have been deleted');
  });

  it('7. Failed revocation persistence throws error and does not report false success', async () => {
    // Create broken DB client that fails on insert
    const brokenDb = ((_tableName: string) => {
      return {
        insert: async () => {
          throw new Error('Database disk write I/O error');
        },
      };
    }) as any;

    const brokenStore = new DatabaseTokenRevocationStore(brokenDb);

    await assert.rejects(
      async () => {
        await brokenStore.revoke('some-jti', Math.floor(Date.now() / 1000) + 300);
      },
      /Database disk write I\/O error/,
      'Revocation failure must propagate error to prevent false logout reporting'
    );
  });

  it('8. Revocation persistence writes directly to revoked_tokens database table', async () => {
    const store = new DatabaseTokenRevocationStore(db1);
    const { jti, exp } = createAdminToken(sampleAdmin);

    await store.revoke(jti, exp);

    const record = await db1('revoked_tokens').where({ jti }).first();
    assert.ok(record, 'Revocation record must exist in revoked_tokens table');
    assert.equal(record.jti, jti);
  });

  it('9. Valid non-revoked tokens continue to authenticate', async () => {
    const store = new DatabaseTokenRevocationStore(db1);
    const { token, jti } = createAdminToken(sampleAdmin);

    assert.ok(verifyAdminToken(token) !== null);
    assert.equal(await store.isRevoked(jti), false);
  });

  it('10. Token expiration via JWT exp claim validation functions independently of the revocation table', () => {
    // Token with negative expiration (already expired)
    const expiredToken = jwt.sign(
      { sub: sampleAdmin.id, role: sampleAdmin.role, jti: 'independent-expired-jti' },
      process.env.AUTH_TOKEN_SECRET || 'development_insecure_auth_token_secret_must_be_at_least_32_characters_long_for_security',
      { algorithm: 'HS256', expiresIn: '-10s' }
    );

    // Natural JWT exp claim validation rejects without needing revocation lookup
    const claims = verifyAdminToken(expiredToken);
    assert.equal(claims, null, 'Expired token must be rejected by JWT exp claim validation');
  });
});
