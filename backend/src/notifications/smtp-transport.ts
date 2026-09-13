/**
 * CITYLINE CONSULTANCY — SMTP Transport Manager
 * Manages Nodemailer pooled connection lifecycle, header injection sanitization,
 * TLS enforcement, timeout controls, and credential redaction.
 *
 * GOVERNANCE:
 * - Uses SMTP submission on port 465 with implicit TLS / secure connection.
 * - Pool-enabled to reuse verified TCP/TLS handshakes across queued batches.
 * - Enforces server-controlled From address (strictly prohibits client-controlled From).
 * - Sanitizes CRLF sequences to block SMTP header injection attacks.
 * - Never prints, logs, or stores SMTP passwords in errors or trace payloads.
 * - Supports mock transport mode for automated test suites and isolated local development.
 */

import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SendMailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

export interface SmtpErrorClassification {
  isTransient: boolean;
  isPermanent: boolean;
  isAuthFailure: boolean;
  isConfigFailure: boolean;
  sanitizedMessage: string;
  code?: string;
  responseCode?: number;
}

export class SmtpTransportManager {
  private transporter: Transporter | null = null;
  private isMockMode: boolean;
  private mockSentMessages: Array<SendMailOptions & { messageId: string; sentAt: Date }> = [];

  constructor() {
    this.isMockMode =
      env.NOTIFICATION_MOCK_TRANSPORT ||
      env.NODE_ENV === 'test' ||
      !env.SMTP_HOST ||
      !(env.SMTP_PASSWORD || env.SMTP_PASS);
  }

  /**
   * Enables or disables mock transport mode (useful for unit testing).
   */
  public setMockMode(enabled: boolean): void {
    this.isMockMode = enabled;
    if (this.transporter) {
      try {
        this.transporter.close();
      } catch {
        // ignore close errors
      }
      this.transporter = null;
    }
  }

  /**
   * Returns recorded mock emails (for assertions in test suites).
   */
  public getMockSentMessages(): Array<SendMailOptions & { messageId: string; sentAt: Date }> {
    return [...this.mockSentMessages];
  }

  /**
   * Clears recorded mock emails.
   */
  public clearMockMessages(): void {
    this.mockSentMessages = [];
  }

  /**
   * Retrieves or lazily creates the singleton pooled Nodemailer transporter.
   */
  public getTransporter(): Transporter {
    if (!this.transporter) {
      if (this.isMockMode) {
        // Create an in-memory JSON/stream transporter for safe testing
        this.transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
      } else {
        const smtpPassword = env.SMTP_PASSWORD || env.SMTP_PASS || '';

        this.transporter = nodemailer.createTransport({
          pool: env.SMTP_POOL,
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE, // true for 465 implicit TLS
          auth: {
            user: env.SMTP_USER,
            pass: smtpPassword,
          },
          maxConnections: env.SMTP_MAX_CONNECTIONS,
          maxMessages: env.SMTP_MAX_MESSAGES,
          connectionTimeout: env.SMTP_CONNECTION_TIMEOUT_MS,
          greetingTimeout: env.SMTP_GREETING_TIMEOUT_MS,
          socketTimeout: env.SMTP_SOCKET_TIMEOUT_MS,
          tls: {
            rejectUnauthorized: true, // STRICT: TLS certificate validation is never disabled
            minVersion: 'TLSv1.2',
          },
        });
      }
    }
    return this.transporter;
  }

  /**
   * Validates and cleanses email header inputs against CRLF header injection.
   */
  public sanitizeHeader(input: string): string {
    return input.replace(/[\r\n]/g, ' ').trim();
  }

  /**
   * Validates email address format server-side.
   */
  public isValidEmail(email: string): boolean {
    if (!email || email.length > 254) return false;
    // Standard RFC-5322 compliant practical regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(email);
  }

  /**
   * Dispatches a transactional email through the transport pool.
   *
   * SECURITY CHECKS:
   * 1. Validates recipient email syntax.
   * 2. Sanitizes subject to block CRLF header injection.
   * 3. Server-enforces the authenticated 'From' address.
   * 4. Strips any password/credential strings from returned or thrown errors.
   */
  public async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    const sanitizedTo = this.sanitizeHeader(options.to);
    if (!this.isValidEmail(sanitizedTo)) {
      throw new Error(`Invalid recipient email address format: [REDACTED_FORMAT]`);
    }

    const sanitizedSubject = this.sanitizeHeader(options.subject);
    const fromAddress = env.SMTP_FROM; // Server-controlled From address

    if (this.isMockMode) {
      const messageId = `<mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@citylineconsultancy.com>`;
      this.mockSentMessages.push({
        to: sanitizedTo,
        subject: sanitizedSubject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        messageId,
        sentAt: new Date(),
      });

      return {
        messageId,
        accepted: [sanitizedTo],
        rejected: [],
      };
    }

    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: fromAddress,
        to: sanitizedTo,
        subject: sanitizedSubject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo ? this.sanitizeHeader(options.replyTo) : undefined,
      });

      return {
        messageId: info.messageId || 'unknown',
        accepted: (info.accepted as string[]) || [sanitizedTo],
        rejected: (info.rejected as string[]) || [],
      };
    } catch (err: unknown) {
      const classified = this.classifyError(err);
      const errorToThrow = new Error(classified.sanitizedMessage);
      (errorToThrow as unknown as { isTransient: boolean; isPermanent: boolean }).isTransient = classified.isTransient;
      (errorToThrow as unknown as { isTransient: boolean; isPermanent: boolean }).isPermanent = classified.isPermanent;
      throw errorToThrow;
    }
  }

  /**
   * Classifies an SMTP error into transient vs permanent and redacts credentials.
   */
  public classifyError(err: unknown): SmtpErrorClassification {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const smtpPass =
      process.env.SMTP_PASSWORD ||
      process.env.SMTP_PASS ||
      env.SMTP_PASSWORD ||
      env.SMTP_PASS;

    // Redact password if it appears anywhere in error message
    let sanitized = rawMsg;
    if (smtpPass && smtpPass.length > 0) {
      sanitized = sanitized.split(smtpPass).join('[REDACTED_SECRET]');
    }

    // Redact password patterns such as "password <secret>" or "password: <secret>"
    sanitized = sanitized.replace(/(password|passwd|secret)[=:\s]+([^\s,;)]+)/gi, '$1 [REDACTED_SECRET]');

    // Capture response code or error code if present
    const errObj = err as Record<string, unknown> | undefined;
    const code = typeof errObj?.code === 'string' ? errObj.code : undefined;
    const responseCode =
      typeof errObj?.responseCode === 'number'
        ? errObj.responseCode
        : typeof errObj?.response === 'string'
        ? parseInt(errObj.response.slice(0, 3), 10) || undefined
        : undefined;

    const isAuthFailure =
      code === 'EAUTH' ||
      responseCode === 535 ||
      sanitized.toLowerCase().includes('authentication failed') ||
      sanitized.toLowerCase().includes('invalid login') ||
      sanitized.toLowerCase().includes('bad credentials') ||
      sanitized.toLowerCase().includes('username and password not accepted');

    const isConfigFailure =
      sanitized.toLowerCase().includes('missing smtp') ||
      sanitized.toLowerCase().includes('configuration') ||
      code === 'ECONFIG';

    // Permanent errors (immediate exhaustion, do not consume retry loops):
    // - SMTP authentication / credentials rejection (e.g. 535 / EAUTH)
    // - Missing or invalid configuration (ECONFIG)
    // - Permanent 5xx SMTP rejection (e.g. 550 User unknown, 553 Mailbox invalid)
    // - Invalid recipient syntax / envelope failure (EENVELOPE)
    // - Recipient syntax error
    const isPermanent =
      isAuthFailure ||
      isConfigFailure ||
      (responseCode !== undefined && responseCode >= 500 && responseCode < 600) ||
      code === 'EENVELOPE' ||
      sanitized.includes('Invalid recipient email') ||
      sanitized.includes('syntax error');

    // Transient errors (retry with exponential backoff):
    // - 4xx SMTP response (e.g. 421 Service not available, 450 Mailbox busy)
    // - Connection timeouts, greeting timeouts, socket timeouts
    // - Network resets, connection refused, DNS temporary lookup failure
    const isTransient =
      !isPermanent &&
      ((responseCode !== undefined && responseCode >= 400 && responseCode < 500) ||
        code === 'ETIMEDOUT' ||
        code === 'ECONNRESET' ||
        code === 'ECONNREFUSED' ||
        code === 'ENOTFOUND' ||
        code === 'EAI_AGAIN' ||
        code === 'ESOCKETTIMEDOUT' ||
        sanitized.toLowerCase().includes('timeout') ||
        sanitized.toLowerCase().includes('connection') ||
        sanitized.toLowerCase().includes('greeting'));

    return {
      isTransient,
      isPermanent,
      isAuthFailure,
      isConfigFailure,
      sanitizedMessage: sanitized,
      code,
      responseCode,
    };
  }

  /**
   * Verifies transport connectivity and credentials against the configured host.
   */
  public async verifyConnection(): Promise<{ success: boolean; message: string }> {
    if (this.isMockMode) {
      return { success: true, message: 'Mock SMTP transport active' };
    }

    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      return { success: true, message: 'SMTP connection verified successfully' };
    } catch (err: unknown) {
      const classified = this.classifyError(err);
      return { success: false, message: classified.sanitizedMessage };
    }
  }

  /**
   * Gracefully destroys pooled connections on application or worker shutdown.
   */
  public close(): void {
    if (this.transporter) {
      try {
        this.transporter.close();
        logger.info('SMTP transport connection pool closed');
      } catch (err: unknown) {
        logger.warn('Error closing SMTP transport pool', {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        this.transporter = null;
      }
    }
  }
}

export const smtpTransportManager = new SmtpTransportManager();
