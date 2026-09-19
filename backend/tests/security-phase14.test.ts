/**
 * CITYLINE CONSULTANCY — Phase 14 Comprehensive Security Regression Test Suite
 * Validates OWASP threat boundaries, authentication, RBAC, IDOR, CSRF, input validation,
 * path traversal defense, CORS, security headers, and secret exposure protection.
 */

import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import supertest from 'supertest';
import knex, { Knex } from 'knex';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { setDbClient } from '../src/database/connection';
import { tokenRevocationStore } from '../src/auth/token-revocation';
import { createAdminToken, generateCsrfToken } from '../src/auth/token';
import { env } from '../src/config/env.config';
import { storageService } from '../src/services/storage.service';
import { detectMagicBytes, sanitizeOriginalFilename } from '../src/utils/file-security';

describe('Phase 14 — Security Audit & Hardening Test Suite', () => {
  let app: ReturnType<typeof createApp>;
  let testKnex: Knex;

  const superAdminId = '99999999-0000-0000-0000-000000000001';
  const operator1Id = '99999999-0000-0000-0000-000000000002';
  const operator2Id = '99999999-0000-0000-0000-000000000003';
  const disabledAdminId = '99999999-0000-0000-0000-000000000004';

  let superAdminAuthHeader: string;
  let superAdminRawToken: string;
  let operator1AuthHeader: string;
  let operator1RawToken: string;
  let operator2AuthHeader: string;
  let disabledAuthHeader: string;

  before(async () => {
    // 1. Setup isolated in-memory SQLite database
    testKnex = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    setDbClient(testKnex);
    tokenRevocationStore.setClient(testKnex);

    // 2. Setup Database Schema
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
      t.timestamp('expires_at').notNullable();
      t.timestamp('revoked_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('audit_logs', (t) => {
      t.string('id', 36).primary();
      t.string('actor_admin_id', 36).nullable();
      t.string('action', 100).notNullable();
      t.string('resource_type', 50).notNullable();
      t.string('resource_id', 100).nullable();
      t.text('details').nullable();
      t.string('client_ip', 45).nullable();
      t.string('request_id', 64).nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
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

    await testKnex.schema.createTable('visa_services', (t) => {
      t.string('id', 36).primary();
      t.string('slug', 100).notNullable().unique();
      t.string('title', 150).notNullable();
      t.string('category', 50).notNullable();
      t.text('description').notNullable();
      t.boolean('is_active').defaultTo(true);
      t.integer('display_order').defaultTo(0);
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
      t.string('document_category', 50).notNullable();
      t.string('original_filename', 255).notNullable();
      t.string('storage_key', 500).notNullable();
      t.integer('file_size_bytes').notNullable();
      t.string('mime_type', 100).notNullable();
      t.string('sha256_hash', 64).notNullable();
      t.string('validation_status', 50).defaultTo('valid');
      t.string('malware_scan_status', 50).defaultTo('clean');
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('job_categories', (t) => {
      t.increments('id').primary();
      t.string('slug', 100).notNullable().unique();
      t.string('name', 100).notNullable();
      t.integer('display_order').defaultTo(0);
      t.boolean('is_active').defaultTo(true);
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('jobs', (t) => {
      t.string('id', 36).primary();
      t.integer('category_id').notNullable();
      t.string('slug', 120).notNullable().unique();
      t.string('title', 150).notNullable();
      t.string('location', 100).notNullable();
      t.string('employment_type', 50).notNullable();
      t.text('description').notNullable();
      t.text('requirements').notNullable();
      t.string('visa_sponsorship', 150).nullable();
      t.string('work_shift', 150).nullable();
      t.string('status', 50).defaultTo('published');
      t.boolean('is_featured').defaultTo(false);
      t.timestamp('published_at').nullable();
      t.timestamp('deleted_at').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('testimonials', (t) => {
      t.increments('id').primary();
      t.string('client_name', 150).notNullable();
      t.string('client_designation', 150).nullable();
      t.string('company_name', 150).nullable();
      t.string('client_location', 100).nullable();
      t.string('service_category', 100).nullable();
      t.text('testimonial_text').notNullable();
      t.integer('rating').nullable();
      t.string('document_id', 36).nullable();
      t.integer('display_order').defaultTo(0);
      t.boolean('is_published').defaultTo(false);
      t.timestamp('deleted_at').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    // 3. Seed Roles & Users
    await testKnex('admin_roles').insert([
      { id: 1, role_key: 'super_admin', name: 'Super Administrator' },
      { id: 2, role_key: 'admin_operator', name: 'Administrative Operator' },
    ]);

    await testKnex('admin_users').insert([
      {
        id: superAdminId,
        role_id: 1,
        username: 'sec_superadmin',
        email: 'superadmin@security-audit.test',
        password_hash: 'dummy_argon2_hash',
        full_name: 'Security Super Admin',
        is_active: true,
      },
      {
        id: operator1Id,
        role_id: 2,
        username: 'sec_operator1',
        email: 'operator1@security-audit.test',
        password_hash: 'dummy_argon2_hash',
        full_name: 'Security Operator One',
        is_active: true,
      },
      {
        id: operator2Id,
        role_id: 2,
        username: 'sec_operator2',
        email: 'operator2@security-audit.test',
        password_hash: 'dummy_argon2_hash',
        full_name: 'Security Operator Two',
        is_active: true,
      },
      {
        id: disabledAdminId,
        role_id: 2,
        username: 'sec_disabled',
        email: 'disabled@security-audit.test',
        password_hash: 'dummy_argon2_hash',
        full_name: 'Disabled Operator',
        is_active: false,
      },
    ]);

    // Generate test JWTs
    const saToken = createAdminToken({
      id: superAdminId,
      username: 'sec_superadmin',
      email: 'superadmin@security-audit.test',
      role: 'super_admin',
      roleId: 1,
    });
    superAdminRawToken = saToken.token;
    superAdminAuthHeader = `Bearer ${saToken.token}`;

    const op1Token = createAdminToken({
      id: operator1Id,
      username: 'sec_operator1',
      email: 'operator1@security-audit.test',
      role: 'admin_operator',
      roleId: 2,
    });
    operator1RawToken = op1Token.token;
    operator1AuthHeader = `Bearer ${op1Token.token}`;

    const op2Token = createAdminToken({
      id: operator2Id,
      username: 'sec_operator2',
      email: 'operator2@security-audit.test',
      role: 'admin_operator',
      roleId: 2,
    });
    operator2AuthHeader = `Bearer ${op2Token.token}`;

    const disToken = createAdminToken({
      id: disabledAdminId,
      username: 'sec_disabled',
      email: 'disabled@security-audit.test',
      role: 'admin_operator',
      roleId: 2,
    });
    disabledAuthHeader = `Bearer ${disToken.token}`;

    // Seed test job and category
    await testKnex('job_categories').insert({
      id: 1,
      slug: 'operations',
      name: 'Operations',
      is_active: true,
    });

    await testKnex('jobs').insert({
      id: 'job-sec-001',
      category_id: 1,
      slug: 'sec-operations-lead',
      title: 'Security Operations Lead',
      location: 'Dubai, UAE',
      employment_type: 'Full-time',
      description: 'Operations job description',
      requirements: 'Requirements description',
      status: 'active',
      published_at: new Date(),
    });

    // Seed test testimonial
    await testKnex('testimonials').insert({
      id: 101,
      client_name: 'Audit Client',
      testimonial_text: 'Excellent security audit experience.',
      is_published: true,
      display_order: 1,
    });

    app = createApp();
  });

  after(async () => {
    if (testKnex) {
      await testKnex.destroy();
    }
  });

  // =========================================================================
  // 1. AUTHENTICATION SECURITY
  // =========================================================================
  describe('Authentication Security', () => {
    it('rejects anonymous access to admin endpoints with HTTP 401', async () => {
      const res = await supertest(app).get('/api/v1/admin/dashboard/stats');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, 'AUTHENTICATION_REQUIRED');
    });

    it('rejects expired JWT token with HTTP 401', async () => {
      const expiredToken = jwt.sign(
        {
          sub: superAdminId,
          username: 'sec_superadmin',
          email: 'superadmin@security-audit.test',
          role: 'super_admin',
          roleId: 1,
          jti: 'expired-jti-uuid',
        },
        env.AUTH_TOKEN_SECRET,
        {
          algorithm: 'HS256',
          expiresIn: '-10s', // Expired in the past
        }
      );

      const res = await supertest(app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${expiredToken}`);

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, 'AUTHENTICATION_FAILED');
    });

    it('rejects revoked JWT token with HTTP 401', async () => {
      const tokenObj = createAdminToken({
        id: superAdminId,
        username: 'sec_superadmin',
        email: 'superadmin@security-audit.test',
        role: 'super_admin',
        roleId: 1,
      });

      // Revoke in DB
      await tokenRevocationStore.revoke(tokenObj.jti, tokenObj.exp);

      const res = await supertest(app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${tokenObj.token}`);

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, 'AUTHENTICATION_FAILED');
    });

    it('rejects deactivated account access with HTTP 401', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', disabledAuthHeader);

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, 'AUTHENTICATION_FAILED');
    });
  });

  // =========================================================================
  // 2. RBAC PRIVILEGE SEGREGATION
  // =========================================================================
  describe('RBAC Privilege Segregation', () => {
    it('restricts permanent job deletion to super_admin; rejects admin_operator with 403', async () => {
      const res = await supertest(app)
        .delete('/api/v1/admin/recruitment/jobs/job-sec-001')
        .set('Authorization', operator1AuthHeader);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error.code, 'FORBIDDEN');
    });

    it('restricts testimonial deletion to super_admin; rejects admin_operator with 403', async () => {
      const res = await supertest(app)
        .delete('/api/v1/admin/testimonials/101')
        .set('Authorization', operator1AuthHeader);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error.code, 'FORBIDDEN');
    });
  });

  // =========================================================================
  // 3. IDOR / RESOURCE OWNERSHIP ISOLATION
  // =========================================================================
  describe('IDOR / Resource Ownership Isolation', () => {
    const assignedEnquiryId = 'visa-sec-assigned-001';
    const unassignedEnquiryId = 'visa-sec-unassigned-002';

    before(async () => {
      // Enquiry assigned specifically to operator1
      await testKnex('enquiries').insert({
        id: assignedEnquiryId,
        enquiry_type: 'visa_enquiry',
        full_name: 'Assigned Client',
        email: 'client1@test.ae',
        phone: '+971501111111',
        status: 'new',
        assigned_admin_id: operator1Id,
      });

      await testKnex('visa_enquiries').insert({
        id: 've-sec-001',
        enquiry_id: assignedEnquiryId,
        applicant_count: 1,
      });

      // Unassigned triage enquiry
      await testKnex('enquiries').insert({
        id: unassignedEnquiryId,
        enquiry_type: 'visa_enquiry',
        full_name: 'Unassigned Client',
        email: 'client2@test.ae',
        phone: '+971502222222',
        status: 'new',
        assigned_admin_id: null,
      });

      await testKnex('visa_enquiries').insert({
        id: 've-sec-002',
        enquiry_id: unassignedEnquiryId,
        applicant_count: 1,
      });
    });

    it('allows assigned operator (operator1) to read their assigned enquiry', async () => {
      const res = await supertest(app)
        .get(`/api/v1/admin/visa-enquiries/${assignedEnquiryId}`)
        .set('Authorization', operator1AuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.enquiry.id, assignedEnquiryId);
    });

    it('blocks other operator (operator2) from reading enquiry assigned to operator1 (IDOR Defense)', async () => {
      const res = await supertest(app)
        .get(`/api/v1/admin/visa-enquiries/${assignedEnquiryId}`)
        .set('Authorization', operator2AuthHeader);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error.code, 'FORBIDDEN');
    });

    it('blocks other operator (operator2) from updating status of enquiry assigned to operator1', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/admin/visa-enquiries/${assignedEnquiryId}/status`)
        .set('Authorization', operator2AuthHeader)
        .send({ status: 'in_progress' });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error.code, 'FORBIDDEN');
    });

    it('permits super_admin to access any enquiry regardless of assigned admin', async () => {
      const res = await supertest(app)
        .get(`/api/v1/admin/visa-enquiries/${assignedEnquiryId}`)
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(res.status, 200);
    });

    it('permits operator to access unassigned triage enquiries', async () => {
      const res = await supertest(app)
        .get(`/api/v1/admin/visa-enquiries/${unassignedEnquiryId}`)
        .set('Authorization', operator2AuthHeader);

      assert.strictEqual(res.status, 200);
    });
  });

  // =========================================================================
  // 4. DOUBLE-SUBMIT CSRF GUARD
  // =========================================================================
  describe('CSRF Double-Submit Protection', () => {
    it('blocks cookie-authenticated state mutation when X-CSRF-Token header is missing', async () => {
      const csrfCookieVal = generateCsrfToken();

      const res = await supertest(app)
        .patch('/api/v1/admin/recruitment/applications/app-test-id/status')
        .set('Cookie', [
          `${env.AUTH_COOKIE_NAME}=${superAdminRawToken}`,
          `${env.AUTH_CSRF_COOKIE_NAME}=${csrfCookieVal}`,
        ])
        .send({ status: 'reviewed' });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error.code, 'CSRF_TOKEN_INVALID');
    });

    it('blocks cookie-authenticated state mutation when X-CSRF-Token header does not match cookie', async () => {
      const csrfCookieVal = generateCsrfToken();
      const attackerHeaderVal = generateCsrfToken();

      const res = await supertest(app)
        .patch('/api/v1/admin/recruitment/applications/app-test-id/status')
        .set('Cookie', [
          `${env.AUTH_COOKIE_NAME}=${superAdminRawToken}`,
          `${env.AUTH_CSRF_COOKIE_NAME}=${csrfCookieVal}`,
        ])
        .set('X-CSRF-Token', attackerHeaderVal)
        .send({ status: 'reviewed' });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.error.code, 'CSRF_TOKEN_INVALID');
    });

    it('allows cookie-authenticated state mutation when X-CSRF-Token header matches cookie', async () => {
      const validCsrf = generateCsrfToken();

      const res = await supertest(app)
        .patch('/api/v1/admin/testimonials/101')
        .set('Cookie', [
          `${env.AUTH_COOKIE_NAME}=${superAdminRawToken}`,
          `${env.AUTH_CSRF_COOKIE_NAME}=${validCsrf}`,
        ])
        .set('X-CSRF-Token', validCsrf)
        .send({ isPublished: false });

      assert.strictEqual(res.status, 200);
    });

    it('exempts safe GET requests from CSRF token check', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/recruitment/jobs')
        .set('Cookie', [`${env.AUTH_COOKIE_NAME}=${superAdminRawToken}`]);

      assert.strictEqual(res.status, 200);
    });
  });

  // =========================================================================
  // 5. INPUT VALIDATION & PAYLOAD BOUNDARIES
  // =========================================================================
  describe('Input Validation & Payload Boundaries', () => {
    it('rejects oversized JSON payload (>100kb) with HTTP 413', async () => {
      const oversizedPayload = {
        padding: 'A'.repeat(120 * 1024), // 120KB
      };

      const res = await supertest(app)
        .post('/api/v1/admin/auth/login')
        .send(oversizedPayload);

      assert.strictEqual(res.status, 413);
    });

    it('rejects unknown injected fields (mass assignment prevention)', async () => {
      const res = await supertest(app)
        .post('/api/v1/admin/recruitment/jobs')
        .set('Authorization', superAdminAuthHeader)
        .send({
          title: 'New Position',
          location: 'Dubai',
          employmentType: 'Full-time',
          categoryId: 1,
          description: 'Desc',
          requirements: 'Reqs',
          injectedAdminRole: 'super_admin', // Unauthorized field
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // 6. SQL INJECTION / ORDER BY SANITIZATION
  // =========================================================================
  describe('SQL Injection & Dynamic Ordering Sanitization', () => {
    it('sanitizes malicious sortBy parameter without executing raw SQL or crashing', async () => {
      const res = await supertest(app)
        .get('/api/v1/jobs?sortBy=id;DROP+TABLE+jobs;--&sortOrder=asc');

      // Must succeed safely by falling back to safe identifier, not crashing with 500
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
    });
  });

  // =========================================================================
  // 7. FILE STORAGE & PATH TRAVERSAL DEFENSE
  // =========================================================================
  describe('File Storage & Path Traversal Defense', () => {
    it('blocks path traversal attempts escaping storage root with PATH_TRAVERSAL_BLOCKED', () => {
      const outsidePath = path.resolve(storageService.getStorageRoot(), '../../escaped.txt');
      assert.throws(
        () => (storageService as any).assertPathWithinStorageRoot(outsidePath),
        (err: any) => {
          assert.strictEqual(err.code, 'PATH_TRAVERSAL_BLOCKED');
          return true;
        }
      );
    });

    it('sanitizes malicious directory traversal in enquiryId and keeps storage isolated', async () => {
      const res = await storageService.writeEnquiryFile('../../etc/passwd', '../../boot.ini', Buffer.from('test'));
      const relative = path.relative(storageService.getStorageRoot(), res.absolutePath);
      assert.strictEqual(relative.startsWith('..'), false);
      assert.strictEqual(path.basename(res.absolutePath), 'boot.ini');
    });

    it('sanitizes malicious client filenames stripping directory traversal and null bytes', () => {
      const malicious = '../../../../windows/system32/cmd.exe\0.pdf';
      const clean = sanitizeOriginalFilename(malicious);
      assert.strictEqual(clean.includes('..'), false);
      assert.strictEqual(clean.includes('/'), false);
      assert.strictEqual(clean.includes('\\'), false);
      assert.strictEqual(clean.includes('\0'), false);
    });

    it('correctly detects genuine magic bytes and rejects binary spoofing', () => {
      const fakePdf = Buffer.from('NOT_A_REAL_PDF_CONTENT');
      assert.strictEqual(detectMagicBytes(fakePdf), null);

      const realPdfHeader = Buffer.from('%PDF-1.7 header');
      assert.strictEqual(detectMagicBytes(realPdfHeader), 'pdf');

      const realPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      assert.strictEqual(detectMagicBytes(realPngHeader), 'png');
    });
  });

  // =========================================================================
  // 8. CORS & SECURITY HEADERS
  // =========================================================================
  describe('CORS & Security Headers', () => {
    it('does not reflect disallowed origin in Access-Control-Allow-Origin header', async () => {
      const res = await supertest(app)
        .get('/health')
        .set('Origin', 'http://malicious-attacker-site.com');

      assert.strictEqual(res.headers['access-control-allow-origin'], undefined);
    });

    it('includes essential security headers on HTTP responses', async () => {
      const res = await supertest(app).get('/health');

      assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
      assert.strictEqual(res.headers['x-frame-options'], 'DENY');
    });
  });

  // =========================================================================
  // 9. PUBLIC DATA LEAKAGE PREVENTION
  // =========================================================================
  describe('Public API Data Leakage Prevention', () => {
    it('public jobs endpoint does not leak internal SQL IDs or non-public fields', async () => {
      const res = await supertest(app).get('/api/v1/jobs');
      assert.strictEqual(res.status, 200);

      const items = res.body.data;
      assert.ok(items.length > 0);
      const firstJob = items[0];

      // Sensitive internal fields must not be present in public DTO
      assert.strictEqual((firstJob as any).category_id, undefined);
      assert.strictEqual((firstJob as any).deleted_at, undefined);
      assert.strictEqual((firstJob as any).storage_key, undefined);
    });
  });
});
