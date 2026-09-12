/**
 * CITYLINE CONSULTANCY — Request ID Middleware
 * Assigns or forwards a unique correlation ID (UUIDv4) for request tracing across logs and responses.
 *
 * SECURITY:
 * - Validates incoming X-Request-ID headers against safe alphanumeric/hyphen patterns (max 64 chars).
 * - Prevents log injection via oversized or malformed correlation IDs.
 * - Always exposes X-Request-ID on the outgoing HTTP response.
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

const VALID_REQUEST_ID_REGEX = /^[a-zA-Z0-9_\-.]{8,64}$/;

export function isValidRequestId(id: unknown): id is string {
  return typeof id === 'string' && VALID_REQUEST_ID_REGEX.test(id.trim());
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'];
  const requestId = isValidRequestId(incomingId)
    ? incomingId.trim()
    : randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('x-request-id', requestId);
  next();
}
