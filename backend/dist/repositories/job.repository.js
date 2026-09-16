"use strict";
/**
 * CITYLINE CONSULTANCY — Job Vacancy Repository
 * Manages database operations for the jobs and job_categories tables.
 *
 * GOVERNANCE:
 * - Public queries strictly filter for published/active vacancies where deleted_at IS NULL.
 * - Search is fully parameterized with strict input sanitization; no raw SQL concatenation.
 * - Deletion safety: protects against cascading or accidental deletion of jobs with dependent applications.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobRepository = exports.JobRepository = exports.CANONICAL_PUBLIC_JOB_STATUS = void 0;
const base_repository_1 = require("./base.repository");
const database_error_1 = require("../database/database-error");
const app_error_1 = require("../utils/app-error");
exports.CANONICAL_PUBLIC_JOB_STATUS = 'active';
class JobRepository extends base_repository_1.AbstractKnexRepository {
    tableName = 'jobs';
    /**
     * Queries publicly published jobs with pagination, filtering, and search.
     * Public visibility strictly enforces: status IN ('active', 'published') and deleted_at IS NULL.
     */
    async findPublishedJobs(params = {}, trx) {
        try {
            const page = Math.max(1, params.page || 1);
            const limit = Math.min(50, Math.max(1, params.limit || 12));
            const offset = (page - 1) * limit;
            const baseQuery = this.getQuery(trx)
                .from('jobs')
                .join('job_categories', 'jobs.category_id', 'job_categories.id')
                .whereNull('jobs.deleted_at')
                .where('jobs.status', exports.CANONICAL_PUBLIC_JOB_STATUS);
            // 1. Category filter (by slug or name or ID)
            if (params.category && params.category.trim()) {
                const cat = params.category.trim().toLowerCase();
                baseQuery.where((b) => {
                    b.whereRaw('LOWER(job_categories.slug) = ?', [cat])
                        .orWhereRaw('LOWER(job_categories.name) = ?', [cat]);
                });
            }
            // 2. Location filter
            if (params.location && params.location.trim()) {
                const loc = `%${params.location.trim().toLowerCase()}%`;
                baseQuery.whereRaw('LOWER(jobs.location) LIKE ?', [loc]);
            }
            // 3. Employment type filter
            if (params.employmentType && params.employmentType.trim()) {
                const empType = params.employmentType.trim().toLowerCase();
                baseQuery.whereRaw('LOWER(jobs.employment_type) = ?', [empType]);
            }
            // 4. Keyword search (title, description, location, category name)
            if (params.search && params.search.trim()) {
                const term = `%${params.search.trim().toLowerCase()}%`;
                baseQuery.where((b) => {
                    b.whereRaw('LOWER(jobs.title) LIKE ?', [term])
                        .orWhereRaw('LOWER(jobs.location) LIKE ?', [term])
                        .orWhereRaw('LOWER(jobs.description) LIKE ?', [term])
                        .orWhereRaw('LOWER(job_categories.name) LIKE ?', [term]);
                });
            }
            // Count query
            const countResult = await baseQuery.clone().count('jobs.id as count').first();
            const total = countResult ? parseInt(String(countResult.count), 10) : 0;
            const totalPages = Math.ceil(total / limit);
            // Data query with ordering
            const rows = await baseQuery
                .clone()
                .select('jobs.*', 'job_categories.name as category_name', 'job_categories.slug as category_slug')
                .orderBy('jobs.is_featured', 'desc')
                .orderBy('jobs.created_at', 'desc')
                .limit(limit)
                .offset(offset);
            return {
                data: rows,
                total,
                page,
                limit,
                totalPages,
            };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobRepository.findPublishedJobs');
        }
    }
    /**
     * Resolves a single published job by slug.
     * Returns null if not found, draft, archived, or soft-deleted.
     */
    async findPublishedBySlug(slug, trx) {
        try {
            const normalizedSlug = slug.trim().toLowerCase();
            const row = await this.getQuery(trx)
                .from('jobs')
                .join('job_categories', 'jobs.category_id', 'job_categories.id')
                .whereNull('jobs.deleted_at')
                .where('jobs.status', exports.CANONICAL_PUBLIC_JOB_STATUS)
                .where('jobs.slug', normalizedSlug)
                .select('jobs.*', 'job_categories.name as category_name', 'job_categories.slug as category_slug')
                .first();
            return row || null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobRepository.findPublishedBySlug');
        }
    }
    /**
     * Resolves a published job by ID or slug.
     */
    async findPublishedById(id, trx) {
        try {
            const row = await this.getQuery(trx)
                .from('jobs')
                .join('job_categories', 'jobs.category_id', 'job_categories.id')
                .whereNull('jobs.deleted_at')
                .where('jobs.status', exports.CANONICAL_PUBLIC_JOB_STATUS)
                .where('jobs.id', id)
                .select('jobs.*', 'job_categories.name as category_name', 'job_categories.slug as category_slug')
                .first();
            return row || null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobRepository.findPublishedById');
        }
    }
    /**
     * Fetches related published opportunities in the same category.
     */
    async findRelatedPublishedJobs(currentJobId, categoryId, limit = 3, trx) {
        try {
            const rows = await this.getQuery(trx)
                .from('jobs')
                .join('job_categories', 'jobs.category_id', 'job_categories.id')
                .whereNull('jobs.deleted_at')
                .where('jobs.status', exports.CANONICAL_PUBLIC_JOB_STATUS)
                .where('jobs.category_id', categoryId)
                .whereNot('jobs.id', currentJobId)
                .select('jobs.*', 'job_categories.name as category_name', 'job_categories.slug as category_slug')
                .orderBy('jobs.created_at', 'desc')
                .limit(limit);
            return rows;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobRepository.findRelatedPublishedJobs');
        }
    }
    /**
     * Retrieves all active categories with published job counts.
     */
    async findCategoriesWithCounts(trx) {
        try {
            const categories = await this.getQuery(trx)
                .from('job_categories')
                .where('is_active', true)
                .orderBy('display_order', 'asc');
            const counts = await this.getQuery(trx)
                .from('jobs')
                .whereNull('deleted_at')
                .where('status', exports.CANONICAL_PUBLIC_JOB_STATUS)
                .groupBy('category_id')
                .select('category_id')
                .count('id as count');
            const countMap = new Map();
            for (const c of counts) {
                countMap.set(c.category_id, parseInt(String(c.count), 10) || 0);
            }
            return categories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                display_order: cat.display_order,
                is_active: Boolean(cat.is_active),
                created_at: cat.created_at,
                updated_at: cat.updated_at,
                job_count: countMap.get(cat.id) || 0,
            }));
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobRepository.findCategoriesWithCounts');
        }
    }
    /**
     * Resolves category by ID.
     */
    async findCategoryById(id, trx) {
        try {
            const row = await this.getQuery(trx).from('job_categories').where({ id }).first();
            return row || null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobRepository.findCategoryById');
        }
    }
    /**
     * Counts existing applications referencing a job.
     */
    async countApplicationsForJob(jobId, trx) {
        try {
            const result = await this.getQuery(trx)
                .from('job_applications')
                .where('job_id', jobId)
                .whereNull('deleted_at')
                .count('id as count')
                .first();
            return result ? parseInt(String(result.count), 10) : 0;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobRepository.countApplicationsForJob');
        }
    }
    /**
     * Administrative method to query all jobs (including draft and archived).
     */
    async listAllJobs(params = {}, trx) {
        try {
            const page = Math.max(1, params.page || 1);
            const limit = Math.min(50, Math.max(1, params.limit || 20));
            const offset = (page - 1) * limit;
            const baseQuery = this.getQuery(trx)
                .from('jobs')
                .join('job_categories', 'jobs.category_id', 'job_categories.id')
                .whereNull('jobs.deleted_at');
            if (params.status && params.status.trim()) {
                baseQuery.where('jobs.status', params.status.trim().toLowerCase());
            }
            if (params.category && params.category.trim()) {
                baseQuery.where('job_categories.slug', params.category.trim().toLowerCase());
            }
            if (params.search && params.search.trim()) {
                const term = `%${params.search.trim().toLowerCase()}%`;
                baseQuery.where((b) => {
                    b.whereRaw('LOWER(jobs.title) LIKE ?', [term])
                        .orWhereRaw('LOWER(jobs.slug) LIKE ?', [term])
                        .orWhereRaw('LOWER(job_categories.name) LIKE ?', [term]);
                });
            }
            const countResult = await baseQuery.clone().count('jobs.id as count').first();
            const total = countResult ? parseInt(String(countResult.count), 10) : 0;
            const rows = await baseQuery
                .clone()
                .select('jobs.*', 'job_categories.name as category_name', 'job_categories.slug as category_slug')
                .orderBy('jobs.created_at', 'desc')
                .limit(limit)
                .offset(offset);
            return {
                data: rows,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobRepository.listAllJobs');
        }
    }
    /**
     * Safely soft-deletes a job vacancy. Preserves all linked candidate applications and documents.
     */
    async softDeleteJob(id, trx) {
        try {
            await this.getQuery(trx)
                .from('jobs')
                .where({ id })
                .update({
                status: 'archived',
                deleted_at: new Date(),
                updated_at: new Date(),
            });
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobRepository.softDeleteJob');
        }
    }
    /**
     * Hard-deletes a job vacancy ONLY if zero dependent applications exist.
     * Throws 409 Conflict if dependent candidate applications are present.
     */
    async hardDeleteJob(id, trx) {
        const appCount = await this.countApplicationsForJob(id, trx);
        if (appCount > 0) {
            throw new app_error_1.AppError(`Cannot hard-delete job with ${appCount} existing candidate application(s). Please archive or soft-delete instead.`, 409, 'CANNOT_DELETE_JOB_WITH_APPLICATIONS');
        }
        try {
            await this.getQuery(trx).from('jobs').where({ id }).delete();
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobRepository.hardDeleteJob');
        }
    }
}
exports.JobRepository = JobRepository;
exports.jobRepository = new JobRepository();
