"use strict";
/**
 * CITYLINE CONSULTANCY — Business Setup & Consultation Enquiry Core Service
 * Coordinates validation, optional document verification and secure storage,
 * transactional persistence across enquiries, business_setup_enquiries, and documents tables,
 * and generates public reference identifiers (CLC-BS-YYYY-XXXXXXXX).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessEnquiryService = exports.BusinessEnquiryService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_config_1 = require("../config/env.config");
const app_error_1 = require("../utils/app-error");
const logger_1 = require("../utils/logger");
const transaction_1 = require("../database/transaction");
const audit_log_repository_1 = require("../repositories/audit-log.repository");
const document_repository_1 = require("../repositories/document.repository");
const storage_service_1 = require("./storage.service");
const file_security_1 = require("../utils/file-security");
const database_error_1 = require("../database/database-error");
class BusinessEnquiryService {
    auditRepo;
    docRepo;
    storage;
    constructor(auditRepo = audit_log_repository_1.auditLogRepository, docRepo = document_repository_1.documentRepository, storage = storage_service_1.storageService) {
        this.auditRepo = auditRepo;
        this.docRepo = docRepo;
        this.storage = storage;
    }
    async submitEnquiry(input, rawFiles = [], context = {}) {
        // 1. Enforce aggregate file limits if files are attached
        if (rawFiles.length > env_config_1.env.UPLOAD_MAX_FILES_PER_ENQUIRY) {
            throw new app_error_1.AppError(`Cannot upload more than ${env_config_1.env.UPLOAD_MAX_FILES_PER_ENQUIRY} documents per enquiry.`, 400, 'TOO_MANY_FILES');
        }
        const totalBytes = rawFiles.reduce((sum, f) => sum + (f.size || f.buffer?.length || 0), 0);
        if (totalBytes > env_config_1.env.UPLOAD_MAX_TOTAL_SIZE_BYTES) {
            const maxMb = Math.round(env_config_1.env.UPLOAD_MAX_TOTAL_SIZE_BYTES / (1024 * 1024));
            throw new app_error_1.AppError(`Total upload payload exceeds the maximum allowed limit of ${maxMb}MB.`, 413, 'PAYLOAD_TOO_LARGE');
        }
        // 2. Validate binary signatures and sanitize each file
        const validatedFiles = [];
        for (const rawFile of rawFiles) {
            const validated = (0, file_security_1.validateUploadedDocument)(rawFile, {
                maxFileSizeBytes: env_config_1.env.UPLOAD_MAX_FILE_SIZE_BYTES,
            });
            validatedFiles.push(validated);
        }
        const enquiryId = crypto_1.default.randomUUID();
        const detailId = crypto_1.default.randomUUID();
        const year = new Date().getFullYear();
        const shortCode = enquiryId.replace(/-/g, '').slice(0, 8).toUpperCase();
        const publicReference = `CLC-BS-${year}-${shortCode}`;
        const createdPhysicalPaths = [];
        const documentRecords = [];
        try {
            // 3. Physical filesystem writes to secure private storage
            for (const file of validatedFiles) {
                const storageResult = await this.storage.writeEnquiryFile(enquiryId, file.storageFilename, file.buffer);
                createdPhysicalPaths.push(storageResult.absolutePath);
                documentRecords.push({
                    id: crypto_1.default.randomUUID(),
                    entity_type: 'enquiry',
                    entity_id: enquiryId,
                    document_category: 'consultation_document',
                    original_filename: file.sanitizedFilename,
                    storage_key: storageResult.storageKey,
                    mime_type: file.detectedMimeType,
                    file_extension: file.extension,
                    file_size_bytes: file.sizeBytes,
                    sha256_hash: file.sha256Hash,
                    validation_status: 'valid',
                    malware_scan_status: 'skipped',
                    retention_status: 'active',
                });
            }
            // 4. Atomic MariaDB transaction
            await (0, transaction_1.withTransaction)(async (trx) => {
                // Parent enquiry record
                await trx('enquiries').insert({
                    id: enquiryId,
                    enquiry_type: 'business_setup',
                    status: 'new',
                    full_name: input.fullName,
                    email: input.email,
                    phone: input.phone,
                    whatsapp: input.whatsapp || null,
                    subject: `Consultation Enquiry: ${input.service}`,
                    message: input.message,
                    source_channel: 'website',
                    assigned_admin_id: null,
                    created_at: trx.fn.now(),
                    updated_at: trx.fn.now(),
                });
                // Business setup / consultation enquiry detail record
                await trx('business_setup_enquiries').insert({
                    id: detailId,
                    enquiry_id: enquiryId,
                    preferred_jurisdiction: input.preferredJurisdiction || null,
                    activity_type: input.activityType || null,
                    shareholders_count: input.shareholdersCount || null,
                    visa_quota_needed: input.visaQuotaNeeded || null,
                    created_at: trx.fn.now(),
                    updated_at: trx.fn.now(),
                });
                // Insert document metadata records
                if (documentRecords.length > 0) {
                    await this.docRepo.insertBatch(documentRecords, trx);
                }
            });
        }
        catch (err) {
            // Rollback compensation: remove any orphan files if DB transaction failed
            if (createdPhysicalPaths.length > 0) {
                logger_1.logger.info(`Compensating failure: Cleaning up ${createdPhysicalPaths.length} orphan files for ${enquiryId}`);
                await this.storage.cleanupFiles(createdPhysicalPaths);
            }
            throw (0, database_error_1.normalizeDatabaseError)(err, 'BusinessEnquiryService.submitEnquiry');
        }
        // 5. Operational audit logging (safe background log)
        void this.auditRepo.logEvent({
            action: 'business_enquiry_submitted',
            resource_type: 'enquiry',
            resource_id: enquiryId,
            request_id: context.requestId,
            client_ip: context.clientIp,
            details_json: JSON.stringify({
                reference: publicReference,
                service: input.service,
                documentsAttached: documentRecords.length,
            }),
        });
        return {
            reference: publicReference,
            enquiryId,
            service: input.service,
            documentsCount: documentRecords.length,
        };
    }
}
exports.BusinessEnquiryService = BusinessEnquiryService;
exports.businessEnquiryService = new BusinessEnquiryService();
