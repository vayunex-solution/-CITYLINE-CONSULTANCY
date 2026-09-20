"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Dashboard Controller
 * Exposes endpoints for real-time dashboard statistics, visa enquiry management,
 * notification queue inspection/retry, and audit log exploration.
 *
 * GOVERNANCE:
 * - Restricted to authenticated operators ('super_admin', 'admin_operator').
 * - Strict schema validation rejects mass assignment and unknown fields.
 * - Sensitive credentials and storage paths are never leaked.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDashboardController = exports.AdminDashboardController = void 0;
const admin_dashboard_service_1 = require("../services/admin-dashboard.service");
const admin_dashboard_schema_1 = require("../schemas/admin-dashboard.schema");
const auth_middleware_1 = require("../middleware/auth.middleware");
const app_error_1 = require("../utils/app-error");
class AdminDashboardController {
    service;
    constructor(service = admin_dashboard_service_1.adminDashboardService) {
        this.service = service;
    }
    getActor(req) {
        const adminUser = req.admin;
        return {
            adminId: adminUser?.id || 'system',
            adminEmail: adminUser?.email || 'admin@cityline.ae',
            ip: req.ip,
        };
    }
    /**
     * GET /api/v1/admin/dashboard/stats
     * Aggregates real backend data across all domains.
     */
    getDashboardStats = async (_req, res, next) => {
        try {
            const stats = await this.service.getDashboardStats();
            res.status(200).json({
                success: true,
                data: stats,
            });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/admin/visa-enquiries
     * Paginated listing of visa enquiries with search & status filters.
     */
    listVisaEnquiries = async (req, res, next) => {
        try {
            const parseResult = admin_dashboard_schema_1.adminVisaQuerySchema.safeParse(req.query);
            if (!parseResult.success) {
                throw new app_error_1.AppError('Invalid query parameters.', 400, 'VALIDATION_ERROR', {
                    fieldErrors: parseResult.error.flatten().fieldErrors,
                });
            }
            const result = await this.service.listVisaEnquiries(parseResult.data);
            res.status(200).json({
                success: true,
                data: result.items,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                },
            });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/admin/visa-enquiries/:id
     * Single visa enquiry details with safe document metadata.
     */
    getVisaEnquiry = async (req, res, next) => {
        try {
            const { id } = req.params;
            const detail = await this.service.getVisaEnquiryById(id);
            if (req.admin && !(0, auth_middleware_1.assertAdminResourceAccess)(req.admin, detail.enquiry?.assignedAdminId)) {
                throw new app_error_1.AppError('Access denied: Insufficient privileges for this enquiry.', 403, 'FORBIDDEN');
            }
            res.status(200).json({
                success: true,
                data: detail,
            });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * PATCH /api/v1/admin/visa-enquiries/:id/status
     * Updates visa enquiry status with audit logging.
     */
    updateVisaEnquiryStatus = async (req, res, next) => {
        try {
            const { id } = req.params;
            const parseResult = admin_dashboard_schema_1.adminUpdateVisaStatusSchema.safeParse(req.body);
            if (!parseResult.success) {
                throw new app_error_1.AppError('Validation failed for visa status update.', 400, 'VALIDATION_ERROR', {
                    fieldErrors: parseResult.error.flatten().fieldErrors,
                });
            }
            const existing = await this.service.getVisaEnquiryById(id);
            if (req.admin && !(0, auth_middleware_1.assertAdminResourceAccess)(req.admin, existing.enquiry?.assignedAdminId)) {
                throw new app_error_1.AppError('Access denied: Insufficient privileges for this enquiry.', 403, 'FORBIDDEN');
            }
            const result = await this.service.updateVisaEnquiryStatus(id, parseResult.data, this.getActor(req));
            res.status(200).json({
                success: true,
                message: 'Visa enquiry status updated successfully.',
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/admin/notifications
     * Paginated list of outbox notification queue items.
     */
    listNotifications = async (req, res, next) => {
        try {
            const parseResult = admin_dashboard_schema_1.adminNotificationQuerySchema.safeParse(req.query);
            if (!parseResult.success) {
                throw new app_error_1.AppError('Invalid query parameters.', 400, 'VALIDATION_ERROR', {
                    fieldErrors: parseResult.error.flatten().fieldErrors,
                });
            }
            const result = await this.service.listNotifications(parseResult.data);
            res.status(200).json({
                success: true,
                data: result.items,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                },
            });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * POST /api/v1/admin/notifications/:id/retry
     * Safely marks a failed/exhausted notification for retry.
     */
    retryNotification = async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await this.service.retryNotification(id, this.getActor(req));
            res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (err) {
            next(err);
        }
    };
    /**
     * GET /api/v1/admin/audit-logs
     * Paginated list of audit events.
     */
    listAuditLogs = async (req, res, next) => {
        try {
            const parseResult = admin_dashboard_schema_1.adminAuditLogQuerySchema.safeParse(req.query);
            if (!parseResult.success) {
                throw new app_error_1.AppError('Invalid query parameters.', 400, 'VALIDATION_ERROR', {
                    fieldErrors: parseResult.error.flatten().fieldErrors,
                });
            }
            const result = await this.service.listAuditLogs(parseResult.data);
            res.status(200).json({
                success: true,
                data: result.items,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                },
            });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.AdminDashboardController = AdminDashboardController;
exports.adminDashboardController = new AdminDashboardController();
