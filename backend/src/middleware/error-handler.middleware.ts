/**
 * CITYLINE CONSULTANCY — Centralized Error Handling Middleware
 * Intercepts all application exceptions, formats uniform error responses,
 * and prevents sensitive data/stack traces from leaking to clients in production.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error';
import { sendError } from '../utils/api-response';
import { logger } from '../utils/logger';
import { env } from '../config/env.config';

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
    logger.warn(`Operational Error: ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
      details: err.details,
    }, requestId);

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
        message: 'Request body contains invalid JSON',
      },
      400,
      requestId
    );
    return;
  }

  // Case 4: Unhandled / Unexpected Programming Errors
  logger.error(`Unhandled Exception: ${err.message}`, err, { path: req.originalUrl, method: req.method }, requestId);

  // In production, suppress internal details to prevent leakage
  const message = env.NODE_ENV === 'production'
    ? 'An unexpected internal error occurred. Please contact support.'
    : err.message || 'Internal Server Error';

  const details = env.NODE_ENV === 'development'
    ? { name: err.name, stack: err.stack }
    : undefined;

  sendError(
    res,
    {
      code: 'INTERNAL_SERVER_ERROR',
      message,
      ...(details ? { details } : {}),
    },
    500,
    requestId
  );
}
