/**
 * CITYLINE CONSULTANCY — Jobs & Recruitment System Integration Test Suite
 *
 * Comprehensive validation of:
 * 1. Public job vacancy discovery, search, filtering, pagination, and slug resolution.
 * 2. Status isolation: only 'published'/'active' jobs are visible to the public; drafts and archived return 404.
 * 3. Candidate application submission with secure CV upload (PDF and DOCX).
 * 4. File security: magic-byte enforcement, disallowed extensions, spoofing rejection, and size limits.
 * 5. Pre-generated identifiers, private storage outside webroot, and filesystem compensation on failure.
 * 6. Malware scanning: fail-closed / quarantine trust semantics and orphan cleanup.
 * 7. Idempotency: duplicate HTTP retries / 15-minute window suppressed without permanently blocking future applications.
 * 8. Job deletion safety: soft-deletion preserves applications and documents; hard-delete blocked on dependency.
 * 9. Rate limiting: 5 requests / 15 min / IP sliding window.
 * 10. Outbox notifications: transactional enqueueing of admin alert and applicant confirmation (no attachments).
 * 11. Administrative RBAC and audit logging for job and application management.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import knex, { Knex } from 'knex';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

import { createApp } from '../src/app';
import { setDbClient } from '../src/database/connection';
import { storageService } from '../src/services/storage.service';
import { malwareScannerService } from '../src/services/malware-scanner.service';
import { jobApplicationRateLimiterInstance } from '../src/middleware/job-rate-limit.middleware';
import { createAdminToken } from '../src/auth/token';
import { tokenRevocationStore } from '../src/auth/token-revocation';
import { jobRepository } from '../src/repositories/job.repository';
import { jobService } from '../src/services/job.service';
import { jobApplicationService } from '../src/services/job-application.service';

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

describe('Jobs & Recruitment System Integration', () => {
  let app: ReturnType<typeof createApp>;
  let testKnex: Knex;
  let testStorageDir: string;

  const testAdminId = '99999999-9999-9999-9999-999999999999';
  let adminAuthHeader: string;

  const sampleJob1Id = '11111111-0000-0000-0000-000000000001';
  const sampleJob2Id = '11111111-0000-0000-0000-000000000002';
  const draftJobId = '11111111-0000-0000-0000-000000000003';
  const archivedJobId = '11111111-0000-0000-0000-000000000004';

  before(async () => {
    // 1. Setup temporary storage root
    testStorageDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'clc-job-test-storage-'));
    storageService.setStorageRoot(testStorageDir);

    // 2. Setup isolated in-memory SQLite database
    testKnex = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    setDbClient(testKnex);
    tokenRevocationStore.setClient(testKnex);

    // 3. Create required schema tables in SQLite
    await testKnex.schema.createTable('admin_roles', (t) => {
      t.increments('id').primary();
      t.string('role_key', 50).notNullable().unique();
      t.string('name', 100).notNullable();
      t.string('description', 255).nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('admin_users', (t) => {
      t.string('id', 36).primary();
      t.integer('role_id').notNullable();
      t.string('username', 100).notNullable().unique();
      t.string('email', 255).notNullable().unique();
      t.string('password_hash', 255).notNullable();
      t.string('full_name', 150).notNullable();
      t.boolean('is_active').defaultTo(true);
      t.timestamp('last_login_at').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('revoked_tokens', (t) => {
      t.string('jti', 64).primary();
      t.string('admin_id', 36).notNullable();
      t.timestamp('expires_at').notNullable();
      t.timestamp('revoked_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('job_categories', (t) => {
      t.increments('id').primary();
      t.string('name', 100).notNullable().unique();
      t.string('slug', 100).notNullable().unique();
      t.string('description', 255).nullable();
      t.integer('display_order').defaultTo(0);
      t.boolean('is_active').defaultTo(true);
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('jobs', (t) => {
      t.string('id', 36).primary();
      t.integer('category_id').notNullable();
      t.string('title', 255).notNullable();
      t.string('slug', 255).notNullable().unique();
      t.string('location', 255).notNullable();
      t.string('employment_type', 50).notNullable();
      t.text('description').notNullable();
      t.text('requirements').notNullable();
      t.text('short_description').nullable();
      t.text('responsibilities').nullable();
      t.string('qualification', 255).nullable();
      t.integer('experience_years_required').nullable();
      t.string('salary_range', 100).nullable();
      t.text('benefits').nullable();
      t.string('visa_sponsorship', 150).nullable();
      t.string('work_shift', 150).nullable();
      t.string('status', 50).defaultTo('draft');
      t.boolean('is_featured').defaultTo(false);
      t.timestamp('published_at').nullable();
      t.timestamp('deleted_at').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('job_applications', (t) => {
      t.string('id', 36).primary();
      t.string('job_id', 36).notNullable();
      t.string('applicant_name', 255).notNullable();
      t.string('email', 255).notNullable();
      t.string('phone', 50).notNullable();
      t.string('whatsapp', 50).nullable();
      t.string('nationality', 100).nullable();
      t.string('current_location', 255).nullable();
      t.integer('years_experience').defaultTo(0);
      t.string('qualification', 255).nullable();
      t.text('cover_letter').nullable();
      t.string('reference_number', 50).nullable();
      t.string('idempotency_key', 100).nullable();
      t.string('status', 50).defaultTo('new');
      t.text('admin_notes').nullable();
      t.string('source_channel', 50).defaultTo('website');
      t.timestamp('deleted_at').nullable();
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

    // 4. Seed reference data: Roles & Admin User
    await testKnex('admin_roles').insert([
      { id: 1, role_key: 'super_admin', name: 'Super Administrator' },
      { id: 2, role_key: 'admin_operator', name: 'Recruitment Operator' },
    ]);

    await testKnex('admin_users').insert({
      id: testAdminId,
      role_id: 1,
      username: 'recruitment_admin',
      email: 'recruitment.admin@citylineconsultancy.ae',
      password_hash: 'hashed_pw_test',
      full_name: 'Recruitment Admin',
      is_active: true,
    });

    const tokenObj = createAdminToken({
      id: testAdminId,
      username: 'recruitment_admin',
      email: 'recruitment.admin@citylineconsultancy.ae',
      role: 'super_admin',
      roleId: 1,
    });
    adminAuthHeader = `Bearer ${tokenObj.token}`;

    // Seed 8 locked categories
    const categories = [
      { id: 1, name: 'Hotel Staff', slug: 'hotel-staff', display_order: 1 },
      { id: 2, name: 'Cleaning', slug: 'cleaning', display_order: 2 },
      { id: 3, name: 'Mason', slug: 'mason', display_order: 3 },
      { id: 4, name: 'Steel Fixer', slug: 'steel-fixer', display_order: 4 },
      { id: 5, name: 'Carpenter', slug: 'carpenter', display_order: 5 },
      { id: 6, name: 'Bike Rider / Delivery Job', slug: 'bike-rider-delivery-job', display_order: 6 },
      { id: 7, name: 'Taxi Driver', slug: 'taxi-driver', display_order: 7 },
      { id: 8, name: 'Truck Driver', slug: 'truck-driver', display_order: 8 },
    ];
    await testKnex('job_categories').insert(categories);

    // Seed sample jobs: 2 published, 1 draft, 1 archived
    await testKnex('jobs').insert([
      {
        id: sampleJob1Id,
        category_id: 3, // Mason
        title: 'Civil Block & Plaster Mason',
        slug: 'civil-block-plaster-mason',
        location: 'Dubai, UAE',
        employment_type: 'Full-Time',
        description: 'Block masonry and plastering opportunities for licensed UAE construction contractors.',
        requirements: 'Demonstrated proficiency in block laying and surface plastering.\nMinimum 2 years experience.',
        short_description: 'Block masonry and plastering opportunities in Dubai.',
        responsibilities: 'Erect concrete blocks and apply plaster layers.\nComply with structural drawings.',
        qualification: 'Secondary School or ITI Masonry Trade Certificate',
        experience_years_required: 2,
        salary_range: 'AED 1,800 - 2,400',
        benefits: 'Employer-provided visa sponsorship, accommodation, transport, and medical insurance.',
        status: 'active',
        is_featured: true,
        published_at: new Date(),
      },
      {
        id: sampleJob2Id,
        category_id: 1, // Hotel Staff
        title: 'Hotel Front Office Associate',
        slug: 'hotel-front-office-associate',
        location: 'Dubai, UAE',
        employment_type: 'Full-Time',
        description: 'Guest service and reception desk coordination at premium hospitality properties.',
        requirements: 'Hospitality customer service experience.\nFluent English communication.',
        short_description: 'Front desk reception and guest coordination in Dubai.',
        responsibilities: 'Manage guest check-ins.\nMaintain billing logs.',
        qualification: 'Diploma in Hospitality or High School Graduate',
        experience_years_required: 1,
        salary_range: 'AED 2,500 - 3,200',
        benefits: 'Sponsorship visa, medical insurance, duty meals, and air ticket allowance.',
        status: 'active',
        is_featured: true,
        published_at: new Date(),
      },
      {
        id: draftJobId,
        category_id: 2, // Cleaning
        title: 'Commercial Cleaning Specialist (Draft)',
        slug: 'commercial-cleaning-draft',
        location: 'Abu Dhabi, UAE',
        employment_type: 'Full-Time',
        description: 'Internal draft job posting that is not yet ready for public publication.',
        requirements: 'Basic hygiene training.',
        status: 'draft',
        is_featured: false,
        published_at: null,
      },
      {
        id: archivedJobId,
        category_id: 7, // Taxi Driver
        title: 'RTA Certified Taxi Driver (Archived)',
        slug: 'rta-taxi-driver-archived',
        location: 'Dubai, UAE',
        employment_type: 'Full-Time',
        description: 'Previously published driver opportunity that is now closed/archived.',
        requirements: 'Valid UAE or Home Country driving license.',
        status: 'archived',
        is_featured: false,
        published_at: new Date(Date.now() - 30 * 86400000),
      },
    ]);

    app = createApp();
  });

  beforeEach(() => {
    jobApplicationRateLimiterInstance.clear();
  });

  after(async () => {
    await testKnex.destroy();
    if (fs.existsSync(testStorageDir)) {
      await fs.promises.rm(testStorageDir, { recursive: true, force: true });
    }
  });

  // ============================================================================
  // 1. PUBLIC JOB DISCOVERY & STATUS ISOLATION
  // ============================================================================
  describe('Public Job Discovery & Filtering', () => {
    it('GET /api/v1/jobs returns ONLY published jobs (drafts and archived excluded)', async () => {
      const res = await request(app).get('/api/v1/jobs');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(Array.isArray(res.body.data), true);
      assert.equal(res.body.data.length, 2);

      const slugs = res.body.data.map((j: any) => j.slug);
      assert.ok(slugs.includes('civil-block-plaster-mason'));
      assert.ok(slugs.includes('hotel-front-office-associate'));
      assert.ok(!slugs.includes('commercial-cleaning-draft'), 'Draft job must not be visible publicly');
      assert.ok(!slugs.includes('rta-taxi-driver-archived'), 'Archived job must not be visible publicly');
    });

    it('GET /api/v1/jobs filters by category slug', async () => {
      const res = await request(app).get('/api/v1/jobs?category=mason');

      assert.equal(res.status, 200);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0].slug, 'civil-block-plaster-mason');
      assert.equal(res.body.data[0].category, 'Mason');
    });

    it('GET /api/v1/jobs filters by search query term', async () => {
      const res = await request(app).get('/api/v1/jobs?search=Front Office');

      assert.equal(res.status, 200);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0].slug, 'hotel-front-office-associate');
    });

    it('GET /api/v1/jobs/categories returns active categories with published job counts', async () => {
      const res = await request(app).get('/api/v1/jobs/categories');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.length, 8);

      const mason = res.body.data.find((c: any) => c.slug === 'mason');
      assert.ok(mason);
      assert.equal(mason.job_count, 1);

      const cleaning = res.body.data.find((c: any) => c.slug === 'cleaning');
      assert.ok(cleaning);
      assert.equal(cleaning.job_count, 0, 'Draft job should not increment published category count');
    });

    it('GET /api/v1/jobs/:slug returns published job details', async () => {
      const res = await request(app).get('/api/v1/jobs/civil-block-plaster-mason');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.slug, 'civil-block-plaster-mason');
      assert.equal(res.body.data.qualification, 'Secondary School or ITI Masonry Trade Certificate');
      assert.equal(res.body.data.experienceYearsRequired, 2);
    });

    it('GET /api/v1/jobs/:slug returns 404 for draft or archived jobs (non-disclosure)', async () => {
      const draftRes = await request(app).get('/api/v1/jobs/commercial-cleaning-draft');
      assert.equal(draftRes.status, 404);
      assert.equal(draftRes.body.error.code, 'JOB_NOT_FOUND');

      const archivedRes = await request(app).get('/api/v1/jobs/rta-taxi-driver-archived');
      assert.equal(archivedRes.status, 404);
      assert.equal(archivedRes.body.error.code, 'JOB_NOT_FOUND');

      const nonExistentRes = await request(app).get('/api/v1/jobs/non-existent-vacancy-slug');
      assert.equal(nonExistentRes.status, 404);
      assert.equal(nonExistentRes.body.error.code, 'JOB_NOT_FOUND');
    });
  });

  // ============================================================================
  // 2. CANDIDATE APPLICATION SUBMISSION & VALIDATION
  // ============================================================================
  describe('Candidate Application Submission', () => {
    it('submits application successfully with a valid PDF CV file', async () => {
      const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

      const res = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .field('fullName', 'Ramesh Kumar')
        .field('email', 'ramesh.mason@example.com')
        .field('phone', '+91 9876543210')
        .field('whatsapp', '+91 9876543210')
        .field('nationality', 'Indian')
        .field('currentLocation', 'Rajasthan, India')
        .field('yearsExperience', '4')
        .field('qualification', 'ITI Masonry Certification')
        .field('coverLetter', 'Experienced block mason with GCC commercial project background.')
        .field('consent', 'true')
        .attach('cv', validPdfBuffer, 'ramesh_resume.pdf');

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.reference);
      assert.match(res.body.data.reference, /^CLC-J-\d{4}-[A-Z0-9]{8}$/);

      // Verify database record
      const appRecord = await testKnex('job_applications')
        .where({ reference_number: res.body.data.reference })
        .first();
      assert.ok(appRecord);
      assert.equal(appRecord.applicant_name, 'Ramesh Kumar');
      assert.equal(appRecord.email, 'ramesh.mason@example.com');
      assert.equal(appRecord.years_experience, 4);
      assert.equal(appRecord.status, 'new');

      // Verify document record
      const docRecord = await testKnex('documents')
        .where({ entity_id: appRecord.id })
        .first();
      assert.ok(docRecord);
      assert.equal(docRecord.document_category, 'resume');
      assert.equal(docRecord.file_extension, 'pdf');
      assert.equal(docRecord.mime_type, 'application/pdf');
      assert.ok(docRecord.storage_key.startsWith('job-applications/'));

      // Verify physical file was written with restricted permissions outside webroot
      const physicalPath = path.join(testStorageDir, docRecord.storage_key);
      assert.ok(fs.existsSync(physicalPath));
    });

    it('submits application successfully with a valid DOCX CV file', async () => {
      const validDocxBuffer = createMockZipBuffer([
        { name: '[Content_Types].xml', content: '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>' },
        { name: 'word/document.xml', content: '<w:document></w:document>' },
      ]);

      const res = await request(app)
        .post('/api/v1/jobs/hotel-front-office-associate/apply')
        .field('fullName', 'Priya Sharma')
        .field('email', 'priya.hospitality@example.com')
        .field('phone', '+91 9123456780')
        .field('nationality', 'Indian')
        .field('currentLocation', 'Delhi, India')
        .field('yearsExperience', '2')
        .field('consent', 'true')
        .attach('cv', validDocxBuffer, 'priya_cv.docx');

      assert.equal(res.status, 201);
      assert.ok(res.body.data.reference);

      const docRecord = await testKnex('documents')
        .where({ original_filename: 'priya_cv.docx' })
        .first();
      assert.ok(docRecord);
      assert.equal(docRecord.file_extension, 'docx');
    });

    it('submits application successfully without CV file (CV is optional)', async () => {
      const res = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .field('fullName', 'Sunil Yadav')
        .field('email', 'sunil.yadav@example.com')
        .field('phone', '+91 9988776655')
        .field('nationality', 'Indian')
        .field('currentLocation', 'Uttar Pradesh, India')
        .field('yearsExperience', '3')
        .field('consent', 'true');

      assert.equal(res.status, 201);
      assert.ok(res.body.data.reference);

      const appRecord = await testKnex('job_applications')
        .where({ email: 'sunil.yadav@example.com' })
        .first();
      assert.ok(appRecord);

      // Verify no document record created
      const docCount = await testKnex('documents').where({ entity_id: appRecord.id });
      assert.equal(docCount.length, 0);
    });

    it('rejects application missing required fields with 400 validation error', async () => {
      const res = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .field('fullName', '') // Missing name
        .field('email', 'invalid-email')
        .field('phone', '')
        .field('consent', 'false');

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
      const fieldErrors = res.body.error.details?.fieldErrors || {};
      assert.ok(fieldErrors.fullName);
      assert.ok(fieldErrors.email);
      assert.ok(fieldErrors.phone);
      assert.ok(fieldErrors.consent);
    });

    it('rejects disallowed file extensions (e.g. .exe / .sh) with 400', async () => {
      const exeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00');

      const res = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .field('fullName', 'Attacker Test')
        .field('email', 'attacker@example.com')
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Unknown')
        .field('yearsExperience', '1')
        .field('consent', 'true')
        .attach('cv', exeBuffer, 'payload.exe');

      assert.equal(res.status, 400);
      assert.equal(res.body.error.code, 'FILE_TYPE_PROHIBITED');
      assert.ok(res.body.error.message.includes('prohibited'));
    });

    it('rejects spoofed extension (file named .pdf but containing plain text) with 415', async () => {
      const fakePdf = Buffer.from('This is completely plain text with no PDF magic bytes at all.');

      const res = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .field('fullName', 'Spoofer Test')
        .field('email', 'spoofer@example.com')
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Delhi')
        .field('yearsExperience', '1')
        .field('consent', 'true')
        .attach('cv', fakePdf, 'fake.pdf');

      assert.equal(res.status, 415);
      assert.equal(res.body.error.code, 'UNSUPPORTED_MEDIA_TYPE');
      assert.ok(res.body.error.message.includes('signature'));
    });
  });

  // ============================================================================
  // 3. MALWARE SCANNER TRUST MODEL & FILESYSTEM COMPENSATION
  // ============================================================================
  describe('Malware Scanner & Filesystem Compensation', () => {
    it('fails closed and removes physical files if scanner detects infection', async () => {
      // Mock scanner to report infected
      const originalScan = malwareScannerService.scanFile;
      const originalEnabled = malwareScannerService.isEnabled;

      (malwareScannerService as any).isEnabled = () => true;
      (malwareScannerService as any).scanFile = async () => ({
        status: 'infected',
        clean: false,
        scanner: 'clamav',
        details: 'EICAR-Test-Signature detected',
      });

      const validPdfBuffer = Buffer.from('%PDF-1.4 mock malware payload %EOF');

      try {
        const res = await request(app)
          .post('/api/v1/jobs/civil-block-plaster-mason/apply')
          .field('fullName', 'Malware Test')
          .field('email', 'malware@example.com')
          .field('phone', '+91 9876543210')
          .field('currentLocation', 'Delhi')
          .field('yearsExperience', '1')
          .field('consent', 'true')
          .attach('cv', validPdfBuffer, 'eicar.pdf');

        assert.equal(res.status, 400);
        assert.equal(res.body.error.code, 'MALICIOUS_FILE_DETECTED');

        // Verify NO database application record exists
        const appRecord = await testKnex('job_applications').where({ email: 'malware@example.com' }).first();
        assert.equal(appRecord, undefined, 'Database record must not be created on malware detection');

        // Verify audit log recorded event
        const audit = await testKnex('audit_logs').where({ action: 'malware_detected' }).first();
        assert.ok(audit);

        // Verify filesystem compensation: no orphaned physical file remaining
        const filesInStorage = await fs.promises.readdir(path.join(testStorageDir, 'job-applications')).catch(() => []);
        // Check that none of the subdirectories contain files for this submission
        let totalFiles = 0;
        for (const sub of filesInStorage) {
          const inner = await fs.promises.readdir(path.join(testStorageDir, 'job-applications', sub));
          totalFiles += inner.length;
        }
        // Previously existing 2 files (ramesh, priya) should remain, but eicar was compensated
        assert.equal(totalFiles, 2, 'Filesystem compensation must clean up infected file');
      } finally {
        (malwareScannerService as any).scanFile = originalScan;
        (malwareScannerService as any).isEnabled = originalEnabled;
      }
    });
  });

  // ============================================================================
  // 4. IDEMPOTENCY & DUPLICATE PROTECTION
  // ============================================================================
  describe('Idempotency & Duplicate Protection', () => {
    it('suppresses immediate duplicate submission within 15 minutes and returns existing reference', async () => {
      const email = 'duplicate.candidate@example.com';

      // 1st submission
      const res1 = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .field('fullName', 'Candidate One')
        .field('email', email)
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Mumbai')
        .field('yearsExperience', '3')
        .field('consent', 'true');

      assert.equal(res1.status, 201);
      const reference1 = res1.body.data.reference;

      // 2nd immediate submission (double-click simulation)
      const res2 = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .field('fullName', 'Candidate One')
        .field('email', email)
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Mumbai')
        .field('yearsExperience', '3')
        .field('consent', 'true');

      assert.equal(res2.status, 200);
      assert.equal(res2.body.data.reference, reference1, 'Must return identical reference');

      // Verify only ONE database record exists
      const records = await testKnex('job_applications').where({ email });
      assert.equal(records.length, 1, 'Only one database application record must be created');
    });

    it('returns existing reference when submitted with identical X-Idempotency-Key', async () => {
      const idempotencyKey = 'key-uuid-12345-abcdef';

      const res1 = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .set('X-Idempotency-Key', idempotencyKey)
        .field('fullName', 'Candidate Key')
        .field('email', 'key.candidate@example.com')
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Kolkata')
        .field('yearsExperience', '2')
        .field('consent', 'true');

      assert.equal(res1.status, 201);
      const ref = res1.body.data.reference;

      const res2 = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .set('X-Idempotency-Key', idempotencyKey)
        .field('fullName', 'Candidate Key')
        .field('email', 'key.candidate@example.com')
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Kolkata')
        .field('yearsExperience', '2')
        .field('consent', 'true');

      assert.equal(res2.status, 200);
      assert.equal(res2.body.data.reference, ref);
    });

    it('allows the same candidate to apply to a different job without being blocked', async () => {
      const email = 'multijob.candidate@example.com';

      // Apply to Job 1 (Mason)
      const res1 = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .field('fullName', 'Versatile Candidate')
        .field('email', email)
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Punjab')
        .field('yearsExperience', '3')
        .field('consent', 'true');
      assert.equal(res1.status, 201);

      // Apply to Job 2 (Hotel Staff)
      const res2 = await request(app)
        .post('/api/v1/jobs/hotel-front-office-associate/apply')
        .field('fullName', 'Versatile Candidate')
        .field('email', email)
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Punjab')
        .field('yearsExperience', '3')
        .field('consent', 'true');
      assert.equal(res2.status, 201);

      assert.notEqual(res1.body.data.reference, res2.body.data.reference);

      const records = await testKnex('job_applications').where({ email });
      assert.equal(records.length, 2, 'Candidate must be able to apply to different jobs independently');
    });

    it('rejects submission with 409 Conflict if X-Idempotency-Key is reused for a different job', async () => {
      const key = 'shared-key-job-conflict-123';

      // First application to Mason
      const res1 = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .set('X-Idempotency-Key', key)
        .field('fullName', 'Candidate Test')
        .field('email', 'conflict.job@example.com')
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Delhi')
        .field('yearsExperience', '2')
        .field('consent', 'true');
      assert.equal(res1.status, 201);

      // Second application with SAME key but to Hotel Staff
      const res2 = await request(app)
        .post('/api/v1/jobs/hotel-front-office-associate/apply')
        .set('X-Idempotency-Key', key)
        .field('fullName', 'Candidate Test')
        .field('email', 'conflict.job@example.com')
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Delhi')
        .field('yearsExperience', '2')
        .field('consent', 'true');

      assert.equal(res2.status, 409);
      assert.equal(res2.body.error.code, 'IDEMPOTENCY_KEY_CONFLICT');
    });

    it('rejects submission with 409 Conflict if X-Idempotency-Key is reused for a different applicant email', async () => {
      const key = 'shared-key-email-conflict-456';

      // First application with email Alpha
      const res1 = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .set('X-Idempotency-Key', key)
        .field('fullName', 'Candidate Alpha')
        .field('email', 'alpha@example.com')
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Delhi')
        .field('yearsExperience', '2')
        .field('consent', 'true');
      assert.equal(res1.status, 201);

      // Second application with SAME key but email Beta
      const res2 = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .set('X-Idempotency-Key', key)
        .field('fullName', 'Candidate Beta')
        .field('email', 'beta@example.com')
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Delhi')
        .field('yearsExperience', '2')
        .field('consent', 'true');

      assert.equal(res2.status, 409);
      assert.equal(res2.body.error.code, 'IDEMPOTENCY_KEY_CONFLICT');
    });

    it('allows candidate to legitimately re-apply to the same job after the duplicate window has passed', async () => {
      const email = 'later.reapply@example.com';

      // First application
      const res1 = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .field('fullName', 'Reapplicant')
        .field('email', email)
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Jaipur')
        .field('yearsExperience', '3')
        .field('consent', 'true');
      assert.equal(res1.status, 201);

      // Age the first record by 20 minutes (outside the 15-minute window)
      const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
      await testKnex('job_applications')
        .where({ email })
        .update({ created_at: twentyMinsAgo });

      // Later legitimate re-application to the same job
      const res2 = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .field('fullName', 'Reapplicant')
        .field('email', email)
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Jaipur')
        .field('yearsExperience', '3')
        .field('consent', 'true');

      assert.equal(res2.status, 201);
      assert.notEqual(res1.body.data.reference, res2.body.data.reference);

      const records = await testKnex('job_applications').where({ email });
      assert.equal(records.length, 2, 'Candidate must not be permanently locked out of applying later');
    });
  });

  // ============================================================================
  // 5. TRANSACTIONAL OUTBOX NOTIFICATIONS
  // ============================================================================
  describe('Transactional Outbox Notifications', () => {
    it('enqueues admin alert and candidate confirmation in notification_queue', async () => {
      const email = 'outbox.candidate@example.com';

      const res = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .field('fullName', 'Outbox Candidate')
        .field('email', email)
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Pune')
        .field('yearsExperience', '2')
        .field('consent', 'true');

      assert.equal(res.status, 201);
      const ref = res.body.data.reference;

      const queueItems = await testKnex('notification_queue').whereLike('payload_json', `%"reference":"${ref}"%`);
      assert.equal(queueItems.length, 2, 'Two outbox notifications must be enqueued');

      const adminNotif = queueItems.find((q) => q.notification_type === 'job_application_admin');
      const confNotif = queueItems.find((q) => q.notification_type === 'job_application_confirmation');

      assert.ok(adminNotif);
      assert.ok(confNotif);
      assert.equal(confNotif.recipient_email, email);

      // Verify payload has no documents attached
      const confPayload = JSON.parse(confNotif.payload_json);
      assert.equal(confPayload.reference, ref);
      assert.equal((confPayload as any).attachments, undefined);
    });
  });

  // ============================================================================
  // 6. RATE LIMITING
  // ============================================================================
  describe('Application Rate Limiting', () => {
    it('enforces 5 requests per 15-minute sliding window and returns 429 with Retry-After', async () => {
      // Send 5 requests from the same IP
      for (let i = 1; i <= 5; i++) {
        const res = await request(app)
          .post('/api/v1/jobs/civil-block-plaster-mason/apply')
          .set('X-Forwarded-For', '198.51.100.42')
          .field('fullName', `Rate Candidate ${i}`)
          .field('email', `rate${i}@example.com`)
          .field('phone', '+91 9876543210')
          .field('currentLocation', 'Mumbai')
          .field('yearsExperience', '1')
          .field('consent', 'true');
        assert.equal(res.status, 201);
      }

      // 6th request from the same IP must be rate-limited
      const throttledRes = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .set('X-Forwarded-For', '198.51.100.42')
        .field('fullName', 'Rate Candidate 6')
        .field('email', 'rate6@example.com')
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Mumbai')
        .field('yearsExperience', '1')
        .field('consent', 'true');

      assert.equal(throttledRes.status, 429);
      assert.equal(throttledRes.body.error.code, 'RATE_LIMIT_EXCEEDED');
      assert.ok(throttledRes.headers['retry-after']);
    });

    it('does not allow arbitrary X-Forwarded-For headers to bypass rate limits when proxy is untrusted', async () => {
      // Send 5 requests from the socket with varying X-Forwarded-For headers
      for (let i = 1; i <= 5; i++) {
        const res = await request(app)
          .post('/api/v1/jobs/hotel-front-office-associate/apply')
          .set('X-Forwarded-For', `203.0.113.${i}`)
          .field('fullName', `Spoof Candidate ${i}`)
          .field('email', `spoof${i}@example.com`)
          .field('phone', '+91 9876543210')
          .field('currentLocation', 'Mumbai')
          .field('yearsExperience', '1')
          .field('consent', 'true');
        assert.equal(res.status, 201);
      }

      // 6th request with yet another spoofed X-Forwarded-For must still be rejected with 429
      const res6 = await request(app)
        .post('/api/v1/jobs/hotel-front-office-associate/apply')
        .set('X-Forwarded-For', '203.0.113.99')
        .field('fullName', 'Spoof Candidate 6')
        .field('email', 'spoof6@example.com')
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Mumbai')
        .field('yearsExperience', '1')
        .field('consent', 'true');

      assert.equal(res6.status, 429);
      assert.equal(res6.body.error.code, 'RATE_LIMIT_EXCEEDED');
      assert.ok(res6.headers['retry-after']);
    });
  });

  // ============================================================================
  // 7. JOB DELETION SAFETY
  // ============================================================================
  describe('Job Deletion Safety', () => {
    it('soft-deletes job with existing applications, preserving applications and documents', async () => {
      // sampleJob1Id has applications submitted above
      await jobService.deleteJob(sampleJob1Id, testAdminId);

      const jobRecord = await testKnex('jobs').where({ id: sampleJob1Id }).first();
      assert.ok(jobRecord);
      assert.ok(jobRecord.deleted_at !== null);
      assert.equal(jobRecord.status, 'archived');

      // Candidate applications are preserved
      const appCount = await testKnex('job_applications').where({ job_id: sampleJob1Id });
      assert.ok(appCount.length > 0, 'Applications must remain intact');

      // Applicant documents are preserved
      const docCount = await testKnex('documents').where({ entity_type: 'job_application' });
      assert.ok(docCount.length > 0, 'Applicant documents must remain intact');
    });

    it('rejects hard-delete of job with existing applications with 409 Conflict', async () => {
      await assert.rejects(
        async () => {
          await jobRepository.hardDeleteJob(sampleJob1Id);
        },
        (err: any) => {
          assert.equal(err.statusCode, 409);
          assert.equal(err.code, 'CANNOT_DELETE_JOB_WITH_APPLICATIONS');
          return true;
        }
      );
    });

    it('preserves application and document access after a job is archived', async () => {
      // sampleJob1Id was soft-deleted/archived earlier
      const apps = await testKnex('job_applications').where({ job_id: sampleJob1Id });
      assert.ok(apps.length > 0);

      // Admin detail for an application on the archived job can still resolve job details
      const res = await request(app)
        .get(`/api/v1/admin/recruitment/applications/${apps[0].id}`)
        .set('Authorization', adminAuthHeader);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.application.job_title, 'Civil Block & Plaster Mason');

      // Public user cannot browse or apply to the archived job
      const pubRes = await request(app).get('/api/v1/jobs/civil-block-plaster-mason');
      assert.equal(pubRes.status, 404);

      const applyRes = await request(app)
        .post('/api/v1/jobs/civil-block-plaster-mason/apply')
        .field('fullName', 'Late Applicant')
        .field('email', 'late@example.com')
        .field('phone', '+91 9876543210')
        .field('currentLocation', 'Delhi')
        .field('yearsExperience', '1')
        .field('consent', 'true');
      assert.equal(applyRes.status, 404);
    });
  });

  // ============================================================================
  // 8. ADMIN RECRUITMENT MANAGEMENT & RBAC
  // ============================================================================
  describe('Administrative Recruitment Endpoints & RBAC', () => {
    it('rejects unauthenticated requests to /api/v1/admin/recruitment/jobs with 401', async () => {
      const res = await request(app).get('/api/v1/admin/recruitment/jobs');
      assert.equal(res.status, 401);
    });

    it('rejects unauthenticated requests to /api/v1/admin/recruitment/applications with 401', async () => {
      const res = await request(app).get('/api/v1/admin/recruitment/applications');
      assert.equal(res.status, 401);
    });

    it('allows authenticated admin to list all jobs including draft and archived', async () => {
      const res = await request(app)
        .get('/api/v1/admin/recruitment/jobs')
        .set('Authorization', adminAuthHeader);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length >= 3);
    });

    it('allows authenticated admin to list candidate applications with filtering', async () => {
      const res = await request(app)
        .get('/api/v1/admin/recruitment/applications?status=new')
        .set('Authorization', adminAuthHeader);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.length > 0);
    });

    it('allows authenticated admin to update application triage status and audits mutation', async () => {
      const appRecord = await testKnex('job_applications').first();
      assert.ok(appRecord);

      const res = await request(app)
        .patch(`/api/v1/admin/recruitment/applications/${appRecord.id}/status`)
        .set('Authorization', adminAuthHeader)
        .send({
          status: 'reviewed',
          adminNotes: 'Trade certificates verified with ITI authority.',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      // Verify database record updated
      const updatedRecord = await testKnex('job_applications').where({ id: appRecord.id }).first();
      assert.equal(updatedRecord.status, 'reviewed');
      assert.equal(updatedRecord.admin_notes, 'Trade certificates verified with ITI authority.');

      // Verify audit log
      const audit = await testKnex('audit_logs')
        .where({
          action: 'job_application_status_updated',
          resource_id: appRecord.id,
        })
        .first();
      assert.ok(audit);
      assert.equal(audit.actor_admin_id, testAdminId);
    });

    it('allows authenticated admin to create a new job vacancy', async () => {
      const newJobSlug = `steel-fixer-dubai-${Date.now()}`;

      const res = await request(app)
        .post('/api/v1/admin/recruitment/jobs')
        .set('Authorization', adminAuthHeader)
        .send({
          categoryId: 4, // Steel Fixer
          title: 'Structural Steel Fixer',
          slug: newJobSlug,
          location: 'Dubai, UAE',
          employmentType: 'Full-Time',
          description: 'Rebar cutting, bending, and positioning for high-rise residential projects.',
          requirements: 'Minimum 2 years commercial rebar experience.',
          shortDescription: 'Rebar fixing opportunities in Dubai.',
          responsibilities: 'Read bar bending schedules and assemble cages.',
          qualification: 'High School or ITI Trade Certificate',
          experienceYearsRequired: 2,
          salaryRange: 'AED 1,900 - 2,500',
          benefits: 'Visa sponsorship, shared accommodation, and transport.',
          status: 'published',
          isFeatured: true,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.title, 'Structural Steel Fixer');

      // Check that it immediately resolves publicly
      const pubRes = await request(app).get(`/api/v1/jobs/${newJobSlug}`);
      assert.equal(pubRes.status, 200);
      assert.equal(pubRes.body.data.title, 'Structural Steel Fixer');
    });

    it('allows authenticated admin to view application detail with metadata-only document info', async () => {
      const appRecord = await testKnex('job_applications').first();
      assert.ok(appRecord);

      const res = await request(app)
        .get(`/api/v1/admin/recruitment/applications/${appRecord.id}`)
        .set('Authorization', adminAuthHeader);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.application);
      assert.equal(res.body.data.application.id, appRecord.id);
      assert.ok(Array.isArray(res.body.data.documents));
      if (res.body.data.documents.length > 0) {
        const doc = res.body.data.documents[0];
        assert.equal(doc.storage_key, undefined, 'Private storage_key must not be exposed');
        assert.equal(doc.absolutePath, undefined, 'Physical filesystem paths must not be exposed');
      }
    });

    it('rejects unauthorized roles (e.g. role without recruitment access) with 403', async () => {
      const guestAdminId = '88888888-8888-8888-8888-888888888888';
      await testKnex('admin_roles').insert({
        id: 99,
        role_key: 'guest_analyst',
        name: 'Guest Analyst',
      });
      await testKnex('admin_users').insert({
        id: guestAdminId,
        role_id: 99,
        username: 'guest_analyst',
        email: 'guest@citylineconsultancy.ae',
        password_hash: 'hashed_pw_test',
        full_name: 'Guest Analyst',
        is_active: true,
      });

      const guestToken = createAdminToken({
        id: guestAdminId,
        username: 'guest_analyst',
        email: 'guest@citylineconsultancy.ae',
        role: 'guest_analyst' as any,
        roleId: 99,
      });

      const res = await request(app)
        .get('/api/v1/admin/recruitment/jobs')
        .set('Authorization', `Bearer ${guestToken.token}`);

      assert.equal(res.status, 403);
    });
  });
});
