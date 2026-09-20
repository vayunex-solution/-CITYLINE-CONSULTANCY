"use strict";
/**
 * CITYLINE CONSULTANCY — Job Application Repository
 * Manages database persistence for candidate job applications.
 *
 * GOVERNANCE:
 * - Atomic persistence of candidate applications and reference numbers.
 * - Idempotency support: checks idempotency_key and recent submission windows without permanently blocking future applications.
 * - Safe admin listing and status updates.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobApplicationRepository = exports.JobApplicationRepository = void 0;
const base_repository_1 = require("./base.repository");
const database_error_1 = require("../database/database-error");
class JobApplicationRepository extends base_repository_1.AbstractKnexRepository {
    tableName = 'job_applications';
    /**
     * Inserts a candidate job application within an active transaction.
     */
    async createApplication(data, trx) {
        try {
            await trx('job_applications').insert({
                ...data,
                created_at: trx.fn.now(),
                updated_at: trx.fn.now(),
            });
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobApplicationRepository.createApplication');
        }
    }
    /**
     * Resolves an application by its public reference number (e.g. CLC-J-YYYY-XXXXXXXX).
     */
    async findByReference(reference, trx) {
        try {
            const row = await this.getQuery(trx)
                .from('job_applications')
                .join('jobs', 'job_applications.job_id', 'jobs.id')
                .where('job_applications.reference_number', reference.trim().toUpperCase())
                .whereNull('job_applications.deleted_at')
                .select('job_applications.*', 'jobs.title as job_title', 'jobs.slug as job_slug')
                .first();
            return row || null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobApplicationRepository.findByReference');
        }
    }
    /**
     * Resolves an application by its client idempotency key.
     */
    async findByIdempotencyKey(key, trx) {
        try {
            const row = await this.getQuery(trx)
                .from('job_applications')
                .where('idempotency_key', key.trim())
                .whereNull('deleted_at')
                .first();
            return row || null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobApplicationRepository.findByIdempotencyKey');
        }
    }
    /**
     * Checks whether an identical application was submitted within a recent short window (e.g. 15 minutes)
     * to suppress accidental double-clicks without permanently blocking future applications.
     */
    async findRecentDuplicate(jobId, email, windowMs = 15 * 60 * 1000, trx) {
        try {
            const cutoff = new Date(Date.now() - windowMs);
            const row = await this.getQuery(trx)
                .from('job_applications')
                .where({
                job_id: jobId,
                email: email.trim().toLowerCase(),
            })
                .where('created_at', '>=', cutoff)
                .whereNull('deleted_at')
                .orderBy('created_at', 'desc')
                .first();
            return row || null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobApplicationRepository.findRecentDuplicate');
        }
    }
    /**
     * Lists applications for administrative review with filtering and pagination.
     */
    async listApplications(params = {}, trx) {
        try {
            const page = Math.max(1, params.page || 1);
            const limit = Math.min(50, Math.max(1, params.limit || 20));
            const offset = (page - 1) * limit;
            const baseQuery = this.getQuery(trx)
                .from('job_applications')
                .join('jobs', 'job_applications.job_id', 'jobs.id')
                .leftJoin('job_categories', 'jobs.category_id', 'job_categories.id')
                .whereNull('job_applications.deleted_at');
            if (params.jobId && params.jobId.trim()) {
                baseQuery.where('job_applications.job_id', params.jobId.trim());
            }
            if (params.status && params.status.trim()) {
                baseQuery.where('job_applications.status', params.status.trim().toLowerCase());
            }
            if (params.search && params.search.trim()) {
                const term = `%${params.search.trim().toLowerCase()}%`;
                baseQuery.where((b) => {
                    b.whereRaw('LOWER(job_applications.applicant_name) LIKE ?', [term])
                        .orWhereRaw('LOWER(job_applications.email) LIKE ?', [term])
                        .orWhereRaw('LOWER(job_applications.phone) LIKE ?', [term])
                        .orWhereRaw('LOWER(job_applications.reference_number) LIKE ?', [term])
                        .orWhereRaw('LOWER(jobs.title) LIKE ?', [term]);
                });
            }
            const countResult = await baseQuery.clone().count('job_applications.id as count').first();
            const total = countResult ? parseInt(String(countResult.count), 10) : 0;
            const rows = await baseQuery
                .clone()
                .select('job_applications.*', 'jobs.title as job_title', 'jobs.slug as job_slug', 'job_categories.name as job_category_name')
                .orderBy('job_applications.created_at', 'desc')
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
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobApplicationRepository.listApplications');
        }
    }
    /**
     * Resolves a single application with associated job and document metadata for administrative review.
     */
    async findByIdWithDetails(id, trx) {
        try {
            const app = await this.getQuery(trx)
                .from('job_applications')
                .join('jobs', 'job_applications.job_id', 'jobs.id')
                .leftJoin('job_categories', 'jobs.category_id', 'job_categories.id')
                .where('job_applications.id', id)
                .whereNull('job_applications.deleted_at')
                .select('job_applications.*', 'jobs.title as job_title', 'jobs.slug as job_slug', 'job_categories.name as job_category_name')
                .first();
            if (!app)
                return null;
            const documents = await this.getQuery(trx)
                .from('documents')
                .where({
                entity_type: 'job_application',
                entity_id: id,
            })
                .select('id', 'document_category', 'original_filename', 'mime_type', 'file_extension', 'file_size_bytes', 'validation_status', 'malware_scan_status', 'created_at');
            return {
                application: app,
                documents,
            };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobApplicationRepository.findByIdWithDetails');
        }
    }
    /**
     * Updates application triage status.
     * If status is 'rejected', automatically soft-deletes into 30-day trash retention.
     */
    async updateStatus(id, status, adminNotes, trx) {
        try {
            const updatePayload = {
                status,
                updated_at: new Date(),
            };
            if (adminNotes !== undefined) {
                updatePayload.admin_notes = adminNotes;
            }
            if (status === 'rejected') {
                updatePayload.deleted_at = new Date();
            }
            await this.getQuery(trx)
                .from('job_applications')
                .where({ id })
                .update(updatePayload);
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobApplicationRepository.updateStatus');
        }
    }
    /**
     * Explicitly moves a job application to the 30-day trash bin.
     */
    async softDelete(id, trx) {
        try {
            await this.getQuery(trx)
                .from('job_applications')
                .where({ id })
                .update({
                deleted_at: new Date(),
                status: 'rejected',
                updated_at: new Date(),
            });
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'JobApplicationRepository.softDelete');
        }
    }
}
exports.JobApplicationRepository = JobApplicationRepository;
exports.jobApplicationRepository = new JobApplicationRepository();
