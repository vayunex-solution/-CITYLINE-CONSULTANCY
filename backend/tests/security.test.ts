/**
 * CITYLINE CONSULTANCY — Security Baseline & Data Redaction Test Suite
 * Validates information disclosure defense, stack trace suppression, and log redaction.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';
import { errorHandlerMiddleware } from '../src/middleware/error-handler.middleware';
import { logger } from '../src/utils/logger';

describe('Security Baseline & Information Leakage Defense', () => {
  it('Production error responses strictly suppress stack traces and internal paths', async () => {
    // Create an isolated test express app configured with errorHandlerMiddleware
    const testApp = express();
    testApp.get('/trigger-error', (_req, _res, next) => {
      next(new Error('Internal unexpected processing failure on line 42 of secret-file.ts'));
    });
    testApp.use(errorHandlerMiddleware);

    const res = await request(testApp).get('/trigger-error');

    assert.strictEqual(res.status, 500);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'INTERNAL_SERVER_ERROR');

    // Verify no stack trace or internal filesystem path is returned
    assert.strictEqual(res.body.error.stack, undefined);
    assert.strictEqual(res.body.error.details, undefined);
    assert.strictEqual(res.body.error.name, undefined);
  });

  it('Error responses never leak raw SQL commands, tables, or database credentials', async () => {
    const testApp = express();
    testApp.get('/trigger-sql-error', (_req, _res, next) => {
      const sqlError = new Error("SELECT * FROM admin_users WHERE password_hash = 'secret'") as Error & {
        code: string;
        errno: number;
        sql: string;
      };
      sqlError.code = 'ER_SYNTAX_ERROR';
      sqlError.errno = 1064;
      sqlError.sql = "SELECT * FROM admin_users WHERE password_hash = 'secret'";
      next(sqlError);
    });
    testApp.use(errorHandlerMiddleware);

    const res = await request(testApp).get('/trigger-sql-error');

    assert.strictEqual(res.body.success, false);
    const bodyString = JSON.stringify(res.body);

    assert.strictEqual(bodyString.includes('password_hash'), false);
    assert.strictEqual(bodyString.includes('admin_users'), false);
    assert.strictEqual(bodyString.includes('secret'), false);
    assert.strictEqual(bodyString.includes('SELECT *'), false);
  });

  it('Structured application logger automatically redacts sensitive property keys', () => {
    // Intercept console.log / console.warn to verify redaction
    const loggedOutputs: string[] = [];
    const originalLog = console.log;
    const originalWarn = console.warn;

    console.log = (msg: string) => loggedOutputs.push(msg);
    console.warn = (msg: string) => loggedOutputs.push(msg);

    try {
      logger.info('User action test', {
        username: 'operator_john',
        password: 'TopSecretPassword123!',
        token: 'bearer_token_abc_xyz',
        authorization: 'Bearer secret_token',
        cookie: 'session_id=abcdefg',
        cv: 'binary_file_contents_buffer',
        passportNumber: 'N12345678',
        nestedData: {
          apiKey: 'pk_live_12345',
          safeField: 'harmless_metadata',
        },
      });

      assert.ok(loggedOutputs.length > 0, 'Logger must produce output');
      const output = loggedOutputs[loggedOutputs.length - 1];
      const parsed = JSON.parse(output);

      assert.strictEqual(parsed.context.username, 'operator_john');
      assert.strictEqual(parsed.context.password, '[REDACTED]');
      assert.strictEqual(parsed.context.token, '[REDACTED]');
      assert.strictEqual(parsed.context.authorization, '[REDACTED]');
      assert.strictEqual(parsed.context.cookie, '[REDACTED]');
      assert.strictEqual(parsed.context.cv, '[REDACTED]');
      assert.strictEqual(parsed.context.passportNumber, '[REDACTED]');
      assert.strictEqual(parsed.context.nestedData.apiKey, '[REDACTED]');
      assert.strictEqual(parsed.context.nestedData.safeField, 'harmless_metadata');

      // Verify raw secrets never exist in the serialized string
      assert.strictEqual(output.includes('TopSecretPassword123!'), false);
      assert.strictEqual(output.includes('bearer_token_abc_xyz'), false);
      assert.strictEqual(output.includes('pk_live_12345'), false);
    } finally {
      console.log = originalLog;
      console.warn = originalWarn;
    }
  });
});
