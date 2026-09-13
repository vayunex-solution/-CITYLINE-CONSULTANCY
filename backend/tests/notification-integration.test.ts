/**
 * CITYLINE CONSULTANCY — Phase 7 SMTP Notification Integration Tests
 *
 * CRITICAL PHILOSOPHY TESTED:
 * 1. DATABASE PERSISTENCE MUST NEVER DEPEND ON SMTP AVAILABILITY.
 *    If SMTP is down, unavailable, times out, or fails:
 *    - Business enquiry remains safely committed in MariaDB.
 *    - Notifications remain safely queued in notification_queue for retry.
 *    - API responds HTTP 201 without rolling back business data.
 * 2. TRANSACTION ROLLBACK INTEGRITY:
 *    - If business transaction rolls back, NO committed notifications remain in outbox.
 * 3. TEMPLATE TRUTHFULNESS & SECURITY:
 *    - No sensitive uploaded documents are attached.
 *    - No private storage keys or database credentials are leaked.
 *    - No pricing or guaranteed visa promises.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import knex, { Knex } from 'knex';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { setDbClient } from '../src/database/connection';
import { storageService } from '../src/services/storage.service';
import { visaServiceRepository } from '../src/repositories/visa-service.repository';
import { enquiryRepository } from '../src/repositories/enquiry.repository';
import { documentRepository } from '../src/repositories/document.repository';
import { auditLogRepository } from '../src/repositories/audit-log.repository';
import { malwareScannerService } from '../src/services/malware-scanner.service';
import { notificationQueueRepository } from '../src/repositories/notification-queue.repository';
import { smtpTransportManager } from '../src/notifications/smtp-transport';
import { notificationService, NotificationService } from '../src/services/notification.service';
import { VisaEnquiryService } from '../src/services/visa-enquiry.service';
import {
  renderVisaAdminNotification,
  renderVisaApplicantConfirmation,
} from '../src/notifications/templates';

describe('Phase 7: SMTP Notification System Integration', () => {
  let testKnex: Knex;
  let testStorageDir: string;
  let visaService: VisaEnquiryService;

  before(async () => {
    // 1. Storage setup
    testStorageDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'clc-notif-test-storage-'));
    storageService.setStorageRoot(testStorageDir);

    // 2. In-memory SQLite setup
    testKnex = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    setDbClient(testKnex);

    // 3. Schema creation
    await testKnex.schema.createTable('visa_services', (t) => {
      t.integer('id').primary();
      t.string('service_code', 50).unique();
      t.string('title', 255);
      t.string('slug', 255).unique();
      t.string('category', 50);
      t.boolean('is_active').defaultTo(true);
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('enquiries', (t) => {
      t.string('id', 36).primary();
      t.string('enquiry_type', 50).notNullable();
      t.string('status', 50).defaultTo('new');
      t.string('full_name', 255).notNullable();
      t.string('email', 255).notNullable();
      t.string('phone', 50).notNullable();
      t.string('whatsapp', 50).nullable();
      t.string('nationality', 100).nullable();
      t.string('subject', 255).notNullable();
      t.text('message').nullable();
      t.string('source_channel', 50).defaultTo('website');
      t.string('assigned_admin_id', 36).nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('visa_enquiries', (t) => {
      t.string('id', 36).primary();
      t.string('enquiry_id', 36).notNullable();
      t.integer('visa_service_id').notNullable();
      t.integer('duration_days').notNullable();
      t.integer('applicant_count').defaultTo(1);
      t.text('notes').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('documents', (t) => {
      t.string('id', 36).primary();
      t.string('entity_type', 50).notNullable();
      t.string('entity_id', 36).notNullable();
      t.string('document_category', 50).notNullable();
      t.string('original_filename', 255).notNullable();
      t.string('storage_key', 500).notNullable();
      t.string('mime_type', 100).notNullable();
      t.string('file_extension', 20).notNullable();
      t.integer('file_size_bytes').notNullable();
      t.string('sha256_hash', 64).notNullable();
      t.string('validation_status', 50).defaultTo('valid');
      t.string('malware_scan_status', 50).defaultTo('pending');
      t.string('retention_status', 50).defaultTo('active');
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('audit_logs', (t) => {
      t.bigIncrements('id').primary();
      t.string('actor_admin_id', 36).nullable();
      t.string('action', 100).notNullable();
      t.string('resource_type', 100).notNullable();
      t.string('resource_id', 100).nullable();
      t.string('request_id', 64).nullable();
      t.string('client_ip', 45).nullable();
      t.text('details_json').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
    });

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

    // Seed test visa service
    await testKnex('visa_services').insert({
      id: 1,
      service_code: 'freelance_2y',
      title: '2-Year Freelance Visa Dubai',
      slug: 'freelance-visa',
      category: 'employment',
      is_active: 1,
    });

    visaService = new VisaEnquiryService(
      visaServiceRepository,
      enquiryRepository,
      documentRepository,
      auditLogRepository,
      storageService,
      malwareScannerService,
      notificationService
    );
  });

  after(async () => {
    setDbClient(null);
    if (testKnex) {
      await testKnex.destroy();
    }
    try {
      if (fs.existsSync(testStorageDir)) {
        await fs.promises.rm(testStorageDir, { recursive: true, force: true });
      }
    } catch {
      // ignore
    }
  });

  beforeEach(async () => {
    await testKnex('enquiries').truncate();
    await testKnex('visa_enquiries').truncate();
    await testKnex('documents').truncate();
    await testKnex('notification_queue').truncate();
    smtpTransportManager.setMockMode(true);
    smtpTransportManager.clearMockMessages();
  });

  it('CRITICAL: enquiry persists and notifications are queued even when SMTP is completely offline', async () => {
    // 1. Submit enquiry via service
    const result = await visaService.submitVisaEnquiry({
      fullName: 'Rashid Al Nuaimi',
      email: 'rashid.nuaimi@example.com',
      phone: '+971501234567',
      whatsapp: '+971501234567',
      nationality: 'United Arab Emirates',
      visaType: 'freelance_2y',
      applicantCount: 1,
      timeline: 'immediate',
      details: 'Urgent freelance permit processing inquiry.',
    });

    assert.ok(result.reference);
    assert.ok(result.reference.startsWith('CLC-V-'));
    assert.ok(result.enquiryId);

    // 2. Assert business database records exist
    const savedEnquiry = await testKnex('enquiries').where('id', result.enquiryId).first();
    assert.ok(savedEnquiry);
    assert.equal(savedEnquiry.full_name, 'Rashid Al Nuaimi');

    const savedVisaDetail = await testKnex('visa_enquiries').where('enquiry_id', result.enquiryId).first();
    assert.ok(savedVisaDetail);

    // 3. Assert notifications exist in notification_queue in 'pending' status
    const queuedNotifs = await testKnex('notification_queue')
      .where('reference_id', result.enquiryId)
      .orderBy('created_at', 'asc');

    assert.equal(queuedNotifs.length, 2);

    const adminNotif = queuedNotifs.find((n) => n.notification_type === 'visa_enquiry_admin');
    const applicantNotif = queuedNotifs.find((n) => n.notification_type === 'visa_enquiry_confirmation');

    assert.ok(adminNotif);
    assert.equal(adminNotif.status, 'pending');
    assert.ok(adminNotif.subject.includes(result.reference));

    assert.ok(applicantNotif);
    assert.equal(applicantNotif.status, 'pending');
    assert.equal(applicantNotif.recipient_email, 'rashid.nuaimi@example.com');
    assert.ok(applicantNotif.subject.includes(result.reference));

    // Zero emails have been sent yet (strict outbox decoupled from synchronous API execution)
    assert.equal(smtpTransportManager.getMockSentMessages().length, 0);
  });

  it('processes queued notifications via worker and marks them sent', async () => {
    // 1. Create enquiry to populate outbox
    const result = await visaService.submitVisaEnquiry({
      fullName: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      phone: '+971529876543',
      visaType: 'freelance_2y',
      applicantCount: 1,
    });

    // 2. Trigger worker batch pass
    const batchResult = await notificationService.processBatch({ batchSize: 10 });

    assert.equal(batchResult.processed, 2);
    assert.equal(batchResult.sent, 2);
    assert.equal(batchResult.failed, 0);

    // 3. Verify in database that records are now 'sent' with sent_at timestamps
    const updatedNotifs = await testKnex('notification_queue').where('reference_id', result.enquiryId);
    for (const notif of updatedNotifs) {
      assert.equal(notif.status, 'sent');
      assert.ok(notif.sent_at);
      assert.equal(notif.last_error, null);
    }

    // 4. Verify mock transporter recorded exactly 2 dispatched emails
    const sentMails = smtpTransportManager.getMockSentMessages();
    assert.equal(sentMails.length, 2);

    const adminMail = sentMails.find((m) => m.to.includes('dev-admin@example.test') || m.to.includes('admin'));
    const applicantMail = sentMails.find((m) => m.to === 'sarah.j@example.com');

    assert.ok(adminMail);
    assert.ok(adminMail.subject.includes(result.reference));
    assert.ok(applicantMail);
    assert.ok(applicantMail.subject.includes(result.reference));
  });

  it('handles transient SMTP failure by updating retry_count and scheduling next_retry_at', async () => {
    // 1. Populate an enquiry
    const result = await visaService.submitVisaEnquiry({
      fullName: 'Tariq Mansoor',
      email: 'tariq@example.com',
      phone: '+971551112233',
      visaType: 'freelance_2y',
    });

    // 2. Configure mock transport manager to simulate a transient network timeout
    const originalSend = smtpTransportManager.sendMail.bind(smtpTransportManager);
    smtpTransportManager.sendMail = async () => {
      const err = new Error('Connection timeout after 10000ms');
      (err as unknown as { code: string }).code = 'ETIMEDOUT';
      throw err;
    };

    try {
      const batchResult = await notificationService.processBatch({ batchSize: 10 });
      assert.equal(batchResult.processed, 2);
      assert.equal(batchResult.sent, 0);
      assert.equal(batchResult.failed, 2); // Scheduled for retry
      assert.equal(batchResult.exhausted, 0);

      // Verify records in database have status 'failed', retry_count = 1, and future next_retry_at
      const notifs = await testKnex('notification_queue').where('reference_id', result.enquiryId);
      for (const notif of notifs) {
        assert.equal(notif.status, 'failed');
        assert.equal(notif.retry_count, 1);
        assert.ok(notif.last_error?.includes('Connection timeout'));
        assert.ok(new Date(notif.next_retry_at).getTime() > Date.now() - 5000);
      }
    } finally {
      smtpTransportManager.sendMail = originalSend;
    }
  });

  it('immediately marks permanent 5xx failure as exhausted without wasteful retry loops', async () => {
    // 1. Populate an enquiry
    const result = await visaService.submitVisaEnquiry({
      fullName: 'Bad Recipient Test',
      email: 'deadletter@example.com',
      phone: '+971559998877',
      visaType: 'freelance_2y',
    });

    // 2. Simulate permanent 550 SMTP rejection
    const originalSend = smtpTransportManager.sendMail.bind(smtpTransportManager);
    smtpTransportManager.sendMail = async () => {
      const err = new Error('550 Requested action not taken: mailbox unavailable');
      (err as unknown as { responseCode: number }).responseCode = 550;
      throw err;
    };

    try {
      const batchResult = await notificationService.processBatch({ batchSize: 10 });
      assert.equal(batchResult.processed, 2);
      assert.equal(batchResult.exhausted, 2);
      assert.equal(batchResult.failed, 0);

      // Verify records in DB have status 'exhausted'
      const notifs = await testKnex('notification_queue').where('reference_id', result.enquiryId);
      for (const notif of notifs) {
        assert.equal(notif.status, 'exhausted');
        assert.ok(notif.last_error?.includes('550'));
      }
    } finally {
      smtpTransportManager.sendMail = originalSend;
    }
  });

  it('immediately marks SMTP authentication failure (535 / EAUTH) as exhausted without wasteful retry loops', async () => {
    // 1. Populate an enquiry
    const result = await visaService.submitVisaEnquiry({
      fullName: 'Auth Failure Test',
      email: 'applicant.auth@example.com',
      phone: '+971550001122',
      visaType: 'freelance_2y',
    });

    // 2. Simulate permanent 535 SMTP authentication failure
    const originalSend = smtpTransportManager.sendMail.bind(smtpTransportManager);
    smtpTransportManager.sendMail = async () => {
      const err = new Error('535 Authentication failed: Bad credentials');
      (err as unknown as { code: string; responseCode: number }).code = 'EAUTH';
      (err as unknown as { code: string; responseCode: number }).responseCode = 535;
      throw err;
    };

    try {
      const batchResult = await notificationService.processBatch({ batchSize: 10 });
      assert.equal(batchResult.processed, 2);
      assert.equal(batchResult.exhausted, 2);
      assert.equal(batchResult.failed, 0); // Zero retries scheduled

      // Verify records in DB have status 'exhausted'
      const notifs = await testKnex('notification_queue').where('reference_id', result.enquiryId);
      for (const notif of notifs) {
        assert.equal(notif.status, 'exhausted');
        assert.ok(notif.last_error?.includes('535'));
      }
    } finally {
      smtpTransportManager.sendMail = originalSend;
    }
  });

  it('guarantees rollback atomicity: if business transaction fails, no notification remains committed', async () => {
    const initialCount = await testKnex('notification_queue').count('* as cnt').first();

    // Force error during transaction
    const originalCreate = enquiryRepository.createVisaEnquiry.bind(enquiryRepository);
    enquiryRepository.createVisaEnquiry = async () => {
      throw new Error('Simulated database deadlock or disk failure');
    };

    try {
      await assert.rejects(
        async () => {
          await visaService.submitVisaEnquiry({
            fullName: 'Rollback Candidate',
            email: 'rollback@example.com',
            phone: '+971501112233',
            visaType: 'freelance_2y',
          });
        },
        {
          name: 'Error',
        }
      );

      // Verify ZERO notifications were committed to notification_queue
      const postCount = await testKnex('notification_queue').count('* as cnt').first();
      assert.equal(Number(postCount?.cnt), Number(initialCount?.cnt));
    } finally {
      enquiryRepository.createVisaEnquiry = originalCreate;
    }
  });

  describe('Template Content & Security Compliance', () => {
    it('Admin template contains reference, details, but NEVER file attachments or private storage paths', () => {
      const { html, text, subject } = renderVisaAdminNotification({
        reference: 'CLC-V-2026-A1B2C3D4',
        fullName: 'Ali Hassan',
        email: 'ali.hassan@example.com',
        phone: '+971501234567',
        serviceTitle: '2-Year Freelance Visa Dubai',
        applicantCount: 2,
        documentsCount: 3,
        submittedAt: 'Sun, 13 Sep 2026 12:00:00 GMT',
      });

      assert.ok(subject.includes('CLC-V-2026-A1B2C3D4'));
      assert.ok(html.includes('CLC-V-2026-A1B2C3D4'));
      assert.ok(html.includes('Ali Hassan'));
      assert.ok(html.includes('3 document(s) uploaded'));
      assert.ok(text.includes('CLC-V-2026-A1B2C3D4'));

      // Security assertions
      assert.equal(html.includes('/storage/'), false);
      assert.equal(html.includes('clc_storage'), false);
      assert.equal(text.includes('/storage/'), false);
      assert.equal(text.includes('clc_storage'), false);
    });

    it('Applicant template contains reference and disclaimer, but NO pricing and NO false approval claims', () => {
      const { html, text, subject } = renderVisaApplicantConfirmation({
        reference: 'CLC-V-2026-E5F6G7H8',
        fullName: 'Elena Rostova',
        serviceTitle: '2-Year Freelance Visa Dubai',
        applicantCount: 1,
        documentsCount: 2,
      });

      assert.ok(subject.includes('CLC-V-2026-E5F6G7H8'));
      assert.ok(html.includes('CLC-V-2026-E5F6G7H8'));
      assert.ok(html.includes('Elena Rostova'));
      assert.ok(html.includes('GDRFA / ICP')); // Discloses official UAE authority role
      assert.ok(text.includes('CLC-V-2026-E5F6G7H8'));

      // STRICT PROHIBITIONS:
      const forbiddenPhrases = [
        'guaranteed visa',
        'guaranteed job',
        '100% success',
        'approved',
        'aed',
        'usd',
        'price',
        'fee',
        'cost',
        'payment',
      ];

      for (const phrase of forbiddenPhrases) {
        assert.equal(
          html.toLowerCase().includes(phrase),
          false,
          `HTML template contains forbidden term or pricing: "${phrase}"`
        );
        assert.equal(
          text.toLowerCase().includes(phrase),
          false,
          `Plain-text template contains forbidden term or pricing: "${phrase}"`
        );
      }
    });
  });
});
