/**
 * CITYLINE CONSULTANCY — Phase 12 Analytics Controller
 * Handles public tracking ingestion and administrative analytics intelligence requests.
 *
 * GOVERNANCE:
 * - Public ingestion endpoint is rate-limited and strictly validated.
 * - Admin reporting endpoint is protected by authenticated admin guards and RBAC.
 */

import { Request, Response, NextFunction } from 'express';
import {
  analyticsService,
  AnalyticsService,
} from '../services/analytics.service';
import {
  trackPageViewSchema,
  adminAnalyticsQuerySchema,
} from '../schemas/analytics.schema';
import { AppError } from '../utils/app-error';

export class AnalyticsController {
  constructor(private readonly service: AnalyticsService = analyticsService) {}

  /**
   * POST /api/v1/analytics/page-view
   * Public lightweight page-view tracking endpoint.
   */
  public trackPageView = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = trackPageViewSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError('Invalid analytics tracking payload.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parseResult.error.flatten().fieldErrors,
        });
      }

      const userAgent = req.headers['user-agent'] || null;
      const result = await this.service.trackPageView(parseResult.data, userAgent);

      res.status(200).json({
        success: true,
        recorded: result.recorded,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/admin/analytics/overview
   * Administrative intelligence reporting endpoint with server-side aggregated metrics.
   */
  public getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = adminAnalyticsQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        throw new AppError('Invalid analytics query parameters.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parseResult.error.flatten().fieldErrors,
        });
      }

      const overview = await this.service.getAnalyticsOverview(parseResult.data);

      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const analyticsController = new AnalyticsController();
