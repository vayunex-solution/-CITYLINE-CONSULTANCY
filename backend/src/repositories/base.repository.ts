/**
 * CITYLINE CONSULTANCY — Base Repository & Data Access Foundation
 * Provides generic, transaction-aware data access interfaces and Knex base implementation.
 *
 * GOVERNANCE:
 * - Establishes conventions for query execution, transactions, error normalization, and pagination.
 * - Does NOT implement any business-specific repositories (Jobs, Visas, Enquiries, etc. deferred to later phases).
 * - Wraps all database errors with normalizeDatabaseError to prevent SQL leaks.
 */

import { Knex } from 'knex';
import { getDbClient } from '../database/connection';
import { normalizeDatabaseError } from '../database/database-error';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BaseRepository<T, TId = string | number> {
  findById(id: TId, trx?: Knex.Transaction): Promise<T | null>;
  findAll(filter?: Partial<T>, trx?: Knex.Transaction): Promise<T[]>;
  findPaginated(
    options?: PaginationOptions,
    filter?: Partial<T>,
    trx?: Knex.Transaction
  ): Promise<PaginatedResult<T>>;
  create(item: Partial<T>, trx?: Knex.Transaction): Promise<T>;
  update(id: TId, item: Partial<T>, trx?: Knex.Transaction): Promise<T | null>;
  delete(id: TId, trx?: Knex.Transaction): Promise<boolean>;
  count(filter?: Partial<T>, trx?: Knex.Transaction): Promise<number>;
}

/**
 * Abstract Knex repository providing standard CRUD and pagination primitives.
 */
export abstract class AbstractKnexRepository<T extends Record<string, unknown> & { id?: TId }, TId = string | number>
  implements BaseRepository<T, TId>
{
  protected abstract readonly tableName: string;

  /**
   * Returns a Knex query builder bound to either the active transaction or the default client.
   */
  protected getQuery(trx?: Knex.Transaction): Knex.QueryBuilder {
    const client = trx || getDbClient();
    return client(this.tableName);
  }

  public async findById(id: TId, trx?: Knex.Transaction): Promise<T | null> {
    try {
      const row = await this.getQuery(trx).where({ id }).first();
      return (row as T) || null;
    } catch (error) {
      throw normalizeDatabaseError(error, `${this.tableName}.findById`);
    }
  }

  public async findAll(filter?: Partial<T>, trx?: Knex.Transaction): Promise<T[]> {
    try {
      let query = this.getQuery(trx);
      if (filter && Object.keys(filter).length > 0) {
        query = query.where(filter as Record<string, unknown>);
      }
      const rows = await query;
      return rows as T[];
    } catch (error) {
      throw normalizeDatabaseError(error, `${this.tableName}.findAll`);
    }
  }

  public async findPaginated(
    options: PaginationOptions = {},
    filter?: Partial<T>,
    trx?: Knex.Transaction
  ): Promise<PaginatedResult<T>> {
    try {
      const page = Math.max(1, Math.floor(options.page || 1));
      const limit = Math.min(100, Math.max(1, Math.floor(options.limit || 20)));
      const offset = (page - 1) * limit;

      let countQuery = this.getQuery(trx);
      let dataQuery = this.getQuery(trx);

      if (filter && Object.keys(filter).length > 0) {
        countQuery = countQuery.where(filter as Record<string, unknown>);
        dataQuery = dataQuery.where(filter as Record<string, unknown>);
      }

      const [{ total }] = (await countQuery.count({ total: '*' })) as [{ total: string | number }];
      const totalCount = Number(total);

      if (options.sortBy) {
        const safeSortBy = /^[a-zA-Z0-9_.]+$/.test(options.sortBy) ? options.sortBy : 'id';
        const safeSortOrder = options.sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc';
        dataQuery = dataQuery.orderBy(safeSortBy, safeSortOrder);
      }

      const items = (await dataQuery.limit(limit).offset(offset)) as T[];
      const totalPages = Math.ceil(totalCount / limit) || 1;

      return {
        items,
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw normalizeDatabaseError(error, `${this.tableName}.findPaginated`);
    }
  }

  public async create(item: Partial<T>, trx?: Knex.Transaction): Promise<T> {
    try {
      await this.getQuery(trx).insert(item as Record<string, unknown>);
      // If item has an id, retrieve by id; otherwise retrieve by insert
      if (item.id) {
        const created = await this.findById(item.id, trx);
        if (created) return created;
      }
      return item as T;
    } catch (error) {
      throw normalizeDatabaseError(error, `${this.tableName}.create`);
    }
  }

  public async update(id: TId, item: Partial<T>, trx?: Knex.Transaction): Promise<T | null> {
    try {
      const rowsAffected = await this.getQuery(trx)
        .where({ id })
        .update(item as Record<string, unknown>);

      if (rowsAffected === 0) {
        return null;
      }

      return await this.findById(id, trx);
    } catch (error) {
      throw normalizeDatabaseError(error, `${this.tableName}.update`);
    }
  }

  public async delete(id: TId, trx?: Knex.Transaction): Promise<boolean> {
    try {
      const rowsAffected = await this.getQuery(trx).where({ id }).delete();
      return rowsAffected > 0;
    } catch (error) {
      throw normalizeDatabaseError(error, `${this.tableName}.delete`);
    }
  }

  public async count(filter?: Partial<T>, trx?: Knex.Transaction): Promise<number> {
    try {
      let query = this.getQuery(trx);
      if (filter && Object.keys(filter).length > 0) {
        query = query.where(filter as Record<string, unknown>);
      }
      const [{ total }] = (await query.count({ total: '*' })) as [{ total: string | number }];
      return Number(total);
    } catch (error) {
      throw normalizeDatabaseError(error, `${this.tableName}.count`);
    }
  }
}
