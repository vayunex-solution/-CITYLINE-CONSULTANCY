"use strict";
/**
 * CITYLINE CONSULTANCY — Audit Log Repository
 * Records append-only operational and security events to the audit_logs table.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogRepository = exports.AuditLogRepository = void 0;
const base_repository_1 = require("./base.repository");
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
class AuditLogRepository extends base_repository_1.AbstractKnexRepository {
    tableName = 'audit_logs';
    /**
     * Safely logs an event without failing the primary user transaction.
     */
    async logEvent(event, trx) {
        try {
            const db = trx || (0, connection_1.getDbClient)();
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
        }
        catch (err) {
            // Non-critical audit logging failure must not destroy a valid primary transaction
            const errorMsg = err instanceof Error ? err.message : String(err);
            logger_1.logger.warn(`AuditLogRepository: Non-fatal audit log insertion failed: ${errorMsg}`);
        }
    }
}
exports.AuditLogRepository = AuditLogRepository;
exports.auditLogRepository = new AuditLogRepository();
