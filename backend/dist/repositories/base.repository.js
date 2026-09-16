"use strict";
/**
 * CITYLINE CONSULTANCY — Base Repository & Data Access Foundation
 * Provides generic, transaction-aware data access interfaces and Knex base implementation.
 *
 * GOVERNANCE:
 * - Establishes conventions for query execution, transactions, error normalization, and pagination.
 * - Does NOT implement any business-specific repositories (Jobs, Visas, Enquiries, etc. deferred to later phases).
 * - Wraps all database errors with normalizeDatabaseError to prevent SQL leaks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractKnexRepository = void 0;
const connection_1 = require("../database/connection");
const database_error_1 = require("../database/database-error");
/**
 * Abstract Knex repository providing standard CRUD and pagination primitives.
 */
class AbstractKnexRepository {
    /**
     * Returns a Knex query builder bound to either the active transaction or the default client.
     */
    getQuery(trx) {
        const client = trx || (0, connection_1.getDbClient)();
        return client(this.tableName);
    }
    async findById(id, trx) {
        try {
            const row = await this.getQuery(trx).where({ id }).first();
            return row || null;
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, `${this.tableName}.findById`);
        }
    }
    async findAll(filter, trx) {
        try {
            let query = this.getQuery(trx);
            if (filter && Object.keys(filter).length > 0) {
                query = query.where(filter);
            }
            const rows = await query;
            return rows;
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, `${this.tableName}.findAll`);
        }
    }
    async findPaginated(options = {}, filter, trx) {
        try {
            const page = Math.max(1, Math.floor(options.page || 1));
            const limit = Math.min(100, Math.max(1, Math.floor(options.limit || 20)));
            const offset = (page - 1) * limit;
            let countQuery = this.getQuery(trx);
            let dataQuery = this.getQuery(trx);
            if (filter && Object.keys(filter).length > 0) {
                countQuery = countQuery.where(filter);
                dataQuery = dataQuery.where(filter);
            }
            const [{ total }] = (await countQuery.count({ total: '*' }));
            const totalCount = Number(total);
            if (options.sortBy) {
                const safeSortBy = /^[a-zA-Z0-9_.]+$/.test(options.sortBy) ? options.sortBy : 'id';
                const safeSortOrder = options.sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc';
                dataQuery = dataQuery.orderBy(safeSortBy, safeSortOrder);
            }
            const items = (await dataQuery.limit(limit).offset(offset));
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
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, `${this.tableName}.findPaginated`);
        }
    }
    async create(item, trx) {
        try {
            await this.getQuery(trx).insert(item);
            // If item has an id, retrieve by id; otherwise retrieve by insert
            if (item.id) {
                const created = await this.findById(item.id, trx);
                if (created)
                    return created;
            }
            return item;
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, `${this.tableName}.create`);
        }
    }
    async update(id, item, trx) {
        try {
            const rowsAffected = await this.getQuery(trx)
                .where({ id })
                .update(item);
            if (rowsAffected === 0) {
                return null;
            }
            return await this.findById(id, trx);
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, `${this.tableName}.update`);
        }
    }
    async delete(id, trx) {
        try {
            const rowsAffected = await this.getQuery(trx).where({ id }).delete();
            return rowsAffected > 0;
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, `${this.tableName}.delete`);
        }
    }
    async count(filter, trx) {
        try {
            let query = this.getQuery(trx);
            if (filter && Object.keys(filter).length > 0) {
                query = query.where(filter);
            }
            const [{ total }] = (await query.count({ total: '*' }));
            return Number(total);
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, `${this.tableName}.count`);
        }
    }
}
exports.AbstractKnexRepository = AbstractKnexRepository;
