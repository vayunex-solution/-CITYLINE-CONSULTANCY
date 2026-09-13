/**
 * CITYLINE CONSULTANCY — Persistent Token Revocation Subsystem
 * Persists revoked JWT identifiers (jti) in the MariaDB revoked_tokens table.
 *
 * GOVERNANCE:
 * - Persistent: Survives process restarts and synchronizes across multi-process Passenger workers.
 * - Indexed by `jti` for fast lookups and `expires_at` for bounded background purges.
 * - Expired records are pruned safely via purgeExpired().
 * - Replaces the process-local in-memory store.
 */

import { Knex } from 'knex';
import { getDbClient } from '../database/connection';
import { logger } from '../utils/logger';

export interface RevokedTokenRow {
  id: string | number;
  jti: string;
  expires_at: Date;
  revoked_at: Date;
}

export class DatabaseTokenRevocationStore {
  private customClient: Knex | null = null;

  constructor(customClient?: Knex) {
    if (customClient) {
      this.customClient = customClient;
    }
  }

  /**
   * Sets a custom Knex client (used for testing or transaction overrides).
   */
  public setClient(client: Knex | null): void {
    this.customClient = client;
  }

  private getDb(trx?: Knex.Transaction): Knex {
    if (trx) return trx;
    if (this.customClient) return this.customClient;
    return getDbClient();
  }

  /**
   * Persists a revoked JWT identifier with its natural expiration date.
   */
  public async revoke(jti: string, expiresAtUnixSeconds: number, trx?: Knex.Transaction): Promise<void> {
    if (!jti) return;

    const db = this.getDb(trx);
    const expiresAt = new Date(expiresAtUnixSeconds * 1000);

    try {
      await db('revoked_tokens').insert({
        jti,
        expires_at: expiresAt,
        revoked_at: new Date(),
      });
    } catch (error: any) {
      // If already recorded (duplicate entry), safe to treat as revoked
      if (error?.code === 'ER_DUP_ENTRY' || error?.message?.includes('UNIQUE constraint failed')) {
        return;
      }
      logger.error(
        'Failed to record persistent token revocation',
        error instanceof Error ? error : new Error(String(error)),
        { jti }
      );
      throw error;
    }
  }

  /**
   * Checks if a jti is persistently marked as revoked.
   * Only matches if the token has not yet reached natural expiration.
   */
  public async isRevoked(jti: string, trx?: Knex.Transaction): Promise<boolean> {
    if (!jti) return true;

    const db = this.getDb(trx);
    const now = new Date();

    try {
      const record = await db('revoked_tokens')
        .where('jti', jti)
        .where('expires_at', '>', now)
        .first();

      return Boolean(record);
    } catch (error: any) {
      logger.error(
        'Error querying persistent token revocation state',
        error instanceof Error ? error : new Error(String(error)),
        { jti }
      );
      // Security defense: on database error during check, default to rejecting access safely
      throw error;
    }
  }

  /**
   * Bounded purge of expired revocation records.
   * Records whose natural JWT expiration has passed are safe to remove.
   */
  public async purgeExpired(trx?: Knex.Transaction): Promise<number> {
    const db = this.getDb(trx);
    const now = new Date();

    try {
      const deletedCount = await db('revoked_tokens')
        .where('expires_at', '<=', now)
        .delete();

      return Number(deletedCount);
    } catch (error: any) {
      logger.error(
        'Error purging expired token revocations',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
}

export const tokenRevocationStore = new DatabaseTokenRevocationStore();
