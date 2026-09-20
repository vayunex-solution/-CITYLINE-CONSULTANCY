"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Job & Recruitment Controller
 * Handles administrative vacancy management and candidate application triage.
 *
 * GOVERNANCE:
 * - Protected by Phase 4 authentication and RBAC guards.
 * - Records structured audit logs for all material state changes.
 * - Conforms to Phase 8 scope: provides backend foundation for future Phase 11 UI.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminJobController = exports.AdminJobController = void 0;
const job_schema_1 = require("../schemas/job.schema");
const job_service_1 = require("../services/job.service");
const job_application_service_1 = require("../services/job-application.service");
const app_error_1 = require("../utils/app-error");
class AdminJobController {
    jobs;
    applications;
    constructor(jobs = job_service_1.jobService, applications = job_application_service_1.jobApplicationService) {
        this.jobs = jobs;
        this.applications = applications;
    }
    /**
     * GET /api/v1/admin/recruitment/jobs
     */
    async listJobs(req, res, next) {
        try {
            const { status, category, search, page, limit } = req.query;
            const result = await this.jobs.listAllJobs({
                status: status,
                category: category,
                search: search,
                page: page ? parseInt(String(page), 10) : 1,
                limit: limit ? parseInt(String(limit), 10) : 20,
            });
            res.status(200).json({
                success: true,
                data: result.data,
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
    }
    /**
     * POST /api/v1/admin/recruitment/jobs
     */
    async createJob(req, res, next) {
        try {
            const parseResult = job_schema_1.adminCreateJobSchema.safeParse(req.body);
            if (!parseResult.success) {
                const errorDetails = parseResult.error.flatten().fieldErrors;
                const formattedErrors = Object.entries(errorDetails)
                    .map(([k, v]) => `${k}: ${(v || []).join(', ')}`)
                    .join('; ');
                throw new app_error_1.AppError(`Validation failed for job creation: ${formattedErrors}`, 400, 'VALIDATION_ERROR', { fieldErrors: errorDetails });
            }
            const adminId = req.admin?.id || 'system';
            const created = await this.jobs.createJob(parseResult.data, adminId, {
                clientIp: req.ip,
                requestId: req.requestId,
            });
            res.status(201).json({
                success: true,
                message: 'Job vacancy created successfully.',
                data: created,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/recruitment/jobs/:id
     */
    async getJob(req, res, next) {
        try {
            const id = req.params.id;
            const jobsList = await this.jobs.listAllJobs({ search: id, limit: 1 });
            const job = jobsList.data.find((j) => j.id === id);
            if (!job) {
                throw new app_error_1.AppError('Job vacancy not found.', 404, 'JOB_NOT_FOUND');
            }
            res.status(200).json({
                success: true,
                data: job,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PUT /api/v1/admin/recruitment/jobs/:id
     */
    async updateJob(req, res, next) {
        try {
            const id = req.params.id;
            const parseResult = job_schema_1.adminUpdateJobSchema.safeParse(req.body);
            if (!parseResult.success) {
                throw new app_error_1.AppError('Validation failed for job update.', 400, 'VALIDATION_ERROR', {
                    fieldErrors: parseResult.error.flatten().fieldErrors,
                });
            }
            const adminId = req.admin?.id || 'system';
            const updated = await this.jobs.updateJob(id, parseResult.data, adminId, {
                clientIp: req.ip,
                requestId: req.requestId,
            });
            res.status(200).json({
                success: true,
                message: 'Job vacancy updated successfully.',
                data: updated,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * DELETE /api/v1/admin/recruitment/jobs/:id
     */
    async deleteJob(req, res, next) {
        try {
            const id = req.params.id;
            const adminId = req.admin?.id || 'system';
            await this.jobs.deleteJob(id, adminId, {
                clientIp: req.ip,
                requestId: req.requestId,
            });
            res.status(200).json({
                success: true,
                message: 'Job vacancy archived successfully.',
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/recruitment/applications
     */
    async listApplications(req, res, next) {
        try {
            const { jobId, status, search, page, limit } = req.query;
            const result = await this.applications.listApplications({
                jobId: jobId,
                status: status,
                search: search,
                page: page ? parseInt(String(page), 10) : 1,
                limit: limit ? parseInt(String(limit), 10) : 20,
            });
            res.status(200).json({
                success: true,
                data: result.data,
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
    }
    /**
     * GET /api/v1/admin/recruitment/applications/:id
     */
    async getApplication(req, res, next) {
        try {
            const id = req.params.id;
            const result = await this.applications.getApplicationDetails(id);
            res.status(200).json({
                success: true,
                data: {
                    application: result.application,
                    documents: result.documents,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PATCH /api/v1/admin/recruitment/applications/:id/status
     */
    async updateApplicationStatus(req, res, next) {
        try {
            const id = req.params.id;
            const parseResult = job_schema_1.adminUpdateApplicationStatusSchema.safeParse(req.body);
            if (!parseResult.success) {
                throw new app_error_1.AppError('Validation failed for status update.', 400, 'VALIDATION_ERROR', {
                    fieldErrors: parseResult.error.flatten().fieldErrors,
                });
            }
            const adminId = req.admin?.id || 'system';
            await this.applications.updateApplicationStatus(id, parseResult.data, adminId, {
                clientIp: req.ip,
                requestId: req.requestId,
            });
            res.status(200).json({
                success: true,
                message: 'Application status updated successfully.',
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * DELETE /api/v1/admin/recruitment/applications/:id
     */
    async moveApplicationToTrash(req, res, next) {
        try {
            const id = req.params.id;
            const adminId = req.admin?.id || 'system';
            await this.applications.moveApplicationToTrash(id, adminId, {
                clientIp: req.ip,
                requestId: req.requestId,
            });
            res.status(200).json({
                success: true,
                message: 'Application moved to trash successfully.',
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AdminJobController = AdminJobController;
exports.adminJobController = new AdminJobController();
