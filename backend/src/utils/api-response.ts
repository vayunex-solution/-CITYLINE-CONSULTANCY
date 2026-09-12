/**
 * CITYLINE CONSULTANCY — API Response Formatter
 * Helper functions to construct uniform, type-safe API envelopes.
 */

import { Response } from 'express';
import { ApiResponse, ApiErrorResponse, ApiErrorDetail } from '@cityline/shared';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  requestId?: string
): Response<ApiResponse<T>> {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(requestId ? { requestId } : {}),
  };

  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  error: ApiErrorDetail,
  statusCode = 500,
  requestId?: string
): Response<ApiErrorResponse> {
  const payload: ApiErrorResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    ...(requestId ? { requestId } : {}),
  };

  return res.status(statusCode).json(payload);
}
