/**
 * CITYLINE CONSULTANCY — Administrative Audit Logging Service
 * Integrates authentication and security events with the Phase 2 audit_logs table.
 *
 * GOVERNANCE:
 * - Append-only operational audit trail.
 * - Sensitive credentials (passwords, tokens, cookies, keys) are strictly redacted.
 * - Supports optional transactional participation.
 */

import { Knex } from 'knex';
import { getDbClient } from '../database/connection';
import { logger } from '../utils/logger';

export type AuditAction =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'account_disabled_login_attempt'
  | 'authorization_denied'
  | 'session_invalidated';

export interface AuditEventParams {
  actorAdminId?: string | null;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string | null;
  requestId?: string | null;
  clientIp?: string | null;
  details?: Record<string, unknown>;
  trx?: Knex.Transaction;
}

const REDACTED_KEYS = new Set([
  'password',
  'password_hash',
  'token',
  'secret',
  'cookie',
  'authorization',
  'credentials',
]);

function sanitizeAuditDetails(details?: Record<string, unknown>): Record<string, unknown> | null {
  if (!details || typeof details !== 'object') return null;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAuditDetails(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Writes an immutable audit entry to the audit_logs table.
 */
export async function recordAuditEvent(params: AuditEventParams): Promise<void> {
  const {
    actorAdminId = null,
    action,
    resourceType = 'auth',
    resourceId = null,
    requestId = null,
    clientIp = null,
    details,
    trx,
  } = params;

  try {
    const sanitized = sanitizeAuditDetails(details);
    const db = trx || getDbClient();

    await db('audit_logs').insert({
      actor_admin_id: actorAdminId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      request_id: requestId,
      client_ip: clientIp,
      details_json: sanitized ? JSON.stringify(sanitized) : null,
      created_at: db.fn.now(),
    });
  } catch (error) {
    // Log write failure without swallowing silently, but protect HTTP caller if outside transaction
    logger.error(
      'Failed to persist audit log entry',
      error instanceof Error ? error : new Error(String(error)),
      { action, resourceType, requestId }
    );

    if (trx) {
      // Within an atomic transaction, propagate to trigger rollback
      throw error;
    }
  }
}
