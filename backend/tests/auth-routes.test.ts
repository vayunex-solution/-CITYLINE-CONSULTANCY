/**
 * CITYLINE CONSULTANCY — Administrative Authentication Endpoints Integration Tests
 * Verifies /api/v1/admin/auth/login, /api/v1/admin/auth/logout, and /api/v1/admin/auth/me.
 *
 * GOVERNANCE:
 * - Tests uniform failure messages (enumeration defense).
 * - Tests cookie flags (HttpOnly, SameSite).
 * - Tests token invalidation on logout.
 * - Tests rate limiting on consecutive failures.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app';
import { adminUserRepository, AdminUserWithRole } from '../src/repositories/admin-user.repository';
import { hashPassword } from '../src/auth/password';
import { authRateLimiterStore } from '../src/middleware/auth-rate-limit.middleware';
import { tokenRevocationStore } from '../src/auth/token-revocation';
import { env } from '../src/config/env.config';

import knex, { Knex } from 'knex';
import { up } from '../src/database/migrations/20260913000001_create_revoked_tokens';

describe('Admin Authentication Endpoints (/api/v1/admin/auth)', () => {
  const app = createApp();
  const testPassword = 'CorrectHorseBatteryStaple123!';
  let activeSuperAdmin: AdminUserWithRole;
  let inactiveAdmin: AdminUserWithRole;
  let testKnex: Knex;

  const originalFindByIdentity = adminUserRepository.findByIdentity;
  const originalFindByIdWithRole = adminUserRepository.findByIdWithRole;
  const originalUpdateLastLogin = adminUserRepository.updateLastLogin;

  before(async () => {
    testKnex = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    await up(testKnex);
    tokenRevocationStore.setClient(testKnex);

    const passwordHash = await hashPassword(testPassword);

    activeSuperAdmin = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      role_id: 1,
      role_key: 'super_admin',
      role_name: 'Super Administrator',
      username: 'superadmin',
      email: 'superadmin@citylineconsultancy.ae',
      password_hash: passwordHash,
      full_name: 'Cityline Super Admin',
      is_active: true,
      last_login_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    inactiveAdmin = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      role_id: 2,
      role_key: 'admin_operator',
      role_name: 'Administrative Operator',
      username: 'inactive_op',
      email: 'inactive@citylineconsultancy.ae',
      password_hash: passwordHash,
      full_name: 'Inactive Operator',
      is_active: false,
      last_login_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Wire mock data retrieval
    adminUserRepository.findByIdentity = async (identity: string) => {
      const normalized = identity.trim().toLowerCase();
      if (normalized === 'superadmin' || normalized === 'superadmin@citylineconsultancy.ae') {
        return activeSuperAdmin;
      }
      if (normalized === 'inactive_op' || normalized === 'inactive@citylineconsultancy.ae') {
        return inactiveAdmin;
      }
      return null;
    };

    adminUserRepository.findByIdWithRole = async (id: string) => {
      if (id === activeSuperAdmin.id) return activeSuperAdmin;
      if (id === inactiveAdmin.id) return inactiveAdmin;
      return null;
    };

    adminUserRepository.updateLastLogin = async () => {};
  });

  after(async () => {
    adminUserRepository.findByIdentity = originalFindByIdentity;
    adminUserRepository.findByIdWithRole = originalFindByIdWithRole;
    adminUserRepository.updateLastLogin = originalUpdateLastLogin;
    tokenRevocationStore.setClient(null);
    if (testKnex) {
      await testKnex.destroy();
    }
  });

  beforeEach(async () => {
    authRateLimiterStore.clear();
    if (testKnex) {
      await testKnex('revoked_tokens').truncate();
    }
  });

  it('POST /login: Authenticates valid credentials and issues secure cookies', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        identity: 'superadmin',
        password: testPassword,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.admin.username, 'superadmin');
    assert.equal(res.body.data.admin.role, 'super_admin');
    assert.equal(res.body.data.admin.password_hash, undefined, 'Must not return password_hash');
    assert.equal(res.body.data.admin.password, undefined);

    // Verify Set-Cookie headers
    const cookies = res.headers['set-cookie'] as string[];
    assert.ok(cookies && cookies.length >= 2, 'Must set auth and CSRF cookies');

    const authCookie = cookies.find((c) => c.startsWith(`${env.AUTH_COOKIE_NAME}=`));
    const csrfCookie = cookies.find((c) => c.startsWith(`${env.AUTH_CSRF_COOKIE_NAME}=`));

    assert.ok(authCookie, 'Auth cookie must be set');
    assert.ok(authCookie.includes('HttpOnly'), 'Auth cookie must be HttpOnly');
    assert.ok(authCookie.includes('SameSite=Lax'), 'Auth cookie must specify SameSite=Lax');

    assert.ok(csrfCookie, 'CSRF cookie must be set');
    assert.equal(csrfCookie.includes('HttpOnly'), false, 'CSRF cookie must NOT be HttpOnly');
  });

  it('POST /login: Rejects incorrect password with safe generic error', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        identity: 'superadmin',
        password: 'IncorrectPassword123!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'AUTHENTICATION_FAILED');
    assert.equal(res.body.error.message, 'Invalid credentials.');
  });

  it('POST /login: Rejects non-existent user with identical generic error (enumeration defense)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        identity: 'non_existent_account',
        password: 'ValidFormatPassword123!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'AUTHENTICATION_FAILED');
    assert.equal(res.body.error.message, 'Invalid credentials.');
  });

  it('POST /login: Rejects deactivated admin user with identical generic error', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        identity: 'inactive_op',
        password: testPassword,
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'AUTHENTICATION_FAILED');
    assert.equal(res.body.error.message, 'Invalid credentials.');
  });

  it('POST /login: Triggers rate limiting after 5 consecutive failures', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/admin/auth/login')
        .send({
          identity: 'superadmin',
          password: 'WrongPassword123!',
        });
    }

    const lockedRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        identity: 'superadmin',
        password: testPassword,
      });

    assert.equal(lockedRes.status, 429);
    assert.equal(lockedRes.body.error.code, 'TOO_MANY_REQUESTS');
    assert.ok(lockedRes.headers['retry-after']);
  });

  it('GET /me: Returns authenticated admin profile when auth cookie is present', async () => {
    // 1. Log in to obtain cookies
    const loginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        identity: 'superadmin',
        password: testPassword,
      });

    const cookies = loginRes.headers['set-cookie'];

    // 2. Query /me
    const meRes = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Cookie', cookies);

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.success, true);
    assert.equal(meRes.body.data.admin.username, 'superadmin');
    assert.equal(meRes.body.data.admin.role, 'super_admin');
  });

  it('GET /me: Rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/admin/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'AUTHENTICATION_REQUIRED');
  });

  it('POST /logout: Invalidates session and clears cookies', async () => {
    // 1. Login
    const loginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        identity: 'superadmin',
        password: testPassword,
      });

    const cookies = loginRes.headers['set-cookie'] as string[];
    const csrfCookie = cookies.find((c) => c.startsWith(`${env.AUTH_CSRF_COOKIE_NAME}=`));
    const csrfToken = csrfCookie?.split(';')[0].split('=')[1];

    // 2. Logout with CSRF header
    const logoutRes = await request(app)
      .post('/api/v1/admin/auth/logout')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrfToken || '');

    assert.equal(logoutRes.status, 200);
    assert.equal(logoutRes.body.success, true);

    // 3. Verify subsequent request with old cookies is rejected
    const afterLogoutRes = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Cookie', cookies);

    assert.equal(afterLogoutRes.status, 401, 'Revoked token must be rejected on /me');
  });
});
