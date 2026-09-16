/**
 * CITYLINE CONSULTANCY — Business Setup & Consultation Enquiry Core Service
 * Coordinates validation, optional document verification and secure storage,
 * transactional persistence across enquiries, business_setup_enquiries, and documents tables,
 * and generates public reference identifiers (CLC-BS-YYYY-XXXXXXXX).
 */

import crypto from 'crypto';
import { env } from '../config/env.config';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import { withTransaction } from '../database/transaction';
import { BusinessEnquiryInput } from '../schemas/business-enquiry.schema';
import { auditLogRepository, AuditLogRepository } from '../repositories/audit-log.repository';
import { documentRepository, DocumentRepository, DocumentRecord } from '../repositories/document.repository';
import { storageService, StorageService } from './storage.service';
import { validateUploadedDocument, ValidatedFile } from '../utils/file-security';
import { normalizeDatabaseError } from '../database/database-error';

export interface ProcessedBusinessEnquiryResult {
  reference: string;
  enquiryId: string;
  service: string;
  documentsCount: number;
}

export class BusinessEnquiryService {
  constructor(
    private auditRepo: AuditLogRepository = auditLogRepository,
    private docRepo: DocumentRepository = documentRepository,
    private storage: StorageService = storageService
  ) {}

  public async submitEnquiry(
    input: BusinessEnquiryInput,
    rawFiles: Express.Multer.File[] = [],
    context: { clientIp?: string; requestId?: string } = {}
  ): Promise<ProcessedBusinessEnquiryResult> {
    // 1. Enforce aggregate file limits if files are attached
    if (rawFiles.length > env.UPLOAD_MAX_FILES_PER_ENQUIRY) {
      throw new AppError(
        `Cannot upload more than ${env.UPLOAD_MAX_FILES_PER_ENQUIRY} documents per enquiry.`,
        400,
        'TOO_MANY_FILES'
      );
    }

    const totalBytes = rawFiles.reduce((sum, f) => sum + (f.size || f.buffer?.length || 0), 0);
    if (totalBytes > env.UPLOAD_MAX_TOTAL_SIZE_BYTES) {
      const maxMb = Math.round(env.UPLOAD_MAX_TOTAL_SIZE_BYTES / (1024 * 1024));
      throw new AppError(
        `Total upload payload exceeds the maximum allowed limit of ${maxMb}MB.`,
        413,
        'PAYLOAD_TOO_LARGE'
      );
    }

    // 2. Validate binary signatures and sanitize each file
    const validatedFiles: ValidatedFile[] = [];
    for (const rawFile of rawFiles) {
      const validated = validateUploadedDocument(rawFile, {
        maxFileSizeBytes: env.UPLOAD_MAX_FILE_SIZE_BYTES,
      });
      validatedFiles.push(validated);
    }

    const enquiryId = crypto.randomUUID();
    const detailId = crypto.randomUUID();
    const year = new Date().getFullYear();
    const shortCode = enquiryId.replace(/-/g, '').slice(0, 8).toUpperCase();
    const publicReference = `CLC-BS-${year}-${shortCode}`;

    const createdPhysicalPaths: string[] = [];
    const documentRecords: Omit<DocumentRecord, 'created_at' | 'updated_at'>[] = [];

    try {
      // 3. Physical filesystem writes to secure private storage
      for (const file of validatedFiles) {
        const storageResult = await this.storage.writeEnquiryFile(
          enquiryId,
          file.storageFilename,
          file.buffer
        );
        createdPhysicalPaths.push(storageResult.absolutePath);

        documentRecords.push({
          id: crypto.randomUUID(),
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
      await withTransaction(async (trx) => {
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
    } catch (err: unknown) {
      // Rollback compensation: remove any orphan files if DB transaction failed
      if (createdPhysicalPaths.length > 0) {
        logger.info(`Compensating failure: Cleaning up ${createdPhysicalPaths.length} orphan files for ${enquiryId}`);
        await this.storage.cleanupFiles(createdPhysicalPaths);
      }
      throw normalizeDatabaseError(err, 'BusinessEnquiryService.submitEnquiry');
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

export const businessEnquiryService = new BusinessEnquiryService();
