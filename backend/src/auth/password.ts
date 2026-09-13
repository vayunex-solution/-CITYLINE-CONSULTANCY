/**
 * CITYLINE CONSULTANCY — Administrative Password Security Service
 * Implements Argon2id password hashing, verification, timing-safe dummy evaluation,
 * and password policy enforcement.
 *
 * GOVERNANCE:
 * - Algorithm: Argon2id (OWASP recommended for server-side password hashing).
 * - Parameters: m=19456 KiB (19 MB), t=2 iterations, p=1 thread.
 * - Password values are NEVER logged, trimmed, or lowercased.
 * - Dummy hash verification mitigates user enumeration timing attacks.
 */

import argon2 from 'argon2';

/**
 * Standard OWASP-recommended Argon2id parameters for interactive logins.
 */
export const ARGON2_CONFIG: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MB
  timeCost: 2,       // 2 passes
  parallelism: 1,    // 1 lane
};

/**
 * Minimum and maximum password length constraints.
 * Admin accounts enforce a minimum of 10 characters to defend against brute force.
 * Maximum of 128 characters prevents algorithmic denial-of-service on hashing engines.
 */
export const PASSWORD_POLICY = {
  MIN_LENGTH: 10,
  MAX_LENGTH: 128,
};

/**
 * Pre-computed valid Argon2id dummy hash for timing-attack mitigation.
 * When an unknown account attempts login, we verify against this dummy hash
 * so that response time is indistinguishable from a valid user lookup.
 */
let dummyHashPromise: Promise<string> | null = null;

async function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = argon2.hash('__clc_timing_safe_dummy_password_constant__', {
      ...ARGON2_CONFIG,
      raw: false,
    });
  }
  return await dummyHashPromise;
}

// Trigger background pre-computation at startup
void getDummyHash();

/**
 * Validates whether a candidate password conforms to the admin password policy.
 * Note: Does NOT modify, trim, or lowercase the input password.
 */
export function validatePasswordPolicy(password: unknown): { valid: boolean; message?: string } {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password must be a string.' };
  }

  if (password.length < PASSWORD_POLICY.MIN_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters long.`,
    };
  }

  if (password.length > PASSWORD_POLICY.MAX_LENGTH) {
    return {
      valid: false,
      message: `Password cannot exceed ${PASSWORD_POLICY.MAX_LENGTH} characters.`,
    };
  }

  if (password.trim().length === 0) {
    return { valid: false, message: 'Password cannot consist solely of whitespace.' };
  }

  return { valid: true };
}

/**
 * Hashes a plaintext password using Argon2id with a unique cryptographic salt.
 */
export async function hashPassword(password: string): Promise<string> {
  const policyCheck = validatePasswordPolicy(password);
  if (!policyCheck.valid) {
    throw new Error(policyCheck.message || 'Password fails policy validation.');
  }

  return argon2.hash(password, { ...ARGON2_CONFIG, raw: false });
}

/**
 * Verifies a plaintext password against a stored Argon2id hash using constant-time comparison.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    return await argon2.verify(hash, password);
  } catch {
    // Malformed hash or driver failure returns false safely
    return false;
  }
}

/**
 * Executes an Argon2id verification against the dummy constant hash.
 * Used during failed account lookups to ensure the computational time
 * matches that of an existing account verification.
 */
export async function verifyDummyPassword(password: string): Promise<boolean> {
  try {
    const dummy = await getDummyHash();
    await argon2.verify(dummy, password || 'dummy_attempt');
  } catch {
    // Ignore verification errors
  }
  return false;
}
