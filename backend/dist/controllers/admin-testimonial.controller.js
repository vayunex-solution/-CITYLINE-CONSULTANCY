"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Testimonials Controller
 * Handles administrative listing, creation, modification, ordering, and archiving of testimonials.
 *
 * GOVERNANCE:
 * - Restricted to authenticated operators ('super_admin', 'admin_operator').
 * - Strict schema parsing rejects mass assignment and unknown fields.
 * - All mutations trigger persistent audit logging.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminTestimonialController = exports.AdminTestimonialController = void 0;
const testimonial_schema_1 = require("../schemas/testimonial.schema");
const testimonial_service_1 = require("../services/testimonial.service");
const app_error_1 = require("../utils/app-error");
class AdminTestimonialController {
    service;
    constructor(service = testimonial_service_1.testimonialService) {
        this.service = service;
    }
    /**
     * Helper to extract authenticated operator details.
     */
    getActor(req) {
        const adminUser = req.admin;
        return {
            adminId: adminUser?.id || 'system',
            adminEmail: adminUser?.email || 'admin@cityline.ae',
            ip: req.ip,
        };
    }
    /**
     * GET /api/v1/admin/testimonials
     * Paginated listing of testimonials with search and status filtering.
     */
    listTestimonials = async (req, res, next) => {
        try {
            const parseResult = testimonial_schema_1.testimonialQuerySchema.safeParse(req.query);
            if (!parseResult.success) {
                throw new app_error_1.AppError('Invalid query parameters.', 400, 'VALIDATION_ERROR', {
                    fieldErrors: parseResult.error.flatten().fieldErrors,
                });
            }
            const result = await this.service.getAdminTestimonials(parseResult.data);
            res.status(200).json({
                success: true,
                data: result.items,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                    hasNextPage: result.hasNextPage,
                    hasPrevPage: result.hasPrevPage,
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/testimonials/:id
     * Single testimonial details.
     */
    getTestimonial = async (req, res, next) => {
        try {
            const id = Number(req.params.id);
            if (isNaN(id) || id <= 0) {
                throw new app_error_1.AppError('Invalid testimonial ID.', 400, 'INVALID_ID');
            }
            const record = await this.service.getTestimonialById(id);
            res.status(200).json({
                success: true,
                data: record,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/admin/testimonials
     * Creates a new testimonial.
     */
    createTestimonial = async (req, res, next) => {
        try {
            const parseResult = testimonial_schema_1.createTestimonialSchema.safeParse(req.body);
            if (!parseResult.success) {
                throw new app_error_1.AppError('Validation failed for testimonial creation.', 400, 'VALIDATION_ERROR', {
                    fieldErrors: parseResult.error.flatten().fieldErrors,
                });
            }
            const record = await this.service.createTestimonial(parseResult.data, this.getActor(req));
            res.status(201).json({
                success: true,
                message: 'Testimonial created successfully.',
                data: record,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * PATCH /api/v1/admin/testimonials/:id
     * Updates an existing testimonial.
     */
    updateTestimonial = async (req, res, next) => {
        try {
            const id = Number(req.params.id);
            if (isNaN(id) || id <= 0) {
                throw new app_error_1.AppError('Invalid testimonial ID.', 400, 'INVALID_ID');
            }
            const parseResult = testimonial_schema_1.updateTestimonialSchema.safeParse(req.body);
            if (!parseResult.success) {
                throw new app_error_1.AppError('Validation failed for testimonial update.', 400, 'VALIDATION_ERROR', {
                    fieldErrors: parseResult.error.flatten().fieldErrors,
                });
            }
            const updated = await this.service.updateTestimonial(id, parseResult.data, this.getActor(req));
            res.status(200).json({
                success: true,
                message: 'Testimonial updated successfully.',
                data: updated,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * DELETE /api/v1/admin/testimonials/:id
     * Safe soft-deletion / archiving of a testimonial.
     */
    deleteTestimonial = async (req, res, next) => {
        try {
            const id = Number(req.params.id);
            if (isNaN(id) || id <= 0) {
                throw new app_error_1.AppError('Invalid testimonial ID.', 400, 'INVALID_ID');
            }
            await this.service.deleteTestimonial(id, this.getActor(req));
            res.status(200).json({
                success: true,
                message: 'Testimonial archived successfully.',
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * PUT /api/v1/admin/testimonials/reorder
     * Reorders testimonials display order.
     */
    reorderTestimonials = async (req, res, next) => {
        try {
            const parseResult = testimonial_schema_1.reorderTestimonialsSchema.safeParse(req.body);
            if (!parseResult.success) {
                throw new app_error_1.AppError('Validation failed for testimonial reordering.', 400, 'VALIDATION_ERROR', {
                    fieldErrors: parseResult.error.flatten().fieldErrors,
                });
            }
            await this.service.reorderTestimonials(parseResult.data.items, this.getActor(req));
            res.status(200).json({
                success: true,
                message: 'Testimonials reordered successfully.',
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AdminTestimonialController = AdminTestimonialController;
exports.adminTestimonialController = new AdminTestimonialController();
