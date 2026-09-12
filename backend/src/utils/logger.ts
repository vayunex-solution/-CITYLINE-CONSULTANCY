/**
 * CITYLINE CONSULTANCY — Structured Application Logger
 * Outputs structured JSON logs with correlation ID tracking and sensitive field redaction.
 */

import { env } from '../config/env.config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Sensitive property names to automatically redact from log context/payloads
const REDACTED_KEYS = new Set([
  'password',
  'passwd',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'secret',
  'sessionsecret',
  'apikey',
  'passport',
  'passportnumber',
  'cv',
  'resume',
  'documentcontent',
  'buffer',
  'filebuffer',
]);

function redactSensitive(value: unknown, depth = 0): unknown {
  if (depth > 5 || value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, depth + 1));
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const lowerKey = k.toLowerCase().replace(/[-_]/g, '');
      if (REDACTED_KEYS.has(lowerKey)) {
        sanitized[k] = '[REDACTED]';
      } else {
        sanitized[k] = redactSensitive(v, depth + 1);
      }
    }
    return sanitized;
  }

  return value;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  environment: string;
  requestId?: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private currentLevel: LogLevel;

  constructor() {
    this.currentLevel = env.LOG_LEVEL;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.currentLevel];
  }

  private write(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
    requestId?: string
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      ...(requestId ? { requestId } : {}),
      ...(context ? { context: redactSensitive(context) as Record<string, unknown> } : {}),
      ...(error
        ? {
            error: {
              name: error.name,
              message: error.message,
              ...(env.NODE_ENV !== 'production' ? { stack: error.stack } : {}),
            },
          }
        : {}),
    };

    const serialized = JSON.stringify(entry);
    if (level === 'error') {
      console.error(serialized);
    } else if (level === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }

  public debug(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.write('debug', message, context, undefined, requestId);
  }

  public info(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.write('info', message, context, undefined, requestId);
  }

  public warn(message: string, context?: Record<string, unknown>, requestId?: string): void {
    this.write('warn', message, context, undefined, requestId);
  }

  public error(message: string, error?: Error, context?: Record<string, unknown>, requestId?: string): void {
    this.write('error', message, context, error, requestId);
  }
}

export const logger = new Logger();
