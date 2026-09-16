"use strict";
/**
 * CITYLINE CONSULTANCY — Public Analytics Tracking Routes
 * Exposes lightweight ingestion endpoints guarded by sliding-window rate limiting.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const analytics_rate_limit_middleware_1 = require("../middleware/analytics-rate-limit.middleware");
const router = (0, express_1.Router)();
// POST /api/v1/analytics/page-view
router.post('/page-view', analytics_rate_limit_middleware_1.analyticsRateLimitMiddleware, analytics_controller_1.analyticsController.trackPageView);
exports.default = router;
