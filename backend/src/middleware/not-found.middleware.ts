/**
 * CITYLINE CONSULTANCY — Centralized 404 Not Found Middleware
 * Intercepts unhandled routes and returns a uniform, safe 404 error envelope without exposing internal route maps.
 */

import { Request, Response } from 'express';
import { sendError } from '../utils/api-response';

export function notFoundMiddleware(req: Request, res: Response): void {
  sendError(
    res,
    {
      code: 'NOT_FOUND',
      message: `Resource not found: ${req.method} ${req.originalUrl}`,
    },
    404,
    req.requestId
  );
}
