"use strict";
/**
 * CITYLINE CONSULTANCY — Notification Service
 * Orchestrates transactional outbox enqueueing, deterministic idempotency hashing,
 * atomic batch worker execution, exponential backoff retries, and dead-letter handling.
 *
 * GOVERNANCE:
 * - Decouples domain services from Nodemailer / SMTP transport.
 * - Outbox pattern: Enqueues notifications in the SAME MariaDB transaction as business models.
 * - SMTP availability NEVER impacts business entity creation or API responsiveness.
 * - Idempotency is enforced by unique SHA-256 event keys in MariaDB.
 * - Bounded batch execution compatible with cPanel cron and background workers.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_config_1 = require("../config/env.config");
const logger_1 = require("../utils/logger");
const notification_queue_repository_1 = require("../repositories/notification-queue.repository");
const smtp_transport_1 = require("../notifications/smtp-transport");
const app_setting_service_1 = require("./app-setting.service");
const templates_1 = require("../notifications/templates");
class NotificationService {
    queueRepo;
    transport;
    appSettings;
    constructor(queueRepo = notification_queue_repository_1.notificationQueueRepository, transport = smtp_transport_1.smtpTransportManager, appSettings = app_setting_service_1.appSettingService) {
        this.queueRepo = queueRepo;
        this.transport = transport;
        this.appSettings = appSettings;
    }
    /**
     * Resolves the primary administrative notification recipient email dynamically from DB settings.
     */
    async getAdminRecipientEmail() {
        return await this.appSettings.getAdminNotificationEmail();
    }
    /**
     * Generates a deterministic SHA-256 idempotency hash for an event.
     */
    generateIdempotencyHash(eventType, entityId, role) {
        return crypto_1.default
            .createHash('sha256')
            .update(`${eventType}:${entityId}:${role}`)
            .digest('hex');
    }
    /**
     * Transactionally enqueues both admin alert and applicant confirmation notifications
     * within an existing database transaction.
     *
     * If SMTP is unavailable, this method STILL succeeds because it only writes to the outbox table.
     */
    async enqueueVisaEnquiryNotifications(params, trx) {
        const adminId = crypto_1.default.randomUUID();
        const confirmationId = crypto_1.default.randomUUID();
        const submittedAtStr = new Date().toUTCString();
        const adminHash = this.generateIdempotencyHash('visa-enquiry', params.enquiryId, 'admin');
        const confirmationHash = this.generateIdempotencyHash('visa-enquiry', params.enquiryId, 'confirmation');
        // 1. Admin notification payload & subject
        const adminPayload = {
            reference: params.publicReference,
            fullName: params.fullName,
            email: params.email,
            phone: params.phone,
            whatsapp: params.whatsapp,
            nationality: params.nationality,
            serviceTitle: params.serviceTitle,
            applicantCount: params.applicantCount,
            timeline: params.timeline,
            details: params.details,
            documentsCount: params.documentsCount,
            submittedAt: submittedAtStr,
        };
        const adminSubject = `[Action Required] New Visa Enquiry — ${params.publicReference} (${params.serviceTitle})`;
        // 2. Applicant confirmation payload & subject
        const confirmationPayload = {
            reference: params.publicReference,
            fullName: params.fullName,
            serviceTitle: params.serviceTitle,
            applicantCount: params.applicantCount,
            documentsCount: params.documentsCount,
        };
        const confirmationSubject = `Enquiry Acknowledged: Visa Application Reference ${params.publicReference} — Cityline Consultancy`;
        const adminRecipient = await this.getAdminRecipientEmail();
        // 3. Batch enqueue to outbox table inside the same transaction
        await this.queueRepo.enqueueBatch([
            {
                id: adminId,
                notification_type: 'visa_enquiry_admin',
                reference_id: params.enquiryId,
                recipient_email: adminRecipient,
                subject: adminSubject,
                payload_json: JSON.stringify(adminPayload),
                idempotency_hash: adminHash,
            },
            {
                id: confirmationId,
                notification_type: 'visa_enquiry_confirmation',
                reference_id: params.enquiryId,
                recipient_email: params.email,
                subject: confirmationSubject,
                payload_json: JSON.stringify(confirmationPayload),
                idempotency_hash: confirmationHash,
            },
        ], trx);
        return {
            adminNotificationId: adminId,
            confirmationNotificationId: confirmationId,
        };
    }
    /**
     * Transactionally enqueues both admin alert and candidate confirmation notifications
     * for a job application within an existing database transaction.
     */
    async enqueueJobApplicationNotifications(params, trx) {
        const adminId = crypto_1.default.randomUUID();
        const confirmationId = crypto_1.default.randomUUID();
        const submittedAtStr = new Date().toUTCString();
        const adminHash = this.generateIdempotencyHash('job-application', params.applicationId, 'admin');
        const confirmationHash = this.generateIdempotencyHash('job-application', params.applicationId, 'confirmation');
        // 1. Admin notification payload & subject
        const adminPayload = {
            reference: params.publicReference,
            jobTitle: params.jobTitle,
            jobCategory: params.jobCategory,
            applicantName: params.applicantName,
            email: params.email,
            phone: params.phone,
            whatsapp: params.whatsapp,
            nationality: params.nationality,
            currentLocation: params.currentLocation,
            yearsExperience: params.yearsExperience,
            qualification: params.qualification,
            coverLetter: params.coverLetter,
            hasCv: params.hasCv,
            submittedAt: submittedAtStr,
        };
        const adminSubject = `[Recruitment Lead] New Application — ${params.publicReference} (${params.jobTitle})`;
        // 2. Candidate confirmation payload & subject
        const confirmationPayload = {
            reference: params.publicReference,
            applicantName: params.applicantName,
            jobTitle: params.jobTitle,
            jobCategory: params.jobCategory,
            hasCv: params.hasCv,
        };
        const confirmationSubject = `Application Acknowledged: ${params.jobTitle} (Ref: ${params.publicReference}) — Cityline Consultancy`;
        const adminRecipient = await this.getAdminRecipientEmail();
        // 3. Batch enqueue into notification_queue
        await this.queueRepo.enqueueBatch([
            {
                id: adminId,
                notification_type: 'job_application_admin',
                reference_id: params.applicationId,
                recipient_email: adminRecipient,
                subject: adminSubject,
                payload_json: JSON.stringify(adminPayload),
                idempotency_hash: adminHash,
            },
            {
                id: confirmationId,
                notification_type: 'job_application_confirmation',
                reference_id: params.applicationId,
                recipient_email: params.email,
                subject: confirmationSubject,
                payload_json: JSON.stringify(confirmationPayload),
                idempotency_hash: confirmationHash,
            },
        ], trx);
        return {
            adminNotificationId: adminId,
            confirmationNotificationId: confirmationId,
        };
    }
    /**
     * Transactionally enqueues both admin alert and employer confirmation notifications
     * for a corporate manpower requirement within an existing database transaction.
     */
    async enqueueManpowerEnquiryNotifications(params, trx) {
        const adminId = crypto_1.default.randomUUID();
        const confirmationId = crypto_1.default.randomUUID();
        const submittedAtStr = new Date().toUTCString();
        const adminHash = this.generateIdempotencyHash('manpower-enquiry', params.enquiryId, 'admin');
        const confirmationHash = this.generateIdempotencyHash('manpower-enquiry', params.enquiryId, 'confirmation');
        // 1. Admin notification payload & subject
        const adminPayload = {
            reference: params.publicReference,
            companyName: params.companyName,
            contactPerson: params.contactPerson,
            contactDesignation: params.contactDesignation,
            email: params.email,
            phone: params.phone,
            whatsapp: params.whatsapp,
            city: params.city,
            website: params.website,
            industry: params.industry,
            preferredTimeline: params.preferredTimeline,
            deploymentLocation: params.deploymentLocation,
            specialRequirements: params.specialRequirements,
            positions: params.positions,
            totalHeadcount: params.totalHeadcount,
            submittedAt: submittedAtStr,
        };
        const adminSubject = `[Manpower Requirement] New Requisition — ${params.publicReference} (${params.companyName})`;
        // 2. Employer confirmation payload & subject
        const confirmationPayload = {
            reference: params.publicReference,
            companyName: params.companyName,
            contactPerson: params.contactPerson,
            rolesCount: params.positions.length,
            totalHeadcount: params.totalHeadcount,
            submittedAt: submittedAtStr,
        };
        const confirmationSubject = `Manpower Requirement Received — ${params.publicReference}`;
        const adminRecipient = await this.getAdminRecipientEmail();
        // 3. Batch enqueue in outbox table
        await this.queueRepo.enqueueBatch([
            {
                id: adminId,
                notification_type: 'manpower_enquiry_admin',
                reference_id: params.enquiryId,
                recipient_email: adminRecipient,
                subject: adminSubject,
                payload_json: JSON.stringify(adminPayload),
                idempotency_hash: adminHash,
            },
            {
                id: confirmationId,
                notification_type: 'manpower_enquiry_confirmation',
                reference_id: params.enquiryId,
                recipient_email: params.email,
                subject: confirmationSubject,
                payload_json: JSON.stringify(confirmationPayload),
                idempotency_hash: confirmationHash,
            },
        ], trx);
        return {
            adminNotificationId: adminId,
            confirmationNotificationId: confirmationId,
        };
    }
    /**
     * Transactionally enqueues both admin alert and customer confirmation notifications
     * for a website contact / business consultation enquiry within an existing database transaction.
     * If any supporting files (PDF, DOCX) were uploaded, they are passed into the outbox payload for attachment.
     */
    async enqueueBusinessEnquiryNotifications(params, trx) {
        const adminId = crypto_1.default.randomUUID();
        const confirmationId = crypto_1.default.randomUUID();
        const submittedAtStr = new Date().toUTCString();
        const adminHash = this.generateIdempotencyHash('business-enquiry', params.enquiryId, 'admin');
        const confirmationHash = this.generateIdempotencyHash('business-enquiry', params.enquiryId, 'confirmation');
        const adminRecipient = await this.getAdminRecipientEmail();
        // 1. Admin notification payload & subject
        const adminPayload = {
            reference: params.publicReference,
            fullName: params.fullName,
            email: params.email,
            phone: params.phone,
            whatsapp: params.whatsapp,
            service: params.service,
            message: params.message,
            documentsCount: params.documentsCount,
            documentNames: params.documents?.map((d) => d.filename) || [],
            submittedAt: submittedAtStr,
            attachments: params.documents?.map((d) => ({
                filename: d.filename,
                path: d.path,
                contentType: d.contentType,
            })),
        };
        const adminSubject = `[Website Enquiry] New Consultation Request — ${params.publicReference} (${params.service})`;
        // 2. Customer confirmation payload & subject
        const confirmationPayload = {
            reference: params.publicReference,
            fullName: params.fullName,
            service: params.service,
            documentsCount: params.documentsCount,
        };
        const confirmationSubject = `Enquiry Acknowledged: Consultation Reference ${params.publicReference} — Cityline Consultancy`;
        // 3. Batch enqueue to outbox table inside the same transaction
        await this.queueRepo.enqueueBatch([
            {
                id: adminId,
                notification_type: 'business_enquiry_admin',
                reference_id: params.enquiryId,
                recipient_email: adminRecipient,
                subject: adminSubject,
                payload_json: JSON.stringify(adminPayload),
                idempotency_hash: adminHash,
            },
            {
                id: confirmationId,
                notification_type: 'business_enquiry_confirmation',
                reference_id: params.enquiryId,
                recipient_email: params.email,
                subject: confirmationSubject,
                payload_json: JSON.stringify(confirmationPayload),
                idempotency_hash: confirmationHash,
            },
        ], trx);
        return {
            adminNotificationId: adminId,
            confirmationNotificationId: confirmationId,
        };
    }
    /**
     * Processes a bounded batch of queued notifications.
     *
     * CRITICAL GUARANTEES:
     * 1. Atomically claims records to prevent double-sends across concurrent workers.
     * 2. Renders templates per notification type.
     * 3. Sends through pooled SMTP transport.
     * 4. Transient failures are scheduled with exponential backoff + jitter.
     * 5. Permanent failures or exhausted retries are moved to 'exhausted'.
     * 6. One failure NEVER stops or crashes the batch processor.
     */
    async processBatch(options) {
        const batchSize = options?.batchSize || env_config_1.env.NOTIFICATION_BATCH_SIZE;
        const staleTimeoutMs = options?.staleTimeoutMs || env_config_1.env.NOTIFICATION_STALE_TIMEOUT_MS;
        const claimed = await this.queueRepo.claimBatch(batchSize, staleTimeoutMs);
        const stats = {
            processed: claimed.length,
            sent: 0,
            failed: 0,
            exhausted: 0,
        };
        if (claimed.length === 0) {
            return stats;
        }
        logger_1.logger.info(`Notification worker claimed ${claimed.length} queued items`);
        for (const record of claimed) {
            const startTime = Date.now();
            try {
                const { html, text, subject } = this.renderNotificationContent(record);
                // Parse optional attachments from payload
                let attachments = undefined;
                try {
                    const parsedPayload = JSON.parse(record.payload_json);
                    if (Array.isArray(parsedPayload.attachments) && parsedPayload.attachments.length > 0) {
                        attachments = parsedPayload.attachments;
                    }
                }
                catch {
                    // ignore payload parse error here; renderNotificationContent already handles validation
                }
                // Send through SMTP transport
                const result = await this.transport.sendMail({
                    to: record.recipient_email,
                    subject: record.subject || subject,
                    html,
                    text,
                    attachments,
                });
                // Mark as sent in DB
                await this.queueRepo.markSent(record.id, new Date());
                stats.sent++;
                const duration = Date.now() - startTime;
                logger_1.logger.info(`Notification delivered successfully`, {
                    notificationId: record.id,
                    referenceId: record.reference_id,
                    notificationType: record.notification_type,
                    recipientDomain: record.recipient_email.split('@')[1] || 'unknown',
                    messageId: result.messageId,
                    durationMs: duration,
                });
            }
            catch (err) {
                const duration = Date.now() - startTime;
                const classification = this.transport.classifyError(err);
                const newRetryCount = record.retry_count + 1;
                const maxAttempts = env_config_1.env.NOTIFICATION_MAX_ATTEMPTS;
                const isExhausted = classification.isPermanent || newRetryCount >= maxAttempts;
                let nextRetryAt;
                if (!isExhausted) {
                    // Exponential backoff with random jitter
                    const baseDelay = env_config_1.env.NOTIFICATION_RETRY_BASE_DELAY_MS;
                    const maxDelay = env_config_1.env.NOTIFICATION_RETRY_MAX_DELAY_MS;
                    const exponentialDelay = baseDelay * Math.pow(2, record.retry_count);
                    const jitter = Math.floor(Math.random() * 1000);
                    const totalDelayMs = Math.min(maxDelay, exponentialDelay) + jitter;
                    nextRetryAt = new Date(Date.now() + totalDelayMs);
                }
                await this.queueRepo.markFailed(record.id, {
                    error: classification.sanitizedMessage,
                    retryCount: newRetryCount,
                    nextRetryAt,
                    isExhausted,
                });
                if (isExhausted) {
                    stats.exhausted++;
                    if (classification.isAuthFailure) {
                        logger_1.logger.error(`SMTP authentication failure encountered; notification moved to exhausted immediately without retry loops to prevent account lockouts`, undefined, {
                            notificationId: record.id,
                            notificationType: record.notification_type,
                            error: classification.sanitizedMessage,
                        });
                    }
                    else if (classification.isConfigFailure) {
                        logger_1.logger.error(`SMTP configuration failure encountered; notification moved to exhausted`, undefined, {
                            notificationId: record.id,
                            notificationType: record.notification_type,
                            error: classification.sanitizedMessage,
                        });
                    }
                    else {
                        logger_1.logger.warn(`Notification exhausted all retry attempts or failed permanently`, {
                            notificationId: record.id,
                            notificationType: record.notification_type,
                            retryCount: newRetryCount,
                            error: classification.sanitizedMessage,
                            durationMs: duration,
                        });
                    }
                }
                else {
                    stats.failed++;
                    logger_1.logger.warn(`Notification delivery attempt failed; retry scheduled`, {
                        notificationId: record.id,
                        notificationType: record.notification_type,
                        retryCount: newRetryCount,
                        nextRetryAt: nextRetryAt?.toISOString(),
                        error: classification.sanitizedMessage,
                        durationMs: duration,
                    });
                }
            }
        }
        return stats;
    }
    /**
     * Renders the corresponding email template for a given notification record.
     */
    renderNotificationContent(record) {
        let payload = {};
        try {
            payload = JSON.parse(record.payload_json);
        }
        catch {
            throw new Error(`Invalid or corrupt JSON payload in notification ${record.id}`);
        }
        switch (record.notification_type) {
            case 'visa_enquiry_admin':
                return (0, templates_1.renderVisaAdminNotification)(payload);
            case 'visa_enquiry_confirmation':
                return (0, templates_1.renderVisaApplicantConfirmation)(payload);
            case 'job_application_admin':
                return (0, templates_1.renderJobApplicationAdminNotification)(payload);
            case 'job_application_confirmation':
                return (0, templates_1.renderJobApplicationConfirmation)(payload);
            case 'manpower_enquiry_admin':
                return (0, templates_1.renderManpowerEnquiryAdminNotification)(payload);
            case 'manpower_enquiry_confirmation':
                return (0, templates_1.renderManpowerEnquiryConfirmation)(payload);
            case 'business_enquiry_admin':
                return (0, templates_1.renderBusinessEnquiryAdminNotification)(payload);
            case 'business_enquiry_confirmation':
                return (0, templates_1.renderBusinessEnquiryConfirmation)(payload);
            default:
                throw new Error(`Unsupported notification type: ${record.notification_type}`);
        }
    }
    /**
     * Cleans up aged sent and exhausted notifications according to retention policies.
     */
    async cleanupOldNotifications() {
        return await this.queueRepo.cleanupOldRecords(env_config_1.env.NOTIFICATION_SENT_RETENTION_DAYS, env_config_1.env.NOTIFICATION_EXHAUSTED_RETENTION_DAYS);
    }
    /**
     * Graceful shutdown of SMTP transport.
     */
    shutdown() {
        this.transport.close();
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
