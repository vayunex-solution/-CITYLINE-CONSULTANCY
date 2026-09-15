/**
 * CITYLINE CONSULTANCY — Phase 11 Admin Dashboard & Management Test Suite
 * Comprehensive verification of Admin Dashboard Aggregates, Visa Enquiry Management,
 * Safe Document Metadata Exposure, Notification Queue Inspection & Safe Retry,
 * Audit Log Exploration, and Backend RBAC Security.
 */

import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import knex, { Knex } from 'knex';
import { createApp } from '../src/app';
import { setDbClient } from '../src/database/connection';
import { tokenRevocationStore } from '../src/auth/token-revocation';
import { createAdminToken } from '../src/auth/token';

describe('Phase 11 — Admin Dashboard & Management Test Suite', () => {
  let app: ReturnType<typeof createApp>;
  let testKnex: Knex;

  const testSuperAdminId = '88888888-8888-8888-8888-888888888881';
  const testOperatorId = '88888888-8888-8888-8888-888888888882';
  const testUnauthorizedRoleId = '88888888-8888-8888-8888-888888888883';

  let superAdminAuthHeader: string;
  let superAdminRawToken: string;
  let operatorAuthHeader: string;
  let unauthorizedAuthHeader: string;

  before(async () => {
    // 1. Setup isolated in-memory SQLite database
    testKnex = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    setDbClient(testKnex);
    tokenRevocationStore.setClient(testKnex);

    // 2. Setup Schema Tables
    await testKnex.schema.createTable('admin_roles', (t) => {
      t.increments('id').primary();
      t.string('role_key', 50).notNullable().unique();
      t.string('name', 100).notNullable();
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

    await testKnex.schema.createTable('visa_services', (t) => {
      t.string('id', 36).primary();
      t.string('slug', 100).notNullable().unique();
      t.string('title', 150).notNullable();
      t.boolean('is_active').defaultTo(true);
      t.integer('display_order').defaultTo(0);
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('enquiries', (t) => {
      t.string('id', 36).primary();
      t.string('enquiry_type', 50).notNullable().defaultTo('visa_enquiry');
      t.string('reference_number', 50).nullable();
      t.string('full_name', 150).notNullable();
      t.string('email', 255).notNullable();
      t.string('phone', 50).notNullable();
      t.string('whatsapp', 50).nullable();
      t.string('nationality', 100).nullable();
      t.text('message').nullable();
      t.string('status', 50).defaultTo('new');
      t.string('assigned_admin_id', 36).nullable();
      t.timestamp('deleted_at').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('visa_enquiries', (t) => {
      t.string('id', 36).primary();
      t.string('enquiry_id', 36).notNullable().references('id').inTable('enquiries').onDelete('CASCADE');
      t.string('visa_service_id', 36).nullable().references('id').inTable('visa_services').onDelete('SET NULL');
      t.integer('duration_days').nullable();
      t.integer('applicant_count').defaultTo(1);
      t.string('intended_travel_date', 50).nullable();
      t.text('notes').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('documents', (t) => {
      t.string('id', 36).primary();
      t.string('entity_type', 50).notNullable();
      t.string('entity_id', 36).notNullable();
      t.string('document_type', 50).notNullable();
      t.string('document_category', 50).nullable();
      t.string('original_filename', 255).notNullable();
      t.string('storage_key', 255).notNullable();
      t.string('mime_type', 100).notNullable();
      t.bigInteger('file_size_bytes').notNullable();
      t.string('checksum_sha256', 64).notNullable();
      t.string('validation_status', 50).defaultTo('valid');
      t.string('malware_scan_status', 50).defaultTo('clean');
      t.boolean('is_verified').defaultTo(false);
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('jobs', (t) => {
      t.string('id', 36).primary();
      t.string('title', 200).notNullable();
      t.string('slug', 200).notNullable().unique();
      t.string('department', 100).notNullable();
      t.string('location', 100).notNullable();
      t.string('employment_type', 50).notNullable();
      t.string('experience_level', 50).notNullable();
      t.string('status', 50).defaultTo('draft');
      t.text('description').notNullable();
      t.boolean('is_featured').defaultTo(false);
      t.timestamp('deleted_at').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('job_applications', (t) => {
      t.string('id', 36).primary();
      t.string('job_id', 36).notNullable();
      t.string('applicant_name', 150).notNullable();
      t.string('email', 255).notNullable();
      t.string('phone', 50).notNullable();
      t.string('status', 50).defaultTo('new');
      t.timestamp('deleted_at').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('manpower_enquiries', (t) => {
      t.string('id', 36).primary();
      t.string('enquiry_id', 36).nullable().references('id').inTable('enquiries').onDelete('CASCADE');
      t.string('reference_number', 50).nullable();
      t.string('company_name', 200).notNullable();
      t.string('contact_person', 150).notNullable();
      t.string('email', 255).notNullable();
      t.string('phone', 50).notNullable();
      t.string('city', 100).notNullable();
      t.string('status', 50).defaultTo('new');
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('testimonials', (t) => {
      t.increments('id').primary();
      t.string('client_name', 150).notNullable();
      t.string('client_designation', 150).nullable();
      t.string('client_company', 150).nullable();
      t.string('client_location', 150).nullable();
      t.text('testimonial_text').notNullable();
      t.integer('rating').nullable();
      t.integer('display_order').defaultTo(0);
      t.boolean('is_published').defaultTo(false);
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
      t.timestamp('deleted_at').nullable();
    });

    await testKnex.schema.createTable('notification_queue', (t) => {
      t.string('id', 36).primary();
      t.string('notification_type', 50).notNullable().defaultTo('system');
      t.string('reference_id', 100).nullable();
      t.string('recipient_email', 255).notNullable();
      t.string('subject', 255).notNullable();
      t.string('status', 50).defaultTo('pending');
      t.integer('retry_count').defaultTo(0);
      t.timestamp('next_retry_at').nullable();
      t.text('last_error').nullable();
      t.timestamp('sent_at').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('audit_logs', (t) => {
      t.increments('id').primary();
      t.string('actor_admin_id', 36).nullable();
      t.string('action', 100).notNullable();
      t.string('resource_type', 100).notNullable();
      t.string('resource_id', 100).nullable();
      t.string('request_id', 64).nullable();
      t.string('client_ip', 45).nullable();
      t.text('details_json').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
    });

    // 3. Seed Roles & Users
    await testKnex('admin_roles').insert([
      { id: 1, role_key: 'super_admin', name: 'Super Administrator' },
      { id: 2, role_key: 'admin_operator', name: 'Admin Operator' },
      { id: 3, role_key: 'auditor', name: 'Auditor Read-Only' },
    ]);

    await testKnex('admin_users').insert([
      {
        id: testSuperAdminId,
        role_id: 1,
        username: 'super_admin_test',
        email: 'superadmin@cityline.ae',
        password_hash: 'hash',
        full_name: 'Super Admin',
        is_active: true,
      },
      {
        id: testOperatorId,
        role_id: 2,
        username: 'operator_test',
        email: 'operator@cityline.ae',
        password_hash: 'hash',
        full_name: 'Admin Operator',
        is_active: true,
      },
      {
        id: testUnauthorizedRoleId,
        role_id: 3,
        username: 'auditor_test',
        email: 'auditor@cityline.ae',
        password_hash: 'hash',
        full_name: 'Auditor',
        is_active: true,
      },
    ]);

    // 4. Generate Auth Tokens
    const superToken = createAdminToken({
      id: testSuperAdminId,
      username: 'super_admin_test',
      email: 'superadmin@cityline.ae',
      role: 'super_admin',
      roleId: 1,
    });
    superAdminAuthHeader = `Bearer ${superToken.token}`;
    superAdminRawToken = superToken.token;

    const operatorToken = createAdminToken({
      id: testOperatorId,
      username: 'operator_test',
      email: 'operator@cityline.ae',
      role: 'admin_operator',
      roleId: 2,
    });
    operatorAuthHeader = `Bearer ${operatorToken.token}`;

    const auditorToken = createAdminToken({
      id: testUnauthorizedRoleId,
      username: 'auditor_test',
      email: 'auditor@cityline.ae',
      role: 'auditor',
      roleId: 3,
    });
    unauthorizedAuthHeader = `Bearer ${auditorToken.token}`;

    app = createApp();
  });

  beforeEach(async () => {
    // Clear dynamic data between tests
    await testKnex('visa_enquiries').del();
    await testKnex('manpower_enquiries').del();
    await testKnex('enquiries').del();
    await testKnex('visa_services').del();
    await testKnex('documents').del();
    await testKnex('jobs').del();
    await testKnex('job_applications').del();
    await testKnex('testimonials').del();
    await testKnex('notification_queue').del();
    await testKnex('audit_logs').del();
  });

  after(async () => {
    if (testKnex) {
      await testKnex.destroy();
    }
  });

  // ============================================================================
  // 1. DASHBOARD STATS AGGREGATION & AUTHENTICATION
  // ============================================================================
  describe('GET /api/v1/admin/dashboard/stats', () => {
    it('rejects unauthenticated request with 401', async () => {
      const res = await supertest(app).get('/api/v1/admin/dashboard/stats');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'AUTHENTICATION_REQUIRED');
    });

    it('rejects unauthorized role with 403', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', unauthorizedAuthHeader);
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'FORBIDDEN');
    });

    it('accepts cookie authentication for authorized admin', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Cookie', [`clc_admin_token=${superAdminRawToken}`]);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    it('returns accurate real aggregate database counts and empty activity when no records', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.deepStrictEqual(res.body.data.enquiries, {
        total: 0,
        new: 0,
        visaTotal: 0,
        visaNew: 0,
        manpowerTotal: 0,
        manpowerNew: 0,
      });
      assert.deepStrictEqual(res.body.data.recruitment, {
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        newApplications: 0,
      });
      assert.deepStrictEqual(res.body.data.testimonials, {
        total: 0,
        published: 0,
      });
      assert.deepStrictEqual(res.body.data.notificationQueue, {
        pending: 0,
        processing: 0,
        sent: 0,
        failed: 0,
        exhausted: 0,
        total: 0,
      });
      assert.strictEqual(res.body.data.recentActivity.length, 0);
    });

    it('calculates metrics and recent activity accurately from populated tables', async () => {
      // Seed visa services
      await testKnex('visa_services').insert([
        { id: 'vs-1', slug: 'tourist-visa', title: 'Tourist Visa' },
      ]);

      // Seed enquiries
      await testKnex('enquiries').insert([
        { id: 've-1', enquiry_type: 'visa_enquiry', full_name: 'John Doe', email: 'john@example.com', phone: '123', status: 'new' },
        { id: 've-2', enquiry_type: 'visa_enquiry', full_name: 'Jane Doe', email: 'jane@example.com', phone: '124', status: 'in_progress' },
        { id: 'enq-emp-1', enquiry_type: 'manpower_enquiry', full_name: 'Acme Corp', email: 'bob@acme.com', phone: '234', status: 'new' },
      ]);

      await testKnex('visa_enquiries').insert([
        { id: 'v-sub-1', enquiry_id: 've-1', visa_service_id: 'vs-1' },
        { id: 'v-sub-2', enquiry_id: 've-2', visa_service_id: 'vs-1' },
      ]);

      // Seed manpower enquiries
      await testKnex('manpower_enquiries').insert([
        { id: 'me-1', enquiry_id: 'enq-emp-1', reference_number: 'EMP-001', company_name: 'Acme Corp', contact_person: 'Bob', email: 'bob@acme.com', phone: '234', city: 'Dubai', status: 'new' },
      ]);

      // Seed jobs
      await testKnex('jobs').insert([
        { id: 'j-1', title: 'Consultant', slug: 'consultant', department: 'Visa', location: 'Dubai', employment_type: 'full_time', experience_level: 'senior', status: 'active', description: 'desc' },
        { id: 'j-2', title: 'Developer', slug: 'dev', department: 'IT', location: 'Dubai', employment_type: 'full_time', experience_level: 'mid', status: 'draft', description: 'desc' },
      ]);

      // Seed job applications
      await testKnex('job_applications').insert([
        { id: 'ja-1', job_id: 'j-1', applicant_name: 'Alice Smith', email: 'alice@example.com', phone: '345', status: 'new' },
      ]);

      // Seed testimonials
      await testKnex('testimonials').insert([
        { id: 1, client_name: 'Client 1', testimonial_text: 'Great', is_published: true },
        { id: 2, client_name: 'Client 2', testimonial_text: 'Okay', is_published: false },
      ]);

      // Seed notification queue
      await testKnex('notification_queue').insert([
        { id: 'nq-1', recipient_email: 'user@test.com', subject: 'Notice 1', status: 'pending' },
        { id: 'nq-2', recipient_email: 'user2@test.com', subject: 'Notice 2', status: 'sent' },
        { id: 'nq-3', recipient_email: 'user3@test.com', subject: 'Notice 3', status: 'failed' },
      ]);

      const res = await supertest(app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', operatorAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.enquiries.total, 3); // 2 visa + 1 manpower
      assert.strictEqual(res.body.data.enquiries.new, 2); // 1 visa + 1 manpower
      assert.strictEqual(res.body.data.enquiries.visaTotal, 2);
      assert.strictEqual(res.body.data.enquiries.visaNew, 1);
      assert.strictEqual(res.body.data.enquiries.manpowerTotal, 1);
      assert.strictEqual(res.body.data.enquiries.manpowerNew, 1);
      assert.strictEqual(res.body.data.recruitment.totalJobs, 2);
      assert.strictEqual(res.body.data.recruitment.activeJobs, 1);
      assert.strictEqual(res.body.data.recruitment.totalApplications, 1);
      assert.strictEqual(res.body.data.recruitment.newApplications, 1);
      assert.strictEqual(res.body.data.testimonials.published, 1);
      assert.strictEqual(res.body.data.testimonials.total, 2);
      assert.strictEqual(res.body.data.notificationQueue.pending, 1);
      assert.strictEqual(res.body.data.notificationQueue.sent, 1);
      assert.strictEqual(res.body.data.notificationQueue.failed, 1);
      assert.strictEqual(res.body.data.recentActivity.length, 4);
    });
  });

  // ============================================================================
  // 2. ADMIN VISA ENQUIRIES MANAGEMENT & DOCUMENT SECURITY
  // ============================================================================
  describe('Admin Visa Enquiries (/api/v1/admin/visa-enquiries)', () => {
    beforeEach(async () => {
      await testKnex('visa_services').insert([
        { id: 'service-001', slug: 'visit-visa', title: 'UAE Visit Visa' },
      ]);

      await testKnex('enquiries').insert([
        {
          id: 'visa-001',
          enquiry_type: 'visa_enquiry',
          reference_number: 'VE-2026-001',
          full_name: 'Mohammad Al-Mansoor',
          email: 'mohammad@example.ae',
          phone: '+971501234567',
          nationality: 'Emirati',
          status: 'new',
        },
        {
          id: 'visa-002',
          enquiry_type: 'visa_enquiry',
          reference_number: 'VE-2026-002',
          full_name: 'Sara Connor',
          email: 'sara@example.com',
          phone: '+971509876543',
          nationality: 'British',
          status: 'in_progress',
        },
      ]);

      await testKnex('visa_enquiries').insert([
        {
          id: 've-sub-001',
          enquiry_id: 'visa-001',
          visa_service_id: 'service-001',
          duration_days: 30,
          applicant_count: 1,
        },
        {
          id: 've-sub-002',
          enquiry_id: 'visa-002',
          visa_service_id: 'service-001',
          duration_days: 60,
          applicant_count: 2,
        },
      ]);

      await testKnex('documents').insert([
        {
          id: 'doc-001',
          entity_type: 'enquiry',
          entity_id: 'visa-001',
          document_type: 'passport_copy',
          document_category: 'passport',
          original_filename: 'passport_mohammad.pdf',
          storage_key: '/private/storage/vault/secret_path_mohammad.pdf',
          mime_type: 'application/pdf',
          file_size_bytes: 512000,
          checksum_sha256: 'abc123sha256fakehash',
          validation_status: 'valid',
          malware_scan_status: 'clean',
          is_verified: true,
        },
      ]);
    });

    it('lists visa enquiries with pagination and search filter', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/visa-enquiries?search=Mohammad')
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(res.body.data[0].fullName, 'Mohammad Al-Mansoor');
      assert.strictEqual(res.body.pagination.total, 1);
    });

    it('filters visa enquiries by status', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/visa-enquiries?status=in_progress')
        .set('Authorization', operatorAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(res.body.data[0].id, 'visa-002');
    });

    it('retrieves single visa enquiry with documents and NEVER leaks private storage_key', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/visa-enquiries/visa-001')
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.enquiry.id, 'visa-001');
      assert.strictEqual(res.body.data.documents.length, 1);

      const doc = res.body.data.documents[0];
      assert.strictEqual(doc.filename, 'passport_mohammad.pdf');
      assert.strictEqual(doc.category, 'passport');
      assert.strictEqual(doc.mimeType, 'application/pdf');

      // CRITICAL SECURITY ASSERTION: storage_key or absolute filesystem path must NEVER be exposed
      assert.strictEqual((doc as any).storage_key, undefined);
      assert.strictEqual((doc as any).storageKey, undefined);
      assert.strictEqual(JSON.stringify(res.body).includes('secret_path_mohammad.pdf'), false);
      assert.strictEqual(JSON.stringify(res.body).includes('/private/storage/vault'), false);
    });

    it('updates visa enquiry status and writes immutable audit log', async () => {
      const res = await supertest(app)
        .patch('/api/v1/admin/visa-enquiries/visa-001/status')
        .set('Authorization', superAdminAuthHeader)
        .send({ status: 'in_progress', adminNotes: 'Documents verified by admin' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.status, 'in_progress');

      // Verify in DB
      const updatedRow = await testKnex('enquiries').where({ id: 'visa-001' }).first();
      assert.strictEqual(updatedRow.status, 'in_progress');

      // Verify Audit Log created
      const auditLog = await testKnex('audit_logs').where({
        action: 'visa_enquiry_status_updated',
        resource_id: 'visa-001',
      }).first();
      assert.ok(auditLog, 'Audit log must be created for status transition');
      assert.strictEqual(auditLog.actor_admin_id, testSuperAdminId);
      const details = JSON.parse(auditLog.details_json);
      assert.strictEqual(details.previousStatus, 'new');
      assert.strictEqual(details.newStatus, 'in_progress');
      assert.strictEqual(details.adminNotes, 'Documents verified by admin');
    });

    it('rejects invalid status values with 400 Bad Request', async () => {
      const res = await supertest(app)
        .patch('/api/v1/admin/visa-enquiries/visa-001/status')
        .set('Authorization', operatorAuthHeader)
        .send({ status: 'invalid_status_xyz' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    });
  });

  // ============================================================================
  // 3. ADMIN NOTIFICATION QUEUE DIAGNOSTICS & SAFE RETRY
  // ============================================================================
  describe('Admin Notification Queue (/api/v1/admin/notifications)', () => {
    beforeEach(async () => {
      await testKnex('notification_queue').insert([
        {
          id: 'notif-failed-1',
          recipient_email: 'failed@client.ae',
          subject: 'Your visa enquiry status update',
          status: 'failed',
          retry_count: 3,
          last_error: 'SMTP connection timeout',
        },
        {
          id: 'notif-sent-1',
          recipient_email: 'success@client.ae',
          subject: 'Welcome to Cityline',
          status: 'sent',
          retry_count: 1,
          last_error: null,
        },
      ]);
    });

    it('lists notifications with status filtering', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/notifications?status=failed')
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(res.body.data[0].id, 'notif-failed-1');
      assert.strictEqual(res.body.data[0].status, 'failed');
    });

    it('resets failed notification to pending and writes audit log upon safe retry', async () => {
      const res = await supertest(app)
        .post('/api/v1/admin/notifications/notif-failed-1/retry')
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);

      // Verify row state in DB
      const notifRow = await testKnex('notification_queue').where({ id: 'notif-failed-1' }).first();
      assert.strictEqual(notifRow.status, 'pending');
      assert.strictEqual(notifRow.retry_count, 0);

      // Verify audit log
      const auditLog = await testKnex('audit_logs').where({
        action: 'notification_retried',
        resource_id: 'notif-failed-1',
      }).first();
      assert.ok(auditLog, 'Audit log entry must be present for notification retry');
      assert.strictEqual(auditLog.actor_admin_id, testSuperAdminId);
    });

    it('rejects retrying an already sent notification with 400', async () => {
      const res = await supertest(app)
        .post('/api/v1/admin/notifications/notif-sent-1/retry')
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'ALREADY_SENT');
    });
  });

  // ============================================================================
  // 4. ADMIN AUDIT LOGS EXPLORATION
  // ============================================================================
  describe('Admin Audit Logs (/api/v1/admin/audit-logs)', () => {
    beforeEach(async () => {
      await testKnex('audit_logs').insert([
        {
          actor_admin_id: testSuperAdminId,
          action: 'admin_login',
          resource_type: 'auth',
          resource_id: testSuperAdminId,
          request_id: 'req-001',
          client_ip: '127.0.0.1',
          details_json: JSON.stringify({ method: 'password' }),
        },
        {
          actor_admin_id: testOperatorId,
          action: 'job_created',
          resource_type: 'job',
          resource_id: 'job-123',
          request_id: 'req-002',
          client_ip: '127.0.0.1',
          details_json: JSON.stringify({ title: 'Senior Consultant' }),
        },
      ]);
    });

    it('lists audit logs with actor joining and action filtering', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/audit-logs?action=job_created')
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(res.body.data[0].action, 'job_created');
      assert.strictEqual(res.body.data[0].actorUsername, 'operator_test');
      assert.strictEqual(res.body.data[0].detailsJson, JSON.stringify({ title: 'Senior Consultant' }));
    });

    it('filters audit logs by resource_type', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/audit-logs?resource_type=auth')
        .set('Authorization', operatorAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(res.body.data[0].action, 'admin_login');
      assert.strictEqual(res.body.data[0].actorUsername, 'super_admin_test');
    });
  });
});
