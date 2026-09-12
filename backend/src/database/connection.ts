/**
 * CITYLINE CONSULTANCY — Database Connection Management
 * Provides Knex database client access, connectivity probes, and graceful shutdown.
 *
 * GOVERNANCE:
 * - Single controlled Knex instance (no per-request connection leaks).
 * - Conservative cPanel connection pooling.
 * - Clean lifecycle hooks for startup, health probes, and graceful shutdown.
 */

import knex, { Knex } from 'knex';
import knexConfig from '../config/knex.config';
import { logger } from '../utils/logger';
import { normalizeDatabaseError } from './database-error';

let dbInstance: Knex | null = null;

/**
 * Returns the active singleton Knex database client.
 * Initializes the client lazily on first access.
 */
export function getDbClient(): Knex {
  if (!dbInstance) {
    dbInstance = knex(knexConfig);
  }
  return dbInstance;
}

/**
 * Explicitly initializes the database client and runs a ping query.
 */
export async function initializeDatabase(): Promise<Knex> {
  const client = getDbClient();
  await client.raw('SELECT 1 as ping');
  return client;
}

/**
 * Checks database connectivity without throwing unhandled exceptions.
 */
export async function checkDatabaseConnectivity(): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = getDbClient();
    await db.raw('SELECT 1 as ping');
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return { ok: false, error: message };
  }
}

/**
 * Executes a raw query safely through the active connection.
 */
export async function executeRawQuery<T = unknown>(
  sql: string,
  bindings?: readonly Knex.RawBinding[]
): Promise<T> {
  try {
    const db = getDbClient();
    const result = bindings ? await db.raw(sql, bindings as Knex.RawBinding[]) : await db.raw(sql);
    return result as T;
  } catch (error) {
    throw normalizeDatabaseError(error, 'Raw Query Execution');
  }
}

/**
 * Destroys the active connection pool during graceful shutdown.
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (dbInstance) {
    try {
      await dbInstance.destroy();
      logger.info('Database connection pool successfully destroyed');
    } catch (error) {
      logger.error('Error destroying database connection pool', error instanceof Error ? error : undefined);
    } finally {
      dbInstance = null;
    }
  }
}

/**
 * Internal helper to inject a mock or custom Knex instance for unit testing.
 */
export function setDbClient(client: Knex | null): void {
  dbInstance = client;
}
