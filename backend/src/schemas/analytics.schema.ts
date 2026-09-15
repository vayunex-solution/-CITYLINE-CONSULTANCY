/**
 * CITYLINE CONSULTANCY — Phase 12 Analytics & Intelligence Schemas
 * Strict validation for first-party page-view tracking and administrative analytics reporting.
 *
 * GOVERNANCE:
 * - Reject arbitrary field injection, oversized payloads, and external destination URLs.
 * - Enforce path normalization and bounds.
 */

import { z } from 'zod';

export const trackPageViewSchema = z
  .object({
    sessionId: z
      .string({
        required_error: 'Session ID is required',
        invalid_type_error: 'Session ID must be a string',
      })
      .trim()
      .min(8, 'Session ID must be at least 8 characters')
      .max(64, 'Session ID must not exceed 64 characters'),
    pathname: z
      .string({
        required_error: 'Pathname is required',
        invalid_type_error: 'Pathname must be a string',
      })
      .trim()
      .min(1, 'Pathname must not be empty')
      .max(255, 'Pathname must not exceed 255 characters')
      .refine(
        (val) => val.startsWith('/') && !val.includes('://') && !val.includes('\0') && !val.startsWith('//'),
        {
          message: 'Pathname must be a valid root-relative path starting with / without external protocols',
        }
      ),
    referrer: z
      .string()
      .trim()
      .max(255, 'Referrer must not exceed 255 characters')
      .nullable()
      .optional(),
  })
  .strict();

export type TrackPageViewInput = z.infer<typeof trackPageViewSchema>;

export const adminAnalyticsQuerySchema = z
  .object({
    period: z.enum(['today', '7d', '30d', 'all']).default('7d'),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be in YYYY-MM-DD format')
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be in YYYY-MM-DD format')
      .optional(),
  })
  .strict();

export type AdminAnalyticsQueryParams = z.infer<typeof adminAnalyticsQuerySchema>;
