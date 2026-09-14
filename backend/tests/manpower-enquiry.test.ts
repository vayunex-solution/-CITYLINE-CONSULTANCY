/**
 * CITYLINE CONSULTANCY — Phase 9 Employer / Manpower Enquiry Test Suite
 * Comprehensive verification of validation, canonical fingerprinting, database-level
 * idempotency uniqueness, no-key concurrency, employer non-mutation, status state machine,
 * admin RBAC, rate limiting, and transactional outbox notifications.
 */

import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import knex, { Knex } from 'knex';
import { createApp } from '../src/app';
import { setDbClient } from '../src/database/connection';
import { tokenRevocationStore } from '../src/auth/token-revocation';
import { createAdminToken } from '../src/auth/token';
import { manpowerRateLimiter } from '../src/middleware/manpower-rate-limit.middleware';
import {
  computeCanonicalRequestHash,
  ManpowerEnquiryInput,
} from '../src/schemas/manpower-enquiry.schema';

describe('Phase 9 — Employer / Manpower Enquiry System Suite', () => {
  let app: ReturnType<typeof createApp>;
  let testKnex: Knex;

  const testAdminId = '88888888-8888-8888-8888-888888888888';
  let adminAuthHeader: string;
  let operatorAuthHeader: string;

  before(async () => {
    // 1. Setup isolated in-memory SQLite database for deterministic tests
    testKnex = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    setDbClient(testKnex);
    tokenRevocationStore.setClient(testKnex);

    // 2. Create Schema Tables
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

    await testKnex.schema.createTable('enquiries', (t) => {
      t.string('id', 36).primary();
      t.string('enquiry_type', 50).notNullable();
      t.string('status', 50).defaultTo('new');
      t.string('full_name', 150).notNullable();
      t.string('email', 255).notNullable();
      t.string('phone', 50).notNullable();
      t.string('whatsapp', 50).nullable();
      t.string('nationality', 100).nullable();
      t.string('subject', 255).nullable();
      t.text('message').nullable();
      t.string('source_channel', 50).defaultTo('website');
      t.string('assigned_admin_id', 36).nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
      t.timestamp('deleted_at').nullable();
    });

    await testKnex.schema.createTable('employers', (t) => {
      t.string('id', 36).primary();
      t.string('company_name', 255).notNullable();
      t.string('trade_license_number', 100).nullable();
      t.string('trn', 100).nullable();
      t.string('industry', 100).notNullable();
      t.string('contact_person', 150).notNullable();
      t.string('contact_designation', 150).nullable();
      t.string('email', 255).notNullable();
      t.string('phone', 50).notNullable();
      t.string('whatsapp', 50).nullable();
      t.string('country', 100).defaultTo('United Arab Emirates').nullable();
      t.string('city', 100).defaultTo('Dubai').notNullable();
      t.text('address').nullable();
      t.string('website', 255).nullable();
      t.text('notes').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('manpower_enquiries', (t) => {
      t.string('id', 36).primary();
      t.string('enquiry_id', 36).notNullable().unique();
      t.string('employer_id', 36).nullable();
      t.string('reference_number', 50).nullable().unique();
      t.string('idempotency_key', 100).nullable().unique();
      t.string('request_hash', 64).nullable();
      t.string('status', 50).defaultTo('new');
      t.integer('total_headcount').defaultTo(1);
      t.string('deployment_location', 150).nullable();
      t.string('preferred_timeline', 100).nullable();
      t.text('special_requirements').nullable();
      t.text('admin_notes').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
      t.timestamp('updated_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('manpower_enquiry_positions', (t) => {
      t.increments('id').primary();
      t.string('manpower_enquiry_id', 36).notNullable();
      t.integer('job_category_id').nullable();
      t.string('role_title', 150).notNullable();
      t.integer('headcount').defaultTo(1);
      t.integer('experience_years_required').nullable();
      t.string('qualification', 255).nullable();
      t.string('gender_requirement', 50).nullable();
      t.string('language_requirements', 255).nullable();
      t.string('salary_offered', 100).nullable();
      t.string('accommodation_provided', 100).nullable();
      t.string('transport_provided', 100).nullable();
      t.string('food_provided', 100).nullable();
      t.text('notes').nullable();
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

    // 3. Seed reference data: Roles & Admin Users
    await testKnex('admin_roles').insert([
      { id: 1, role_key: 'super_admin', name: 'Super Administrator' },
      { id: 2, role_key: 'admin_operator', name: 'Recruitment Operator' },
    ]);

    await testKnex('admin_users').insert({
      id: testAdminId,
      role_id: 1,
      username: 'admin_mp',
      email: 'admin.mp@cityline.ae',
      password_hash: 'test_hash',
      full_name: 'Admin MP',
      is_active: true,
    });

    const superAdminToken = createAdminToken({
      id: testAdminId,
      username: 'admin_mp',
      email: 'admin.mp@cityline.ae',
      role: 'super_admin',
      roleId: 1,
    });
    adminAuthHeader = `Bearer ${superAdminToken.token}`;

    const operatorToken = createAdminToken({
      id: '77777777-7777-7777-7777-777777777777',
      username: 'operator_mp',
      email: 'operator.mp@cityline.ae',
      role: 'admin_operator',
      roleId: 2,
    });
    operatorAuthHeader = `Bearer ${operatorToken.token}`;

    // Seed the 8 canonical categories
    await testKnex('job_categories').insert([
      { id: 1, name: 'Hotel Staff', slug: 'hotel-staff', display_order: 1 },
      { id: 2, name: 'Cleaning', slug: 'cleaning', display_order: 2 },
      { id: 3, name: 'Mason', slug: 'mason', display_order: 3 },
      { id: 4, name: 'Steel Fixer', slug: 'steel-fixer', display_order: 4 },
      { id: 5, name: 'Carpenter', slug: 'carpenter', display_order: 5 },
      { id: 6, name: 'Bike Rider / Delivery Job', slug: 'bike-rider-delivery', display_order: 6 },
      { id: 7, name: 'Taxi Driver', slug: 'taxi-driver', display_order: 7 },
      { id: 8, name: 'Truck Driver', slug: 'truck-driver', display_order: 8 },
    ]);

    app = createApp();
  });

  beforeEach(() => {
    manpowerRateLimiter.clear();
  });

  after(async () => {
    await testKnex.destroy();
  });

  const validPayload = (overrides: Partial<ManpowerEnquiryInput> = {}): ManpowerEnquiryInput => ({
    companyName: 'Example UAE Operations LLC',
    contactPerson: 'Rashid Al Nuaimi',
    contactDesignation: 'HR Director',
    email: 'rashid@example-ops.ae',
    phone: '+971 4 123 4567',
    whatsapp: '+971 50 123 4567',
    city: 'Dubai',
    website: 'https://example-ops.ae',
    industry: 'Facility Management',
    preferredTimeline: '30-days',
    deploymentLocation: 'Dubai Marina',
    specialRequirements: 'Rotational 8-hour shifts.',
    positions: [
      {
        categorySlug: 'cleaning',
        roleTitle: 'General Facility Cleaner',
        headcount: 10,
        experienceYearsRequired: 1,
        qualification: 'Secondary School',
        genderRequirement: 'any',
        languageRequirements: 'Basic English',
        salaryOffered: '1000 - 1200 AED',
        accommodationProvided: 'provided',
        transportProvided: 'provided',
        foodProvided: 'not_provided',
        notes: 'Commercial mall experience preferred.',
      },
      {
        categorySlug: 'hotel-staff',
        roleTitle: 'Kitchen Steward',
        headcount: 5,
        experienceYearsRequired: 2,
        accommodationProvided: 'provided',
        transportProvided: 'provided',
      },
    ],
    ...overrides,
  });

  // =========================================================================
  // 1. PUBLIC VALIDATION TESTS
  // =========================================================================
  describe('1. Public Input Validation & Strict Schema', () => {
    it('successfully submits a valid manpower requisition with multiple positions (HTTP 201)', async () => {
      const res = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(validPayload());

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.reference.startsWith('CLC-MP-'));
      assert.strictEqual(res.body.data.status, 'new');
      assert.strictEqual(res.body.data.totalPositions, 2);
      assert.strictEqual(res.body.data.totalHeadcount, 15);
      assert.strictEqual(res.body.data.isDuplicate, false);
    });

    it('rejects submission if required companyName is missing', async () => {
      const invalid = validPayload();
      delete (invalid as any).companyName;

      const res = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(invalid);

      assert.strictEqual(res.status, 422);
      assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('rejects submission with invalid email syntax', async () => {
      const res = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(validPayload({ email: 'not-an-email' }));

      assert.strictEqual(res.status, 422);
    });

    it('rejects submission with category slug outside the 8 locked categories', async () => {
      const payload = validPayload({
        positions: [
          {
            categorySlug: 'software-engineer' as any,
            roleTitle: 'Software Engineer',
            headcount: 5,
          },
        ],
      });

      const res = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(payload);

      assert.strictEqual(res.status, 422);
      assert.ok(JSON.stringify(res.body).includes('8 canonical categories'));
    });

    it('rejects submission if headcount is less than 1 or exceeds 500', async () => {
      const payloadZero = validPayload({
        positions: [{ categorySlug: 'mason', roleTitle: 'Mason', headcount: 0 }],
      });
      const resZero = await supertest(app).post('/api/v1/manpower-enquiries').send(payloadZero);
      assert.strictEqual(resZero.status, 422);

      const payloadExceed = validPayload({
        positions: [{ categorySlug: 'mason', roleTitle: 'Mason', headcount: 501 }],
      });
      const resExceed = await supertest(app).post('/api/v1/manpower-enquiries').send(payloadExceed);
      assert.strictEqual(resExceed.status, 422);
    });

    it('rejects submission with empty positions array', async () => {
      const res = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(validPayload({ positions: [] }));

      assert.strictEqual(res.status, 422);
    });

    it('rejects submission containing trade_license_number, trn, or unknown fields (.strict())', async () => {
      const payload = {
        ...validPayload(),
        trade_license_number: '123456',
        trn: '100200300',
      };

      const res = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(payload);

      assert.strictEqual(res.status, 422);
      assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // 2. CANONICAL POSITION ORDERING & FINGERPRINTING
  // =========================================================================
  describe('2. Canonical Request Fingerprinting & Deterministic Position Ordering', () => {
    it('produces an IDENTICAL canonical request hash when positions array is shuffled', () => {
      const posA = {
        categorySlug: 'cleaning' as const,
        roleTitle: 'General Cleaner',
        headcount: 10,
        experienceYearsRequired: 1,
        qualification: 'Secondary School',
        genderRequirement: 'any' as const,
        languageRequirements: 'English',
        salaryOffered: '1200 AED',
        accommodationProvided: 'provided' as const,
        transportProvided: 'provided' as const,
        foodProvided: 'not_provided' as const,
        notes: 'Commercial mall experience',
      };

      const posB = {
        categorySlug: 'hotel-staff' as const,
        roleTitle: 'Kitchen Steward',
        headcount: 5,
        experienceYearsRequired: 2,
        qualification: null,
        genderRequirement: null,
        languageRequirements: null,
        salaryOffered: null,
        accommodationProvided: 'provided' as const,
        transportProvided: 'provided' as const,
        foodProvided: null,
        notes: null,
      };

      const input1 = validPayload({ positions: [posA, posB] });
      const input2 = validPayload({ positions: [posB, posA] }); // Reversed order

      const hash1 = computeCanonicalRequestHash(input1);
      const hash2 = computeCanonicalRequestHash(input2);

      assert.strictEqual(hash1, hash2, 'Reordered position arrays must produce identical canonical hashes');
    });

    it('produces a DIFFERENT canonical hash if any field in any position is modified', () => {
      const base = validPayload();
      const baseHash = computeCanonicalRequestHash(base);

      // Change headcount
      const changedHeadcount = validPayload({
        positions: [
          { ...base.positions[0], headcount: 12 },
          base.positions[1],
        ],
      });
      assert.notStrictEqual(computeCanonicalRequestHash(changedHeadcount), baseHash);

      // Change qualification
      const changedQual = validPayload({
        positions: [
          { ...base.positions[0], qualification: 'Vocational Diploma' },
          base.positions[1],
        ],
      });
      assert.notStrictEqual(computeCanonicalRequestHash(changedQual), baseHash);

      // Change company name
      const changedCompany = validPayload({ companyName: 'Different Company LLC' });
      assert.notStrictEqual(computeCanonicalRequestHash(changedCompany), baseHash);
    });

    it('excludes idempotencyKey from canonical fingerprint calculation', () => {
      const inputA = validPayload({ idempotencyKey: 'key-alpha-111' });
      const inputB = validPayload({ idempotencyKey: 'key-beta-222' });

      assert.strictEqual(
        computeCanonicalRequestHash(inputA),
        computeCanonicalRequestHash(inputB),
        'idempotencyKey must not alter the business request hash'
      );
    });
  });

  // =========================================================================
  // 3. IDEMPOTENCY & DATABASE-LEVEL UNIQUE CONSTRAINT
  // =========================================================================
  describe('3. Hardened Idempotency & Database Unique Constraint Recovery', () => {
    it('returns existing enquiry with HTTP 200 (isDuplicate: true) on same key + same payload', async () => {
      const key = 'test-idemp-key-001';
      const payload = validPayload({
        companyName: 'Idempotent Corp Dubai',
        email: 'idemp@corp.ae',
      });

      // 1st call
      const res1 = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .set('X-Idempotency-Key', key)
        .send(payload);

      assert.strictEqual(res1.status, 201);
      const initialReference = res1.body.data.reference;

      // 2nd call with same key and identical payload
      const res2 = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .set('X-Idempotency-Key', key)
        .send(payload);

      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.body.data.isDuplicate, true);
      assert.strictEqual(res2.body.data.reference, initialReference);

      // Verify zero duplicate records in DB
      const count = await testKnex('manpower_enquiries').where('idempotency_key', key).count('* as c');
      assert.strictEqual(Number(count[0].c), 1);
    });

    it('returns HTTP 409 IDEMPOTENCY_KEY_CONFLICT on same key + materially different payload', async () => {
      const key = 'test-idemp-key-conflict';
      const payload1 = validPayload({
        companyName: 'Conflict Corp LLC',
        email: 'conflict@corp.ae',
      });

      const res1 = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .set('X-Idempotency-Key', key)
        .send(payload1);

      assert.strictEqual(res1.status, 201);

      // 2nd call with same key but changed headcount
      const payload2 = {
        ...payload1,
        positions: [
          {
            ...payload1.positions[0],
            headcount: 99, // Material difference
          },
        ],
      };

      const res2 = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .set('X-Idempotency-Key', key)
        .send(payload2);

      assert.strictEqual(res2.status, 409);
      assert.strictEqual(res2.body.error.code, 'IDEMPOTENCY_KEY_CONFLICT');
    });

    it('allows multiple distinct enquiries with null idempotency key', async () => {
      const payloadA = validPayload({ companyName: 'Null Key Corp A', email: 'a@nullkey.ae' });
      const payloadB = validPayload({ companyName: 'Null Key Corp B', email: 'b@nullkey.ae' });

      const resA = await supertest(app).post('/api/v1/manpower-enquiries').send(payloadA);
      const resB = await supertest(app).post('/api/v1/manpower-enquiries').send(payloadB);

      assert.strictEqual(resA.status, 201);
      assert.strictEqual(resB.status, 201);
      assert.notStrictEqual(resA.body.data.reference, resB.body.data.reference);
    });
  });

  // =========================================================================
  // 4. NO-KEY CONCURRENCY & DUPLICATE SUPPRESSION
  // =========================================================================
  describe('4. No-Key Duplicate Suppression & Legitimate Re-submission', () => {
    it('suppresses rapid identical double-click submission within 15-minute window', async () => {
      const payload = validPayload({
        companyName: 'DoubleClick Facility Services',
        email: 'ops@doubleclick.ae',
      });

      const res1 = await supertest(app).post('/api/v1/manpower-enquiries').send(payload);
      assert.strictEqual(res1.status, 201);

      // Rapid re-submission (no key, same company + email + hash)
      const res2 = await supertest(app).post('/api/v1/manpower-enquiries').send(payload);
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.body.data.isDuplicate, true);
      assert.strictEqual(res2.body.data.reference, res1.body.data.reference);

      // Exactly 1 enquiry in DB
      const count = await testKnex('manpower_enquiries')
        .join('employers', 'manpower_enquiries.employer_id', 'employers.id')
        .where('employers.email', 'ops@doubleclick.ae')
        .count('* as c');
      assert.strictEqual(Number(count[0].c), 1);
    });

    it('allows a legitimate subsequent submission after duplicate window elapses', async () => {
      const payload = validPayload({
        companyName: 'Reapplication Logistics LLC',
        email: 'hiring@reapp-logistics.ae',
      });

      const res1 = await supertest(app).post('/api/v1/manpower-enquiries').send(payload);
      assert.strictEqual(res1.status, 201);

      // Simulate 16 minutes having elapsed by rewinding created_at
      const sixteenMinsAgo = new Date(Date.now() - 16 * 60 * 1000);
      await testKnex('manpower_enquiries')
        .where('reference_number', res1.body.data.reference)
        .update({ created_at: sixteenMinsAgo });

      // Subsequent legitimate requisition succeeds
      const res2 = await supertest(app).post('/api/v1/manpower-enquiries').send(payload);
      assert.strictEqual(res2.status, 201);
      assert.strictEqual(res2.body.data.isDuplicate, false);
      assert.notStrictEqual(res2.body.data.reference, res1.body.data.reference);
    });

    it('concurrent simultaneous identical submissions create exactly ONE enquiry', async () => {
      const payload = validPayload({
        companyName: 'Concurrent Race Services',
        email: 'race@concurrent.ae',
      });

      // Fire 3 simultaneous identical requests without idempotency key
      const [r1, r2, r3] = await Promise.all([
        supertest(app).post('/api/v1/manpower-enquiries').send(payload),
        supertest(app).post('/api/v1/manpower-enquiries').send(payload),
        supertest(app).post('/api/v1/manpower-enquiries').send(payload),
      ]);

      const statuses = [r1.status, r2.status, r3.status];
      // One creates (201), the concurrent duplicates resolve to 200 isDuplicate: true
      assert.ok(statuses.includes(201), 'At least one request must create');
      const count200 = statuses.filter((s) => s === 200).length;
      assert.strictEqual(count200, 2, 'Two concurrent requests must resolve as duplicate (200)');

      // Verify DB: exactly 1 enquiry created
      const enquiries = await testKnex('manpower_enquiries')
        .join('employers', 'manpower_enquiries.employer_id', 'employers.id')
        .where('employers.email', 'race@concurrent.ae');
      assert.strictEqual(enquiries.length, 1);
    });
  });

  // =========================================================================
  // 5. EMPLOYER DEDUPLICATION & NON-MUTATION
  // =========================================================================
  describe('5. Employer Deduplication & Non-Mutation Invariant', () => {
    it('reuses existing employer record WITHOUT mutating original profile fields', async () => {
      // 1. First submission establishes employer master record
      const initialPayload = validPayload({
        companyName: 'Alpha Marine Contracting',
        contactPerson: 'Original Contact Person',
        phone: '+971 4 111 2222',
        email: 'marine@alpha-corp.ae',
      });

      const res1 = await supertest(app).post('/api/v1/manpower-enquiries').send(initialPayload);
      assert.strictEqual(res1.status, 201);

      // Inspect created employer record
      const initialEmployer = await testKnex('employers')
        .where('email', 'marine@alpha-corp.ae')
        .first();
      assert.ok(initialEmployer);
      assert.strictEqual(initialEmployer.contact_person, 'Original Contact Person');
      assert.strictEqual(initialEmployer.phone, '+971 4 111 2222');

      // 2. Second submission with different contact person and phone for the same company + email
      // (After modifying one field so it's a distinct requisition)
      const secondPayload = validPayload({
        companyName: 'Alpha Marine Contracting',
        contactPerson: 'New Project Coordinator',
        phone: '+971 4 999 8888',
        email: 'marine@alpha-corp.ae',
        deploymentLocation: 'Jebel Ali Port Terminal 3', // Distinct requisition
      });

      const res2 = await supertest(app).post('/api/v1/manpower-enquiries').send(secondPayload);
      assert.strictEqual(res2.status, 201);

      // Verify: Employer was REUSED and NOT MUTATED
      const employers = await testKnex('employers').where('email', 'marine@alpha-corp.ae');
      assert.strictEqual(employers.length, 1, 'Employer must be reused, not duplicated');
      assert.strictEqual(
        employers[0].contact_person,
        'Original Contact Person',
        'Existing employer contact_person must NOT be mutated'
      );
      assert.strictEqual(
        employers[0].phone,
        '+971 4 111 2222',
        'Existing employer phone must NOT be mutated'
      );

      // Verify: Per-enquiry contact details were recorded in parent enquiries table
      const parentEnquiry = await testKnex('enquiries')
        .join('manpower_enquiries', 'enquiries.id', 'manpower_enquiries.enquiry_id')
        .where('manpower_enquiries.reference_number', res2.body.data.reference)
        .first();
      assert.strictEqual(parentEnquiry.full_name, 'New Project Coordinator');
      assert.strictEqual(parentEnquiry.phone, '+971 4 999 8888');
    });

    it('creates a separate employer if company name or email differs', async () => {
      const res1 = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(validPayload({ companyName: 'Beta Group A', email: 'common@group.ae' }));

      const res2 = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(validPayload({ companyName: 'Beta Group B', email: 'common@group.ae' }));

      assert.strictEqual(res1.status, 201);
      assert.strictEqual(res2.status, 201);

      const empCount = await testKnex('employers').where('email', 'common@group.ae').count('* as c');
      assert.strictEqual(Number(empCount[0].c), 2);
    });
  });

  // =========================================================================
  // 6. SERVICE-LEVEL STATUS STATE MACHINE
  // =========================================================================
  describe('6. Service-Level Status State Machine Invariants', () => {
    let enquiryId: string;

    before(async () => {
      const res = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(validPayload({ companyName: 'State Machine Test LLC', email: 'sm@test.ae' }));
      const row = await testKnex('manpower_enquiries')
        .where('reference_number', res.body.data.reference)
        .first();
      enquiryId = row.id;
    });

    it('allows valid progressive transitions: new -> reviewing -> contacted -> qualified -> processing -> fulfilled -> closed', async () => {
      const transitions = [
        'reviewing',
        'contacted',
        'qualified',
        'processing',
        'fulfilled',
        'closed',
      ];

      for (const nextStatus of transitions) {
        const res = await supertest(app)
          .patch(`/api/v1/admin/manpower-enquiries/${enquiryId}/status`)
          .set('Authorization', adminAuthHeader)
          .send({ status: nextStatus, notes: `Transitioned to ${nextStatus}` });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.data.status, nextStatus);
      }
    });

    it('rejects invalid forward jump (new -> fulfilled)', async () => {
      // Create fresh enquiry
      const resNew = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(validPayload({ companyName: 'Jump Test LLC', email: 'jump@test.ae' }));
      const row = await testKnex('manpower_enquiries')
        .where('reference_number', resNew.body.data.reference)
        .first();

      const res = await supertest(app)
        .patch(`/api/v1/admin/manpower-enquiries/${row.id}/status`)
        .set('Authorization', adminAuthHeader)
        .send({ status: 'fulfilled' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error.code, 'INVALID_STATUS_TRANSITION');
    });

    it('rejects invalid backward transition (processing -> new)', async () => {
      // Create fresh enquiry and advance to reviewing -> contacted -> qualified -> processing
      const resNew = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(validPayload({ companyName: 'Backward Test LLC', email: 'back@test.ae' }));
      const row = await testKnex('manpower_enquiries')
        .where('reference_number', resNew.body.data.reference)
        .first();

      await supertest(app)
        .patch(`/api/v1/admin/manpower-enquiries/${row.id}/status`)
        .set('Authorization', adminAuthHeader)
        .send({ status: 'reviewing' });
      await supertest(app)
        .patch(`/api/v1/admin/manpower-enquiries/${row.id}/status`)
        .set('Authorization', adminAuthHeader)
        .send({ status: 'contacted' });
      await supertest(app)
        .patch(`/api/v1/admin/manpower-enquiries/${row.id}/status`)
        .set('Authorization', adminAuthHeader)
        .send({ status: 'qualified' });
      await supertest(app)
        .patch(`/api/v1/admin/manpower-enquiries/${row.id}/status`)
        .set('Authorization', adminAuthHeader)
        .send({ status: 'processing' });

      // Attempt backward jump to 'new'
      const res = await supertest(app)
        .patch(`/api/v1/admin/manpower-enquiries/${row.id}/status`)
        .set('Authorization', adminAuthHeader)
        .send({ status: 'new' });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error.code, 'INVALID_STATUS_TRANSITION');
    });

    it('allows transition to rejected and then closed', async () => {
      const resNew = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(validPayload({ companyName: 'Rejection Test LLC', email: 'reject@test.ae' }));
      const row = await testKnex('manpower_enquiries')
        .where('reference_number', resNew.body.data.reference)
        .first();

      // new -> rejected
      const resRej = await supertest(app)
        .patch(`/api/v1/admin/manpower-enquiries/${row.id}/status`)
        .set('Authorization', adminAuthHeader)
        .send({ status: 'rejected', notes: 'Incompatible commercial requirements' });
      assert.strictEqual(resRej.status, 200);

      // rejected -> closed
      const resClosed = await supertest(app)
        .patch(`/api/v1/admin/manpower-enquiries/${row.id}/status`)
        .set('Authorization', adminAuthHeader)
        .send({ status: 'closed', notes: 'Archived file' });
      assert.strictEqual(resClosed.status, 200);
    });
  });

  // =========================================================================
  // 7. ADMIN API, RBAC & RESTRICTED UPDATE SCOPE
  // =========================================================================
  describe('7. Admin Endpoints, RBAC & Restricted Update Scope', () => {
    let testEnquiryId: string;

    before(async () => {
      const res = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(validPayload({ companyName: 'Admin Inspection LLC', email: 'admin-inspect@test.ae' }));
      const row = await testKnex('manpower_enquiries')
        .where('reference_number', res.body.data.reference)
        .first();
      testEnquiryId = row.id;
    });

    it('returns 401 Unauthorized if no admin token is provided', async () => {
      const res = await supertest(app).get('/api/v1/admin/manpower-enquiries');
      assert.strictEqual(res.status, 401);
    });

    it('lists manpower enquiries with pagination for authenticated admin', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/manpower-enquiries?page=1&limit=10')
        .set('Authorization', adminAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.pagination.total >= 1);
    });

    it('retrieves complete enquiry details including positions and employer profile', async () => {
      const res = await supertest(app)
        .get(`/api/v1/admin/manpower-enquiries/${testEnquiryId}`)
        .set('Authorization', adminAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.employer.company_name, 'Admin Inspection LLC');
      assert.ok(Array.isArray(res.body.data.positions));
      assert.strictEqual(res.body.data.positions.length, 2);
    });

    it('returns 404 for non-existent enquiry ID', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/manpower-enquiries/00000000-0000-0000-0000-000000000000')
        .set('Authorization', adminAuthHeader);

      assert.strictEqual(res.status, 404);
    });

    it('generic update endpoint (PATCH /:id) permits approved operational fields', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/admin/manpower-enquiries/${testEnquiryId}`)
        .set('Authorization', adminAuthHeader)
        .send({
          adminNotes: 'Reviewed by recruitment lead; pending site tour',
          deploymentLocation: 'Al Quoz Industrial 3',
          preferredTimeline: '60-days',
          specialRequirements: 'Night transport needed',
        });

      assert.strictEqual(res.status, 200);

      const updated = await testKnex('manpower_enquiries').where('id', testEnquiryId).first();
      assert.strictEqual(updated.admin_notes, 'Reviewed by recruitment lead; pending site tour');
      assert.strictEqual(updated.deployment_location, 'Al Quoz Industrial 3');
      assert.strictEqual(updated.preferred_timeline, '60-days');
    });

    it('generic update endpoint (PATCH /:id) REJECTS status field', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/admin/manpower-enquiries/${testEnquiryId}`)
        .set('Authorization', adminAuthHeader)
        .send({ status: 'fulfilled' });

      assert.strictEqual(res.status, 400);
    });

    it('generic update endpoint (PATCH /:id) REJECTS employer identity mutation', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/admin/manpower-enquiries/${testEnquiryId}`)
        .set('Authorization', adminAuthHeader)
        .send({ company_name: 'Mutated Name LLC', email: 'hacked@email.com' });

      assert.strictEqual(res.status, 400);
    });

    it('records structured audit logs upon status update and generic update', async () => {
      const auditStatus = await testKnex('audit_logs')
        .where('resource_type', 'manpower_enquiry')
        .where('action', 'manpower_enquiry_status_updated')
        .first();
      assert.ok(auditStatus, 'Status updates must generate audit log entries');

      const auditEnquiry = await testKnex('audit_logs')
        .where('resource_type', 'manpower_enquiry')
        .where('action', 'manpower_enquiry_updated')
        .first();
      assert.ok(auditEnquiry, 'Enquiry updates must generate audit log entries');
    });
  });

  // =========================================================================
  // 8. RATE LIMITING & TRUSTED CLIENT IP
  // =========================================================================
  describe('8. Rate Limiting & Trusted Socket IP', () => {
    it('allows 5 successful requests and blocks 6th with HTTP 429 and Retry-After', async () => {
      manpowerRateLimiter.clear();

      for (let i = 0; i < 5; i++) {
        const res = await supertest(app)
          .post('/api/v1/manpower-enquiries')
          .send(
            validPayload({
              companyName: `Rate Limit Org ${i}`,
              email: `rate${i}@company.ae`,
            })
          );
        assert.strictEqual(res.status, 201, `Request ${i + 1} must succeed`);
      }

      // 6th request
      const res6 = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(
          validPayload({
            companyName: 'Rate Limit Org 6',
            email: 'rate6@company.ae',
          })
        );

      assert.strictEqual(res6.status, 429);
      assert.strictEqual(res6.body.error.code, 'RATE_LIMIT_EXCEEDED');
      assert.ok(res6.headers['retry-after']);
    });

    it('rejects bypass attempt via spoofed X-Forwarded-For header', async () => {
      manpowerRateLimiter.clear();

      // Exhaust 5 allowed attempts
      for (let i = 0; i < 5; i++) {
        await supertest(app)
          .post('/api/v1/manpower-enquiries')
          .send(validPayload({ companyName: `Spoof ${i}`, email: `spoof${i}@test.ae` }));
      }

      // 6th request with spoofed X-Forwarded-For header is STILL blocked
      const resBlocked = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .set('X-Forwarded-For', '203.0.113.195') // Spoofed header
        .send(validPayload({ companyName: 'Spoofed Bypass', email: 'bypass@test.ae' }));

      assert.strictEqual(
        resBlocked.status,
        429,
        'Limiter must rely on socket IP and reject X-Forwarded-For bypass'
      );
    });
  });

  // =========================================================================
  // 9. TRANSACTIONAL NOTIFICATIONS & DATA SECURITY
  // =========================================================================
  describe('9. Transactional Notifications & Data Security', () => {
    it('creates exactly two outbox notification records with neutral wording and zero attachments', async () => {
      const res = await supertest(app)
        .post('/api/v1/manpower-enquiries')
        .send(
          validPayload({
            companyName: 'Notification Test Corporate',
            email: 'notify@corporate.ae',
          })
        );

      assert.strictEqual(res.status, 201);
      const ref = res.body.data.reference;

      const manpowerRow = await testKnex('manpower_enquiries')
        .where('reference_number', ref)
        .first();

      const outboxRecords = await testKnex('notification_queue').where(
        'reference_id',
        manpowerRow.enquiry_id
      );

      assert.strictEqual(outboxRecords.length, 2, 'Exactly two outbox records must be enqueued');

      const adminNotif = outboxRecords.find((r) => r.notification_type === 'manpower_enquiry_admin');
      const employerNotif = outboxRecords.find(
        (r) => r.notification_type === 'manpower_enquiry_confirmation'
      );

      assert.ok(adminNotif, 'Admin notification must be enqueued');
      assert.ok(employerNotif, 'Employer confirmation must be enqueued');

      // Check employer confirmation neutral copy
      const employerPayload = JSON.parse(employerNotif.payload_json);
      assert.strictEqual(employerPayload.reference, ref);
      assert.strictEqual(employerPayload.companyName, 'Notification Test Corporate');

      // Confirm absence of unverified legal/regulatory/labour claims
      const employerPayloadStr = JSON.stringify(employerPayload);
      assert.ok(
        !employerPayloadStr.includes('adheres to UAE labour standards'),
        'Must not contain unverified labour standards claim'
      );
      assert.ok(
        !employerPayloadStr.includes('guarantee'),
        'Must not contain any guarantee claims'
      );

      // Confirm zero filesystem paths or private keys in payload
      assert.ok(!employerPayloadStr.includes('/storage/'));
      assert.ok(!employerPayloadStr.includes('storage_key'));
    });
  });
});
