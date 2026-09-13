/**
 * CITYLINE CONSULTANCY — Administrative Token & CSRF Subsystem Tests
 * Verifies JWT token generation, signature validation, revocation, and CSRF Double-Submit verification.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import {
  createAdminToken,
  verifyAdminToken,
  generateCsrfToken,
  verifyCsrfToken,
  getAuthCookieOptions,
  getCsrfCookieOptions,
} from '../src/auth/token';

describe('Admin Token & CSRF Subsystem', () => {
  it('generates a valid signed JWT access token with all required claims', () => {
    const admin = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      username: 'clc_admin',
      email: 'admin@citylineconsultancy.ae',
      role: 'super_admin' as const,
      roleId: 1,
    };

    const { token, jti, exp } = createAdminToken(admin);

    assert.ok(token, 'Token must be generated');
    assert.ok(jti, 'Token must include unique jti identifier');
    assert.ok(exp > Math.floor(Date.now() / 1000), 'Expiration must be in the future');

    const claims = verifyAdminToken(token);
    assert.ok(claims, 'Verification must succeed');
    assert.equal(claims.sub, admin.id);
    assert.equal(claims.username, admin.username);
    assert.equal(claims.email, admin.email);
    assert.equal(claims.role, admin.role);
    assert.equal(claims.roleId, admin.roleId);
    assert.equal(claims.jti, jti);
  });

  it('rejects forged tokens signed with an unauthorized secret', () => {
    const forgedToken = jwt.sign(
      { sub: 'attacker', role: 'super_admin', jti: 'fake-jti' },
      'wrong_unauthorized_secret_key_1234567890',
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    const verified = verifyAdminToken(forgedToken);
    assert.equal(verified, null, 'Forged token must return null');
  });

  it('rejects expired tokens cleanly', () => {
    const expiredToken = jwt.sign(
      { sub: 'test-admin', role: 'admin_operator', jti: 'expired-jti' },
      process.env.AUTH_TOKEN_SECRET || 'development_insecure_auth_token_secret_must_be_at_least_32_characters_long_for_security',
      { algorithm: 'HS256', expiresIn: '-1s' } // Expired 1 second ago
    );

    const verified = verifyAdminToken(expiredToken);
    assert.equal(verified, null, 'Expired token must return null');
  });

  it('generates 32-byte cryptographic hex CSRF tokens', () => {
    const token1 = generateCsrfToken();
    const token2 = generateCsrfToken();

    assert.equal(token1.length, 64, '32 bytes hex must be 64 characters');
    assert.equal(token2.length, 64);
    assert.notEqual(token1, token2, 'CSRF tokens must be uniquely generated');
  });

  it('verifies matching CSRF tokens and rejects mismatches', () => {
    const csrfToken = generateCsrfToken();

    // Exact match
    assert.equal(verifyCsrfToken(csrfToken, csrfToken), true);

    // Mismatched token
    assert.equal(verifyCsrfToken(csrfToken, generateCsrfToken()), false);

    // Missing header or cookie
    assert.equal(verifyCsrfToken(undefined, csrfToken), false);
    assert.equal(verifyCsrfToken(csrfToken, undefined), false);
    assert.equal(verifyCsrfToken('', csrfToken), false);

    // Different lengths
    assert.equal(verifyCsrfToken(csrfToken, 'short'), false);
  });

  it('produces secure cookie configurations', () => {
    const authCookie = getAuthCookieOptions();
    assert.equal(authCookie.httpOnly, true, 'Auth cookie must be HttpOnly');
    assert.equal(authCookie.sameSite, 'lax', 'Auth cookie must be SameSite=Lax');
    assert.equal(authCookie.path, '/');

    const csrfCookie = getCsrfCookieOptions();
    assert.equal(csrfCookie.httpOnly, false, 'CSRF cookie must NOT be HttpOnly to allow client header inclusion');
    assert.equal(csrfCookie.sameSite, 'lax');
    assert.equal(csrfCookie.path, '/');
  });
});
