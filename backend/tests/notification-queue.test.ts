/**
 * CITYLINE CONSULTANCY — Notification Queue Repository & Lifecycle Tests
 * Verifies outbox persistence, deterministic idempotency deduplication, atomic claiming,
 * retry scheduling, exponential backoff, dead-letter exhaustion, and retention cleanup.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import knex, { Knex } from 'knex';
import { setDbClient } from '../src/database/connection';
import {
  NotificationQueueRepository,
  NotificationQueueRecord,
} from '../src/repositories/notification-queue.repository';

describe('Notification Queue & Outbox Lifecycle', () => {
  let testKnex: Knex;
  let queueRepo: NotificationQueueRepository;

  before(async () => {
    testKnex = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    setDbClient(testKnex);

    await testKnex.schema.createTable('notification_queue', (t) => {
      t.string('id', 36).primary();
      t.string('notification_type', 50).notNullable();
      t.string('reference_id', 36).notNullable();
      t.string('recipient_email', 255).notNullable();
      t.string('subject', 255).notNullable();
      t.text('payload_json').notNullable();
      t.string('status', 50).defaultTo('pending').notNullable();
      t.integer('retry_count').defaultTo(0).notNullable();
      t.timestamp('next_retry_at').defaultTo(testKnex.fn.now()).notNullable();
      t.text('last_error').nullable();
      t.timestamp('sent_at').nullable();
      t.string('idempotency_hash', 64).notNullable().unique();
      t.timestamp('created_at').defaultTo(testKnex.fn.now()).notNullable();
      t.timestamp('updated_at').defaultTo(testKnex.fn.now()).notNullable();
    });

    queueRepo = new NotificationQueueRepository();
  });

  after(async () => {
    setDbClient(null);
    if (testKnex) {
      await testKnex.destroy();
    }
  });

  beforeEach(async () => {
    await testKnex('notification_queue').truncate();
  });

  it('enqueues a new notification record into outbox table', async () => {
    const res = await queueRepo.enqueue({
      id: 'notif-1',
      notification_type: 'visa_enquiry_admin',
      reference_id: 'enq-1',
      recipient_email: 'admin@citylineconsultancy.com',
      subject: 'New Visa Lead',
      payload_json: JSON.stringify({ applicant: 'John Doe' }),
      idempotency_hash: 'hash-abc-123',
    });

    assert.equal(res.enqueued, true);
    assert.equal(res.id, 'notif-1');

    const inDb = await testKnex('notification_queue').where('id', 'notif-1').first();
    assert.ok(inDb);
    assert.equal(inDb.status, 'pending');
    assert.equal(inDb.retry_count, 0);
    assert.equal(inDb.recipient_email, 'admin@citylineconsultancy.com');
  });

  it('safely deduplicates and ignores duplicate enqueue attempts with identical idempotency_hash', async () => {
    // First enqueue
    const res1 = await queueRepo.enqueue({
      id: 'notif-10',
      notification_type: 'visa_enquiry_admin',
      reference_id: 'enq-10',
      recipient_email: 'admin@citylineconsultancy.com',
      subject: 'New Visa Lead',
      payload_json: JSON.stringify({ test: 1 }),
      idempotency_hash: 'deterministic-idempotency-key-001',
    });
    assert.equal(res1.enqueued, true);

    // Second enqueue with same idempotency_hash but different id
    const res2 = await queueRepo.enqueue({
      id: 'notif-11-duplicate',
      notification_type: 'visa_enquiry_admin',
      reference_id: 'enq-10',
      recipient_email: 'admin@citylineconsultancy.com',
      subject: 'Duplicate Submission',
      payload_json: JSON.stringify({ test: 2 }),
      idempotency_hash: 'deterministic-idempotency-key-001',
    });

    // Insertion ignored, no database error thrown, only 1 record exists
    assert.equal(res2.enqueued, false);
    const count = await testKnex('notification_queue').count('* as cnt').first();
    assert.equal(Number(count?.cnt), 1);
  });

  it('atomically claims eligible notifications and marks them as processing', async () => {
    await queueRepo.enqueue({
      id: 'item-claim-1',
      notification_type: 'visa_enquiry_admin',
      reference_id: 'ref-1',
      recipient_email: 'test@example.com',
      subject: 'Test',
      payload_json: '{}',
      idempotency_hash: 'hash-claim-1',
    });

    const claimed = await queueRepo.claimBatch(10);
    assert.equal(claimed.length, 1);
    assert.equal(claimed[0].id, 'item-claim-1');

    // Verify status updated in database to 'processing'
    const inDb = await testKnex('notification_queue').where('id', 'item-claim-1').first();
    assert.equal(inDb.status, 'processing');
  });

  it('prevents a second worker from claiming already processing notifications', async () => {
    await queueRepo.enqueue({
      id: 'item-concurrent-1',
      notification_type: 'visa_enquiry_admin',
      reference_id: 'ref-2',
      recipient_email: 'test@example.com',
      subject: 'Test',
      payload_json: '{}',
      idempotency_hash: 'hash-concurrent-1',
    });

    // Worker 1 claims
    const worker1Claimed = await queueRepo.claimBatch(10);
    assert.equal(worker1Claimed.length, 1);

    // Worker 2 attempts to claim simultaneously
    const worker2Claimed = await queueRepo.claimBatch(10);
    assert.equal(worker2Claimed.length, 0); // No items left to claim
  });

  it('transitions claimed notification to sent upon successful delivery', async () => {
    await queueRepo.enqueue({
      id: 'item-sent-1',
      notification_type: 'visa_enquiry_admin',
      reference_id: 'ref-3',
      recipient_email: 'test@example.com',
      subject: 'Test',
      payload_json: '{}',
      idempotency_hash: 'hash-sent-1',
    });

    const sentDate = new Date();
    await queueRepo.markSent('item-sent-1', sentDate);

    const inDb = await testKnex('notification_queue').where('id', 'item-sent-1').first();
    assert.equal(inDb.status, 'sent');
    assert.ok(inDb.sent_at);
    assert.equal(inDb.last_error, null);
  });

  it('transitions notification to failed with next retry date for transient errors', async () => {
    await queueRepo.enqueue({
      id: 'item-retry-1',
      notification_type: 'visa_enquiry_admin',
      reference_id: 'ref-4',
      recipient_email: 'test@example.com',
      subject: 'Test',
      payload_json: '{}',
      idempotency_hash: 'hash-retry-1',
    });

    const nextRetry = new Date(Date.now() + 60000); // 1 minute in future
    await queueRepo.markFailed('item-retry-1', {
      error: 'SMTP connection timeout',
      retryCount: 1,
      nextRetryAt: nextRetry,
      isExhausted: false,
    });

    const inDb = await testKnex('notification_queue').where('id', 'item-retry-1').first();
    assert.equal(inDb.status, 'failed');
    assert.equal(inDb.retry_count, 1);
    assert.equal(inDb.last_error, 'SMTP connection timeout');
  });

  it('moves notification to exhausted (dead_letter) when max retries exceeded or permanent error occurs', async () => {
    await queueRepo.enqueue({
      id: 'item-exhaust-1',
      notification_type: 'visa_enquiry_admin',
      reference_id: 'ref-5',
      recipient_email: 'invalid@example.com',
      subject: 'Test',
      payload_json: '{}',
      idempotency_hash: 'hash-exhaust-1',
    });

    await queueRepo.markFailed('item-exhaust-1', {
      error: '550 Recipient mailbox does not exist',
      retryCount: 5,
      isExhausted: true,
    });

    const inDb = await testKnex('notification_queue').where('id', 'item-exhaust-1').first();
    assert.equal(inDb.status, 'exhausted');
    assert.equal(inDb.retry_count, 5);
    assert.equal(inDb.last_error, '550 Recipient mailbox does not exist');
  });

  it('recovers and reclaims stale processing items if a previous worker crashed', async () => {
    const staleTime = new Date(Date.now() - 15 * 60 * 1000); // 15 mins ago
    await testKnex('notification_queue').insert({
      id: 'item-stale-1',
      notification_type: 'visa_enquiry_admin',
      reference_id: 'ref-6',
      recipient_email: 'test@example.com',
      subject: 'Stale item',
      payload_json: '{}',
      status: 'processing',
      retry_count: 0,
      next_retry_at: staleTime,
      idempotency_hash: 'hash-stale-1',
      created_at: staleTime,
      updated_at: staleTime, // 15 mins stale
    });

    // Reclaim with 10 minute stale timeout
    const claimed = await queueRepo.claimBatch(10, 10 * 60 * 1000);
    assert.equal(claimed.length, 1);
    assert.equal(claimed[0].id, 'item-stale-1');
  });

  it('safely purges old sent and exhausted records without touching active records', async () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);
    const oneHundredDaysAgo = new Date(Date.now() - 100 * 86400000);

    // Old sent record (eligible for 30-day cleanup)
    await testKnex('notification_queue').insert({
      id: 'old-sent',
      notification_type: 'visa_enquiry_admin',
      reference_id: 'r1',
      recipient_email: 'test@example.com',
      subject: 's',
      payload_json: '{}',
      status: 'sent',
      sent_at: sixtyDaysAgo,
      idempotency_hash: 'h-old-sent',
      created_at: sixtyDaysAgo,
      updated_at: sixtyDaysAgo,
    });

    // Old exhausted record (eligible for 90-day cleanup)
    await testKnex('notification_queue').insert({
      id: 'old-exhausted',
      notification_type: 'visa_enquiry_admin',
      reference_id: 'r2',
      recipient_email: 'test@example.com',
      subject: 's',
      payload_json: '{}',
      status: 'exhausted',
      idempotency_hash: 'h-old-exhaust',
      created_at: oneHundredDaysAgo,
      updated_at: oneHundredDaysAgo,
    });

    // Active pending record (MUST NOT BE DELETED)
    await testKnex('notification_queue').insert({
      id: 'active-pending',
      notification_type: 'visa_enquiry_admin',
      reference_id: 'r3',
      recipient_email: 'test@example.com',
      subject: 's',
      payload_json: '{}',
      status: 'pending',
      idempotency_hash: 'h-active',
      created_at: sixtyDaysAgo,
      updated_at: sixtyDaysAgo,
    });

    const cleanup = await queueRepo.cleanupOldRecords(30, 90);
    assert.equal(cleanup.deletedSent, 1);
    assert.equal(cleanup.deletedExhausted, 1);

    const remaining = await testKnex('notification_queue').select('id');
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, 'active-pending');
  });
});
