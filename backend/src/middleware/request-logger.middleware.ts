/**
 * CITYLINE CONSULTANCY — HTTP Request Logger Middleware
 * Logs HTTP request method, path, status, and duration using the structured logger.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const { method, originalUrl } = req;
  const requestId = req.requestId;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const context = {
      method,
      path: originalUrl,
      statusCode,
      durationMs: duration,
      userAgent: req.headers['user-agent'],
    };

    if (statusCode >= 500) {
      logger.error(`HTTP ${method} ${originalUrl} ${statusCode} (${duration}ms)`, undefined, context, requestId);
    } else if (statusCode >= 400) {
      logger.warn(`HTTP ${method} ${originalUrl} ${statusCode} (${duration}ms)`, context, requestId);
    } else {
      logger.info(`HTTP ${method} ${originalUrl} ${statusCode} (${duration}ms)`, context, requestId);
    }
  });

  next();
}
