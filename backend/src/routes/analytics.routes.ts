/**
 * CITYLINE CONSULTANCY — Public Analytics Tracking Routes
 * Exposes lightweight ingestion endpoints guarded by sliding-window rate limiting.
 */

import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { analyticsRateLimitMiddleware } from '../middleware/analytics-rate-limit.middleware';

const router = Router();

// POST /api/v1/analytics/page-view
router.post('/page-view', analyticsRateLimitMiddleware, analyticsController.trackPageView);

export default router;
