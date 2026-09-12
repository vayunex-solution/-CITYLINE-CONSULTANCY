/**
 * CITYLINE CONSULTANCY — Generic Repository Foundation Test Suite
 * Validates abstract repository CRUD contracts, pagination mathematics,
 * transaction propagation, and error normalization without touching business entities.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  AbstractKnexRepository,
  PaginationOptions,
  PaginatedResult,
} from '../src/repositories/base.repository';
import { AppError } from '../src/utils/app-error';
import { Knex } from 'knex';

interface DummyEntity {
  id: string;
  name: string;
  status: string;
}

// Test implementation of AbstractKnexRepository for infrastructure verification
class DummyRepository extends AbstractKnexRepository<DummyEntity, string> {
  protected readonly tableName = 'dummy_test_table';

  // Expose protected method for testing
  public getTestQuery(trx?: Knex.Transaction): Knex.QueryBuilder {
    return this.getQuery(trx);
  }
}

describe('Generic Repository Data Access Foundation', () => {
  const repo = new DummyRepository();

  it('Exposes typed CRUD and pagination contract methods', () => {
    assert.strictEqual(typeof repo.findById, 'function');
    assert.strictEqual(typeof repo.findAll, 'function');
    assert.strictEqual(typeof repo.findPaginated, 'function');
    assert.strictEqual(typeof repo.create, 'function');
    assert.strictEqual(typeof repo.update, 'function');
    assert.strictEqual(typeof repo.delete, 'function');
    assert.strictEqual(typeof repo.count, 'function');
  });

  it('Calculates pagination metadata accurately', async () => {
    // Mock query builder for findPaginated
    const totalRecords = 45;
    const mockItems = Array.from({ length: 10 }, (_, i) => ({
      id: `item-${i + 1}`,
      name: `Test Item ${i + 1}`,
      status: 'active',
    }));

    const mockQueryBuilder = {
      where: function () {
        return this;
      },
      count: async () => [{ total: totalRecords }],
      orderBy: function () {
        return this;
      },
      limit: function () {
        return this;
      },
      offset: function () {
        return this;
      },
      then: (resolve: (data: unknown) => unknown) => resolve(mockItems),
    };

    const mockClient = (() => mockQueryBuilder) as unknown as Knex;
    const mockTrx = mockClient as unknown as Knex.Transaction;

    const options: PaginationOptions = { page: 2, limit: 10 };
    const result: PaginatedResult<DummyEntity> = await repo.findPaginated(
      options,
      { status: 'active' },
      mockTrx
    );

    assert.strictEqual(result.page, 2);
    assert.strictEqual(result.limit, 10);
    assert.strictEqual(result.total, 45);
    assert.strictEqual(result.totalPages, 5);
    assert.strictEqual(result.hasNextPage, true);
    assert.strictEqual(result.hasPrevPage, true);
    assert.strictEqual(result.items.length, 10);
  });

  it('Sanitizes out-of-bounds pagination options (negative page, oversized limit)', async () => {
    const mockQueryBuilder = {
      where: function () {
        return this;
      },
      count: async () => [{ total: 10 }],
      orderBy: function () {
        return this;
      },
      limit: function () {
        return this;
      },
      offset: function () {
        return this;
      },
      then: (resolve: (data: unknown) => unknown) => resolve([]),
    };

    const mockTrx = (() => mockQueryBuilder) as unknown as Knex.Transaction;

    // Passing invalid negative page and excessive limit > 100
    const result = await repo.findPaginated({ page: -5, limit: 9999 }, undefined, mockTrx);

    assert.strictEqual(result.page, 1, 'Page should be clamped to 1');
    assert.strictEqual(result.limit, 100, 'Limit should be clamped to 100');
  });

  it('Catches raw database query exceptions and throws normalized AppErrors', async () => {
    const errorQueryBuilder = {
      where: function () {
        return this;
      },
      first: async () => {
        const error = new Error("Duplicate entry 'test' for key 'PRIMARY'") as Error & {
          code: string;
          errno: number;
        };
        error.code = 'ER_DUP_ENTRY';
        error.errno = 1062;
        throw error;
      },
    };

    const mockTrx = (() => errorQueryBuilder) as unknown as Knex.Transaction;

    await assert.rejects(
      async () => {
        await repo.findById('duplicate-id', mockTrx);
      },
      (err: unknown) => {
        assert.ok(err instanceof AppError, 'Thrown error must be an instance of AppError');
        assert.strictEqual((err as AppError).statusCode, 409);
        assert.strictEqual((err as AppError).code, 'DUPLICATE_RECORD');
        return true;
      }
    );
  });
});
