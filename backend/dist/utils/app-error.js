"use strict";
/**
 * CITYLINE CONSULTANCY — Application Error Class
 * Standardized operational error wrapper for controlled API exception handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    isOperational;
    details;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
    static badRequest(message, code = 'BAD_REQUEST', details) {
        return new AppError(message, 400, code, details);
    }
    static unauthorized(message = 'Unauthorized access', code = 'UNAUTHORIZED') {
        return new AppError(message, 401, code);
    }
    static forbidden(message = 'Access forbidden', code = 'FORBIDDEN') {
        return new AppError(message, 403, code);
    }
    static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
        return new AppError(message, 404, code);
    }
    static conflict(message, code = 'CONFLICT') {
        return new AppError(message, 409, code);
    }
    static unprocessable(message, code = 'UNPROCESSABLE_ENTITY', details) {
        return new AppError(message, 422, code, details);
    }
    static tooManyRequests(message = 'Too many requests, please slow down', code = 'RATE_LIMIT_EXCEEDED') {
        return new AppError(message, 429, code);
    }
    static internal(message = 'An unexpected internal error occurred', code = 'INTERNAL_SERVER_ERROR') {
        return new AppError(message, 500, code, undefined, false);
    }
}
exports.AppError = AppError;
