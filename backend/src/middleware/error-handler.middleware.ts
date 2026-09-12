/**
 * CITYLINE CONSULTANCY — Centralized Error Handling Middleware
 * Intercepts all application exceptions, formats uniform error responses,
 * normalizes database and payload errors, and strictly suppresses sensitive details in production.
 *
 * CRITICAL SECURITY GUARANTEES:
 * - Zero stack traces in production responses.
 * - Zero SQL queries, column names, or table internals leaked to clients.
 * - Uniform API error envelope: { success: false, error: { code, message, requestId, details? }, timestamp }.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error';
import { sendError } from '../utils/api-response';
import { logger } from '../utils/logger';
import { env } from '../config/env.config';
import { normalizeDatabaseError, MySqlErrorLike } from '../database/database-error';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = req.requestId;

  // Case 1: Known Operational Application Errors
  if (err instanceof AppError) {
    logger.warn(
      `Operational Error [${err.code}]: ${err.message}`,
      {
        code: err.code,
        statusCode: err.statusCode,
        details: err.details,
      },
      requestId
    );

    sendError(
      res,
      {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      err.statusCode,
      requestId
    );
    return;
  }

  // Case 2: Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const formattedIssues = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      rule: issue.code,
    }));

    logger.warn('Request validation failed', { issues: formattedIssues }, requestId);

    sendError(
      res,
      {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data provided',
        details: formattedIssues,
      },
      422,
      requestId
    );
    return;
  }

  // Case 3: SyntaxError from malformed JSON in request body
  if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
    logger.warn('Malformed JSON payload received', undefined, requestId);
    sendError(
      res,
      {
        code: 'MALFORMED_JSON',
        message: 'Request body contains invalid JSON syntax',
      },
      400,
      requestId
    );
    return;
  }

  // Case 4: Express Body Parser Payload Too Large (413)
  const bodyErr = err as { type?: string; status?: number; limit?: number };
  if (bodyErr.type === 'entity.too.large' || bodyErr.status === 413) {
    logger.warn('Request entity too large', { limit: bodyErr.limit }, requestId);
    sendError(
      res,
      {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload exceeds maximum allowed size (100kb limit)',
      },
      413,
      requestId
    );
    return;
  }

  // Case 5: Uncaught MySQL / MariaDB / Knex Database Exceptions
  const sqlErr = err as MySqlErrorLike;
  if (sqlErr.code?.startsWith('ER_') || sqlErr.errno || sqlErr.sqlState || sqlErr.code === 'KnexTimeoutError') {
    const normalized = normalizeDatabaseError(err, `${req.method} ${req.originalUrl}`);
    sendError(
      res,
      {
        code: normalized.code,
        message: normalized.message,
      },
      normalized.statusCode,
      requestId
    );
    return;
  }

  // Case 6: Unhandled Unexpected Programming Exceptions
  logger.error(
    `Unhandled Exception: ${err.message}`,
    err,
    { path: req.originalUrl, method: req.method },
    requestId
  );

  // In production / test, strictly suppress internal stack traces and paths
  const isSafeMode = env.NODE_ENV === 'production';
  const message = isSafeMode
    ? 'An unexpected internal error occurred. Please contact support.'
    : err.message || 'Internal Server Error';

  sendError(
    res,
    {
      code: 'INTERNAL_SERVER_ERROR',
      message,
    },
    500,
    requestId
  );
}
