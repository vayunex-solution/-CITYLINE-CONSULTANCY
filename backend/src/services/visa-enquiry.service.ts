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

import crypto from 'crypto';
import { env } from '../config/env.config';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import { withTransaction } from '../database/transaction';
import { VisaEnquiryInput } from '../schemas/visa-enquiry.schema';
import { validateUploadedDocument, ValidatedFile } from '../utils/file-security';
import { storageService, StorageService } from './storage.service';
import { malwareScannerService, MalwareScannerService } from './malware-scanner.service';
import { visaServiceRepository, VisaServiceRepository } from '../repositories/visa-service.repository';
import { enquiryRepository, EnquiryRepository } from '../repositories/enquiry.repository';
import { documentRepository, DocumentRepository, DocumentRecord } from '../repositories/document.repository';
import { auditLogRepository, AuditLogRepository } from '../repositories/audit-log.repository';

export interface ProcessedVisaEnquiryResult {
  reference: string;
  enquiryId: string;
  serviceTitle: string;
  documentsCount: number;
}

export class VisaEnquiryService {
  constructor(
    private visaRepo: VisaServiceRepository = visaServiceRepository,
    private enquiryRepo: EnquiryRepository = enquiryRepository,
    private docRepo: DocumentRepository = documentRepository,
    private auditRepo: AuditLogRepository = auditLogRepository,
    private storage: StorageService = storageService,
    private scanner: MalwareScannerService = malwareScannerService
  ) {}

  /**
   * Submits and transactionally persists a public visa enquiry with optional attached documents.
   */
  public async submitVisaEnquiry(
    input: VisaEnquiryInput,
    rawFiles: Express.Multer.File[] = [],
    context: { clientIp?: string; requestId?: string } = {}
  ): Promise<ProcessedVisaEnquiryResult> {
    // 1. Enforce aggregate file limits
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

    // 2. Validate and resolve canonical Visa Service from database
    const visaService = await this.visaRepo.findActiveByCodeOrSlug(input.visaType);
    if (!visaService) {
      throw new AppError(
        'The selected visa service is invalid or currently unavailable.',
        400,
        'INVALID_VISA_SERVICE'
      );
    }

    // 3. Deep binary signature, magic byte, and DOCX archive validation for each file
    const validatedFiles: ValidatedFile[] = [];
    for (const rawFile of rawFiles) {
      const validated = validateUploadedDocument(rawFile, {
        maxFileSizeBytes: env.UPLOAD_MAX_FILE_SIZE_BYTES,
      });
      validatedFiles.push(validated);
    }

    // 4. Prepare entity IDs and directories
    const enquiryId = crypto.randomUUID();
    const createdPhysicalPaths: string[] = [];
    const documentRecords: Omit<DocumentRecord, 'created_at' | 'updated_at'>[] = [];

    // 5. Physical filesystem writes & malware inspection (with immediate rollback compensation)
    try {
      for (const file of validatedFiles) {
        // Write to private storage outside webroot
        const storageResult = await this.storage.writeEnquiryFile(
          enquiryId,
          file.storageFilename,
          file.buffer
        );
        createdPhysicalPaths.push(storageResult.absolutePath);

        let validationStatus = 'pending';
        let malwareScanStatus = 'skipped';

        if (this.scanner.isEnabled()) {
          // Run scanner adapter on saved file
          const scanResult = await this.scanner.scanFile(storageResult.absolutePath);

          if (scanResult.status === 'infected') {
            logger.warn(`Malicious upload blocked for enquiry ${enquiryId}: ${file.sanitizedFilename}`);
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
            throw new AppError(
              'One or more uploaded files failed security verification.',
              400,
              'MALICIOUS_FILE_DETECTED'
            );
          }

          if (scanResult.status === 'scan_failed' || !scanResult.clean) {
            logger.error(`Malware scanner execution failure for enquiry ${enquiryId}: ${file.sanitizedFilename} (${scanResult.details})`);
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
            throw new AppError(
              'Security scanning could not be completed at this time. Please try again later.',
              500,
              'SCANNER_UNAVAILABLE'
            );
          }

          // Authoritatively verified clean by active scanner -> ACCEPTED / TRUSTED
          validationStatus = 'valid';
          malwareScanStatus = 'clean';
        } else {
          // Scanner disabled in environment: document remains quarantined / untrusted
          validationStatus = 'pending';
          malwareScanStatus = 'skipped';
        }

        documentRecords.push({
          id: crypto.randomUUID(),
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

      // 6. Atomic MariaDB transaction: persist enquiries, visa_enquiries, and documents metadata
      await withTransaction(async (trx) => {
        // Parent inquiry record
        await this.enquiryRepo.createVisaEnquiry(
          {
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
          },
          {
            id: crypto.randomUUID(),
            enquiry_id: enquiryId,
            visa_service_id: visaService.id,
            duration_days:
              visaService.service_code === 'visit_30d'
                ? 30
                : visaService.service_code === 'visit_60d'
                ? 60
                : 730,
            applicant_count: input.applicantCount || 1,
            notes: input.timeline ? `Timeline: ${input.timeline}` : null,
          },
          trx
        );

        // Batch insert document metadata
        if (documentRecords.length > 0) {
          await this.docRepo.insertBatch(documentRecords, trx);
        }
      });
    } catch (err: unknown) {
      // COMPENSATION: If DB transaction fails or scanner rejected, purge newly written orphan files
      if (createdPhysicalPaths.length > 0) {
        logger.info(`Compensating failure: Cleaning up ${createdPhysicalPaths.length} orphan files for ${enquiryId}`);
        await this.storage.cleanupFiles(createdPhysicalPaths);
      }
      throw err;
    }

    // 7. Generate non-sequential, public-safe reference: CLC-V-YYYY-XXXXXXXX
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

export const visaEnquiryService = new VisaEnquiryService();
