/**
 * CITYLINE CONSULTANCY — Request ID Middleware
 * Assigns or forwards a unique correlation ID (UUIDv4) for request tracing across logs and responses.
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'];
  const requestId = typeof incomingId === 'string' && incomingId.trim().length > 0
    ? incomingId.trim()
    : randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
