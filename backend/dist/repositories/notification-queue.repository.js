"use strict";
/**
 * CITYLINE CONSULTANCY — Notification Queue Repository
 * Manages database-backed transactional outbox persistence, atomic batch claiming,
 * retry lifecycle transitions, and idempotency deduplication for MariaDB.
 *
 * GOVERNANCE:
 * - Backed by the locked Phase 2 `notification_queue` table.
 * - Outbox pattern: Notifications are committed transactionally with business entities.
 * - Atomic worker claiming using row-level locking (FOR UPDATE) to prevent concurrency races.
 * - Idempotency hash uniqueness prevents duplicate notification queuing.
 * - Sanitized error persistence prevents credential/secret leakage in MariaDB.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationQueueRepository = exports.NotificationQueueRepository = void 0;
const base_repository_1 = require("./base.repository");
const connection_1 = require("../database/connection");
const database_error_1 = require("../database/database-error");
class NotificationQueueRepository extends base_repository_1.AbstractKnexRepository {
    tableName = 'notification_queue';
    /**
     * Enqueues a single notification transactionally with idempotency deduplication.
     * If a record with the same idempotency_hash already exists, the insertion is silently ignored.
     */
    async enqueue(input, trx) {
        try {
            const client = trx || (0, connection_1.getDbClient)();
            // Check if this idempotency hash is already queued
            const existing = await client(this.tableName)
                .where('idempotency_hash', input.idempotency_hash)
                .first();
            if (existing) {
                return { enqueued: false, id: existing.id };
            }
            const now = new Date();
            const record = {
                id: input.id,
                notification_type: input.notification_type,
                reference_id: input.reference_id,
                recipient_email: input.recipient_email,
                subject: input.subject,
                payload_json: input.payload_json,
                status: input.status || 'pending',
                retry_count: input.retry_count ?? 0,
                next_retry_at: input.next_retry_at || now,
                last_error: input.last_error || null,
                sent_at: null,
                idempotency_hash: input.idempotency_hash,
                created_at: now,
                updated_at: now,
            };
            await client(this.tableName)
                .insert(record)
                .onConflict('idempotency_hash')
                .ignore();
            return { enqueued: true, id: input.id };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'NotificationQueueRepository.enqueue');
        }
    }
    /**
     * Enqueues a batch of notifications transactionally with idempotency protection.
     */
    async enqueueBatch(inputs, trx) {
        if (inputs.length === 0)
            return 0;
        try {
            const client = trx || (0, connection_1.getDbClient)();
            const now = new Date();
            const records = inputs.map((input) => ({
                id: input.id,
                notification_type: input.notification_type,
                reference_id: input.reference_id,
                recipient_email: input.recipient_email,
                subject: input.subject,
                payload_json: input.payload_json,
                status: input.status || 'pending',
                retry_count: input.retry_count ?? 0,
                next_retry_at: input.next_retry_at || now,
                last_error: input.last_error || null,
                sent_at: null,
                idempotency_hash: input.idempotency_hash,
                created_at: now,
                updated_at: now,
            }));
            const result = await client(this.tableName)
                .insert(records)
                .onConflict('idempotency_hash')
                .ignore();
            return Array.isArray(result) ? result[0] : Number(result || 0);
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'NotificationQueueRepository.enqueueBatch');
        }
    }
    /**
     * Atomically claims a bounded batch of eligible queued notifications for processing.
     * Eligible records are:
     * 1. Status 'pending' or 'failed' where next_retry_at <= NOW()
     * 2. Status 'processing' where updated_at <= NOW() - staleTimeoutMs (worker crash recovery)
     *
     * Uses MariaDB row locking (FOR UPDATE) inside an isolated transaction to prevent race conditions.
     */
    async claimBatch(batchSize = 20, staleTimeoutMs = 600000 // 10 minutes default
    ) {
        const db = (0, connection_1.getDbClient)();
        return await db.transaction(async (trx) => {
            const now = new Date();
            const staleThreshold = new Date(now.getTime() - staleTimeoutMs);
            // 1. Atomically query candidate IDs with row-level locking
            const candidates = await trx(this.tableName)
                .select('id')
                .where((builder) => {
                builder
                    .whereIn('status', ['pending', 'failed'])
                    .andWhere('next_retry_at', '<=', now);
            })
                .orWhere((builder) => {
                builder
                    .where('status', 'processing')
                    .andWhere('updated_at', '<=', staleThreshold);
            })
                .orderBy('created_at', 'asc')
                .limit(batchSize)
                .forUpdate();
            if (!candidates || candidates.length === 0) {
                return [];
            }
            const candidateIds = candidates.map((c) => c.id);
            // 2. Mark claimed candidate IDs as 'processing'
            await trx(this.tableName)
                .whereIn('id', candidateIds)
                .update({
                status: 'processing',
                updated_at: now,
            });
            // 3. Retrieve and return the claimed records
            const claimed = await trx(this.tableName)
                .whereIn('id', candidateIds)
                .orderBy('created_at', 'asc');
            return claimed;
        });
    }
    /**
     * Transitions a notification to 'sent' upon successful delivery.
     */
    async markSent(id, sentAt = new Date(), trx) {
        try {
            const client = trx || (0, connection_1.getDbClient)();
            await client(this.tableName)
                .where('id', id)
                .update({
                status: 'sent',
                sent_at: sentAt,
                last_error: null,
                updated_at: new Date(),
            });
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'NotificationQueueRepository.markSent');
        }
    }
    /**
     * Transitions a notification to 'failed' (retryable) or 'exhausted' (dead-letter).
     */
    async markFailed(id, params, trx) {
        try {
            const client = trx || (0, connection_1.getDbClient)();
            const status = params.isExhausted ? 'exhausted' : 'failed';
            const now = new Date();
            await client(this.tableName)
                .where('id', id)
                .update({
                status,
                retry_count: params.retryCount,
                next_retry_at: params.nextRetryAt || now,
                last_error: params.error.slice(0, 1000), // bounded error text
                updated_at: now,
            });
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'NotificationQueueRepository.markFailed');
        }
    }
    /**
     * Finds a notification by its deterministic idempotency hash.
     */
    async findByIdempotencyHash(hash, trx) {
        try {
            const client = trx || (0, connection_1.getDbClient)();
            const record = await client(this.tableName)
                .where('idempotency_hash', hash)
                .first();
            return record || null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'NotificationQueueRepository.findByIdempotencyHash');
        }
    }
    /**
     * Safely purges old historical records according to retention policies.
     * NEVER deletes active or retryable notifications (pending, processing, failed).
     */
    async cleanupOldRecords(sentRetentionDays = 30, exhaustedRetentionDays = 90) {
        try {
            const db = (0, connection_1.getDbClient)();
            const now = Date.now();
            const sentThreshold = new Date(now - sentRetentionDays * 86400000);
            const exhaustedThreshold = new Date(now - exhaustedRetentionDays * 86400000);
            const deletedSent = await db(this.tableName)
                .where('status', 'sent')
                .andWhere('sent_at', '<=', sentThreshold)
                .delete();
            const deletedExhausted = await db(this.tableName)
                .where('status', 'exhausted')
                .andWhere('updated_at', '<=', exhaustedThreshold)
                .delete();
            return {
                deletedSent: Number(deletedSent || 0),
                deletedExhausted: Number(deletedExhausted || 0),
            };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'NotificationQueueRepository.cleanupOldRecords');
        }
    }
}
exports.NotificationQueueRepository = NotificationQueueRepository;
exports.notificationQueueRepository = new NotificationQueueRepository();
