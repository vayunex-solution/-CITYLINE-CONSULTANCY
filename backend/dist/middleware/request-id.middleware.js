"use strict";
/**
 * CITYLINE CONSULTANCY — Request ID Middleware
 * Assigns or forwards a unique correlation ID (UUIDv4) for request tracing across logs and responses.
 *
 * SECURITY:
 * - Validates incoming X-Request-ID headers against safe alphanumeric/hyphen patterns (max 64 chars).
 * - Prevents log injection via oversized or malformed correlation IDs.
 * - Always exposes X-Request-ID on the outgoing HTTP response.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidRequestId = isValidRequestId;
exports.requestIdMiddleware = requestIdMiddleware;
const crypto_1 = require("crypto");
const VALID_REQUEST_ID_REGEX = /^[a-zA-Z0-9_\-.]{8,64}$/;
function isValidRequestId(id) {
    return typeof id === 'string' && VALID_REQUEST_ID_REGEX.test(id.trim());
}
function requestIdMiddleware(req, res, next) {
    const incomingId = req.headers['x-request-id'];
    const requestId = isValidRequestId(incomingId)
        ? incomingId.trim()
        : (0, crypto_1.randomUUID)();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('x-request-id', requestId);
    next();
}
