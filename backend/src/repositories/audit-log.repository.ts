/**
 * CITYLINE CONSULTANCY — Audit Log Repository
 * Records append-only operational and security events to the audit_logs table.
 */

import { Knex } from 'knex';
import { AbstractKnexRepository } from './base.repository';
import { getDbClient } from '../database/connection';
import { logger } from '../utils/logger';

export interface AuditLogRecord {
  [key: string]: unknown;
  id?: number;
  actor_admin_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  request_id?: string | null;
  client_ip?: string | null;
  details_json?: string | null;
  created_at?: Date;
}

export class AuditLogRepository extends AbstractKnexRepository<AuditLogRecord, number> {
  protected readonly tableName = 'audit_logs';

  /**
   * Safely logs an event without failing the primary user transaction.
   */
  public async logEvent(
    event: Omit<AuditLogRecord, 'id' | 'created_at'>,
    trx?: Knex.Transaction
  ): Promise<void> {
    try {
      const db = trx || getDbClient();
      await db('audit_logs').insert({
        actor_admin_id: event.actor_admin_id || null,
        action: event.action,
        resource_type: event.resource_type,
        resource_id: event.resource_id || null,
        request_id: event.request_id || null,
        client_ip: event.client_ip || null,
        details_json: event.details_json || null,
        created_at: db.fn.now(),
      });
    } catch (err: unknown) {
      // Non-critical audit logging failure must not destroy a valid primary transaction
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.warn(`AuditLogRepository: Non-fatal audit log insertion failed: ${errorMsg}`);
    }
  }
}

export const auditLogRepository = new AuditLogRepository();
