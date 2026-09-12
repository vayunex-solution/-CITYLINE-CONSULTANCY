/**
 * CITYLINE CONSULTANCY — Database Connection Management
 * Provides Knex database client access, connectivity probes, and graceful shutdown.
 */

import knex, { Knex } from 'knex';
import knexConfig from '../config/knex.config';
import { logger } from '../utils/logger';

let dbInstance: Knex | null = null;

export function getDbClient(): Knex {
  if (!dbInstance) {
    dbInstance = knex(knexConfig);
  }
  return dbInstance;
}

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
