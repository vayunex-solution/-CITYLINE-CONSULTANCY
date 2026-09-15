/**
 * CITYLINE CONSULTANCY — Phase 12 Analytics & Intelligence Test Suite
 * Comprehensive verification of First-Party Tracking, Session Lifecycle, Server-side Aggregations,
 * Genuine Persisted Conversions, Privacy Safeguards, and RBAC Security.
 */

import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import knex, { Knex } from 'knex';
import { createApp } from '../src/app';
import { setDbClient } from '../src/database/connection';
import { tokenRevocationStore } from '../src/auth/token-revocation';
import { createAdminToken } from '../src/auth/token';
import { analyticsRateLimiter } from '../src/middleware/analytics-rate-limit.middleware';

describe('Phase 12 — Analytics & Intelligence Test Suite', () => {
  let app: ReturnType<typeof createApp>;
  let testKnex: Knex;

  const testSuperAdminId = '77777777-7777-7777-7777-777777777771';
  const testOperatorId = '77777777-7777-7777-7777-777777777772';
  const testUnauthorizedRoleId = '77777777-7777-7777-7777-777777777773';

  let superAdminAuthHeader: string;
  let operatorAuthHeader: string;
  let unauthorizedAuthHeader: string;

  before(async () => {
    // 1. Isolated in-memory SQLite database
    testKnex = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    setDbClient(testKnex);
    tokenRevocationStore.setClient(testKnex);

    // 2. Base Admin & Auth Schema
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

    // 3. Analytics Schema (visitor_sessions & page_views)
    await testKnex.schema.createTable('visitor_sessions', (t) => {
      t.string('id', 36).primary();
      t.string('session_hash', 64).notNullable().unique();
      t.string('device_category', 50).nullable();
      t.string('browser', 100).nullable();
      t.string('os', 100).nullable();
      t.string('country_code', 2).nullable();
      t.string('referrer_source', 255).nullable();
      t.timestamp('first_seen_at').defaultTo(testKnex.fn.now()).notNullable();
      t.timestamp('last_seen_at').defaultTo(testKnex.fn.now()).notNullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now()).notNullable();
    });

    await testKnex.schema.createTable('page_views', (t) => {
      t.bigIncrements('id').primary();
      t.string('session_id', 36).notNullable().references('id').inTable('visitor_sessions').onDelete('CASCADE');
      t.string('page_path', 255).notNullable();
      t.string('event_name', 100).defaultTo('pageview').notNullable();
      t.integer('duration_seconds').defaultTo(0).notNullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now()).notNullable();
    });

    // 4. Conversion Target Tables
    await testKnex.schema.createTable('enquiries', (t) => {
      t.string('id', 36).primary();
      t.string('enquiry_type', 50).notNullable().defaultTo('visa_enquiry');
      t.string('full_name', 150).notNullable();
      t.string('status', 50).defaultTo('new');
      t.timestamp('deleted_at').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('manpower_enquiries', (t) => {
      t.string('id', 36).primary();
      t.string('company_name', 200).notNullable();
      t.string('status', 50).defaultTo('new');
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
    });

    await testKnex.schema.createTable('job_applications', (t) => {
      t.string('id', 36).primary();
      t.string('applicant_name', 150).notNullable();
      t.string('status', 50).defaultTo('new');
      t.timestamp('deleted_at').nullable();
      t.timestamp('created_at').defaultTo(testKnex.fn.now());
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

    // 5. Seed Roles & Users
    await testKnex('admin_roles').insert([
      { id: 1, role_key: 'super_admin', name: 'Super Administrator' },
      { id: 2, role_key: 'admin_operator', name: 'Admin Operator' },
      { id: 3, role_key: 'auditor', name: 'Auditor Read-Only' },
    ]);

    await testKnex('admin_users').insert([
      {
        id: testSuperAdminId,
        role_id: 1,
        username: 'analytics_admin',
        email: 'admin@cityline.ae',
        password_hash: 'hash',
        full_name: 'Analytics Admin',
        is_active: true,
      },
      {
        id: testOperatorId,
        role_id: 2,
        username: 'analytics_operator',
        email: 'operator@cityline.ae',
        password_hash: 'hash',
        full_name: 'Analytics Operator',
        is_active: true,
      },
      {
        id: testUnauthorizedRoleId,
        role_id: 3,
        username: 'analytics_auditor',
        email: 'auditor@cityline.ae',
        password_hash: 'hash',
        full_name: 'Analytics Auditor',
        is_active: true,
      },
    ]);

    const superToken = createAdminToken({
      id: testSuperAdminId,
      username: 'analytics_admin',
      email: 'admin@cityline.ae',
      role: 'super_admin',
      roleId: 1,
    });
    superAdminAuthHeader = `Bearer ${superToken.token}`;

    const operatorToken = createAdminToken({
      id: testOperatorId,
      username: 'analytics_operator',
      email: 'operator@cityline.ae',
      role: 'admin_operator',
      roleId: 2,
    });
    operatorAuthHeader = `Bearer ${operatorToken.token}`;

    const auditorToken = createAdminToken({
      id: testUnauthorizedRoleId,
      username: 'analytics_auditor',
      email: 'auditor@cityline.ae',
      role: 'auditor',
      roleId: 3,
    });
    unauthorizedAuthHeader = `Bearer ${auditorToken.token}`;

    app = createApp();
  });

  beforeEach(async () => {
    analyticsRateLimiter.clear();
    await testKnex('page_views').del();
    await testKnex('visitor_sessions').del();
    await testKnex('enquiries').del();
    await testKnex('manpower_enquiries').del();
    await testKnex('job_applications').del();
    await testKnex('audit_logs').del();
  });

  after(async () => {
    if (testKnex) {
      await testKnex.destroy();
    }
  });

  // ============================================================================
  // 1. PUBLIC TRACKING INGESTION (POST /api/v1/analytics/page-view)
  // ============================================================================
  describe('POST /api/v1/analytics/page-view', () => {
    it('records valid page view and creates visitor session', async () => {
      const res = await supertest(app)
        .post('/api/v1/analytics/page-view')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')
        .send({
          sessionId: 'session-client-uuid-001',
          pathname: '/visa-services/freelance-visa',
          referrer: 'https://www.google.com/search?q=dubai+visa',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.recorded, true);

      // Verify row in visitor_sessions
      const sessions = await testKnex('visitor_sessions').select('*');
      assert.strictEqual(sessions.length, 1);
      assert.strictEqual(sessions[0].device_category, 'desktop');
      assert.strictEqual(sessions[0].browser, 'Chrome');
      assert.strictEqual(sessions[0].os, 'Windows');
      assert.strictEqual(sessions[0].referrer_source, 'Google');

      // Verify row in page_views
      const views = await testKnex('page_views').select('*');
      assert.strictEqual(views.length, 1);
      assert.strictEqual(views[0].page_path, '/visa-services/freelance-visa');
      assert.strictEqual(views[0].session_id, sessions[0].id);
    });

    it('normalizes pathname by stripping query parameters and hashes', async () => {
      const res = await supertest(app)
        .post('/api/v1/analytics/page-view')
        .send({
          sessionId: 'session-client-uuid-002',
          pathname: '/jobs?category=it&sort=desc#featured',
          referrer: null,
        });

      assert.strictEqual(res.status, 200);
      const views = await testKnex('page_views').where({ page_path: '/jobs' }).select('*');
      assert.strictEqual(views.length, 1);
    });

    it('detects mobile and tablet devices correctly from user-agent', async () => {
      // Mobile
      await supertest(app)
        .post('/api/v1/analytics/page-view')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1')
        .send({
          sessionId: 'session-mobile-001',
          pathname: '/about',
        });

      // Tablet
      await supertest(app)
        .post('/api/v1/analytics/page-view')
        .set('User-Agent', 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1')
        .send({
          sessionId: 'session-tablet-001',
          pathname: '/contact',
        });

      const mobileSession = await testKnex('visitor_sessions').where({ os: 'iOS', device_category: 'mobile' }).first();
      assert.ok(mobileSession);
      assert.strictEqual(mobileSession.browser, 'Safari');

      const tabletSession = await testKnex('visitor_sessions').where({ device_category: 'tablet' }).first();
      assert.ok(tabletSession);
    });

    it('rejects invalid payload without sessionId or pathname with 400', async () => {
      const res = await supertest(app)
        .post('/api/v1/analytics/page-view')
        .send({});

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('rejects malformed pathname with external protocol or invalid prefix with 400', async () => {
      const res = await supertest(app)
        .post('/api/v1/analytics/page-view')
        .send({
          sessionId: 'session-malformed-001',
          pathname: 'https://evil-phishing-site.com/steal',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    });

    it('rejects oversized input exceeding bounds with 400', async () => {
      const res = await supertest(app)
        .post('/api/v1/analytics/page-view')
        .send({
          sessionId: 's'.repeat(70), // max is 64
          pathname: '/test',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('rejects arbitrary field injection (mass assignment defense) with 400', async () => {
      const res = await supertest(app)
        .post('/api/v1/analytics/page-view')
        .send({
          sessionId: 'valid-session-123',
          pathname: '/test',
          injected_admin_role: 'super_admin',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });
  });

  // ============================================================================
  // 2. SESSION LIFECYCLE & RETURNING SESSIONS
  // ============================================================================
  describe('Session Lifecycle & Returning Visitors', () => {
    it('updates last_seen_at on returning session without creating duplicate session rows', async () => {
      const sessionId = 'stable-visitor-session-uuid';

      // 1. First visit
      const res1 = await supertest(app)
        .post('/api/v1/analytics/page-view')
        .send({ sessionId, pathname: '/' });
      assert.strictEqual(res1.status, 200);

      const sessionAfterFirst = await testKnex('visitor_sessions').first();
      assert.ok(sessionAfterFirst);
      const firstSeen = sessionAfterFirst.first_seen_at;

      // 2. Subsequent visit from same session
      const res2 = await supertest(app)
        .post('/api/v1/analytics/page-view')
        .send({ sessionId, pathname: '/visa-services' });
      assert.strictEqual(res2.status, 200);

      // Verify sessions table still contains exactly 1 row
      const sessionCount = await testKnex('visitor_sessions').count('id as count').first();
      assert.strictEqual(Number(sessionCount?.count), 1);

      // Verify page_views has 2 records linked to this single session
      const views = await testKnex('page_views').select('*');
      assert.strictEqual(views.length, 2);
      assert.strictEqual(views[0].session_id, sessionAfterFirst.id);
      assert.strictEqual(views[1].session_id, sessionAfterFirst.id);
    });
  });

  // ============================================================================
  // 3. ADMIN ANALYTICS AGGREGATION & REPORTING
  // ============================================================================
  describe('GET /api/v1/admin/analytics/overview', () => {
    it('rejects unauthenticated request with 401', async () => {
      const res = await supertest(app).get('/api/v1/admin/analytics/overview');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'AUTHENTICATION_REQUIRED');
    });

    it('rejects unauthorized role with 403', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', unauthorizedAuthHeader);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'FORBIDDEN');
    });

    it('returns zero state gracefully when database is empty', async () => {
      const res = await supertest(app)
        .get('/api/v1/admin/analytics/overview?period=7d')
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.metrics.totalVisitors, 0);
      assert.strictEqual(res.body.data.metrics.totalPageViews, 0);
      assert.strictEqual(res.body.data.metrics.uniqueVisitors, 0);
      assert.strictEqual(res.body.data.metrics.conversionRate, 0);
      assert.strictEqual(res.body.data.metrics.totalConversions, 0);
      assert.deepStrictEqual(res.body.data.topPages, []);
      assert.deepStrictEqual(res.body.data.trafficSources, []);
      assert.deepStrictEqual(res.body.data.deviceBreakdown, []);
    });

    it('aggregates metrics, rankings, and conversions accurately for authorized operators', async () => {
      // Seed 2 visitor sessions using testKnex.fn.now()
      await testKnex('visitor_sessions').insert([
        {
          id: 'sess-1',
          session_hash: 'hash-1',
          device_category: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
          referrer_source: 'Google',
          first_seen_at: testKnex.fn.now(),
          last_seen_at: testKnex.fn.now(),
          created_at: testKnex.fn.now(),
        },
        {
          id: 'sess-2',
          session_hash: 'hash-2',
          device_category: 'mobile',
          browser: 'Safari',
          os: 'iOS',
          referrer_source: 'Direct',
          first_seen_at: testKnex.fn.now(),
          last_seen_at: testKnex.fn.now(),
          created_at: testKnex.fn.now(),
        },
      ]);

      // Seed page views: 3 on /visa-services, 1 on /about
      await testKnex('page_views').insert([
        { session_id: 'sess-1', page_path: '/visa-services', event_name: 'pageview', created_at: testKnex.fn.now() },
        { session_id: 'sess-2', page_path: '/visa-services', event_name: 'pageview', created_at: testKnex.fn.now() },
        { session_id: 'sess-1', page_path: '/visa-services', event_name: 'pageview', created_at: testKnex.fn.now() },
        { session_id: 'sess-2', page_path: '/about', event_name: 'pageview', created_at: testKnex.fn.now() },
      ]);

      // Seed persisted conversions
      await testKnex('enquiries').insert([
        { id: 'enq-1', enquiry_type: 'visa_enquiry', full_name: 'Applicant 1', created_at: testKnex.fn.now() },
      ]);
      await testKnex('manpower_enquiries').insert([
        { id: 'man-1', company_name: 'Company 1', created_at: testKnex.fn.now() },
      ]);
      await testKnex('job_applications').insert([
        { id: 'app-1', applicant_name: 'Candidate 1', created_at: testKnex.fn.now() },
      ]);

      const res = await supertest(app)
        .get('/api/v1/admin/analytics/overview?period=7d')
        .set('Authorization', operatorAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.metrics.totalVisitors, 2);
      assert.strictEqual(res.body.data.metrics.totalPageViews, 4);
      assert.strictEqual(res.body.data.metrics.uniqueVisitors, 2);
      assert.strictEqual(res.body.data.metrics.totalConversions, 3);
      // 3 conversions / 2 visitors = 150%
      assert.strictEqual(res.body.data.metrics.conversionRate, 150);

      // Top pages
      assert.strictEqual(res.body.data.topPages[0].path, '/visa-services');
      assert.strictEqual(res.body.data.topPages[0].views, 3);
      assert.strictEqual(res.body.data.topPages[1].path, '/about');
      assert.strictEqual(res.body.data.topPages[1].views, 1);

      // Traffic Sources
      assert.strictEqual(res.body.data.trafficSources.length, 2);

      // Device breakdown
      const desktop = res.body.data.deviceBreakdown.find((d: any) => d.device === 'desktop');
      const mobile = res.body.data.deviceBreakdown.find((d: any) => d.device === 'mobile');
      assert.strictEqual(desktop.count, 1);
      assert.strictEqual(mobile.count, 1);
    });

    it('filters metrics by custom date ranges', async () => {
      const pastDate = '2025-01-01 12:00:00';
      await testKnex('visitor_sessions').insert([
        {
          id: 'old-sess',
          session_hash: 'old-hash',
          first_seen_at: pastDate,
          last_seen_at: pastDate,
          created_at: pastDate,
        },
      ]);
      await testKnex('page_views').insert([
        { session_id: 'old-sess', page_path: '/old-page', created_at: pastDate },
      ]);

      // Query modern range 2026-09-01 to 2026-09-30 should yield 0
      const res = await supertest(app)
        .get('/api/v1/admin/analytics/overview?startDate=2026-09-01&endDate=2026-09-30')
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.metrics.totalPageViews, 0);

      // Query past range 2025-01-01 to 2025-01-02 should yield 1
      const resPast = await supertest(app)
        .get('/api/v1/admin/analytics/overview?startDate=2025-01-01&endDate=2025-01-02')
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(resPast.status, 200);
      assert.strictEqual(resPast.body.data.metrics.totalPageViews, 1);
    });
  });

  // ============================================================================
  // 4. CONVERSION INTEGRITY & ZERO SENSITIVE DATA LEAKAGE
  // ============================================================================
  describe('Conversion Integrity & Security', () => {
    it('does NOT count page views as conversions without actual persisted records', async () => {
      // Simulate user viewing visa form page 10 times
      const sid = 'browse-only-session-uuid';
      for (let i = 0; i < 5; i++) {
        await supertest(app)
          .post('/api/v1/analytics/page-view')
          .send({ sessionId: sid, pathname: '/visa-enquiry' });
      }

      const res = await supertest(app)
        .get('/api/v1/admin/analytics/overview?period=today')
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.metrics.totalPageViews, 5);
      // STRICT ASSERTION: Genuine conversions must be 0
      assert.strictEqual(res.body.data.conversions.total, 0);
      assert.strictEqual(res.body.data.metrics.conversionRate, 0);
    });

    it('NEVER leaks IP addresses or private session secrets in responses', async () => {
      await supertest(app)
        .post('/api/v1/analytics/page-view')
        .send({ sessionId: 'privacy-test-sid', pathname: '/' });

      const res = await supertest(app)
        .get('/api/v1/admin/analytics/overview?period=today')
        .set('Authorization', superAdminAuthHeader);

      assert.strictEqual(res.status, 200);
      const jsonStr = JSON.stringify(res.body);

      // Verify no raw IP or internal hashes leaked
      assert.strictEqual(jsonStr.includes('client_ip'), false);
      assert.strictEqual(jsonStr.includes('session_hash'), false);
      assert.strictEqual(jsonStr.includes('127.0.0.1'), false);
    });
  });
});
