/**
 * CITYLINE CONSULTANCY — Phase 10 Testimonials Management Test Suite
 * Comprehensive verification of Database Migration, Public API, Admin API (RBAC, CRUD,
 * Mass Assignment rejection, Reordering), and Audit Logging.
 */

import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import knex, { Knex } from 'knex';
import { createApp } from '../src/app';
import { setDbClient } from '../src/database/connection';
import { tokenRevocationStore } from '../src/auth/token-revocation';
import { createAdminToken } from '../src/auth/token';
import * as phase10Migration from '../src/database/migrations/20260914000002_extend_testimonials';

describe('Phase 10 — Testimonials Management Test Suite', () => {
  let app: ReturnType<typeof createApp>;
  let testKnex: Knex;

  const testSuperAdminId = '99999999-9999-9999-9999-999999999991';
  const testOperatorId = '99999999-9999-9999-9999-999999999992';
  const testUnauthorizedRoleId = '99999999-9999-9999-9999-999999999993';

  let superAdminAuthHeader: string;
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

    // 2. Setup Base Tables
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

    await testKnex.schema.createTable('documents', (t) => {
      t.string('id', 36).primary();
      t.string('original_filename', 255).notNullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
    });

    // Base Phase 2 Testimonials Table
    await testKnex.schema.createTable('testimonials', (table) => {
      table.increments('id').primary();
      table.string('client_name', 150).notNullable();
      table.string('client_designation', 150).nullable();
      table.string('client_location', 150).nullable();
      table.text('testimonial_text').notNullable();
      table.tinyint('rating').unsigned().nullable();
      table.string('document_id', 36).nullable()
        .references('id').inTable('documents').onDelete('SET NULL');
      table.integer('display_order').defaultTo(0).notNullable();
      table.boolean('is_published').defaultTo(false).notNullable();
      table.timestamp('created_at').defaultTo(testKnex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(testKnex.fn.now()).notNullable();
      table.timestamp('deleted_at').nullable();
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

    // 5. Initialize App
    app = createApp();
  });

  after(async () => {
    if (testKnex) {
      await testKnex.destroy();
    }
  });

  // =========================================================================
  // 1. DATABASE & ADDITIVE MIGRATION VERIFICATION
  // =========================================================================
  describe('Database Additive Migration', () => {
    it('successfully runs additive migration UP to add company_name and service_category', async () => {
      await phase10Migration.up(testKnex);

      const hasCompany = await testKnex.schema.hasColumn('testimonials', 'company_name');
      const hasCategory = await testKnex.schema.hasColumn('testimonials', 'service_category');

      assert.strictEqual(hasCompany, true, 'Migration must add company_name column');
      assert.strictEqual(hasCategory, true, 'Migration must add service_category column');
    });

    it('successfully rolls back with DOWN migration and re-applies UP', async () => {
      await phase10Migration.down(testKnex);

      const hasCompanyDown = await testKnex.schema.hasColumn('testimonials', 'company_name');
      const hasCategoryDown = await testKnex.schema.hasColumn('testimonials', 'service_category');

      assert.strictEqual(hasCompanyDown, false, 'Down migration must drop company_name column');
      assert.strictEqual(hasCategoryDown, false, 'Down migration must drop service_category column');

      // Re-apply up for rest of test suite
      await phase10Migration.up(testKnex);
      const hasCompanyUp = await testKnex.schema.hasColumn('testimonials', 'company_name');
      assert.strictEqual(hasCompanyUp, true);
    });
  });

  // =========================================================================
  // 2. PUBLIC API CONTRACT VERIFICATION (GET /api/v1/testimonials)
  // =========================================================================
  describe('Public API Contract (GET /api/v1/testimonials)', () => {
    beforeEach(async () => {
      await testKnex('testimonials').del();
      await testKnex('audit_logs').del();
    });

    it('returns empty list when zero testimonials exist (neutral empty state)', async () => {
      const res = await supertest(app).get('/api/v1/testimonials');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.deepStrictEqual(res.body.data, []);
    });

    it('returns ONLY published testimonials and strictly excludes unpublished / draft records', async () => {
      await testKnex('testimonials').insert([
        {
          client_name: 'Published Client A',
          client_designation: 'Managing Partner',
          company_name: 'Apex Dubai LLC',
          client_location: 'Dubai, UAE',
          service_category: 'Enterprise Setup',
          testimonial_text: 'Flawless corporate formation process with prompt advisory.',
          rating: 5,
          display_order: 1,
          is_published: true,
        },
        {
          client_name: 'Unpublished Client B',
          client_designation: 'Project Lead',
          company_name: 'Beta Global',
          testimonial_text: 'Still awaiting formal internal clearance.',
          rating: 4,
          display_order: 2,
          is_published: false, // DRAFT
        },
      ]);

      const res = await supertest(app).get('/api/v1/testimonials');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(res.body.data[0].clientName, 'Published Client A');
      assert.strictEqual(res.body.data[0].companyName, 'Apex Dubai LLC');
    });

    it('excludes soft-deleted testimonials even if marked is_published = true', async () => {
      await testKnex('testimonials').insert({
        client_name: 'Archived Client',
        testimonial_text: 'Great past service now archived.',
        rating: 5,
        display_order: 1,
        is_published: true,
        deleted_at: testKnex.fn.now(), // SOFT-DELETED
      });

      const res = await supertest(app).get('/api/v1/testimonials');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 0);
    });

    it('returns testimonials ordered deterministically by displayOrder ASC', async () => {
      await testKnex('testimonials').insert([
        {
          client_name: 'Second Item',
          testimonial_text: 'Displayed second in sequence.',
          rating: 5,
          display_order: 10,
          is_published: true,
        },
        {
          client_name: 'First Item',
          testimonial_text: 'Displayed first in sequence.',
          rating: 5,
          display_order: 2,
          is_published: true,
        },
        {
          client_name: 'Third Item',
          testimonial_text: 'Displayed third in sequence.',
          rating: 5,
          display_order: 25,
          is_published: true,
        },
      ]);

      const res = await supertest(app).get('/api/v1/testimonials');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 3);
      assert.strictEqual(res.body.data[0].clientName, 'First Item');
      assert.strictEqual(res.body.data[1].clientName, 'Second Item');
      assert.strictEqual(res.body.data[2].clientName, 'Third Item');
    });

    it('never exposes internal admin-only fields in public DTO', async () => {
      await testKnex('testimonials').insert({
        client_name: 'Safe Client',
        client_designation: 'Engineer',
        testimonial_text: 'Clean public representation without sensitive columns.',
        rating: 5,
        display_order: 1,
        is_published: true,
      });

      const res = await supertest(app).get('/api/v1/testimonials');

      assert.strictEqual(res.status, 200);
      const item = res.body.data[0];
      assert.strictEqual(item.is_published, undefined);
      assert.strictEqual(item.isPublished, undefined);
      assert.strictEqual(item.deleted_at, undefined);
      assert.strictEqual(item.deletedAt, undefined);
      assert.strictEqual(item.document_id, undefined);
      assert.strictEqual(item.documentId, undefined);
    });
  });

  // =========================================================================
  // 3. ADMIN API SECURITY & RBAC ENFORCEMENT
  // =========================================================================
  describe('Admin API Security & RBAC', () => {
    it('returns 401 Unauthorized when accessing admin endpoints without token', async () => {
      const res = await supertest(app).get('/api/v1/admin/testimonials');
      assert.strictEqual(res.status, 401);
    });

    it('returns 403 Forbidden when accessed by unauthorized admin role (e.g. auditor)', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/testimonials')
        .set('Authorization', unauthorizedAuthHeader);
      assert.strictEqual(res.status, 403);
    });

    it('allows access to super_admin', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/testimonials')
        .set('Authorization', superAdminAuthHeader);
      assert.strictEqual(res.status, 200);
    });

    it('allows access to admin_operator', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/testimonials')
        .set('Authorization', operatorAuthHeader);
      assert.strictEqual(res.status, 200);
    });
  });

  // =========================================================================
  // 4. ADMIN CRUD, VALIDATION & REJECTION OF UNKNOWN FIELDS
  // =========================================================================
  describe('Admin CRUD & Strict Schema Validation', () => {
    beforeEach(async () => {
      await testKnex('testimonials').del();
      await testKnex('audit_logs').del();
    });

    it('creates a testimonial with valid payload and returns 201', async () => {
      const payload = {
        clientName: 'Sanjay Verma',
        clientDesignation: 'Director of Logistics',
        companyName: 'Gulf Express FZE',
        clientLocation: 'Sharjah, UAE',
        serviceCategory: 'Corporate Manpower',
        testimonialText: 'Cityline deployed 45 skilled warehouse operators efficiently.',
        rating: 5,
        displayOrder: 1,
        isPublished: true,
      };

      const res = await supertest(app)
        .post('/api/v1/admin/testimonials')
        .set('Authorization', superAdminAuthHeader)
        .send(payload);

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.clientName, 'Sanjay Verma');
      assert.strictEqual(res.body.data.companyName, 'Gulf Express FZE');
      assert.strictEqual(res.body.data.isPublished, true);
      assert.ok(res.body.data.id);
    });

    it('rejects creation when unknown fields are submitted (strict schema / mass assignment prevention)', async () => {
      const payloadWithUnknown = {
        clientName: 'Malicious Attempt',
        testimonialText: 'Attempting to inject unknown columns or flags.',
        isPublished: false,
        injectedRole: 'superuser',
        isSuperAdmin: true,
      };

      const res = await supertest(app)
        .post('/api/v1/admin/testimonials')
        .set('Authorization', superAdminAuthHeader)
        .send(payloadWithUnknown);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('rejects creation when required fields are missing or invalid', async () => {
      // Missing testimonialText
      const invalidPayload = {
        clientName: 'Test Name',
        rating: 6, // Exceeds max rating of 5
      };

      const res = await supertest(app)
        .post('/api/v1/admin/testimonials')
        .set('Authorization', superAdminAuthHeader)
        .send(invalidPayload);

      assert.strictEqual(res.status, 400);
    });

    it('retrieves single testimonial by ID via GET /:id', async () => {
      const [id] = await testKnex('testimonials').insert({
        client_name: 'Amina Al-Nuaimi',
        testimonial_text: 'Professional UAE business incorporation and license processing.',
        rating: 5,
        is_published: true,
      });

      const res = await supertest(app)
        .get(`/api/v1/admin/testimonials/${id}`)
        .set('Authorization', operatorAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.clientName, 'Amina Al-Nuaimi');
    });

    it('returns 404 when retrieving non-existent ID', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/testimonials/99999')
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(res.status, 404);
    });

    it('updates testimonial fields via PATCH /:id', async () => {
      const [id] = await testKnex('testimonials').insert({
        client_name: 'Initial Client',
        testimonial_text: 'Initial review text before update.',
        rating: 4,
        is_published: false,
      });

      const updatePayload = {
        clientName: 'Updated Client Name',
        rating: 5,
        isPublished: true,
      };

      const res = await supertest(app)
        .patch(`/api/v1/admin/testimonials/${id}`)
        .set('Authorization', operatorAuthHeader)
        .send(updatePayload);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.clientName, 'Updated Client Name');
      assert.strictEqual(res.body.data.rating, 5);
      assert.strictEqual(res.body.data.isPublished, true);
    });

    it('rejects PATCH with unknown fields', async () => {
      const [id] = await testKnex('testimonials').insert({
        client_name: 'Client Test',
        testimonial_text: 'Text content here.',
        is_published: true,
      });

      const res = await supertest(app)
        .patch(`/api/v1/admin/testimonials/${id}`)
        .set('Authorization', superAdminAuthHeader)
        .send({ unknownField: 'not_allowed' });

      assert.strictEqual(res.status, 400);
    });

    it('soft-deletes testimonial via DELETE /:id', async () => {
      const [id] = await testKnex('testimonials').insert({
        client_name: 'To Delete',
        testimonial_text: 'This should be archived safely.',
        is_published: true,
      });

      const res = await supertest(app)
        .delete(`/api/v1/admin/testimonials/${id}`)
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);

      // Verify database record has deleted_at set
      const row = await testKnex('testimonials').where({ id }).first();
      assert.ok(row.deleted_at, 'deleted_at must be populated on soft deletion');

      // Verify excluded from admin listing
      const listRes = await supertest(app)
        .get('/api/v1/admin/testimonials')
        .set('Authorization', superAdminAuthHeader);
      assert.strictEqual(listRes.body.data.length, 0);
    });
  });

  // =========================================================================
  // 5. DETERMINISTIC REORDERING ENDPOINT (PUT /reorder)
  // =========================================================================
  describe('Testimonials Reordering', () => {
    beforeEach(async () => {
      await testKnex('testimonials').del();
      await testKnex('audit_logs').del();
    });

    it('batch reorders testimonials with deterministic displayOrder', async () => {
      const [id1] = await testKnex('testimonials').insert({
        client_name: 'Client Alpha',
        testimonial_text: 'Alpha review text.',
        display_order: 0,
        is_published: true,
      });
      const [id2] = await testKnex('testimonials').insert({
        client_name: 'Client Beta',
        testimonial_text: 'Beta review text.',
        display_order: 1,
        is_published: true,
      });

      // Swap positions
      const reorderPayload = {
        items: [
          { id: id1, displayOrder: 1 },
          { id: id2, displayOrder: 0 },
        ],
      };

      const res = await supertest(app)
        .put('/api/v1/admin/testimonials/reorder')
        .set('Authorization', superAdminAuthHeader)
        .send(reorderPayload);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);

      // Verify new order in public API
      const publicRes = await supertest(app).get('/api/v1/testimonials');
      assert.strictEqual(publicRes.body.data[0].clientName, 'Client Beta');
      assert.strictEqual(publicRes.body.data[1].clientName, 'Client Alpha');
    });

    it('rejects reorder request with invalid payload', async () => {
      const res = await supertest(app)
        .put('/api/v1/admin/testimonials/reorder')
        .set('Authorization', superAdminAuthHeader)
        .send({ items: [] }); // Empty array rejected by Zod min(1)

      assert.strictEqual(res.status, 400);
    });
  });

  // =========================================================================
  // 6. AUDIT LOGGING VERIFICATION
  // =========================================================================
  describe('Mutation Audit Logging', () => {
    beforeEach(async () => {
      await testKnex('testimonials').del();
      await testKnex('audit_logs').del();
    });

    it('logs testimonial_created audit entry upon creation', async () => {
      await supertest(app)
        .post('/api/v1/admin/testimonials')
        .set('Authorization', superAdminAuthHeader)
        .send({
          clientName: 'Audit Test Client',
          testimonialText: 'Audit logging verification review content.',
          isPublished: false,
        });

      const audit = await testKnex('audit_logs')
        .where({ resource_type: 'testimonial', action: 'testimonial_created' })
        .first();

      assert.ok(audit, 'testimonial_created audit log must be recorded');
      assert.strictEqual(audit.actor_admin_id, testSuperAdminId);
    });

    it('logs testimonial_published when publishing an unpublished record', async () => {
      const [id] = await testKnex('testimonials').insert({
        client_name: 'Publish Audit Client',
        testimonial_text: 'Verifying publish state change audit event.',
        is_published: false,
      });

      await supertest(app)
        .patch(`/api/v1/admin/testimonials/${id}`)
        .set('Authorization', operatorAuthHeader)
        .send({ isPublished: true });

      const audit = await testKnex('audit_logs')
        .where({ resource_type: 'testimonial', action: 'testimonial_published' })
        .first();

      assert.ok(audit, 'testimonial_published audit log must be recorded');
      assert.strictEqual(audit.actor_admin_id, testOperatorId);
    });

    it('logs testimonial_deleted when archiving a testimonial', async () => {
      const [id] = await testKnex('testimonials').insert({
        client_name: 'Delete Audit Client',
        testimonial_text: 'Verifying archive audit event.',
        is_published: true,
      });

      await supertest(app)
        .delete(`/api/v1/admin/testimonials/${id}`)
        .set('Authorization', superAdminAuthHeader);

      const audit = await testKnex('audit_logs')
        .where({ resource_type: 'testimonial', action: 'testimonial_deleted' })
        .first();

      assert.ok(audit, 'testimonial_deleted audit log must be recorded');
    });

    it('logs testimonials_reordered when reordering testimonials', async () => {
      const [id1] = await testKnex('testimonials').insert({
        client_name: 'Item 1',
        testimonial_text: 'Reorder audit test 1.',
        display_order: 0,
        is_published: true,
      });

      await supertest(app)
        .put('/api/v1/admin/testimonials/reorder')
        .set('Authorization', superAdminAuthHeader)
        .send({
          items: [{ id: id1, displayOrder: 5 }],
        });

      const audit = await testKnex('audit_logs')
        .where({ resource_type: 'testimonial', action: 'testimonials_reordered' })
        .first();

      assert.ok(audit, 'testimonials_reordered audit log must be recorded');
    });
  });
});
