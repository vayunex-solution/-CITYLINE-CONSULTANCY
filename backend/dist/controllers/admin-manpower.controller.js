"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Manpower Enquiry Controller
 * Handles administrative listing, inspection, status updates, and operational field updates.
 *
 * GOVERNANCE:
 * - Strictly guarded by Phase 4 authentication and RBAC ('super_admin', 'admin_operator').
 * - Tightly restricted update schema prevents mass assignment.
 * - Writes audit log records for all status and field modifications.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminManpowerController = exports.AdminManpowerController = void 0;
const manpower_enquiry_schema_1 = require("../schemas/manpower-enquiry.schema");
const manpower_enquiry_service_1 = require("../services/manpower-enquiry.service");
const app_error_1 = require("../utils/app-error");
class AdminManpowerController {
    /**
     * GET /api/v1/admin/manpower-enquiries
     * Lists manpower enquiries with pagination and filters.
     */
    async listEnquiries(req, res, next) {
        try {
            const queryParams = manpower_enquiry_schema_1.manpowerQuerySchema.parse(req.query);
            const result = await manpower_enquiry_service_1.manpowerEnquiryService.listEnquiries(queryParams);
            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/manpower-enquiries/:id
     * Retrieves full details of a single manpower enquiry.
     */
    async getEnquiry(req, res, next) {
        try {
            const { id } = req.params;
            const detail = await manpower_enquiry_service_1.manpowerEnquiryService.getEnquiryById(id);
            res.status(200).json({
                success: true,
                data: detail,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PATCH /api/v1/admin/manpower-enquiries/:id/status
     * Dedicated status state machine transition endpoint.
     */
    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const parseResult = manpower_enquiry_schema_1.adminUpdateManpowerStatusSchema.safeParse(req.body);
            if (!parseResult.success) {
                throw new app_error_1.AppError('Validation failed for status update.', 400, 'VALIDATION_ERROR', {
                    fieldErrors: parseResult.error.flatten().fieldErrors,
                });
            }
            const adminUser = req.admin;
            const result = await manpower_enquiry_service_1.manpowerEnquiryService.updateEnquiryStatus(id, parseResult.data, {
                adminId: adminUser?.id || 'system',
                adminEmail: adminUser?.email || 'admin@cityline.ae',
                ip: req.ip,
            });
            res.status(200).json({
                success: true,
                message: `Manpower enquiry status successfully updated to "${result.status}".`,
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PATCH /api/v1/admin/manpower-enquiries/:id
     * Tightly restricted operational field update endpoint.
     */
    async updateEnquiry(req, res, next) {
        try {
            const { id } = req.params;
            const parseResult = manpower_enquiry_schema_1.adminUpdateManpowerEnquirySchema.safeParse(req.body);
            if (!parseResult.success) {
                throw new app_error_1.AppError('Validation failed for enquiry update.', 400, 'VALIDATION_ERROR', {
                    fieldErrors: parseResult.error.flatten().fieldErrors,
                });
            }
            const adminUser = req.admin;
            await manpower_enquiry_service_1.manpowerEnquiryService.updateEnquiry(id, parseResult.data, {
                adminId: adminUser?.id || 'system',
                adminEmail: adminUser?.email || 'admin@cityline.ae',
                ip: req.ip,
            });
            res.status(200).json({
                success: true,
                message: 'Manpower enquiry updated successfully.',
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AdminManpowerController = AdminManpowerController;
exports.adminManpowerController = new AdminManpowerController();
