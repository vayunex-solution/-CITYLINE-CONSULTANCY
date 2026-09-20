"use strict";
/**
 * CITYLINE CONSULTANCY — Phase 11 Admin Dashboard & Management Service
 * Aggregates real backend data for the management console, oversees visa enquiries,
 * notification queue diagnostics, safe retries, and operational audit logs.
 *
 * GOVERNANCE:
 * - 100% API/Database driven metrics (Zero invented or hardcoded numbers).
 * - Document storage paths and credentials strictly redacted.
 * - All state mutations trigger immutable audit logging.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDashboardService = exports.AdminDashboardService = void 0;
const connection_1 = require("../database/connection");
const database_error_1 = require("../database/database-error");
const audit_log_repository_1 = require("../repositories/audit-log.repository");
const app_error_1 = require("../utils/app-error");
const logger_1 = require("../utils/logger");
class AdminDashboardService {
    get db() {
        return (0, connection_1.getDbClient)();
    }
    /**
     * Aggregates real-time counts and operational metrics across the system.
     */
    async getDashboardStats() {
        try {
            const db = this.db;
            // 1. Enquiries Counts
            const totalEnquiriesRow = await db('enquiries')
                .whereNull('deleted_at')
                .count('id as count')
                .first();
            const totalEnquiries = Number(totalEnquiriesRow?.count || 0);
            const newEnquiriesRow = await db('enquiries')
                .whereNull('deleted_at')
                .where('status', 'new')
                .count('id as count')
                .first();
            const newEnquiries = Number(newEnquiriesRow?.count || 0);
            const visaTotalRow = await db('enquiries')
                .whereNull('deleted_at')
                .where('enquiry_type', 'visa_enquiry')
                .count('id as count')
                .first();
            const visaTotal = Number(visaTotalRow?.count || 0);
            const visaNewRow = await db('enquiries')
                .whereNull('deleted_at')
                .where('enquiry_type', 'visa_enquiry')
                .where('status', 'new')
                .count('id as count')
                .first();
            const visaNew = Number(visaNewRow?.count || 0);
            // Manpower Enquiries
            const manpowerTotalRow = await db('manpower_enquiries')
                .join('enquiries', 'manpower_enquiries.enquiry_id', 'enquiries.id')
                .whereNull('enquiries.deleted_at')
                .count('manpower_enquiries.id as count')
                .first();
            const manpowerTotal = Number(manpowerTotalRow?.count || 0);
            const manpowerNewRow = await db('manpower_enquiries')
                .join('enquiries', 'manpower_enquiries.enquiry_id', 'enquiries.id')
                .whereNull('enquiries.deleted_at')
                .where('manpower_enquiries.status', 'new')
                .count('manpower_enquiries.id as count')
                .first();
            const manpowerNew = Number(manpowerNewRow?.count || 0);
            // 2. Recruitment & Jobs Counts
            const jobsTotalRow = await db('jobs')
                .whereNull('deleted_at')
                .count('id as count')
                .first();
            const totalJobs = Number(jobsTotalRow?.count || 0);
            const activeJobsRow = await db('jobs')
                .whereNull('deleted_at')
                .where('status', 'active')
                .count('id as count')
                .first();
            const activeJobs = Number(activeJobsRow?.count || 0);
            const appsTotalRow = await db('job_applications')
                .whereNull('deleted_at')
                .count('id as count')
                .first();
            const totalApplications = Number(appsTotalRow?.count || 0);
            const newAppsRow = await db('job_applications')
                .whereNull('deleted_at')
                .where('status', 'new')
                .count('id as count')
                .first();
            const newApplications = Number(newAppsRow?.count || 0);
            // 3. Testimonials Counts
            const totalTestimonialsRow = await db('testimonials')
                .whereNull('deleted_at')
                .count('id as count')
                .first();
            const totalTestimonials = Number(totalTestimonialsRow?.count || 0);
            const publishedTestimonialsRow = await db('testimonials')
                .whereNull('deleted_at')
                .where('is_published', 1)
                .count('id as count')
                .first();
            const publishedTestimonials = Number(publishedTestimonialsRow?.count || 0);
            // 4. Notification Queue Health
            const queueCounts = await db('notification_queue')
                .select('status')
                .count('id as count')
                .groupBy('status');
            const queueStats = {
                pending: 0,
                processing: 0,
                sent: 0,
                failed: 0,
                exhausted: 0,
                total: 0,
            };
            for (const row of queueCounts) {
                const count = Number(row.count || 0);
                const status = row.status;
                if (queueStats[status] !== undefined) {
                    queueStats[status] = count;
                }
                queueStats.total += count;
            }
            // 5. Real Recent Activity (Latest Enquiries & Applications)
            const recentEnquiries = await db('enquiries')
                .whereNull('deleted_at')
                .orderBy('created_at', 'desc')
                .limit(5)
                .select('id', 'enquiry_type', 'full_name', 'status', 'created_at');
            const recentApps = await db('job_applications')
                .whereNull('deleted_at')
                .orderBy('created_at', 'desc')
                .limit(5)
                .select('id', 'applicant_name', 'status', 'created_at');
            const recentActivity = [
                ...recentEnquiries.map((e) => ({
                    id: e.id,
                    type: (e.enquiry_type === 'visa_enquiry' ? 'visa_enquiry' : 'manpower_enquiry'),
                    title: `${e.full_name} (${e.enquiry_type})`,
                    status: e.status,
                    createdAt: e.created_at,
                })),
                ...recentApps.map((a) => ({
                    id: a.id,
                    type: 'job_application',
                    title: `Application from ${a.applicant_name}`,
                    status: a.status,
                    createdAt: a.created_at,
                })),
            ]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 8);
            return {
                enquiries: {
                    total: totalEnquiries,
                    new: newEnquiries,
                    visaTotal,
                    visaNew,
                    manpowerTotal,
                    manpowerNew,
                },
                recruitment: {
                    totalJobs,
                    activeJobs,
                    totalApplications,
                    newApplications,
                },
                testimonials: {
                    total: totalTestimonials,
                    published: publishedTestimonials,
                },
                notificationQueue: queueStats,
                recentActivity,
            };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AdminDashboardService.getDashboardStats');
        }
    }
    /**
     * Paginated listing of Visa Enquiries with search, status filtering, and document counts.
     */
    async listVisaEnquiries(params) {
        try {
            const db = this.db;
            const { page, limit, status, search } = params;
            const offset = (page - 1) * limit;
            let baseQuery = db('enquiries')
                .leftJoin('visa_enquiries', 'enquiries.id', 'visa_enquiries.enquiry_id')
                .leftJoin('visa_services', 'visa_enquiries.visa_service_id', 'visa_services.id')
                .whereNull('enquiries.deleted_at');
            if (status && status !== 'all') {
                baseQuery = baseQuery.where('enquiries.status', status);
            }
            if (search && search.trim()) {
                const term = `%${search.trim()}%`;
                baseQuery = baseQuery.where((builder) => {
                    builder
                        .where('enquiries.full_name', 'like', term)
                        .orWhere('enquiries.email', 'like', term)
                        .orWhere('enquiries.phone', 'like', term)
                        .orWhere('visa_services.title', 'like', term)
                        .orWhere('enquiries.subject', 'like', term);
                });
            }
            const countRow = await baseQuery.clone().count('enquiries.id as count').first();
            const total = Number(countRow?.count || 0);
            const rows = await baseQuery
                .clone()
                .select('enquiries.id', 'enquiries.status', 'enquiries.full_name as fullName', 'enquiries.email', 'enquiries.phone', 'enquiries.whatsapp', 'enquiries.nationality', 'enquiries.created_at as createdAt', 'visa_enquiries.duration_days as durationDays', db.raw('COALESCE(visa_enquiries.applicant_count, 1) as applicantCount'), 'visa_enquiries.intended_travel_date as intendedTravelDate', db.raw('COALESCE(visa_services.title, enquiries.subject, enquiries.enquiry_type) as serviceTitle'), 'visa_services.slug as serviceSlug')
                .orderBy('enquiries.created_at', 'desc')
                .limit(limit)
                .offset(offset);
            // Fetch document counts for these enquiry IDs
            const enquiryIds = rows.map((r) => r.id);
            const docCountMap = {};
            if (enquiryIds.length > 0) {
                const docCounts = await db('documents')
                    .where('entity_type', 'enquiry')
                    .whereIn('entity_id', enquiryIds)
                    .select('entity_id')
                    .count('id as count')
                    .groupBy('entity_id');
                for (const dc of docCounts) {
                    docCountMap[dc.entity_id] = Number(dc.count || 0);
                }
            }
            const items = rows.map((r) => ({
                ...r,
                documentCount: docCountMap[r.id] || 0,
            }));
            return {
                items,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AdminDashboardService.listVisaEnquiries');
        }
    }
    /**
     * Retrieves single visa enquiry details with strictly sanitized document metadata.
     */
    async getVisaEnquiryById(id) {
        try {
            const db = this.db;
            const row = await db('enquiries')
                .leftJoin('visa_enquiries', 'enquiries.id', 'visa_enquiries.enquiry_id')
                .leftJoin('visa_services', 'visa_enquiries.visa_service_id', 'visa_services.id')
                .where('enquiries.id', id)
                .whereNull('enquiries.deleted_at')
                .select('enquiries.id', 'enquiries.status', 'enquiries.assigned_admin_id as assignedAdminId', 'enquiries.full_name as fullName', 'enquiries.email', 'enquiries.phone', 'enquiries.whatsapp', 'enquiries.nationality', 'enquiries.message', 'enquiries.subject', 'enquiries.enquiry_type as enquiryType', 'enquiries.created_at as createdAt', 'enquiries.updated_at as updatedAt', 'visa_enquiries.duration_days as durationDays', db.raw('COALESCE(visa_enquiries.applicant_count, 1) as applicantCount'), 'visa_enquiries.intended_travel_date as intendedTravelDate', 'visa_enquiries.notes', 'visa_services.id as serviceId', db.raw('COALESCE(visa_services.title, enquiries.subject, enquiries.enquiry_type) as serviceTitle'), 'visa_services.slug as serviceSlug')
                .first();
            if (!row) {
                throw new app_error_1.AppError('Enquiry not found.', 404, 'ENQUIRY_NOT_FOUND');
            }
            // Safe document metadata: NEVER expose storage_key or file paths!
            const documents = await db('documents')
                .where({ entity_type: 'enquiry', entity_id: id })
                .select('id', 'document_category as category', 'original_filename as filename', 'file_size_bytes as sizeBytes', 'mime_type as mimeType', 'validation_status as validationStatus', 'malware_scan_status as malwareScanStatus', 'created_at as createdAt');
            return {
                enquiry: row,
                documents,
            };
        }
        catch (err) {
            if (err instanceof app_error_1.AppError)
                throw err;
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AdminDashboardService.getVisaEnquiryById');
        }
    }
    /**
     * Updates visa enquiry status with audit logging.
     */
    async updateVisaEnquiryStatus(id, input, actor) {
        try {
            const db = this.db;
            const existing = await db('enquiries')
                .where({ id })
                .whereNull('deleted_at')
                .first();
            if (!existing) {
                throw new app_error_1.AppError('Enquiry not found.', 404, 'ENQUIRY_NOT_FOUND');
            }
            const isRejecting = input.status === 'rejected';
            await db('enquiries')
                .where({ id })
                .update({
                status: input.status,
                ...(isRejecting ? { deleted_at: db.fn.now() } : {}),
                updated_at: db.fn.now(),
            });
            logger_1.logger.info(`Visa Enquiry ${id} status updated to '${input.status}' by ${actor.adminEmail || 'admin'}`);
            await audit_log_repository_1.auditLogRepository.logEvent({
                actor_admin_id: actor.adminId,
                action: 'visa_enquiry_status_updated',
                resource_type: 'visa_enquiry',
                resource_id: id,
                client_ip: actor.ip,
                details_json: JSON.stringify({
                    previousStatus: existing.status,
                    newStatus: input.status,
                    adminNotes: input.adminNotes,
                    adminEmail: actor.adminEmail,
                }),
            });
            return { success: true, status: input.status };
        }
        catch (err) {
            if (err instanceof app_error_1.AppError)
                throw err;
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AdminDashboardService.updateVisaEnquiryStatus');
        }
    }
    /**
     * Explicitly moves a visa enquiry to trash.
     */
    async moveVisaEnquiryToTrash(id, actor) {
        try {
            const db = this.db;
            const existing = await db('enquiries').where({ id }).whereNull('deleted_at').first();
            if (!existing)
                throw new app_error_1.AppError('Enquiry not found.', 404, 'ENQUIRY_NOT_FOUND');
            await db('enquiries').where({ id }).update({
                deleted_at: db.fn.now(),
                status: 'rejected',
                updated_at: db.fn.now(),
            });
            await audit_log_repository_1.auditLogRepository.logEvent({
                actor_admin_id: actor.adminId,
                action: 'visa_enquiry_moved_to_trash',
                resource_type: 'visa_enquiry',
                resource_id: id,
                client_ip: actor.ip,
                details_json: JSON.stringify({ previousStatus: existing.status }),
            });
            return { success: true, message: 'Enquiry moved to Trash.' };
        }
        catch (err) {
            if (err instanceof app_error_1.AppError)
                throw err;
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AdminDashboardService.moveVisaEnquiryToTrash');
        }
    }
    /**
     * Paginated listing of the Outbox Notification Queue.
     * NEVER exposes credentials or SMTP passwords.
     */
    async listNotifications(params) {
        try {
            const db = this.db;
            const { page, limit, status, search } = params;
            const offset = (page - 1) * limit;
            let baseQuery = db('notification_queue');
            if (status && status !== 'all') {
                baseQuery = baseQuery.where('status', status);
            }
            if (search && search.trim()) {
                const term = `%${search.trim()}%`;
                baseQuery = baseQuery.where((builder) => {
                    builder
                        .where('recipient_email', 'like', term)
                        .orWhere('subject', 'like', term)
                        .orWhere('reference_id', 'like', term);
                });
            }
            const countRow = await baseQuery.clone().count('id as count').first();
            const total = Number(countRow?.count || 0);
            const items = await baseQuery
                .clone()
                .select('id', 'notification_type as notificationType', 'reference_id as referenceId', 'recipient_email as recipientEmail', 'subject', 'status', 'retry_count as retryCount', 'next_retry_at as nextRetryAt', 'last_error as lastError', 'sent_at as sentAt', 'created_at as createdAt', 'updated_at as updatedAt')
                .orderBy('created_at', 'desc')
                .limit(limit)
                .offset(offset);
            return {
                items,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AdminDashboardService.listNotifications');
        }
    }
    /**
     * Safely retries a failed or exhausted notification with audit log.
     */
    async retryNotification(id, actor) {
        try {
            const db = this.db;
            const existing = await db('notification_queue').where({ id }).first();
            if (!existing) {
                throw new app_error_1.AppError('Notification not found in queue.', 404, 'NOTIFICATION_NOT_FOUND');
            }
            if (existing.status === 'sent') {
                throw new app_error_1.AppError('Notification has already been sent successfully.', 400, 'ALREADY_SENT');
            }
            await db('notification_queue')
                .where({ id })
                .update({
                status: 'pending',
                retry_count: 0,
                next_retry_at: db.fn.now(),
                last_error: null,
                updated_at: db.fn.now(),
            });
            logger_1.logger.info(`Notification #${id} queued for retry by ${actor.adminEmail || 'admin'}`);
            await audit_log_repository_1.auditLogRepository.logEvent({
                actor_admin_id: actor.adminId,
                action: 'notification_retried',
                resource_type: 'notification_queue',
                resource_id: id,
                client_ip: actor.ip,
                details_json: JSON.stringify({
                    recipientEmail: existing.recipient_email,
                    previousStatus: existing.status,
                    adminEmail: actor.adminEmail,
                }),
            });
            return { success: true, message: 'Notification queued for immediate retry.' };
        }
        catch (err) {
            if (err instanceof app_error_1.AppError)
                throw err;
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AdminDashboardService.retryNotification');
        }
    }
    /**
     * Paginated listing of audit logs with actor details.
     */
    async listAuditLogs(params) {
        try {
            const db = this.db;
            const { page, limit, action, resourceType, search } = params;
            const offset = (page - 1) * limit;
            let baseQuery = db('audit_logs')
                .leftJoin('admin_users', 'audit_logs.actor_admin_id', 'admin_users.id');
            if (action && action.trim()) {
                baseQuery = baseQuery.where('audit_logs.action', action.trim());
            }
            if (resourceType && resourceType.trim()) {
                baseQuery = baseQuery.where('audit_logs.resource_type', resourceType.trim());
            }
            if (search && search.trim()) {
                const term = `%${search.trim()}%`;
                baseQuery = baseQuery.where((builder) => {
                    builder
                        .where('audit_logs.action', 'like', term)
                        .orWhere('audit_logs.resource_id', 'like', term)
                        .orWhere('admin_users.username', 'like', term)
                        .orWhere('audit_logs.details_json', 'like', term);
                });
            }
            const countRow = await baseQuery.clone().count('audit_logs.id as count').first();
            const total = Number(countRow?.count || 0);
            const items = await baseQuery
                .clone()
                .select('audit_logs.id', 'audit_logs.actor_admin_id as actorAdminId', 'admin_users.username as actorUsername', 'admin_users.full_name as actorFullName', 'audit_logs.action', 'audit_logs.resource_type as resourceType', 'audit_logs.resource_id as resourceId', 'audit_logs.client_ip as clientIp', 'audit_logs.details_json as detailsJson', 'audit_logs.created_at as createdAt')
                .orderBy('audit_logs.created_at', 'desc')
                .limit(limit)
                .offset(offset);
            return {
                items,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AdminDashboardService.listAuditLogs');
        }
    }
}
exports.AdminDashboardService = AdminDashboardService;
exports.adminDashboardService = new AdminDashboardService();
