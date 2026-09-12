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

import { Knex } from 'knex';
import { getDbClient } from './connection';
import { normalizeDatabaseError } from './database-error';

export type TransactionCallback<T> = (trx: Knex.Transaction) => Promise<T>;

/**
 * Executes a callback function within an atomic transaction boundary.
 *
 * @param callback Async function executing data access operations via the provided transaction handle.
 * @param existingTrx Optional existing transaction. If passed, the callback participates in it directly.
 * @returns Result of the callback on success.
 * @throws Normalized AppError if an error occurs during execution or commit.
 */
export async function withTransaction<T>(
  callback: TransactionCallback<T>,
  existingTrx?: Knex.Transaction
): Promise<T> {
  // Propagate through existing transaction if already present
  if (existingTrx) {
    return await callback(existingTrx);
  }

  const db = getDbClient();
  const trx = await db.transaction();

  try {
    const result = await callback(trx);
    if (!trx.isCompleted()) {
      await trx.commit();
    }
    return result;
  } catch (error) {
    if (!trx.isCompleted()) {
      try {
        await trx.rollback();
      } catch {
        // Rollback attempt completed or already rolled back
      }
    }
    throw normalizeDatabaseError(error, 'Transaction Boundary');
  }
}
