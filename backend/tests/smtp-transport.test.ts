/**
 * CITYLINE CONSULTANCY — SMTP Transport & Security Verification Suite
 * Verifies SMTP configuration validation, transport pooling, header injection defense,
 * error classification, and credential leakage protection.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { validateEnvConfig } from '../src/config/env.config';
import { SmtpTransportManager } from '../src/notifications/smtp-transport';

describe('SMTP Transport & Security Architecture', () => {
  let transportManager: SmtpTransportManager;

  beforeEach(() => {
    transportManager = new SmtpTransportManager();
    transportManager.setMockMode(true);
    transportManager.clearMockMessages();
  });

  describe('Configuration Validation', () => {
    it('validates default development SMTP configuration successfully', () => {
      const result = validateEnvConfig({
        NODE_ENV: 'development',
        PORT: '5000',
        DB_HOST: '127.0.0.1',
        DB_NAME: 'clc_db',
        DB_USER: 'clc_user',
        SMTP_HOST: 'mail.citylineconsultancy.com',
        SMTP_PORT: '465',
        SMTP_USER: 'no-reply@citylineconsultancy.com',
        SMTP_FROM: 'Cityline Consultancy <no-reply@citylineconsultancy.com>',
        SMTP_SECURE: 'true',
        NOTIFICATION_ADMIN_EMAIL: 'info@citylineconsultancy.com',
      });

      assert.equal(result.success, true);
      assert.ok(result.data);
      assert.equal(result.data.SMTP_HOST, 'mail.citylineconsultancy.com');
      assert.equal(result.data.SMTP_PORT, 465);
      assert.equal(result.data.SMTP_SECURE, true);
      assert.equal(result.data.NOTIFICATION_ADMIN_EMAIL, 'info@citylineconsultancy.com');
    });

    it('fails fast in production mode when SMTP credentials or host are missing', () => {
      const result = validateEnvConfig({
        NODE_ENV: 'production',
        PORT: '5000',
        DB_HOST: '127.0.0.1',
        DB_NAME: 'clc_db',
        DB_USER: 'clc_user',
        DB_PASSWORD: 'ValidProductionDbPassword2026!',
        CORS_ORIGIN: 'https://admin.citylineconsultancy.ae',
        AUTH_TOKEN_SECRET: 'e4b2d56a7981f3490cb8d4e721a35bf8e4b2d56a7981f3490cb8d4e721a35bf8',
        SMTP_HOST: 'mail.citylineconsultancy.com',
        SMTP_USER: 'no-reply@citylineconsultancy.com',
        SMTP_PASSWORD: '', // Missing password in production
        NOTIFICATION_MOCK_TRANSPORT: 'false',
      });

      assert.equal(result.success, false);
      assert.ok(result.errors);
      assert.ok(result.errors.some((e) => e.includes('SMTP_PASSWORD: Required in production mode')));
    });

    it('fails fast in production mode when NOTIFICATION_ADMIN_EMAIL is missing', () => {
      const result = validateEnvConfig({
        NODE_ENV: 'production',
        PORT: '5000',
        DB_HOST: '127.0.0.1',
        DB_NAME: 'clc_db',
        DB_USER: 'clc_user',
        DB_PASSWORD: 'ValidProductionDbPassword2026!',
        CORS_ORIGIN: 'https://admin.citylineconsultancy.ae',
        AUTH_TOKEN_SECRET: 'e4b2d56a7981f3490cb8d4e721a35bf8e4b2d56a7981f3490cb8d4e721a35bf8',
        SMTP_HOST: 'mail.citylineconsultancy.com',
        SMTP_USER: 'no-reply@citylineconsultancy.com',
        SMTP_PASSWORD: 'ValidProductionSmtpPassword123!',
        NOTIFICATION_ADMIN_EMAIL: '', // Missing admin email in production
        NOTIFICATION_MOCK_TRANSPORT: 'false',
      });

      assert.equal(result.success, false);
      assert.ok(result.errors);
      assert.ok(result.errors.some((e) => e.includes('NOTIFICATION_ADMIN_EMAIL: Required in production mode')));
    });

    it('fails fast in production mode when NOTIFICATION_ADMIN_EMAIL uses unmonitored no-reply sender address', () => {
      const result = validateEnvConfig({
        NODE_ENV: 'production',
        PORT: '5000',
        DB_HOST: '127.0.0.1',
        DB_NAME: 'clc_db',
        DB_USER: 'clc_user',
        DB_PASSWORD: 'ValidProductionDbPassword2026!',
        CORS_ORIGIN: 'https://admin.citylineconsultancy.ae',
        AUTH_TOKEN_SECRET: 'e4b2d56a7981f3490cb8d4e721a35bf8e4b2d56a7981f3490cb8d4e721a35bf8',
        SMTP_HOST: 'mail.citylineconsultancy.com',
        SMTP_USER: 'no-reply@citylineconsultancy.com',
        SMTP_PASSWORD: 'ValidProductionSmtpPassword123!',
        NOTIFICATION_ADMIN_EMAIL: 'no-reply@citylineconsultancy.com', // Prohibited in production
        NOTIFICATION_MOCK_TRANSPORT: 'false',
      });

      assert.equal(result.success, false);
      assert.ok(result.errors);
      assert.ok(result.errors.some((e) => e.includes('Cannot use unmonitored sender')));
    });

    it('fails when NOTIFICATION_ADMIN_EMAIL is malformed', () => {
      const result = validateEnvConfig({
        NODE_ENV: 'development',
        NOTIFICATION_ADMIN_EMAIL: 'not-an-email-address',
      });

      assert.equal(result.success, false);
      assert.ok(result.errors);
      assert.ok(result.errors.some((e) => e.includes('NOTIFICATION_ADMIN_EMAIL')));
    });

    it('never prints or leaks SMTP passwords in validation error messages', () => {
      const testSecret = 'SuperSecretSmtpPass1234!';
      const result = validateEnvConfig({
        NODE_ENV: 'production',
        SMTP_HOST: '', // causes error
        SMTP_PASSWORD: testSecret,
        NOTIFICATION_MOCK_TRANSPORT: 'false',
      });

      assert.equal(result.success, false);
      const joined = (result.errors || []).join(' ');
      assert.equal(joined.includes(testSecret), false);
    });
  });

  describe('Transport Execution & Security Defenses', () => {
    it('successfully dispatches email in mock mode and records payload', async () => {
      const sendResult = await transportManager.sendMail({
        to: 'applicant@example.com',
        subject: 'Visa Enquiry Acknowledged',
        html: '<p>Thank you for your enquiry.</p>',
        text: 'Thank you for your enquiry.',
      });

      assert.ok(sendResult.messageId);
      assert.deepEqual(sendResult.accepted, ['applicant@example.com']);
      assert.equal(sendResult.rejected.length, 0);

      const recorded = transportManager.getMockSentMessages();
      assert.equal(recorded.length, 1);
      assert.equal(recorded[0].to, 'applicant@example.com');
      assert.equal(recorded[0].subject, 'Visa Enquiry Acknowledged');
    });

    it('sanitizes and strips CRLF sequences from subject and recipient to block header injection', async () => {
      await transportManager.sendMail({
        to: 'clean.recipient@example.com\r\n',
        subject: 'Safe Subject\r\nContent-Type: text/html\r\n\r\nMalicious Injection',
        html: '<p>Body</p>',
        text: 'Body',
      });

      const recorded = transportManager.getMockSentMessages();
      assert.equal(recorded.length, 1);
      assert.equal(recorded[0].to, 'clean.recipient@example.com');
      assert.equal(
        recorded[0].subject,
        'Safe Subject  Content-Type: text/html    Malicious Injection'
      );
      assert.equal(recorded[0].subject.includes('\r'), false);
      assert.equal(recorded[0].subject.includes('\n'), false);
    });

    it('blocks and rejects arbitrary recipient injection attempts via CRLF in to field', async () => {
      await assert.rejects(
        async () => {
          await transportManager.sendMail({
            to: 'victim@example.com\r\nBcc: attacker@example.com',
            subject: 'Test',
            html: '<p>Body</p>',
            text: 'Body',
          });
        },
        {
          name: 'Error',
          message: /Invalid recipient email address format/,
        }
      );
    });

    it('rejects completely malformed recipient email addresses', async () => {
      await assert.rejects(
        async () => {
          await transportManager.sendMail({
            to: 'invalid-email-address',
            subject: 'Subject',
            html: '<p>Body</p>',
            text: 'Body',
          });
        },
        {
          name: 'Error',
          message: /Invalid recipient email address format/,
        }
      );
    });

    it('classifies SMTP 5xx and syntax errors as permanent (non-retryable)', () => {
      const permError550 = {
        message: '550 User mailbox not found',
        responseCode: 550,
      };
      const classification550 = transportManager.classifyError(permError550);
      assert.equal(classification550.isPermanent, true);
      assert.equal(classification550.isTransient, false);

      const permErrorSyntax = new Error('Invalid recipient email syntax error');
      const classificationSyntax = transportManager.classifyError(permErrorSyntax);
      assert.equal(classificationSyntax.isPermanent, true);
      assert.equal(classificationSyntax.isTransient, false);
    });

    it('classifies SMTP authentication failures (535 / EAUTH) as permanent non-retryable configuration errors', () => {
      const authErrorEAUTH = {
        message: 'Invalid login: 535 Incorrect authentication data',
        code: 'EAUTH',
        responseCode: 535,
      };
      const classification = transportManager.classifyError(authErrorEAUTH);
      assert.equal(classification.isPermanent, true);
      assert.equal(classification.isTransient, false);
      assert.equal(classification.isAuthFailure, true);
    });

    it('classifies missing or invalid SMTP configuration as a permanent operational failure', () => {
      const configError = {
        message: 'Missing SMTP credentials or invalid host configuration',
        code: 'ECONFIG',
      };
      const classification = transportManager.classifyError(configError);
      assert.equal(classification.isPermanent, true);
      assert.equal(classification.isTransient, false);
      assert.equal(classification.isConfigFailure, true);
    });

    it('classifies SMTP timeouts, connection refusals, and 4xx as transient (retryable)', () => {
      const timeoutError = {
        message: 'Connection timeout after 10000ms',
        code: 'ETIMEDOUT',
      };
      const classTimeout = transportManager.classifyError(timeoutError);
      assert.equal(classTimeout.isTransient, true);
      assert.equal(classTimeout.isPermanent, false);

      const error421 = {
        message: '421 Service temporarily unavailable, closing transmission channel',
        responseCode: 421,
      };
      const class421 = transportManager.classifyError(error421);
      assert.equal(class421.isTransient, true);
      assert.equal(class421.isPermanent, false);
    });

    it('sanitizes and redacts passwords if they appear in an SMTP error message', () => {
      process.env.SMTP_PASSWORD = 'TopSecretPassword987';
      const errorWithPassword = new Error(
        'Authentication failed for user no-reply with password TopSecretPassword987 at mail.citylineconsultancy.com'
      );

      const classified = transportManager.classifyError(errorWithPassword);
      assert.equal(classified.sanitizedMessage.includes('TopSecretPassword987'), false);
      assert.ok(classified.sanitizedMessage.includes('[REDACTED_SECRET]'));
      delete process.env.SMTP_PASSWORD;
    });

    it('gracefully closes transport connection pool on shutdown without crashing', () => {
      assert.doesNotThrow(() => {
        transportManager.close();
      });
    });
  });
});
