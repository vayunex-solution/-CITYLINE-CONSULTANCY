/**
 * CITYLINE CONSULTANCY — Administrative Security Configuration Tests
 * Verifies production fail-fast rules for AUTH_TOKEN_SECRET and auth variables.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateEnvConfig } from '../src/config/env.config';

describe('Admin Security Configuration & Secret Hardening', () => {
  const baseValidDevEnv = {
    NODE_ENV: 'development',
    PORT: '5000',
    DB_HOST: '127.0.0.1',
    DB_NAME: 'clc_db',
    DB_USER: 'clc_user',
  };

  it('permits default development auth secret in development environment', () => {
    const result = validateEnvConfig(baseValidDevEnv);
    assert.equal(result.success, true);
    assert.ok(result.data?.AUTH_TOKEN_SECRET);
  });

  it('fails fast in production mode if AUTH_TOKEN_SECRET is missing or empty', () => {
    const prodEnv = {
      ...baseValidDevEnv,
      NODE_ENV: 'production',
      DB_PASSWORD: 'ValidProductionDbPassword2026!',
      CORS_ORIGIN: 'https://admin.citylineconsultancy.ae',
      AUTH_TOKEN_SECRET: '',
    };

    const result = validateEnvConfig(prodEnv);
    assert.equal(result.success, false);
    assert.ok(result.errors?.some((e) => e.includes('AUTH_TOKEN_SECRET')));
  });

  it('fails fast in production mode if AUTH_TOKEN_SECRET is shorter than 32 characters', () => {
    const prodEnv = {
      ...baseValidDevEnv,
      NODE_ENV: 'production',
      DB_PASSWORD: 'ValidProductionDbPassword2026!',
      CORS_ORIGIN: 'https://admin.citylineconsultancy.ae',
      AUTH_TOKEN_SECRET: 'short_secret_under_32_chars',
    };

    const result = validateEnvConfig(prodEnv);
    assert.equal(result.success, false);
    assert.ok(result.errors?.some((e) => e.includes('AUTH_TOKEN_SECRET: Required in production and must be at least 32 characters long')));
  });

  it('fails fast in production mode if AUTH_TOKEN_SECRET contains default or placeholder string', () => {
    const prodEnv = {
      ...baseValidDevEnv,
      NODE_ENV: 'production',
      DB_PASSWORD: 'ValidProductionDbPassword2026!',
      CORS_ORIGIN: 'https://admin.citylineconsultancy.ae',
      AUTH_TOKEN_SECRET: 'development_insecure_auth_token_secret_must_be_at_least_32_characters_long_for_security',
    };

    const result = validateEnvConfig(prodEnv);
    assert.equal(result.success, false);
    assert.ok(result.errors?.some((e) => e.includes('AUTH_TOKEN_SECRET: Insecure default or placeholder secret detected in production')));
  });

  it('succeeds in production mode with a high-entropy 32+ character secret', () => {
    const prodEnv = {
      ...baseValidDevEnv,
      NODE_ENV: 'production',
      DB_PASSWORD: 'ValidProductionDbPassword2026!',
      CORS_ORIGIN: 'https://admin.citylineconsultancy.ae',
      AUTH_TOKEN_SECRET: 'e4b2d56a7981f3490cb8d4e721a35bf8e4b2d56a7981f3490cb8d4e721a35bf8',
    };

    const result = validateEnvConfig(prodEnv);
    assert.equal(result.success, true);
  });
});
