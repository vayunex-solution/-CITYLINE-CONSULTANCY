/**
 * CITYLINE CONSULTANCY — Application Error Class
 * Standardized operational error wrapper for controlled API exception handling.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  public static badRequest(message: string, code = 'BAD_REQUEST', details?: unknown): AppError {
    return new AppError(message, 400, code, details);
  }

  public static unauthorized(message = 'Unauthorized access', code = 'UNAUTHORIZED'): AppError {
    return new AppError(message, 401, code);
  }

  public static forbidden(message = 'Access forbidden', code = 'FORBIDDEN'): AppError {
    return new AppError(message, 403, code);
  }

  public static notFound(message = 'Resource not found', code = 'NOT_FOUND'): AppError {
    return new AppError(message, 404, code);
  }

  public static conflict(message: string, code = 'CONFLICT'): AppError {
    return new AppError(message, 409, code);
  }

  public static unprocessable(message: string, code = 'UNPROCESSABLE_ENTITY', details?: unknown): AppError {
    return new AppError(message, 422, code, details);
  }

  public static tooManyRequests(message = 'Too many requests, please slow down', code = 'RATE_LIMIT_EXCEEDED'): AppError {
    return new AppError(message, 429, code);
  }

  public static internal(message = 'An unexpected internal error occurred', code = 'INTERNAL_SERVER_ERROR'): AppError {
    return new AppError(message, 500, code, undefined, false);
  }
}
