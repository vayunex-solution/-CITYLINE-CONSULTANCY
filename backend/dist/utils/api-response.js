"use strict";
/**
 * CITYLINE CONSULTANCY — API Response Formatter
 * Helper functions to construct uniform, type-safe API envelopes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, data, statusCode = 200, requestId) {
    const payload = {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        ...(requestId ? { requestId } : {}),
    };
    return res.status(statusCode).json(payload);
}
function sendError(res, error, statusCode = 500, requestId) {
    const payload = {
        success: false,
        error,
        timestamp: new Date().toISOString(),
        ...(requestId ? { requestId } : {}),
    };
    return res.status(statusCode).json(payload);
}
