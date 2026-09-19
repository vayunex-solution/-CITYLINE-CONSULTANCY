"use strict";
/**
 * CITYLINE CONSULTANCY — Job Vacancy Service
 * Coordinates public job vacancy discovery and administrative job lifecycle management.
 *
 * GOVERNANCE:
 * - Public operations strictly restrict visibility to published/active jobs where deleted_at IS NULL.
 * - Non-existent or unpublished jobs return standard 404 without leaking draft presence.
 * - Administrative mutations record structured audit logs.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobService = exports.JobService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const job_repository_1 = require("../repositories/job.repository");
const audit_log_repository_1 = require("../repositories/audit-log.repository");
const app_error_1 = require("../utils/app-error");
class JobService {
    jobRepo;
    auditRepo;
    constructor(jobRepo = job_repository_1.jobRepository, auditRepo = audit_log_repository_1.auditLogRepository) {
        this.jobRepo = jobRepo;
        this.auditRepo = auditRepo;
    }
    /**
     * Sanitizes internal database record into public-facing Job DTO.
     */
    toPublicDTO(job) {
        return {
            id: job.id,
            slug: job.slug,
            title: job.title,
            category: job.category_name || '',
            categorySlug: job.category_slug || '',
            location: job.location,
            employmentType: job.employment_type,
            description: job.description,
            requirements: job.requirements,
            shortDescription: job.short_description || null,
            responsibilities: job.responsibilities || null,
            qualification: job.qualification || null,
            experienceYearsRequired: job.experience_years_required ?? null,
            salaryRange: job.salary_range || null,
            benefits: job.benefits || null,
            visaSponsorship: job.visa_sponsorship || '2-Year UAE Employment Visa',
            workShift: job.work_shift || '8 Hrs/Day + Overtime (UAE Law)',
            isFeatured: Boolean(job.is_featured),
            publishedAt: job.published_at ? new Date(job.published_at).toISOString() : null,
            createdAt: new Date(job.created_at).toISOString(),
        };
    }
    /**
     * Retrieves paginated public jobs matching search and filter criteria.
     */
    async getPublishedJobs(params = {}) {
        const result = await this.jobRepo.findPublishedJobs(params);
        return {
            data: result.data.map((j) => this.toPublicDTO(j)),
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        };
    }
    /**
     * Resolves a public job by its slug.
     * Throws 404 AppError if not found or not published.
     */
    async getPublishedJobBySlug(slug) {
        const job = await this.jobRepo.findPublishedBySlug(slug);
        if (!job) {
            throw new app_error_1.AppError('The requested job vacancy was not found or is currently closed.', 404, 'JOB_NOT_FOUND');
        }
        const related = await this.jobRepo.findRelatedPublishedJobs(job.id, job.category_id, 3);
        return {
            job: this.toPublicDTO(job),
            relatedJobs: related.map((j) => this.toPublicDTO(j)),
        };
    }
    /**
     * Retrieves all active job categories with published job counts.
     */
    async getJobCategoriesWithCounts() {
        return await this.jobRepo.findCategoriesWithCounts();
    }
    /**
     * Administrative method to query all vacancies (including drafts and archived).
     */
    async listAllJobs(params) {
        return await this.jobRepo.listAllJobs(params);
    }
    /**
     * Administrative method to create a new job vacancy.
     */
    async createJob(input, adminId, context = {}) {
        const category = await this.jobRepo.findCategoryById(input.categoryId);
        if (!category) {
            throw new app_error_1.AppError('The specified job category does not exist.', 400, 'INVALID_JOB_CATEGORY');
        }
        const jobId = crypto_1.default.randomUUID();
        const normalizedStatus = (input.status === 'published' || input.status === 'active') ? 'active' : input.status;
        const isPublic = normalizedStatus === 'active';
        const jobRecord = {
            id: jobId,
            category_id: input.categoryId,
            title: input.title,
            slug: input.slug,
            location: input.location,
            employment_type: input.employmentType,
            description: input.description,
            requirements: input.requirements,
            short_description: input.shortDescription || null,
            responsibilities: input.responsibilities || null,
            qualification: input.qualification || null,
            experience_years_required: input.experienceYearsRequired ?? null,
            salary_range: input.salaryRange || null,
            benefits: input.benefits || null,
            visa_sponsorship: input.visaSponsorship || '2-Year UAE Employment Visa',
            work_shift: input.workShift || '8 Hrs/Day + Overtime (UAE Law)',
            status: normalizedStatus,
            is_featured: Boolean(input.isFeatured),
            published_at: isPublic ? new Date() : null,
            deleted_at: null,
        };
        await this.jobRepo.create(jobRecord);
        // Audit log
        await this.auditRepo.logEvent({
            actor_admin_id: adminId,
            action: 'job_created',
            resource_type: 'job',
            resource_id: jobId,
            client_ip: context.clientIp,
            request_id: context.requestId,
            details_json: JSON.stringify({
                title: input.title,
                slug: input.slug,
                status: normalizedStatus,
            }),
        });
        const created = await this.jobRepo.findById(jobId);
        return created;
    }
    /**
     * Administrative method to update an existing vacancy.
     */
    async updateJob(id, input, adminId, context = {}) {
        const existing = await this.jobRepo.findById(id);
        if (!existing || existing.deleted_at) {
            throw new app_error_1.AppError('Job vacancy not found.', 404, 'JOB_NOT_FOUND');
        }
        if (input.categoryId !== undefined) {
            const category = await this.jobRepo.findCategoryById(input.categoryId);
            if (!category) {
                throw new app_error_1.AppError('The specified job category does not exist.', 400, 'INVALID_JOB_CATEGORY');
            }
        }
        const updates = {};
        if (input.categoryId !== undefined)
            updates.category_id = input.categoryId;
        if (input.title !== undefined)
            updates.title = input.title;
        if (input.slug !== undefined)
            updates.slug = input.slug;
        if (input.location !== undefined)
            updates.location = input.location;
        if (input.employmentType !== undefined)
            updates.employment_type = input.employmentType;
        if (input.description !== undefined)
            updates.description = input.description;
        if (input.requirements !== undefined)
            updates.requirements = input.requirements;
        if (input.shortDescription !== undefined)
            updates.short_description = input.shortDescription;
        if (input.responsibilities !== undefined)
            updates.responsibilities = input.responsibilities;
        if (input.qualification !== undefined)
            updates.qualification = input.qualification;
        if (input.experienceYearsRequired !== undefined)
            updates.experience_years_required = input.experienceYearsRequired;
        if (input.salaryRange !== undefined)
            updates.salary_range = input.salaryRange;
        if (input.benefits !== undefined)
            updates.benefits = input.benefits;
        if (input.visaSponsorship !== undefined)
            updates.visa_sponsorship = input.visaSponsorship;
        if (input.workShift !== undefined)
            updates.work_shift = input.workShift;
        if (input.isFeatured !== undefined)
            updates.is_featured = input.isFeatured;
        if (input.status !== undefined) {
            const normalizedStatus = (input.status === 'published' || input.status === 'active') ? 'active' : input.status;
            updates.status = normalizedStatus;
            if (normalizedStatus === 'active' && !existing.published_at) {
                updates.published_at = new Date();
            }
        }
        updates.updated_at = new Date();
        await this.jobRepo.update(id, updates);
        // Audit log
        await this.auditRepo.logEvent({
            actor_admin_id: adminId,
            action: 'job_updated',
            resource_type: 'job',
            resource_id: id,
            client_ip: context.clientIp,
            request_id: context.requestId,
            details_json: JSON.stringify({
                updatedFields: Object.keys(updates),
            }),
        });
        const updated = await this.jobRepo.findById(id);
        return updated;
    }
    /**
     * Administrative safe delete for a job.
     */
    async deleteJob(id, adminId, context = {}) {
        const existing = await this.jobRepo.findById(id);
        if (!existing || existing.deleted_at) {
            throw new app_error_1.AppError('Job vacancy not found.', 404, 'JOB_NOT_FOUND');
        }
        // Soft delete preserves all application links and applicant documents
        await this.jobRepo.softDeleteJob(id);
        // Audit log
        await this.auditRepo.logEvent({
            actor_admin_id: adminId,
            action: 'job_deleted',
            resource_type: 'job',
            resource_id: id,
            client_ip: context.clientIp,
            request_id: context.requestId,
            details_json: JSON.stringify({
                title: existing.title,
                status: 'archived',
            }),
        });
    }
}
exports.JobService = JobService;
exports.jobService = new JobService();
