"use strict";
/**
 * CITYLINE CONSULTANCY — Job Application Service
 * Coordinates candidate application submission, secure CV validation and storage,
 * malware scanning, atomic persistence, outbox notification enqueueing, and administrative triage.
 *
 * CRITICAL GOVERNANCE & SECURITY GUARANTEES:
 * 1. Application identifier (UUIDv4) and reference (CLC-J-YYYY-XXXXXXXX) are generated in-memory beforehand.
 * 2. CV documents are stored outside the webroot with restricted permissions (0o600).
 * 3. File validation enforces magic bytes and DOCX archive safety; restricted strictly to PDF and DOCX.
 * 4. Malware scanner operates with fail-closed / quarantine trust semantics.
 * 5. If malware is found or the database transaction rolls back, newly created physical files are cleaned up immediately (Filesystem Compensation).
 * 6. Idempotency: protects against rapid duplicate submissions without permanently barring legitimate future applications.
 * 7. Outbox pattern: transactional emails are queued within the database transaction; SMTP outages never roll back valid applications.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobApplicationService = exports.JobApplicationService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_config_1 = require("../config/env.config");
const app_error_1 = require("../utils/app-error");
const logger_1 = require("../utils/logger");
const transaction_1 = require("../database/transaction");
const file_security_1 = require("../utils/file-security");
const storage_service_1 = require("./storage.service");
const malware_scanner_service_1 = require("./malware-scanner.service");
const job_repository_1 = require("../repositories/job.repository");
const job_application_repository_1 = require("../repositories/job-application.repository");
const document_repository_1 = require("../repositories/document.repository");
const audit_log_repository_1 = require("../repositories/audit-log.repository");
const notification_service_1 = require("./notification.service");
class JobApplicationService {
    jobRepo;
    jobAppRepo;
    docRepo;
    auditRepo;
    storage;
    scanner;
    notification;
    constructor(jobRepo = job_repository_1.jobRepository, jobAppRepo = job_application_repository_1.jobApplicationRepository, docRepo = document_repository_1.documentRepository, auditRepo = audit_log_repository_1.auditLogRepository, storage = storage_service_1.storageService, scanner = malware_scanner_service_1.malwareScannerService, notification = notification_service_1.notificationService) {
        this.jobRepo = jobRepo;
        this.jobAppRepo = jobAppRepo;
        this.docRepo = docRepo;
        this.auditRepo = auditRepo;
        this.storage = storage;
        this.scanner = scanner;
        this.notification = notification;
    }
    /**
     * Submits a candidate application for an open job vacancy.
     */
    async submitApplication(jobSlugOrId, input, rawCvFile, context = {}) {
        // 1. Resolve and verify authoritative job vacancy
        let job = await this.jobRepo.findPublishedBySlug(jobSlugOrId);
        if (!job) {
            job = await this.jobRepo.findPublishedById(jobSlugOrId);
        }
        if (!job) {
            throw new app_error_1.AppError('The requested job vacancy was not found or is currently closed to new applications.', 404, 'JOB_NOT_FOUND');
        }
        // 2. Idempotency Check: Client key or recent submission window
        const idempotencyKey = context.idempotencyKey || input.idempotencyKey;
        if (idempotencyKey && idempotencyKey.trim()) {
            const existingKeyApp = await this.jobAppRepo.findByIdempotencyKey(idempotencyKey.trim());
            if (existingKeyApp) {
                // Enforce idempotency semantic hardening:
                // A) Same key + same request (job and applicant) => returns existing application reference
                // B) Same key + materially different request => returns 409 Conflict without creating application
                const isSameJob = existingKeyApp.job_id === job.id;
                const isSameEmail = existingKeyApp.email.trim().toLowerCase() === input.email.trim().toLowerCase();
                if (!isSameJob || !isSameEmail) {
                    logger_1.logger.warn(`Idempotency key conflict: Key "${idempotencyKey}" previously used for different payload`, {
                        existingJobId: existingKeyApp.job_id,
                        requestedJobId: job.id,
                        existingEmail: existingKeyApp.email,
                        requestedEmail: input.email,
                    });
                    throw new app_error_1.AppError('Idempotency key conflict: This key was previously used for a different application request.', 409, 'IDEMPOTENCY_KEY_CONFLICT');
                }
                logger_1.logger.info(`Idempotent retry detected for key ${idempotencyKey}; returning existing reference`);
                return {
                    success: true,
                    reference: existingKeyApp.reference_number,
                    message: 'Your application has been received.',
                    isDuplicate: true,
                };
            }
        }
        // Check recent duplicate submission window (15 minutes) to suppress rapid double-clicks
        const recentApp = await this.jobAppRepo.findRecentDuplicate(job.id, input.email, 15 * 60 * 1000);
        if (recentApp) {
            logger_1.logger.info(`Recent duplicate application detected for job ${job.id} / ${input.email}; returning existing reference`);
            return {
                success: true,
                reference: recentApp.reference_number,
                message: 'Your application has been received.',
                isDuplicate: true,
            };
        }
        // 3. Document validation: restrict CV uploads strictly to PDF and DOCX
        let validatedCv = null;
        if (rawCvFile) {
            validatedCv = (0, file_security_1.validateUploadedDocument)(rawCvFile, {
                maxFileSizeBytes: env_config_1.env.UPLOAD_MAX_FILE_SIZE_BYTES,
                allowedTypes: ['pdf', 'docx'],
            });
        }
        // 4. Pre-generate application identifiers and public reference
        const applicationId = crypto_1.default.randomUUID();
        const year = new Date().getFullYear();
        const shortCode = applicationId.replace(/-/g, '').slice(0, 8).toUpperCase();
        const publicReference = `CLC-J-${year}-${shortCode}`;
        const createdPhysicalPaths = [];
        let documentRecord = null;
        // 5. Physical file storage & malware inspection with filesystem compensation
        try {
            if (validatedCv) {
                const storageResult = await this.storage.writeApplicationFile(applicationId, validatedCv.storageFilename, validatedCv.buffer);
                createdPhysicalPaths.push(storageResult.absolutePath);
                let validationStatus = 'pending';
                let malwareScanStatus = 'skipped';
                if (this.scanner.isEnabled()) {
                    const scanResult = await this.scanner.scanFile(storageResult.absolutePath);
                    if (scanResult.status === 'infected') {
                        logger_1.logger.warn(`Malicious CV upload blocked for application ${applicationId}: ${validatedCv.sanitizedFilename}`);
                        await this.auditRepo.logEvent({
                            action: 'malware_detected',
                            resource_type: 'document',
                            request_id: context.requestId,
                            client_ip: context.clientIp,
                            details_json: JSON.stringify({
                                filename: validatedCv.sanitizedFilename,
                                reason: scanResult.details,
                            }),
                        });
                        throw new app_error_1.AppError('Uploaded CV file failed security verification.', 400, 'MALICIOUS_FILE_DETECTED');
                    }
                    if (scanResult.status === 'scan_failed' || !scanResult.clean) {
                        logger_1.logger.error(`Malware scanner execution failure for application ${applicationId}: ${validatedCv.sanitizedFilename}`);
                        await this.auditRepo.logEvent({
                            action: 'malware_scan_failed',
                            resource_type: 'document',
                            request_id: context.requestId,
                            client_ip: context.clientIp,
                            details_json: JSON.stringify({
                                filename: validatedCv.sanitizedFilename,
                                reason: 'Scanner execution failed closed',
                            }),
                        });
                        throw new app_error_1.AppError('Security scanning could not be completed at this time. Please try again later.', 500, 'SCANNER_UNAVAILABLE');
                    }
                    validationStatus = 'valid';
                    malwareScanStatus = 'clean';
                }
                else {
                    // Scanner disabled: remains quarantined
                    validationStatus = 'pending';
                    malwareScanStatus = 'skipped';
                }
                documentRecord = {
                    id: crypto_1.default.randomUUID(),
                    entity_type: 'job_application',
                    entity_id: applicationId,
                    document_category: 'resume',
                    original_filename: validatedCv.sanitizedFilename,
                    storage_key: storageResult.storageKey,
                    mime_type: validatedCv.detectedMimeType,
                    file_extension: validatedCv.extension,
                    file_size_bytes: validatedCv.sizeBytes,
                    sha256_hash: validatedCv.sha256Hash,
                    validation_status: validationStatus,
                    malware_scan_status: malwareScanStatus,
                    retention_status: 'active',
                };
            }
            // 6. Atomic MariaDB transaction: persist application, document metadata, and outbox notifications
            await (0, transaction_1.withTransaction)(async (trx) => {
                // Insert application record
                await this.jobAppRepo.createApplication({
                    id: applicationId,
                    job_id: job.id,
                    applicant_name: input.fullName,
                    email: input.email,
                    phone: input.phone,
                    whatsapp: input.whatsapp || null,
                    nationality: input.nationality,
                    current_location: input.currentLocation,
                    years_experience: input.yearsExperience,
                    qualification: input.qualification || null,
                    cover_letter: input.coverLetter || null,
                    reference_number: publicReference,
                    idempotency_key: idempotencyKey ? idempotencyKey.trim() : null,
                    status: 'new',
                    admin_notes: null,
                    source_channel: 'website',
                    deleted_at: null,
                }, trx);
                // Insert document metadata record
                if (documentRecord) {
                    await this.docRepo.insertBatch([documentRecord], trx);
                }
                // Enqueue transactional outbox notifications
                await this.notification.enqueueJobApplicationNotifications({
                    applicationId,
                    publicReference,
                    jobTitle: job.title,
                    jobCategory: job.category_name || 'General',
                    applicantName: input.fullName,
                    email: input.email,
                    phone: input.phone,
                    whatsapp: input.whatsapp,
                    nationality: input.nationality,
                    currentLocation: input.currentLocation,
                    yearsExperience: input.yearsExperience,
                    qualification: input.qualification,
                    coverLetter: input.coverLetter,
                    hasCv: Boolean(documentRecord),
                }, trx);
            });
            logger_1.logger.info(`Job application successfully submitted: ${publicReference} for ${job.title}`, {
                applicationId,
                reference: publicReference,
                jobId: job.id,
                hasCv: Boolean(documentRecord),
            });
            return {
                success: true,
                reference: publicReference,
                message: 'Your application has been received.',
            };
        }
        catch (err) {
            // 7. Filesystem compensation: delete any newly created physical files
            if (createdPhysicalPaths.length > 0) {
                logger_1.logger.info(`Compensating failure: Cleaning up ${createdPhysicalPaths.length} orphan files for application ${applicationId}`);
                await this.storage.cleanupFiles(createdPhysicalPaths);
            }
            throw err;
        }
    }
    /**
     * Administrative method to query applications with triage filtering.
     */
    async listApplications(params = {}) {
        return await this.jobAppRepo.listApplications(params);
    }
    /**
     * Administrative method to retrieve an application and its document metadata.
     */
    async getApplicationDetails(id) {
        const result = await this.jobAppRepo.findByIdWithDetails(id);
        if (!result) {
            throw new app_error_1.AppError('Candidate application not found.', 404, 'APPLICATION_NOT_FOUND');
        }
        return result;
    }
    /**
     * Administrative method to update application triage status.
     */
    async updateApplicationStatus(id, input, adminId, context = {}) {
        const existing = await this.jobAppRepo.findById(id);
        if (!existing || existing.deleted_at) {
            throw new app_error_1.AppError('Candidate application not found.', 404, 'APPLICATION_NOT_FOUND');
        }
        await this.jobAppRepo.updateStatus(id, input.status, input.adminNotes);
        // Audit log
        await this.auditRepo.logEvent({
            actor_admin_id: adminId,
            action: 'job_application_status_updated',
            resource_type: 'job_application',
            resource_id: id,
            client_ip: context.clientIp,
            request_id: context.requestId,
            details_json: JSON.stringify({
                previousStatus: existing.status,
                newStatus: input.status,
                hasNotes: Boolean(input.adminNotes),
            }),
        });
    }
}
exports.JobApplicationService = JobApplicationService;
exports.jobApplicationService = new JobApplicationService();
