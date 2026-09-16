"use strict";
/**
 * CITYLINE CONSULTANCY — Centralized 404 Not Found Middleware
 * Intercepts unhandled routes and returns a uniform, safe 404 error envelope without exposing internal route maps.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = notFoundMiddleware;
const api_response_1 = require("../utils/api-response");
function notFoundMiddleware(req, res) {
    (0, api_response_1.sendError)(res, {
        code: 'NOT_FOUND',
        message: `Resource not found: ${req.method} ${req.originalUrl}`,
    }, 404, req.requestId);
}
