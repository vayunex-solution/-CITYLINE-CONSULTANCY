/**
 * CITYLINE CONSULTANCY — Administrative Password Security Tests
 * Verifies Argon2id configuration, password policy enforcement, and timing-safe dummy evaluation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  verifyDummyPassword,
  validatePasswordPolicy,
  PASSWORD_POLICY,
  ARGON2_CONFIG,
} from '../src/auth/password';

describe('Password Security & Argon2id Hashing', () => {
  it('enforces OWASP-compliant Argon2id parameters', () => {
    assert.equal(ARGON2_CONFIG.type, 2); // argon2id enum value
    assert.equal(ARGON2_CONFIG.memoryCost, 19456); // 19 MB
    assert.equal(ARGON2_CONFIG.timeCost, 2); // 2 iterations
    assert.equal(ARGON2_CONFIG.parallelism, 1); // 1 lane
  });

  it('hashes valid passwords with Argon2id and unique cryptographic salts', async () => {
    const password = 'CorrectHorseBatteryStaple123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    assert.ok(hash1.startsWith('$argon2id$'), 'Hash must start with $argon2id$');
    assert.ok(hash2.startsWith('$argon2id$'), 'Hash must start with $argon2id$');
    assert.notEqual(hash1, hash2, 'Salts must be unique across repeated hash operations');
  });

  it('verifies correct passwords successfully', async () => {
    const password = 'SuperSecureAdminPassword2026!';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    assert.equal(isValid, true, 'Correct password must verify successfully');
  });

  it('rejects incorrect passwords safely', async () => {
    const password = 'SuperSecureAdminPassword2026!';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword('WrongPassword123!', hash);
    assert.equal(isValid, false, 'Incorrect password must be rejected');
  });

  it('executes dummy password verification without errors for timing attack defense', async () => {
    const result = await verifyDummyPassword('attempted_probe_password');
    assert.equal(result, false, 'Dummy verification must always resolve to false');
  });

  it('enforces password length and composition policy', () => {
    // Rejects too short (< 10 chars)
    const shortResult = validatePasswordPolicy('Short1!');
    assert.equal(shortResult.valid, false);
    assert.ok(shortResult.message?.includes(String(PASSWORD_POLICY.MIN_LENGTH)));

    // Rejects too long (> 128 chars)
    const longPassword = 'a'.repeat(129);
    const longResult = validatePasswordPolicy(longPassword);
    assert.equal(longResult.valid, false);
    assert.ok(longResult.message?.includes(String(PASSWORD_POLICY.MAX_LENGTH)));

    // Rejects whitespace-only
    const whitespaceResult = validatePasswordPolicy('          ');
    assert.equal(whitespaceResult.valid, false);

    // Rejects non-string
    const nonStringResult = validatePasswordPolicy(12345678901);
    assert.equal(nonStringResult.valid, false);

    // Accepts valid strong passphrase
    const validResult = validatePasswordPolicy('ValidAdminPassphrase2026!');
    assert.equal(validResult.valid, true);
  });

  it('rejects hashing when password violates policy', async () => {
    await assert.rejects(
      async () => {
        await hashPassword('short');
      },
      /Password must be at least/
    );
  });
});
