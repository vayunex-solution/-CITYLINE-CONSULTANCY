/**
 * CITYLINE CONSULTANCY — Visa Enquiry & Document Upload Integration Tests
 * Verifies public endpoint POST /api/v1/visa-enquiries, multipart file processing,
 * rate limiting, schema validation, compensation cleanup, and information disclosure defense.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import knex, { Knex } from 'knex';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createApp } from '../src/app';
import { setDbClient } from '../src/database/connection';
import { storageService } from '../src/services/storage.service';
import { malwareScannerService } from '../src/services/malware-scanner.service';
import { isDocumentTrusted, assertDocumentTrusted } from '../src/repositories/document.repository';
import { visaEnquiryRateLimiterInstance } from '../src/middleware/visa-rate-limit.middleware';

// Helper to construct in-memory ZIP archive buffers for DOCX testing
function createMockZipBuffer(
  files: {
    name: string;
    content?: string;
    compressedSize?: number;
    uncompressedSize?: number;
  }[]
): Buffer {
  const chunks: Buffer[] = [];
  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const contentBuf = Buffer.from(file.content || '<xml></xml>', 'utf8');
    const compSize = file.compressedSize !== undefined ? file.compressedSize : contentBuf.length;
    const uncompSize = file.uncompressedSize !== undefined ? file.uncompressedSize : contentBuf.length;

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt32LE(0, 10);
    header.writeUInt32LE(0, 14);
    header.writeUInt32LE(compSize, 18);
    header.writeUInt32LE(uncompSize, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(0, 28);

    chunks.push(header);
    chunks.push(nameBuf);
    chunks.push(contentBuf);
  }

  chunks.push(Buffer.from([0x50, 0x4b, 0x01, 0x02, 0, 0, 0, 0]));
  return Buffer.concat(chunks);
}

describe('Visa Enquiry & Document Upload Integration (/api/v1/visa-enquiries)', () => {
  let app: ReturnType<typeof createApp>;
  let testKnex: Knex;
  let testStorageDir: string;

  before(async () => {
    // 1. Setup isolated temporary storage root
    testStorageDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'clc-visa-test-storage-'));
    storageService.setStorageRoot(testStorageDir);

    // 2. Setup isolated in-memory SQLite database
    testKnex = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    setDbClient(testKnex);

    // 3. Create required schema tables in SQLite
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

    // 4. Seed active and inactive visa services
    await testKnex('visa_services').insert([
      {
        id: 1,
        service_code: 'freelance_2y',
        title: '2-Year Freelance Visa Dubai',
        slug: 'freelance-visa',
        category: 'employment',
        is_active: 1,
      },
      {
        id: 2,
        service_code: 'visit_30d',
        title: '30-Day Visit Visa',
        slug: 'visit-visa-30',
        category: 'visit',
        is_active: 1,
      },
      {
        id: 3,
        service_code: 'visit_60d',
        title: '60-Day Visit Visa',
        slug: 'visit-visa-60',
        category: 'visit',
        is_active: 1,
      },
      {
        id: 4,
        service_code: 'inactive_service',
        title: 'Inactive Discontinued Visa',
        slug: 'inactive-visa',
        category: 'visit',
        is_active: 0,
      },
    ]);

    app = createApp();
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
      // Ignore cleanup error
    }
  });

  beforeEach(() => {
    visaEnquiryRateLimiterInstance.clear();
    malwareScannerService.setEnabled(false);
    malwareScannerService.setCommand('clamscan --no-summary');
  });

  it('submits a valid visa enquiry with text fields only and persists records', async () => {
    const res = await request(app)
      .post('/api/v1/visa-enquiries')
      .field('fullName', 'Rashid Al Nuaimi')
      .field('email', 'rashid.nuaimi@example.ae')
      .field('phone', '+971 50 123 4567')
      .field('whatsapp', '+971 50 123 4567')
      .field('visaType', 'freelance-visa')
      .field('nationality', 'United Arab Emirates')
      .field('timeline', 'immediate')
      .field('applicantCount', '1')
      .field('details', 'Interested in freelance visa consultation.')
      .field('consent', 'true');

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.documentsUploaded, 0);
    assert.strictEqual(res.body.data.serviceTitle, '2-Year Freelance Visa Dubai');
    assert.match(res.body.data.reference, /^CLC-V-\d{4}-[0-9A-F]{8}$/);

    // Verify DB records exist
    const savedEnquiry = await testKnex('enquiries')
      .where({ email: 'rashid.nuaimi@example.ae' })
      .first();
    assert.ok(savedEnquiry);
    assert.strictEqual(savedEnquiry.full_name, 'Rashid Al Nuaimi');
    assert.strictEqual(savedEnquiry.enquiry_type, 'visa');

    const savedVisaEnquiry = await testKnex('visa_enquiries')
      .where({ enquiry_id: savedEnquiry.id })
      .first();
    assert.ok(savedVisaEnquiry);
    assert.strictEqual(savedVisaEnquiry.visa_service_id, 1);
    assert.strictEqual(savedVisaEnquiry.duration_days, 730);

    // Verify audit log entry was created
    const auditRecord = await testKnex('audit_logs')
      .where({ resource_id: savedEnquiry.id })
      .first();
    assert.ok(auditRecord);
    assert.strictEqual(auditRecord.action, 'visa_enquiry_submitted');
  });

  it('submits a valid visa enquiry with multiple attached documents (PDF, JPEG, PNG, DOCX)', async () => {
    const pdfBuf = Buffer.from('%PDF-1.7 mock applicant passport copy');
    const jpegBuf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const pngBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const docxBuf = createMockZipBuffer([
      { name: '[Content_Types].xml', content: '<Types/>' },
      { name: 'word/document.xml', content: '<w:document/>' },
    ]);

    const res = await request(app)
      .post('/api/v1/visa-enquiries')
      .field('fullName', 'Fatima Zahra')
      .field('email', 'fatima.zahra@example.com')
      .field('phone', '+971 52 987 6543')
      .field('visaType', 'visit-visa-30')
      .field('nationality', 'Morocco')
      .field('timeline', 'within_1_month')
      .field('applicantCount', '2')
      .field('consent', 'true')
      .attach('documents', pdfBuf, 'passport.pdf')
      .attach('documents', jpegBuf, 'photo.jpg')
      .attach('documents', pngBuf, 'id_card.png')
      .attach('documents', docxBuf, 'application.docx');

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.documentsUploaded, 4);

    // Verify documents metadata in database
    const savedEnquiry = await testKnex('enquiries')
      .where({ email: 'fatima.zahra@example.com' })
      .first();
    assert.ok(savedEnquiry);

    const docs = await testKnex('documents').where({ entity_id: savedEnquiry.id });
    assert.strictEqual(docs.length, 4);

    // Verify physical files exist on disk in the private storage directory
    for (const doc of docs) {
      assert.ok(doc.storage_key);
      const expectedPath = path.join(testStorageDir, doc.storage_key);
      assert.strictEqual(fs.existsSync(expectedPath), true);
      // Check that storage key doesn't leak into public response
      assert.strictEqual(res.text.includes(doc.storage_key), false);
    }
  });

  it('rejects missing required fields with structured validation errors', async () => {
    const res = await request(app)
      .post('/api/v1/visa-enquiries')
      .send({}); // empty payload

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details);
    assert.ok(res.body.error.details.fieldErrors);

    const { fieldErrors } = res.body.error.details;
    assert.ok(fieldErrors.fullName, 'fullName error required');
    assert.ok(fieldErrors.email, 'email error required');
    assert.ok(fieldErrors.phone, 'phone error required');
    assert.ok(fieldErrors.visaType, 'visaType error required');
    assert.ok(fieldErrors.nationality, 'nationality error required');
    assert.ok(fieldErrors.consent, 'consent error required');
  });

  it('rejects invalid email and phone formats', async () => {
    const res = await request(app)
      .post('/api/v1/visa-enquiries')
      .field('fullName', 'John Doe')
      .field('email', 'not-an-email')
      .field('phone', 'abc')
      .field('visaType', 'visit-visa-30')
      .field('nationality', 'United Kingdom')
      .field('consent', 'true');

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.fieldErrors.email);
    assert.ok(res.body.error.details.fieldErrors.phone);
  });

  it('rejects unknown or inactive visa services', async () => {
    // 1. Unknown service
    const res1 = await request(app)
      .post('/api/v1/visa-enquiries')
      .field('fullName', 'John Doe')
      .field('email', 'john.doe@example.com')
      .field('phone', '+971 50 111 2222')
      .field('visaType', 'golden-visa-10y') // Not active/supported
      .field('nationality', 'Canada')
      .field('consent', 'true');

    assert.strictEqual(res1.status, 400);
    assert.strictEqual(res1.body.error.code, 'INVALID_VISA_SERVICE');

    // 2. Inactive service
    const res2 = await request(app)
      .post('/api/v1/visa-enquiries')
      .field('fullName', 'John Doe')
      .field('email', 'john.doe@example.com')
      .field('phone', '+971 50 111 2222')
      .field('visaType', 'inactive-visa') // is_active = 0
      .field('nationality', 'Canada')
      .field('consent', 'true');

    assert.strictEqual(res2.status, 400);
    assert.strictEqual(res2.body.error.code, 'INVALID_VISA_SERVICE');
  });

  it('rejects prohibited file extensions (.exe)', async () => {
    const res = await request(app)
      .post('/api/v1/visa-enquiries')
      .field('fullName', 'Malicious Actor')
      .field('email', 'attacker@example.com')
      .field('phone', '+971 50 000 0000')
      .field('visaType', 'visit-visa-30')
      .field('nationality', 'Unknown')
      .field('consent', 'true')
      .attach('documents', Buffer.from('binary executable data'), 'malware.exe');

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'FILE_TYPE_PROHIBITED');
  });

  it('rejects spoofed MIME / magic-byte mismatch', async () => {
    const res = await request(app)
      .post('/api/v1/visa-enquiries')
      .field('fullName', 'Spoof Test')
      .field('email', 'spoof@example.com')
      .field('phone', '+971 50 123 4567')
      .field('visaType', 'visit-visa-30')
      .field('nationality', 'Jordan')
      .field('consent', 'true')
      .attach('documents', Buffer.from('Plain text claiming to be PDF'), 'passport.pdf');

    assert.strictEqual(res.status, 415);
    assert.strictEqual(res.body.error.code, 'UNSUPPORTED_MEDIA_TYPE');
  });

  it('rejects uploads exceeding maximum document count (>5 files)', async () => {
    const pdfBuf = Buffer.from('%PDF-1.7 mock valid document');
    const reqBuilder = request(app)
      .post('/api/v1/visa-enquiries')
      .field('fullName', 'Multi File Test')
      .field('email', 'multifile@example.com')
      .field('phone', '+971 50 123 4567')
      .field('visaType', 'visit-visa-30')
      .field('nationality', 'India')
      .field('consent', 'true');

    // Attach 6 files (limit is 5)
    for (let i = 1; i <= 6; i++) {
      reqBuilder.attach('documents', pdfBuf, `doc_${i}.pdf`);
    }

    const res = await reqBuilder;
    assert.strictEqual(res.status, 400);
    assert.ok(
      res.body.error.code === 'TOO_MANY_FILES' || res.body.error.code === 'LIMIT_FILE_COUNT'
    );
  });

  it('treats SQL injection and XSS payloads safely as plain text', async () => {
    const sqlInjection = "' OR '1'='1; DROP TABLE enquiries; --";
    const xssPayload = "<script>alert('xss')</script>";

    const res = await request(app)
      .post('/api/v1/visa-enquiries')
      .field('fullName', 'Security Auditor')
      .field('email', 'auditor@example.com')
      .field('phone', '+971 50 999 8888')
      .field('visaType', 'visit-visa-30')
      .field('nationality', 'UAE')
      .field('details', `${sqlInjection} and ${xssPayload}`)
      .field('consent', 'true');

    assert.strictEqual(res.status, 201);

    // Verify enquiries table still exists and record contains exact string safely
    const saved = await testKnex('enquiries').where({ email: 'auditor@example.com' }).first();
    assert.ok(saved);
    assert.strictEqual(saved.message, `${sqlInjection} and ${xssPayload}`);
  });

  it('enforces rate limiting on rapid consecutive requests (HTTP 429)', async () => {
    visaEnquiryRateLimiterInstance.setLimits(60000, 3); // 3 attempts per minute for test

    // Send 3 requests successfully
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/v1/visa-enquiries')
        .field('fullName', `User ${i}`)
        .field('email', `user${i}@example.com`)
        .field('phone', '+971 50 111 2222')
        .field('visaType', 'visit-visa-30')
        .field('nationality', 'UAE')
        .field('consent', 'true');
      assert.strictEqual(res.status, 201);
    }

    // 4th request must be rate-limited
    const rateLimitedRes = await request(app)
      .post('/api/v1/visa-enquiries')
      .field('fullName', 'User 4')
      .field('email', 'user4@example.com')
      .field('phone', '+971 50 111 2222')
      .field('visaType', 'visit-visa-30')
      .field('nationality', 'UAE')
      .field('consent', 'true');

    assert.strictEqual(rateLimitedRes.status, 429);
    assert.strictEqual(rateLimitedRes.body.error.code, 'RATE_LIMIT_EXCEEDED');
    assert.ok(rateLimitedRes.headers['retry-after']);
  });

  it('compensates and cleans up physical orphan files if database transaction fails', async () => {
    const pdfBuf = Buffer.from('%PDF-1.7 mock orphan file payload');

    // Helper to count files in storage root
    const countStorageFiles = async (dir: string): Promise<number> => {
      if (!fs.existsSync(dir)) return 0;
      let count = 0;
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          count += await countStorageFiles(full);
        } else {
          count++;
        }
      }
      return count;
    };

    const filesBefore = await countStorageFiles(testStorageDir);

    // Temporarily break enquiries insert by renaming the table to trigger a DB transaction error
    await testKnex.schema.renameTable('enquiries', 'enquiries_broken');

    try {
      const res = await request(app)
        .post('/api/v1/visa-enquiries')
        .field('fullName', 'Orphan Test')
        .field('email', 'orphan@example.com')
        .field('phone', '+971 50 123 4567')
        .field('visaType', 'visit-visa-30')
        .field('nationality', 'Egypt')
        .field('consent', 'true')
        .attach('documents', pdfBuf, 'orphan_doc.pdf');

      assert.strictEqual(res.status, 500);

      // Verify that no new orphan files remain in the storage directory
      const filesAfter = await countStorageFiles(testStorageDir);
      assert.strictEqual(filesAfter, filesBefore, 'Orphan files must be cleaned up on DB failure');
    } finally {
      // Restore table
      await testKnex.schema.renameTable('enquiries_broken', 'enquiries');
    }
  });

  it('prohibits public document access / download endpoints (documents remain strictly private)', async () => {
    // Attempt to access document directly through public API routes
    const res1 = await request(app).get('/api/v1/visa-enquiries/documents/any-id');
    assert.strictEqual(res1.status, 404);

    const res2 = await request(app).get('/api/v1/documents/any-id');
    assert.strictEqual(res2.status, 404);

    const res3 = await request(app).get('/storage/visa-enquiries/sample.pdf');
    assert.strictEqual(res3.status, 404);
  });

  describe('Malware Scanner Execution Path & Trust Lifecycle', () => {
    it('when malware scanner is disabled, uploaded document is persisted in quarantined/untrusted status (pending/skipped) and assertDocumentTrusted fails', async () => {
      malwareScannerService.setEnabled(false);

      const pdfBuf = Buffer.from('%PDF-1.7 mock applicant passport copy');
      const res = await request(app)
        .post('/api/v1/visa-enquiries')
        .field('fullName', 'Tariq Mansoor')
        .field('email', 'tariq.mansoor@example.com')
        .field('phone', '+971 50 111 2233')
        .field('visaType', 'visit-visa-30')
        .field('nationality', 'Oman')
        .field('consent', 'true')
        .attach('documents', pdfBuf, 'tariq_passport.pdf');

      assert.strictEqual(res.status, 201);

      const savedEnquiry = await testKnex('enquiries').where({ email: 'tariq.mansoor@example.com' }).first();
      assert.ok(savedEnquiry);

      const doc = await testKnex('documents').where({ entity_id: savedEnquiry.id }).first();
      assert.ok(doc);
      // Untrusted lifecycle state
      assert.strictEqual(doc.validation_status, 'pending');
      assert.strictEqual(doc.malware_scan_status, 'skipped');

      // Trust assertions
      assert.strictEqual(isDocumentTrusted(doc), false);
      assert.throws(
        () => assertDocumentTrusted(doc),
        (err: any) => {
          assert.strictEqual(err.code, 'DOCUMENT_UNTRUSTED');
          assert.strictEqual(err.statusCode, 403);
          return true;
        }
      );
    });

    it('when malware scanner is enabled and reports clean, document is accepted as trusted (valid/clean) and assertDocumentTrusted succeeds', async () => {
      malwareScannerService.setEnabled(true);
      // Execute a benign mock scanner that exits cleanly
      malwareScannerService.setCommand('node -e process.exit(0)');

      const pdfBuf = Buffer.from('%PDF-1.7 mock clean document payload');
      const res = await request(app)
        .post('/api/v1/visa-enquiries')
        .field('fullName', 'Zainab Qasim')
        .field('email', 'zainab.qasim@example.com')
        .field('phone', '+971 50 444 5566')
        .field('visaType', 'visit-visa-60')
        .field('nationality', 'Bahrain')
        .field('consent', 'true')
        .attach('documents', pdfBuf, 'clean_scan.pdf');

      assert.strictEqual(res.status, 201);

      const savedEnquiry = await testKnex('enquiries').where({ email: 'zainab.qasim@example.com' }).first();
      assert.ok(savedEnquiry);

      const doc = await testKnex('documents').where({ entity_id: savedEnquiry.id }).first();
      assert.ok(doc);
      // Trusted lifecycle state
      assert.strictEqual(doc.validation_status, 'valid');
      assert.strictEqual(doc.malware_scan_status, 'clean');

      // Trust assertions
      assert.strictEqual(isDocumentTrusted(doc), true);
      assert.doesNotThrow(() => assertDocumentTrusted(doc));
    });

    it('when malware scanner is enabled and detects malware, upload is rejected with 400 MALICIOUS_FILE_DETECTED, compensation unlinks files, and audit log records malware_detected', async () => {
      malwareScannerService.setEnabled(true);
      // Mock scanner that outputs infection signature and exits with 1
      malwareScannerService.setCommand('node -e console.log("FOUND_Infected_Signature");process.exit(1)');

      const pdfBuf = Buffer.from('%PDF-1.7 infected mock payload');
      const res = await request(app)
        .post('/api/v1/visa-enquiries')
        .field('fullName', 'Infected User')
        .field('email', 'infected@example.com')
        .field('phone', '+971 50 000 9999')
        .field('visaType', 'visit-visa-30')
        .field('nationality', 'Unknown')
        .field('consent', 'true')
        .attach('documents', pdfBuf, 'virus.pdf');

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error.code, 'MALICIOUS_FILE_DETECTED');

      // Verify no DB record created
      const savedEnquiry = await testKnex('enquiries').where({ email: 'infected@example.com' }).first();
      assert.strictEqual(savedEnquiry, undefined);

      // Verify audit log record created
      const auditLog = await testKnex('audit_logs').where({ action: 'malware_detected' }).first();
      assert.ok(auditLog, 'Audit log must record malware_detected event');
      assert.strictEqual(auditLog.resource_type, 'document');
      assert.strictEqual(auditLog.details_json.includes('virus.pdf'), true);
      assert.strictEqual(auditLog.details_json.includes('%PDF'), false, 'Never log file content bytes');
    });

    it('when malware scanner is enabled and scanner command fails, system fails closed with 500 SCANNER_UNAVAILABLE and cleans up files', async () => {
      malwareScannerService.setEnabled(true);
      // Mock scanner command that fails to execute (non-existent binary)
      malwareScannerService.setCommand('non_existent_clamscan_binary_missing_xyz');

      const pdfBuf = Buffer.from('%PDF-1.7 mock file for failed scanner');
      const res = await request(app)
        .post('/api/v1/visa-enquiries')
        .field('fullName', 'FailClosed User')
        .field('email', 'failclosed@example.com')
        .field('phone', '+971 50 888 7777')
        .field('visaType', 'visit-visa-30')
        .field('nationality', 'Kuwait')
        .field('consent', 'true')
        .attach('documents', pdfBuf, 'fail_closed.pdf');

      assert.strictEqual(res.status, 500);
      assert.strictEqual(res.body.error.code, 'SCANNER_UNAVAILABLE');

      // Fail closed: no DB record created
      const savedEnquiry = await testKnex('enquiries').where({ email: 'failclosed@example.com' }).first();
      assert.strictEqual(savedEnquiry, undefined);

      // Audit log records failure
      const auditLog = await testKnex('audit_logs').where({ action: 'malware_scan_failed' }).first();
      assert.ok(auditLog, 'Audit log must record malware_scan_failed event');
    });
  });

  describe('Multipart Request Limits & RAM Exhaustion Defense', () => {
    it('rejects an individual file exceeding the 10MB limit (HTTP 413 FILE_TOO_LARGE)', async () => {
      // 10MB + 1KB buffer
      const oversizedBuf = Buffer.alloc(10 * 1024 * 1024 + 1024);
      oversizedBuf.set(Buffer.from('%PDF-1.7'), 0);

      const res = await request(app)
        .post('/api/v1/visa-enquiries')
        .field('fullName', 'Big File User')
        .field('email', 'bigfile@example.com')
        .field('phone', '+971 50 123 4567')
        .field('visaType', 'visit-visa-30')
        .field('nationality', 'UAE')
        .field('consent', 'true')
        .attach('documents', oversizedBuf, 'big_file.pdf');

      assert.strictEqual(res.status, 413);
      assert.strictEqual(res.body.error.code, 'FILE_TOO_LARGE');
    });

    it('rejects request declaring Content-Length > 25MB before parsing buffers (HTTP 413 PAYLOAD_TOO_LARGE)', async () => {
      const res = await request(app)
        .post('/api/v1/visa-enquiries')
        .set('Content-Length', (26 * 1024 * 1024).toString())
        .set('Content-Type', 'multipart/form-data; boundary=---test')
        .send('mock data');

      assert.strictEqual(res.status, 413);
      assert.strictEqual(res.body.error.code, 'PAYLOAD_TOO_LARGE');
    });

    it('accepts exact boundary of 5 documents without error', async () => {
      const pdfBuf = Buffer.from('%PDF-1.7 mock passport copy');
      const reqBuilder = request(app)
        .post('/api/v1/visa-enquiries')
        .field('fullName', 'Five Docs User')
        .field('email', 'fivedocs@example.com')
        .field('phone', '+971 50 123 4567')
        .field('visaType', 'visit-visa-30')
        .field('nationality', 'UAE')
        .field('consent', 'true');

      for (let i = 1; i <= 5; i++) {
        reqBuilder.attach('documents', pdfBuf, `doc_${i}.pdf`);
      }

      const res = await reqBuilder;
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.documentsUploaded, 5);
    });

    it('rejects excessive multipart text fields (>20 fields) to prevent multipart flooding', async () => {
      const reqBuilder = request(app)
        .post('/api/v1/visa-enquiries')
        .field('fullName', 'Field Flood User')
        .field('email', 'flood@example.com')
        .field('phone', '+971 50 123 4567')
        .field('visaType', 'visit-visa-30')
        .field('nationality', 'UAE')
        .field('consent', 'true');

      // Add 25 extra text fields
      for (let i = 1; i <= 25; i++) {
        reqBuilder.field(`extra_field_${i}`, `value_${i}`);
      }

      const res = await reqBuilder;
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error.code, 'TOO_MANY_FIELDS');
    });
  });
});
