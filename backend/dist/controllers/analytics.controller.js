"use strict";
/**
 * CITYLINE CONSULTANCY — Phase 12 Analytics Controller
 * Handles public tracking ingestion and administrative analytics intelligence requests.
 *
 * GOVERNANCE:
 * - Public ingestion endpoint is rate-limited and strictly validated.
 * - Admin reporting endpoint is protected by authenticated admin guards and RBAC.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = exports.AnalyticsController = void 0;
const analytics_service_1 = require("../services/analytics.service");
const analytics_schema_1 = require("../schemas/analytics.schema");
const app_error_1 = require("../utils/app-error");
class AnalyticsController {
    service;
    constructor(service = analytics_service_1.analyticsService) {
        this.service = service;
    }
    /**
     * POST /api/v1/analytics/page-view
     * Public lightweight page-view tracking endpoint.
     */
    trackPageView = async (req, res, next) => {
        try {
            const parseResult = analytics_schema_1.trackPageViewSchema.safeParse(req.body);
            if (!parseResult.success) {
                throw new app_error_1.AppError('Invalid analytics tracking payload.', 400, 'VALIDATION_ERROR', {
                    fieldErrors: parseResult.error.flatten().fieldErrors,
                });
            }
            const userAgent = req.headers['user-agent'] || null;
            const result = await this.service.trackPageView(parseResult.data, userAgent);
            res.status(200).json({
                success: true,
                recorded: result.recorded,
            });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/admin/analytics/overview
     * Administrative intelligence reporting endpoint with server-side aggregated metrics.
     */
    getOverview = async (req, res, next) => {
        try {
            const parseResult = analytics_schema_1.adminAnalyticsQuerySchema.safeParse(req.query);
            if (!parseResult.success) {
                throw new app_error_1.AppError('Invalid analytics query parameters.', 400, 'VALIDATION_ERROR', {
                    fieldErrors: parseResult.error.flatten().fieldErrors,
                });
            }
            const overview = await this.service.getAnalyticsOverview(parseResult.data);
            res.status(200).json({
                success: true,
                data: overview,
            });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.AnalyticsController = AnalyticsController;
exports.analyticsController = new AnalyticsController();
