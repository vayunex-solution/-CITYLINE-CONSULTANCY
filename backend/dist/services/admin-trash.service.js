"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Trash & 30-Day Retention Service
 * Manages soft-deleted enquiries, applications, document file purging,
 * 30-day lifecycle countdowns, restoration, and permanent cleanup.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminTrashService = exports.AdminTrashService = void 0;
const connection_1 = require("../database/connection");
const storage_service_1 = require("./storage.service");
const audit_log_repository_1 = require("../repositories/audit-log.repository");
const app_error_1 = require("../utils/app-error");
const logger_1 = require("../utils/logger");
const database_error_1 = require("../database/database-error");
class AdminTrashService {
    db;
    storage;
    auditRepo;
    constructor(db = (0, connection_1.getDbClient)(), storage = storage_service_1.storageService, auditRepo = audit_log_repository_1.auditLogRepository) {
        this.db = db;
        this.storage = storage;
        this.auditRepo = auditRepo;
    }
    /**
     * Lists all soft-deleted records across enquiries and job applications.
     */
    async listTrashItems(search) {
        try {
            const db = this.db;
            // 1. Soft-deleted Enquiries
            let enquiryQuery = db('enquiries')
                .leftJoin('visa_enquiries', 'enquiries.id', 'visa_enquiries.enquiry_id')
                .leftJoin('visa_services', 'visa_enquiries.visa_service_id', 'visa_services.id')
                .whereNotNull('enquiries.deleted_at')
                .select('enquiries.id', 'enquiries.enquiry_type as enquiryType', 'enquiries.full_name as fullName', 'enquiries.email', 'enquiries.phone', 'enquiries.status', 'enquiries.subject', 'enquiries.deleted_at as deletedAt', 'visa_services.title as visaTitle');
            // 2. Soft-deleted Job Applications
            let jobAppQuery = db('job_applications')
                .leftJoin('jobs', 'job_applications.job_id', 'jobs.id')
                .whereNotNull('job_applications.deleted_at')
                .select('job_applications.id', 'job_applications.applicant_name as fullName', 'job_applications.email', 'job_applications.phone', 'job_applications.status', 'job_applications.reference_number as referenceNumber', 'job_applications.deleted_at as deletedAt', 'jobs.title as jobTitle');
            if (search && search.trim()) {
                const term = `%${search.trim()}%`;
                enquiryQuery = enquiryQuery.where((builder) => {
                    builder
                        .where('enquiries.full_name', 'like', term)
                        .orWhere('enquiries.email', 'like', term)
                        .orWhere('enquiries.phone', 'like', term)
                        .orWhere('enquiries.subject', 'like', term);
                });
                jobAppQuery = jobAppQuery.where((builder) => {
                    builder
                        .where('job_applications.applicant_name', 'like', term)
                        .orWhere('job_applications.email', 'like', term)
                        .orWhere('job_applications.phone', 'like', term)
                        .orWhere('jobs.title', 'like', term);
                });
            }
            const [enquiryRows, jobAppRows] = await Promise.all([enquiryQuery, jobAppQuery]);
            // 3. Attach document counts
            const allEntityIds = [...enquiryRows.map((r) => r.id), ...jobAppRows.map((r) => r.id)];
            let docCountMap = {};
            if (allEntityIds.length > 0) {
                const docCounts = await db('documents')
                    .whereIn('entity_id', allEntityIds)
                    .groupBy('entity_id')
                    .select('entity_id', db.raw('COUNT(id) as count'));
                for (const dc of docCounts) {
                    docCountMap[dc.entity_id] = Number(dc.count || 0);
                }
            }
            const items = [];
            for (const r of enquiryRows) {
                const deletedTime = new Date(r.deletedAt).getTime();
                const purgeTime = deletedTime + 30 * 24 * 60 * 60 * 1000;
                const msRemaining = purgeTime - Date.now();
                const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
                const isVisa = r.enquiryType === 'visa' || !!r.visaTitle;
                items.push({
                    id: r.id,
                    type: isVisa ? 'visa_enquiry' : 'business_enquiry',
                    typeLabel: isVisa ? 'Visa Enquiry' : 'Contact Lead',
                    reference: r.subject || (isVisa ? (r.visaTitle ? `Visa: ${r.visaTitle}` : 'Visa Enquiry') : 'Consultation Enquiry'),
                    applicantName: r.fullName || 'Anonymous User',
                    email: r.email,
                    phone: r.phone,
                    status: r.status,
                    deletedAt: new Date(r.deletedAt).toISOString(),
                    daysRemaining,
                    expiresAt: new Date(purgeTime).toISOString(),
                    documentCount: docCountMap[r.id] || 0,
                });
            }
            for (const r of jobAppRows) {
                const deletedTime = new Date(r.deletedAt).getTime();
                const purgeTime = deletedTime + 30 * 24 * 60 * 60 * 1000;
                const msRemaining = purgeTime - Date.now();
                const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
                items.push({
                    id: r.id,
                    type: 'job_application',
                    typeLabel: 'Job Application',
                    reference: r.referenceNumber || (r.jobTitle ? `Applied: ${r.jobTitle}` : 'Job Application'),
                    applicantName: r.fullName || 'Candidate',
                    email: r.email,
                    phone: r.phone,
                    status: r.status,
                    deletedAt: new Date(r.deletedAt).toISOString(),
                    daysRemaining,
                    expiresAt: new Date(purgeTime).toISOString(),
                    documentCount: docCountMap[r.id] || 0,
                });
            }
            // Sort by deletion timestamp descending (newest deletions first)
            items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
            return {
                items,
                total: items.length,
            };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AdminTrashService.listTrashItems');
        }
    }
    /**
     * Restores a soft-deleted item back to active status.
     */
    async restoreTrashItem(type, id, actor) {
        try {
            const db = this.db;
            if (type === 'job_application') {
                const updated = await db('job_applications')
                    .where({ id })
                    .whereNotNull('deleted_at')
                    .update({
                    deleted_at: null,
                    status: 'new',
                    updated_at: db.fn.now(),
                });
                if (!updated)
                    throw new app_error_1.AppError('Job application not found in trash.', 404, 'NOT_FOUND');
            }
            else {
                const updated = await db('enquiries')
                    .where({ id })
                    .whereNotNull('deleted_at')
                    .update({
                    deleted_at: null,
                    status: 'new',
                    updated_at: db.fn.now(),
                });
                if (!updated)
                    throw new app_error_1.AppError('Enquiry not found in trash.', 404, 'NOT_FOUND');
            }
            void this.auditRepo.logEvent({
                action: 'trash_item_restored',
                resource_type: type,
                resource_id: id,
                actor_admin_id: actor.adminId || null,
                client_ip: actor.ip,
                details_json: JSON.stringify({
                    restoredBy: actor.adminEmail || 'admin',
                    type,
                }),
            });
            logger_1.logger.info(`Trash item restored: ${type} ${id} by ${actor.adminEmail || 'admin'}`);
        }
        catch (err) {
            if (err instanceof app_error_1.AppError)
                throw err;
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AdminTrashService.restoreTrashItem');
        }
    }
    /**
     * Permanently deletes a specific item and all associated physical documents.
     */
    async permanentlyDeleteItem(type, id, actor) {
        try {
            const db = this.db;
            // 1. Fetch any attached documents
            const docs = await db('documents')
                .where({ entity_id: id })
                .select('id', 'storage_key');
            // 2. Cleanup physical files from disk
            if (docs.length > 0) {
                const pathsToClean = [];
                for (const doc of docs) {
                    try {
                        const abs = this.storage.getAbsolutePath(doc.storage_key);
                        pathsToClean.push(abs);
                    }
                    catch {
                        // ignore path resolution failure
                    }
                }
                if (pathsToClean.length > 0) {
                    await this.storage.cleanupFiles(pathsToClean);
                }
                // Remove document records
                await db('documents').where({ entity_id: id }).delete();
            }
            // 3. Remove entity records
            if (type === 'job_application') {
                await db('job_applications').where({ id }).delete();
            }
            else {
                await db('business_setup_enquiries').where({ enquiry_id: id }).delete();
                await db('visa_enquiries').where({ enquiry_id: id }).delete();
                await db('manpower_enquiries').where({ enquiry_id: id }).delete();
                await db('enquiries').where({ id }).delete();
            }
            // 4. Remove any outbox queue records referencing this entity
            await db('notification_queue').where({ reference_id: id }).delete();
            void this.auditRepo.logEvent({
                action: 'trash_item_permanently_deleted',
                resource_type: type,
                resource_id: id,
                actor_admin_id: actor.adminId || null,
                client_ip: actor.ip,
                details_json: JSON.stringify({
                    purgedBy: actor.adminEmail || 'admin',
                    type,
                    filesPurged: docs.length,
                }),
            });
            logger_1.logger.info(`Trash item permanently deleted: ${type} ${id} (Files purged: ${docs.length})`);
        }
        catch (err) {
            if (err instanceof app_error_1.AppError)
                throw err;
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AdminTrashService.permanentlyDeleteItem');
        }
    }
    /**
     * Purges all trash items older than retentionDays (defaults to 30 days).
     */
    async purgeExpiredTrash(retentionDays = 30, actor) {
        try {
            const db = this.db;
            const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
            // Find expired enquiries
            const expiredEnquiries = await db('enquiries')
                .whereNotNull('deleted_at')
                .where('deleted_at', '<=', cutoffDate)
                .select('id', 'enquiry_type');
            // Find expired job applications
            const expiredJobApps = await db('job_applications')
                .whereNotNull('deleted_at')
                .where('deleted_at', '<=', cutoffDate)
                .select('id');
            let purgedCount = 0;
            for (const e of expiredEnquiries) {
                await this.permanentlyDeleteItem(e.enquiry_type === 'visa' ? 'visa_enquiry' : 'business_enquiry', e.id, actor || {});
                purgedCount++;
            }
            for (const j of expiredJobApps) {
                await this.permanentlyDeleteItem('job_application', j.id, actor || {});
                purgedCount++;
            }
            logger_1.logger.info(`Purged ${purgedCount} expired trash items older than ${retentionDays} days`);
            return { purgedCount };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AdminTrashService.purgeExpiredTrash');
        }
    }
    /**
     * Empties all items currently in Trash immediately.
     */
    async emptyAllTrash(actor) {
        return await this.purgeExpiredTrash(0, actor);
    }
}
exports.AdminTrashService = AdminTrashService;
exports.adminTrashService = new AdminTrashService();
