"use strict";
/**
 * CITYLINE CONSULTANCY — Public Job Controller
 * Handles public job discovery, category listings, slug resolution, and candidate applications.
 *
 * GOVERNANCE:
 * - Public responses strictly conceal draft/archived vacancies and internal administrative data.
 * - Input validation via Zod with structured field-error mapping.
 * - Responses contain strictly necessary public data (no private document keys, no internal SQL IDs).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobController = exports.JobController = void 0;
const job_schema_1 = require("../schemas/job.schema");
const job_service_1 = require("../services/job.service");
const job_application_service_1 = require("../services/job-application.service");
const app_error_1 = require("../utils/app-error");
class JobController {
    jobs;
    applications;
    constructor(jobs = job_service_1.jobService, applications = job_application_service_1.jobApplicationService) {
        this.jobs = jobs;
        this.applications = applications;
    }
    /**
     * GET /api/v1/jobs
     */
    async getJobs(req, res, next) {
        try {
            const queryParse = job_schema_1.jobQuerySchema.safeParse(req.query);
            if (!queryParse.success) {
                throw new app_error_1.AppError('Invalid job search parameters.', 400, 'VALIDATION_ERROR');
            }
            const result = await this.jobs.getPublishedJobs(queryParse.data);
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
     * GET /api/v1/jobs/categories
     */
    async getCategories(_req, res, next) {
        try {
            const categories = await this.jobs.getJobCategoriesWithCounts();
            res.status(200).json({
                success: true,
                data: categories,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/jobs/:slug
     */
    async getJobBySlug(req, res, next) {
        try {
            const slug = req.params.slug;
            if (!slug) {
                throw new app_error_1.AppError('Job slug is required.', 400, 'INVALID_SLUG');
            }
            const result = await this.jobs.getPublishedJobBySlug(slug);
            res.status(200).json({
                success: true,
                data: result.job,
                relatedJobs: result.relatedJobs,
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/jobs/:slug/apply
     */
    async submitApplication(req, res, next) {
        try {
            const slug = req.params.slug;
            if (!slug) {
                throw new app_error_1.AppError('Job slug is required.', 400, 'INVALID_SLUG');
            }
            // 1. Authoritative Zod schema validation
            const parseResult = job_schema_1.jobApplicationInputSchema.safeParse(req.body);
            if (!parseResult.success) {
                const fieldErrors = {};
                for (const issue of parseResult.error.issues) {
                    const pathKey = issue.path.join('.');
                    if (!fieldErrors[pathKey]) {
                        fieldErrors[pathKey] = issue.message;
                    }
                }
                throw new app_error_1.AppError('Validation failed for job application submission.', 400, 'VALIDATION_ERROR', {
                    fieldErrors,
                });
            }
            // 2. Extract CV file from Multer (normalized by jobApplicationUploadMiddleware)
            const rawCvFile = req.file;
            // 3. Extract idempotency key from header or body
            const idempotencyKey = req.headers['x-idempotency-key'] || parseResult.data.idempotencyKey || undefined;
            // 4. Delegate to domain service
            const result = await this.applications.submitApplication(slug, parseResult.data, rawCvFile, {
                clientIp: req.ip || req.socket.remoteAddress,
                requestId: req.headers['x-request-id'] || undefined,
                idempotencyKey,
            });
            res.status(result.isDuplicate ? 200 : 201).json({
                success: true,
                message: result.message,
                data: {
                    reference: result.reference,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.JobController = JobController;
exports.jobController = new JobController();
