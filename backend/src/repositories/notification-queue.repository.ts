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

import { Knex } from 'knex';
import { AbstractKnexRepository } from './base.repository';
import { getDbClient } from '../database/connection';
import { normalizeDatabaseError } from '../database/database-error';

export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'exhausted';

export interface NotificationQueueRecord {
  [key: string]: unknown;
  id: string;
  notification_type: string;
  reference_id: string;
  recipient_email: string;
  subject: string;
  payload_json: string;
  status: NotificationStatus;
  retry_count: number;
  next_retry_at: Date;
  last_error?: string | null;
  sent_at?: Date | null;
  idempotency_hash: string;
  created_at: Date;
  updated_at: Date;
}

export type NewNotificationInput = {
  id: string;
  notification_type: string;
  reference_id: string;
  recipient_email: string;
  subject: string;
  payload_json: string;
  idempotency_hash: string;
  status?: NotificationStatus;
  retry_count?: number;
  next_retry_at?: Date;
  last_error?: string | null;
};

export class NotificationQueueRepository extends AbstractKnexRepository<NotificationQueueRecord, string> {
  protected readonly tableName = 'notification_queue';

  /**
   * Enqueues a single notification transactionally with idempotency deduplication.
   * If a record with the same idempotency_hash already exists, the insertion is silently ignored.
   */
  public async enqueue(
    input: NewNotificationInput,
    trx?: Knex.Transaction
  ): Promise<{ enqueued: boolean; id: string }> {
    try {
      const client = trx || getDbClient();

      // Check if this idempotency hash is already queued
      const existing = await client(this.tableName)
        .where('idempotency_hash', input.idempotency_hash)
        .first();

      if (existing) {
        return { enqueued: false, id: existing.id as string };
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
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'NotificationQueueRepository.enqueue');
    }
  }

  /**
   * Enqueues a batch of notifications transactionally with idempotency protection.
   */
  public async enqueueBatch(
    inputs: NewNotificationInput[],
    trx?: Knex.Transaction
  ): Promise<number> {
    if (inputs.length === 0) return 0;
    try {
      const client = trx || getDbClient();
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
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'NotificationQueueRepository.enqueueBatch');
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
  public async claimBatch(
    batchSize = 20,
    staleTimeoutMs = 600000 // 10 minutes default
  ): Promise<NotificationQueueRecord[]> {
    const db = getDbClient();

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

      const candidateIds = candidates.map((c: { id: string }) => c.id);

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

      return claimed as NotificationQueueRecord[];
    });
  }

  /**
   * Transitions a notification to 'sent' upon successful delivery.
   */
  public async markSent(
    id: string,
    sentAt: Date = new Date(),
    trx?: Knex.Transaction
  ): Promise<void> {
    try {
      const client = trx || getDbClient();
      await client(this.tableName)
        .where('id', id)
        .update({
          status: 'sent',
          sent_at: sentAt,
          last_error: null,
          updated_at: new Date(),
        });
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'NotificationQueueRepository.markSent');
    }
  }

  /**
   * Transitions a notification to 'failed' (retryable) or 'exhausted' (dead-letter).
   */
  public async markFailed(
    id: string,
    params: {
      error: string;
      retryCount: number;
      nextRetryAt?: Date;
      isExhausted: boolean;
    },
    trx?: Knex.Transaction
  ): Promise<void> {
    try {
      const client = trx || getDbClient();
      const status: NotificationStatus = params.isExhausted ? 'exhausted' : 'failed';
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
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'NotificationQueueRepository.markFailed');
    }
  }

  /**
   * Finds a notification by its deterministic idempotency hash.
   */
  public async findByIdempotencyHash(
    hash: string,
    trx?: Knex.Transaction
  ): Promise<NotificationQueueRecord | null> {
    try {
      const client = trx || getDbClient();
      const record = await client(this.tableName)
        .where('idempotency_hash', hash)
        .first();
      return (record as NotificationQueueRecord) || null;
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'NotificationQueueRepository.findByIdempotencyHash');
    }
  }

  /**
   * Safely purges old historical records according to retention policies.
   * NEVER deletes active or retryable notifications (pending, processing, failed).
   */
  public async cleanupOldRecords(
    sentRetentionDays = 30,
    exhaustedRetentionDays = 90
  ): Promise<{ deletedSent: number; deletedExhausted: number }> {
    try {
      const db = getDbClient();
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
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'NotificationQueueRepository.cleanupOldRecords');
    }
  }
}

export const notificationQueueRepository = new NotificationQueueRepository();
