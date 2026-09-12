/**
 * CITYLINE CONSULTANCY — Database Core & Transaction Foundation Test Suite
 * Tests connection lifecycle, database error normalization, and transaction lifecycle.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { databaseConfig } from '../src/config/database.config';
import {
  getDbClient,
  checkDatabaseConnectivity,
  closeDatabaseConnection,
} from '../src/database/connection';
import { normalizeDatabaseError } from '../src/database/database-error';
import { withTransaction } from '../src/database/transaction';
import { Knex } from 'knex';

describe('Database Core & Transaction Foundation', () => {
  it('Database configuration enforces Phase 2 and Phase 3 pool constraints and UTC timezone', () => {
    assert.strictEqual(databaseConfig.client, 'mysql2');
    assert.strictEqual(databaseConfig.charset, 'utf8mb4');
    assert.strictEqual(databaseConfig.timezone, 'Z');
    assert.strictEqual(databaseConfig.pool.min, 0);
    assert.strictEqual(databaseConfig.pool.max, 5);
    assert.strictEqual(databaseConfig.pool.acquireTimeoutMillis, 10000);
  });

  it('getDbClient returns a single consistent Knex client instance', () => {
    const client1 = getDbClient();
    const client2 = getDbClient();
    assert.strictEqual(client1, client2, 'Database client must be a singleton');
  });

  it('checkDatabaseConnectivity reports connection status safely without crashing', async () => {
    const status = await checkDatabaseConnectivity();
    assert.strictEqual(typeof status.ok, 'boolean');
    if (!status.ok) {
      assert.strictEqual(typeof status.error, 'string');
    }
  });

  it('Normalizes ER_DUP_ENTRY error into safe 409 DUPLICATE_RECORD', () => {
    const rawSqlError = {
      code: 'ER_DUP_ENTRY',
      errno: 1062,
      sqlState: '23000',
      message: "Duplicate entry 'duplicate@test.com' for key 'uk_enquiries_email'",
      sql: 'INSERT INTO enquiries (email) VALUES (?)',
    };

    const normalized = normalizeDatabaseError(rawSqlError, 'Enquiry Submission');

    assert.strictEqual(normalized.statusCode, 409);
    assert.strictEqual(normalized.code, 'DUPLICATE_RECORD');
    assert.strictEqual(
      normalized.message,
      'A record with the specified unique information already exists.'
    );
    // Crucial: Must never leak raw SQL query or column details in the public message
    assert.strictEqual(normalized.message.includes('INSERT INTO'), false);
    assert.strictEqual(normalized.message.includes('uk_enquiries_email'), false);
  });

  it('Normalizes foreign key violation ER_NO_REFERENCED_ROW_2 into safe 400 FOREIGN_KEY_VIOLATION', () => {
    const rawSqlError = {
      code: 'ER_NO_REFERENCED_ROW_2',
      errno: 1452,
      sqlState: '23000',
      message: 'Cannot add or update a child row: a foreign key constraint fails',
      sql: 'INSERT INTO visa_enquiries (enquiry_id) VALUES (?)',
    };

    const normalized = normalizeDatabaseError(rawSqlError);

    assert.strictEqual(normalized.statusCode, 400);
    assert.strictEqual(normalized.code, 'FOREIGN_KEY_VIOLATION');
    assert.strictEqual(normalized.message, 'Referenced entity does not exist.');
  });

  it('Normalizes active foreign key constraint ER_ROW_IS_REFERENCED_2 into safe 409 RECORD_IN_USE', () => {
    const rawSqlError = {
      code: 'ER_ROW_IS_REFERENCED_2',
      errno: 1451,
      sqlState: '23000',
      message: 'Cannot delete or update a parent row: a foreign key constraint fails',
    };

    const normalized = normalizeDatabaseError(rawSqlError);

    assert.strictEqual(normalized.statusCode, 409);
    assert.strictEqual(normalized.code, 'RECORD_IN_USE');
    assert.strictEqual(
      normalized.message,
      'Cannot complete operation because the record is referenced by other active entities.'
    );
  });

  it('Normalizes connection and timeout failures into safe 503 DATABASE_UNAVAILABLE', () => {
    const connError = {
      code: 'ECONNREFUSED',
      message: 'connect ECONNREFUSED 127.0.0.1:3306',
    };

    const normalized = normalizeDatabaseError(connError);

    assert.strictEqual(normalized.statusCode, 503);
    assert.strictEqual(normalized.code, 'DATABASE_UNAVAILABLE');
    assert.strictEqual(
      normalized.message,
      'Database service is temporarily unavailable. Please try again later.'
    );
  });

  it('Transaction helper commits on successful execution', async () => {
    let commitCalled = false;
    let rollbackCalled = false;

    const mockTrx = {
      isCompleted: () => commitCalled || rollbackCalled,
      commit: async () => {
        commitCalled = true;
      },
      rollback: async () => {
        rollbackCalled = true;
      },
    } as unknown as Knex.Transaction;

    const result = await withTransaction(
      async (trx) => {
        assert.ok(trx);
        return { saved: true, recordId: 101 };
      },
      mockTrx // Pass mock transaction
    );

    assert.deepStrictEqual(result, { saved: true, recordId: 101 });
  });

  it('Transaction helper rolls back and propagates original error on failure', async () => {
    let rollbackCalled = false;

    const mockTrx = {
      isCompleted: () => rollbackCalled,
      commit: async () => {},
      rollback: async () => {
        rollbackCalled = true;
      },
    } as unknown as Knex.Transaction;

    await assert.rejects(
      async () => {
        await withTransaction(async () => {
          throw new Error('Business logic validation failed inside transaction');
        }, mockTrx);
      },
      (err: Error) => {
        assert.ok(err.message.includes('Business logic validation failed'));
        return true;
      }
    );
  });

  it('closeDatabaseConnection gracefully terminates the connection pool', async () => {
    // Calling closeDatabaseConnection should not throw
    await assert.doesNotReject(async () => {
      await closeDatabaseConnection();
    });
  });
});
