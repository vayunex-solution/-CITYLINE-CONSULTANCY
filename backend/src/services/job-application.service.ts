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

import crypto from 'crypto';
import { env } from '../config/env.config';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import { withTransaction } from '../database/transaction';
import { validateUploadedDocument, ValidatedFile } from '../utils/file-security';
import { storageService, StorageService } from './storage.service';
import { malwareScannerService, MalwareScannerService } from './malware-scanner.service';
import { jobRepository, JobRepository } from '../repositories/job.repository';
import { jobApplicationRepository, JobApplicationRepository, JobApplicationRecord, ApplicationQueryParams } from '../repositories/job-application.repository';
import { documentRepository, DocumentRepository, DocumentRecord } from '../repositories/document.repository';
import { auditLogRepository, AuditLogRepository } from '../repositories/audit-log.repository';
import { notificationService, NotificationService } from './notification.service';
import { JobApplicationInput, AdminUpdateApplicationStatusInput } from '../schemas/job.schema';
import { JobPaginatedResult } from '../repositories/job.repository';

export interface ProcessedJobApplicationResult {
  success: boolean;
  reference: string;
  message: string;
  isDuplicate?: boolean;
}

export class JobApplicationService {
  constructor(
    private readonly jobRepo: JobRepository = jobRepository,
    private readonly jobAppRepo: JobApplicationRepository = jobApplicationRepository,
    private readonly docRepo: DocumentRepository = documentRepository,
    private readonly auditRepo: AuditLogRepository = auditLogRepository,
    private readonly storage: StorageService = storageService,
    private readonly scanner: MalwareScannerService = malwareScannerService,
    private readonly notification: NotificationService = notificationService
  ) {}

  /**
   * Submits a candidate application for an open job vacancy.
   */
  public async submitApplication(
    jobSlugOrId: string,
    input: JobApplicationInput,
    rawCvFile?: Express.Multer.File,
    context: { clientIp?: string; requestId?: string; idempotencyKey?: string } = {}
  ): Promise<ProcessedJobApplicationResult> {
    // 1. Resolve and verify authoritative job vacancy
    let job = await this.jobRepo.findPublishedBySlug(jobSlugOrId);
    if (!job) {
      job = await this.jobRepo.findPublishedById(jobSlugOrId);
    }

    if (!job) {
      throw new AppError(
        'The requested job vacancy was not found or is currently closed to new applications.',
        404,
        'JOB_NOT_FOUND'
      );
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
          logger.warn(`Idempotency key conflict: Key "${idempotencyKey}" previously used for different payload`, {
            existingJobId: existingKeyApp.job_id,
            requestedJobId: job.id,
            existingEmail: existingKeyApp.email,
            requestedEmail: input.email,
          });
          throw new AppError(
            'Idempotency key conflict: This key was previously used for a different application request.',
            409,
            'IDEMPOTENCY_KEY_CONFLICT'
          );
        }

        logger.info(`Idempotent retry detected for key ${idempotencyKey}; returning existing reference`);
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
      logger.info(`Recent duplicate application detected for job ${job.id} / ${input.email}; returning existing reference`);
      return {
        success: true,
        reference: recentApp.reference_number,
        message: 'Your application has been received.',
        isDuplicate: true,
      };
    }

    // 3. Document validation: restrict CV uploads strictly to PDF and DOCX
    let validatedCv: ValidatedFile | null = null;
    if (rawCvFile) {
      validatedCv = validateUploadedDocument(rawCvFile, {
        maxFileSizeBytes: env.UPLOAD_MAX_FILE_SIZE_BYTES,
        allowedTypes: ['pdf', 'docx'],
      });
    }

    // 4. Pre-generate application identifiers and public reference
    const applicationId = crypto.randomUUID();
    const year = new Date().getFullYear();
    const shortCode = applicationId.replace(/-/g, '').slice(0, 8).toUpperCase();
    const publicReference = `CLC-J-${year}-${shortCode}`;

    const createdPhysicalPaths: string[] = [];
    let documentRecord: Omit<DocumentRecord, 'created_at' | 'updated_at'> | null = null;

    // 5. Physical file storage & malware inspection with filesystem compensation
    try {
      if (validatedCv) {
        const storageResult = await this.storage.writeApplicationFile(
          applicationId,
          validatedCv.storageFilename,
          validatedCv.buffer
        );
        createdPhysicalPaths.push(storageResult.absolutePath);

        let validationStatus = 'pending';
        let malwareScanStatus = 'skipped';

        if (this.scanner.isEnabled()) {
          const scanResult = await this.scanner.scanFile(storageResult.absolutePath);

          if (scanResult.status === 'infected') {
            logger.warn(`Malicious CV upload blocked for application ${applicationId}: ${validatedCv.sanitizedFilename}`);
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
            throw new AppError(
              'Uploaded CV file failed security verification.',
              400,
              'MALICIOUS_FILE_DETECTED'
            );
          }

          if (scanResult.status === 'scan_failed' || !scanResult.clean) {
            logger.error(`Malware scanner execution failure for application ${applicationId}: ${validatedCv.sanitizedFilename}`);
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
            throw new AppError(
              'Security scanning could not be completed at this time. Please try again later.',
              500,
              'SCANNER_UNAVAILABLE'
            );
          }

          validationStatus = 'valid';
          malwareScanStatus = 'clean';
        } else {
          // Scanner disabled: remains quarantined
          validationStatus = 'pending';
          malwareScanStatus = 'skipped';
        }

        documentRecord = {
          id: crypto.randomUUID(),
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
      await withTransaction(async (trx) => {
        // Insert application record
        await this.jobAppRepo.createApplication(
          {
            id: applicationId,
            job_id: job!.id,
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
          },
          trx
        );

        // Insert document metadata record
        if (documentRecord) {
          await this.docRepo.insertBatch([documentRecord], trx);
        }

        // Enqueue transactional outbox notifications
        await this.notification.enqueueJobApplicationNotifications(
          {
            applicationId,
            publicReference,
            jobTitle: job!.title,
            jobCategory: job!.category_name || 'General',
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
          },
          trx
        );
      });

      logger.info(`Job application successfully submitted: ${publicReference} for ${job.title}`, {
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
    } catch (err: unknown) {
      // 7. Filesystem compensation: delete any newly created physical files
      if (createdPhysicalPaths.length > 0) {
        logger.info(`Compensating failure: Cleaning up ${createdPhysicalPaths.length} orphan files for application ${applicationId}`);
        await this.storage.cleanupFiles(createdPhysicalPaths);
      }
      throw err;
    }
  }

  /**
   * Administrative method to query applications with triage filtering.
   */
  public async listApplications(params: ApplicationQueryParams = {}): Promise<JobPaginatedResult<JobApplicationRecord>> {
    return await this.jobAppRepo.listApplications(params);
  }

  /**
   * Administrative method to retrieve an application and its document metadata.
   */
  public async getApplicationDetails(id: string): Promise<{ application: JobApplicationRecord; documents: any[] }> {
    const result = await this.jobAppRepo.findByIdWithDetails(id);
    if (!result) {
      throw new AppError('Candidate application not found.', 404, 'APPLICATION_NOT_FOUND');
    }
    return result;
  }

  /**
   * Administrative method to update application triage status.
   */
  public async updateApplicationStatus(
    id: string,
    input: AdminUpdateApplicationStatusInput,
    adminId: string,
    context: { clientIp?: string; requestId?: string } = {}
  ): Promise<void> {
    const existing = await this.jobAppRepo.findById(id);
    if (!existing || existing.deleted_at) {
      throw new AppError('Candidate application not found.', 404, 'APPLICATION_NOT_FOUND');
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

  /**
   * Moves a job application to the 30-day trash bin.
   */
  public async moveApplicationToTrash(
    id: string,
    adminId: string,
    context: { clientIp?: string; requestId?: string } = {}
  ): Promise<void> {
    const existing = await this.jobAppRepo.findById(id);
    if (!existing || existing.deleted_at) {
      throw new AppError('Candidate application not found.', 404, 'APPLICATION_NOT_FOUND');
    }

    await this.jobAppRepo.softDelete(id);

    await this.auditRepo.logEvent({
      actor_admin_id: adminId,
      action: 'job_application_moved_to_trash',
      resource_type: 'job_application',
      resource_id: id,
      client_ip: context.clientIp,
      request_id: context.requestId,
      details_json: JSON.stringify({
        previousStatus: existing.status,
      }),
    });
  }
}

export const jobApplicationService = new JobApplicationService();
