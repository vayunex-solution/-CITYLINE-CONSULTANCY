"use strict";
/**
 * CITYLINE CONSULTANCY — Database Transaction Foundation
 * Provides robust, atomic transaction lifecycle management for business operations.
 *
 * GOVERNANCE:
 * - Begins transaction, commits on success, rolls back on error.
 * - Propagates original errors cleanly without swallowing.
 * - Supports nested / existing transactions without creating superfluous sub-transactions.
 * - Ensures proper cleanup of transaction handles.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = withTransaction;
const connection_1 = require("./connection");
const database_error_1 = require("./database-error");
/**
 * Executes a callback function within an atomic transaction boundary.
 *
 * @param callback Async function executing data access operations via the provided transaction handle.
 * @param existingTrx Optional existing transaction. If passed, the callback participates in it directly.
 * @returns Result of the callback on success.
 * @throws Normalized AppError if an error occurs during execution or commit.
 */
async function withTransaction(callback, existingTrx) {
    // Propagate through existing transaction if already present
    if (existingTrx) {
        return await callback(existingTrx);
    }
    const db = (0, connection_1.getDbClient)();
    const trx = await db.transaction();
    try {
        const result = await callback(trx);
        if (!trx.isCompleted()) {
            await trx.commit();
        }
        return result;
    }
    catch (error) {
        if (!trx.isCompleted()) {
            try {
                await trx.rollback();
            }
            catch {
                // Rollback attempt completed or already rolled back
            }
        }
        throw (0, database_error_1.normalizeDatabaseError)(error, 'Transaction Boundary');
    }
}
