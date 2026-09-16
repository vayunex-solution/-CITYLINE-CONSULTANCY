"use strict";
/**
 * CITYLINE CONSULTANCY — Visa Enquiry Core Service
 * Coordinates input validation, visa service canonical matching, secure document storage,
 * atomic database transactions, orphan file compensation, and audit logging.
 *
 * GOVERNANCE:
 * - The database remains the source of truth.
 * - Documents are stored physically outside the webroot before database commit.
 * - If the database transaction fails, newly created physical files are cleaned up immediately.
 * - Non-fatal audit log failures do not destroy an otherwise valid enquiry.
 * - Generates public-safe, non-sequential reference identifiers (CLC-V-YYYY-XXXXXXXX).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.visaEnquiryService = exports.VisaEnquiryService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_config_1 = require("../config/env.config");
const app_error_1 = require("../utils/app-error");
const logger_1 = require("../utils/logger");
const transaction_1 = require("../database/transaction");
const file_security_1 = require("../utils/file-security");
const storage_service_1 = require("./storage.service");
const malware_scanner_service_1 = require("./malware-scanner.service");
const visa_service_repository_1 = require("../repositories/visa-service.repository");
const enquiry_repository_1 = require("../repositories/enquiry.repository");
const document_repository_1 = require("../repositories/document.repository");
const audit_log_repository_1 = require("../repositories/audit-log.repository");
const notification_service_1 = require("./notification.service");
class VisaEnquiryService {
    visaRepo;
    enquiryRepo;
    docRepo;
    auditRepo;
    storage;
    scanner;
    notification;
    constructor(visaRepo = visa_service_repository_1.visaServiceRepository, enquiryRepo = enquiry_repository_1.enquiryRepository, docRepo = document_repository_1.documentRepository, auditRepo = audit_log_repository_1.auditLogRepository, storage = storage_service_1.storageService, scanner = malware_scanner_service_1.malwareScannerService, notification = notification_service_1.notificationService) {
        this.visaRepo = visaRepo;
        this.enquiryRepo = enquiryRepo;
        this.docRepo = docRepo;
        this.auditRepo = auditRepo;
        this.storage = storage;
        this.scanner = scanner;
        this.notification = notification;
    }
    /**
     * Submits and transactionally persists a public visa enquiry with optional attached documents.
     */
    async submitVisaEnquiry(input, rawFiles = [], context = {}) {
        // 1. Enforce aggregate file limits
        if (rawFiles.length > env_config_1.env.UPLOAD_MAX_FILES_PER_ENQUIRY) {
            throw new app_error_1.AppError(`Cannot upload more than ${env_config_1.env.UPLOAD_MAX_FILES_PER_ENQUIRY} documents per enquiry.`, 400, 'TOO_MANY_FILES');
        }
        const totalBytes = rawFiles.reduce((sum, f) => sum + (f.size || f.buffer?.length || 0), 0);
        if (totalBytes > env_config_1.env.UPLOAD_MAX_TOTAL_SIZE_BYTES) {
            const maxMb = Math.round(env_config_1.env.UPLOAD_MAX_TOTAL_SIZE_BYTES / (1024 * 1024));
            throw new app_error_1.AppError(`Total upload payload exceeds the maximum allowed limit of ${maxMb}MB.`, 413, 'PAYLOAD_TOO_LARGE');
        }
        // 2. Validate and resolve canonical Visa Service from database
        const visaService = await this.visaRepo.findActiveByCodeOrSlug(input.visaType);
        if (!visaService) {
            throw new app_error_1.AppError('The selected visa service is invalid or currently unavailable.', 400, 'INVALID_VISA_SERVICE');
        }
        // 3. Deep binary signature, magic byte, and DOCX archive validation for each file
        const validatedFiles = [];
        for (const rawFile of rawFiles) {
            const validated = (0, file_security_1.validateUploadedDocument)(rawFile, {
                maxFileSizeBytes: env_config_1.env.UPLOAD_MAX_FILE_SIZE_BYTES,
            });
            validatedFiles.push(validated);
        }
        // 4. Prepare entity IDs and directories
        const enquiryId = crypto_1.default.randomUUID();
        const createdPhysicalPaths = [];
        const documentRecords = [];
        // 5. Physical filesystem writes & malware inspection (with immediate rollback compensation)
        try {
            for (const file of validatedFiles) {
                // Write to private storage outside webroot
                const storageResult = await this.storage.writeEnquiryFile(enquiryId, file.storageFilename, file.buffer);
                createdPhysicalPaths.push(storageResult.absolutePath);
                let validationStatus = 'pending';
                let malwareScanStatus = 'skipped';
                if (this.scanner.isEnabled()) {
                    // Run scanner adapter on saved file
                    const scanResult = await this.scanner.scanFile(storageResult.absolutePath);
                    if (scanResult.status === 'infected') {
                        logger_1.logger.warn(`Malicious upload blocked for enquiry ${enquiryId}: ${file.sanitizedFilename}`);
                        await this.auditRepo.logEvent({
                            action: 'malware_detected',
                            resource_type: 'document',
                            request_id: context.requestId,
                            client_ip: context.clientIp,
                            details_json: JSON.stringify({
                                filename: file.sanitizedFilename,
                                reason: scanResult.details,
                            }),
                        });
                        throw new app_error_1.AppError('One or more uploaded files failed security verification.', 400, 'MALICIOUS_FILE_DETECTED');
                    }
                    if (scanResult.status === 'scan_failed' || !scanResult.clean) {
                        logger_1.logger.error(`Malware scanner execution failure for enquiry ${enquiryId}: ${file.sanitizedFilename} (${scanResult.details})`);
                        await this.auditRepo.logEvent({
                            action: 'malware_scan_failed',
                            resource_type: 'document',
                            request_id: context.requestId,
                            client_ip: context.clientIp,
                            details_json: JSON.stringify({
                                filename: file.sanitizedFilename,
                                reason: 'Scanner command execution failed closed',
                            }),
                        });
                        throw new app_error_1.AppError('Security scanning could not be completed at this time. Please try again later.', 500, 'SCANNER_UNAVAILABLE');
                    }
                    // Authoritatively verified clean by active scanner -> ACCEPTED / TRUSTED
                    validationStatus = 'valid';
                    malwareScanStatus = 'clean';
                }
                else {
                    // Scanner disabled in environment: document remains quarantined / untrusted
                    validationStatus = 'pending';
                    malwareScanStatus = 'skipped';
                }
                documentRecords.push({
                    id: crypto_1.default.randomUUID(),
                    entity_type: 'enquiry',
                    entity_id: enquiryId,
                    document_category: 'passport_copy', // Default visa enquiry category
                    original_filename: file.sanitizedFilename,
                    storage_key: storageResult.storageKey,
                    mime_type: file.detectedMimeType,
                    file_extension: file.extension,
                    file_size_bytes: file.sizeBytes,
                    sha256_hash: file.sha256Hash,
                    validation_status: validationStatus,
                    malware_scan_status: malwareScanStatus,
                    retention_status: 'active',
                });
            }
            // 6. Generate non-sequential, public-safe reference: CLC-V-YYYY-XXXXXXXX
            const year = new Date().getFullYear();
            const shortCode = enquiryId.replace(/-/g, '').slice(0, 8).toUpperCase();
            const publicReference = `CLC-V-${year}-${shortCode}`;
            // 7. Atomic MariaDB transaction: persist enquiries, visa_enquiries, documents, and notifications outbox
            await (0, transaction_1.withTransaction)(async (trx) => {
                // Parent inquiry record
                await this.enquiryRepo.createVisaEnquiry({
                    id: enquiryId,
                    enquiry_type: 'visa',
                    status: 'new',
                    full_name: input.fullName,
                    email: input.email,
                    phone: input.phone,
                    whatsapp: input.whatsapp || null,
                    nationality: input.nationality || null,
                    subject: `Visa Enquiry: ${visaService.title}`,
                    message: input.details || null,
                    source_channel: 'website',
                    assigned_admin_id: null,
                }, {
                    id: crypto_1.default.randomUUID(),
                    enquiry_id: enquiryId,
                    visa_service_id: visaService.id,
                    duration_days: visaService.service_code === 'visit_30d'
                        ? 30
                        : visaService.service_code === 'visit_60d'
                            ? 60
                            : 730,
                    applicant_count: input.applicantCount || 1,
                    notes: input.timeline ? `Timeline: ${input.timeline}` : null,
                }, trx);
                // Batch insert document metadata
                if (documentRecords.length > 0) {
                    await this.docRepo.insertBatch(documentRecords, trx);
                }
                // Phase 7 Outbox: Enqueue transactional email notifications
                await this.notification.enqueueVisaEnquiryNotifications({
                    enquiryId,
                    publicReference,
                    fullName: input.fullName,
                    email: input.email,
                    phone: input.phone,
                    whatsapp: input.whatsapp || null,
                    nationality: input.nationality || null,
                    serviceTitle: visaService.title,
                    applicantCount: input.applicantCount || 1,
                    timeline: input.timeline || null,
                    details: input.details || null,
                    documentsCount: documentRecords.length,
                }, trx);
            });
        }
        catch (err) {
            // COMPENSATION: If DB transaction fails or scanner rejected, purge newly written orphan files
            if (createdPhysicalPaths.length > 0) {
                logger_1.logger.info(`Compensating failure: Cleaning up ${createdPhysicalPaths.length} orphan files for ${enquiryId}`);
                await this.storage.cleanupFiles(createdPhysicalPaths);
            }
            throw err;
        }
        const year = new Date().getFullYear();
        const shortCode = enquiryId.replace(/-/g, '').slice(0, 8).toUpperCase();
        const publicReference = `CLC-V-${year}-${shortCode}`;
        // 8. Operational audit logging (safe non-blocking background log)
        void this.auditRepo.logEvent({
            action: 'visa_enquiry_submitted',
            resource_type: 'enquiry',
            resource_id: enquiryId,
            request_id: context.requestId,
            client_ip: context.clientIp,
            details_json: JSON.stringify({
                reference: publicReference,
                visaServiceCode: visaService.service_code,
                documentsAttached: documentRecords.length,
            }),
        });
        return {
            reference: publicReference,
            enquiryId,
            serviceTitle: visaService.title,
            documentsCount: documentRecords.length,
        };
    }
}
exports.VisaEnquiryService = VisaEnquiryService;
exports.visaEnquiryService = new VisaEnquiryService();
