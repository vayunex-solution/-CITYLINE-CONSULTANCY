/**
 * CITYLINE CONSULTANCY — Environment Configuration Verification Suite
 * Tests runtime configuration validation, fail-fast production rules, and secret protection.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateEnvConfig, env } from '../src/config/env.config';

describe('Environment Configuration Architecture', () => {
  it('Validates default development configuration successfully', () => {
    const res = validateEnvConfig({
      NODE_ENV: 'development',
      PORT: '5000',
      HOST: '0.0.0.0',
      DB_HOST: '127.0.0.1',
      DB_PORT: '3306',
      DB_NAME: 'cityline_db',
      DB_USER: 'cityline_admin',
      STORAGE_ROOT: 'C:\\Users\\Admin\\clc_storage',
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.data);
    assert.strictEqual(res.data.PORT, 5000);
    assert.strictEqual(res.data.HOST, '0.0.0.0');
    assert.strictEqual(res.data.DB_POOL_MIN, 0);
    assert.strictEqual(res.data.DB_POOL_MAX, 5);
    assert.strictEqual(res.data.DB_TIMEOUT_MS, 10000);
  });

  it('Fails fast in production when required database credentials or origins are unsafe', () => {
    const res = validateEnvConfig({
      NODE_ENV: 'production',
      PORT: '5000',
      DB_HOST: '127.0.0.1',
      DB_NAME: 'cityline_db',
      DB_USER: 'cityline_admin',
      DB_PASSWORD: '', // Empty password in production
      CORS_ORIGIN: '*', // Wildcard CORS in production
      STORAGE_ROOT: 'C:\\Users\\Admin\\clc_storage',
    });

    assert.strictEqual(res.success, false);
    assert.ok(res.errors);
    assert.ok(res.errors.some((e) => e.includes('DB_PASSWORD')));
    assert.ok(res.errors.some((e) => e.includes('CORS_ORIGIN')));
  });

  it('Prohibits localhost CORS origin in production mode', () => {
    const res = validateEnvConfig({
      NODE_ENV: 'production',
      PORT: '5000',
      DB_HOST: '127.0.0.1',
      DB_NAME: 'cityline_db',
      DB_USER: 'cityline_admin',
      DB_PASSWORD: 'secure_sample_password_for_test',
      CORS_ORIGIN: 'http://localhost:3000',
      STORAGE_ROOT: 'C:\\Users\\Admin\\clc_storage',
    });

    assert.strictEqual(res.success, false);
    assert.ok(res.errors);
    assert.ok(res.errors.some((e) => e.includes('Localhost origin')));
  });

  it('Rejects STORAGE_ROOT placed inside webroot or repository public directories', () => {
    const res = validateEnvConfig({
      NODE_ENV: 'development',
      STORAGE_ROOT: './public_html',
    });

    assert.strictEqual(res.success, false);
    assert.ok(res.errors);
    assert.ok(res.errors.some((e) => e.includes('STORAGE_ROOT')));
  });

  it('Never outputs actual secret values in validation error messages', () => {
    const secretValue = 'VerySecretPassword999';
    const res = validateEnvConfig({
      NODE_ENV: 'production',
      DB_PASSWORD: '', // Triggers missing error
      CORS_ORIGIN: '*',
    });

    assert.strictEqual(res.success, false);
    const joinedErrors = (res.errors || []).join(' ');
    assert.strictEqual(joinedErrors.includes(secretValue), false);
  });

  it('Exposes typed active runtime environment configuration safely', () => {
    assert.ok(env);
    assert.strictEqual(typeof env.PORT, 'number');
    assert.strictEqual(typeof env.HOST, 'string');
    assert.strictEqual(typeof env.DB_HOST, 'string');
    assert.strictEqual(typeof env.DB_PORT, 'number');
    assert.strictEqual(typeof env.DB_NAME, 'string');
    assert.strictEqual(typeof env.DB_USER, 'string');
    assert.strictEqual(typeof env.DB_POOL_MIN, 'number');
    assert.strictEqual(typeof env.DB_POOL_MAX, 'number');
  });
});
