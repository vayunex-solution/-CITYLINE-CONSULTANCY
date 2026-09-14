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

import crypto from 'crypto';
import { Knex } from 'knex';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';
import {
  NotificationQueueRepository,
  notificationQueueRepository,
  NotificationQueueRecord,
} from '../repositories/notification-queue.repository';
import { SmtpTransportManager, smtpTransportManager } from '../notifications/smtp-transport';
import {
  renderVisaAdminNotification,
  VisaAdminNotificationData,
  renderVisaApplicantConfirmation,
  VisaApplicantConfirmationData,
  renderJobApplicationAdminNotification,
  JobApplicationAdminNotificationData,
  renderJobApplicationConfirmation,
  JobApplicationConfirmationData,
  renderManpowerEnquiryAdminNotification,
  ManpowerEnquiryAdminNotificationData,
  renderManpowerEnquiryConfirmation,
  ManpowerEnquiryConfirmationData,
} from '../notifications/templates';

export interface EnqueueJobApplicationParams {
  applicationId: string;
  publicReference: string;
  jobTitle: string;
  jobCategory: string;
  applicantName: string;
  email: string;
  phone: string;
  whatsapp?: string | null;
  nationality: string;
  currentLocation: string;
  yearsExperience: number;
  qualification?: string | null;
  coverLetter?: string | null;
  hasCv: boolean;
}

export interface EnqueueVisaEnquiryParams {
  enquiryId: string;
  publicReference: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp?: string | null;
  nationality?: string | null;
  serviceTitle: string;
  applicantCount: number;
  timeline?: string | null;
  details?: string | null;
  documentsCount: number;
}

export interface EnqueueManpowerEnquiryParams {
  enquiryId: string;
  publicReference: string;
  companyName: string;
  contactPerson: string;
  contactDesignation?: string | null;
  email: string;
  phone: string;
  whatsapp?: string | null;
  city: string;
  website?: string | null;
  industry?: string | null;
  preferredTimeline?: string | null;
  deploymentLocation?: string | null;
  specialRequirements?: string | null;
  positions: Array<{
    categorySlug: string;
    roleTitle: string;
    headcount: number;
    experienceYearsRequired?: number | null;
    qualification?: string | null;
    genderRequirement?: string | null;
    languageRequirements?: string | null;
    salaryOffered?: string | null;
    accommodationProvided?: string | null;
    transportProvided?: string | null;
    foodProvided?: string | null;
    notes?: string | null;
  }>;
  totalHeadcount: number;
}

export interface BatchProcessingResult {
  processed: number;
  sent: number;
  failed: number;
  exhausted: number;
}

export class NotificationService {
  constructor(
    private readonly queueRepo: NotificationQueueRepository = notificationQueueRepository,
    private readonly transport: SmtpTransportManager = smtpTransportManager
  ) {}

  /**
   * Generates a deterministic SHA-256 idempotency hash for an event.
   */
  public generateIdempotencyHash(eventType: string, entityId: string, role: 'admin' | 'confirmation'): string {
    return crypto
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
  public async enqueueVisaEnquiryNotifications(
    params: EnqueueVisaEnquiryParams,
    trx: Knex.Transaction
  ): Promise<{ adminNotificationId: string; confirmationNotificationId: string }> {
    const adminId = crypto.randomUUID();
    const confirmationId = crypto.randomUUID();
    const submittedAtStr = new Date().toUTCString();

    const adminHash = this.generateIdempotencyHash('visa-enquiry', params.enquiryId, 'admin');
    const confirmationHash = this.generateIdempotencyHash('visa-enquiry', params.enquiryId, 'confirmation');

    // 1. Admin notification payload & subject
    const adminPayload: VisaAdminNotificationData = {
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
    const confirmationPayload: VisaApplicantConfirmationData = {
      reference: params.publicReference,
      fullName: params.fullName,
      serviceTitle: params.serviceTitle,
      applicantCount: params.applicantCount,
      documentsCount: params.documentsCount,
    };

    const confirmationSubject = `Enquiry Acknowledged: Visa Application Reference ${params.publicReference} — Cityline Consultancy`;

    // 3. Batch enqueue to outbox table inside the same transaction
    await this.queueRepo.enqueueBatch(
      [
        {
          id: adminId,
          notification_type: 'visa_enquiry_admin',
          reference_id: params.enquiryId,
          recipient_email: env.NOTIFICATION_ADMIN_EMAIL || 'dev-admin@example.test',
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
      ],
      trx
    );

    return {
      adminNotificationId: adminId,
      confirmationNotificationId: confirmationId,
    };
  }

  /**
   * Transactionally enqueues both admin alert and candidate confirmation notifications
   * for a job application within an existing database transaction.
   */
  public async enqueueJobApplicationNotifications(
    params: EnqueueJobApplicationParams,
    trx: Knex.Transaction
  ): Promise<{ adminNotificationId: string; confirmationNotificationId: string }> {
    const adminId = crypto.randomUUID();
    const confirmationId = crypto.randomUUID();
    const submittedAtStr = new Date().toUTCString();

    const adminHash = this.generateIdempotencyHash('job-application', params.applicationId, 'admin');
    const confirmationHash = this.generateIdempotencyHash('job-application', params.applicationId, 'confirmation');

    // 1. Admin notification payload & subject
    const adminPayload: JobApplicationAdminNotificationData = {
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
    const confirmationPayload: JobApplicationConfirmationData = {
      reference: params.publicReference,
      applicantName: params.applicantName,
      jobTitle: params.jobTitle,
      jobCategory: params.jobCategory,
      hasCv: params.hasCv,
    };

    const confirmationSubject = `Application Acknowledged: ${params.jobTitle} (Ref: ${params.publicReference}) — Cityline Consultancy`;

    // 3. Batch enqueue into notification_queue
    await this.queueRepo.enqueueBatch(
      [
        {
          id: adminId,
          notification_type: 'job_application_admin',
          reference_id: params.applicationId,
          recipient_email: env.NOTIFICATION_ADMIN_EMAIL || 'dev-admin@example.test',
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
      ],
      trx
    );

    return {
      adminNotificationId: adminId,
      confirmationNotificationId: confirmationId,
    };
  }

  /**
   * Transactionally enqueues both admin alert and employer confirmation notifications
   * for a corporate manpower requirement within an existing database transaction.
   */
  public async enqueueManpowerEnquiryNotifications(
    params: EnqueueManpowerEnquiryParams,
    trx: Knex.Transaction
  ): Promise<{ adminNotificationId: string; confirmationNotificationId: string }> {
    const adminId = crypto.randomUUID();
    const confirmationId = crypto.randomUUID();
    const submittedAtStr = new Date().toUTCString();

    const adminHash = this.generateIdempotencyHash('manpower-enquiry', params.enquiryId, 'admin');
    const confirmationHash = this.generateIdempotencyHash('manpower-enquiry', params.enquiryId, 'confirmation');

    // 1. Admin notification payload & subject
    const adminPayload: ManpowerEnquiryAdminNotificationData = {
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
    const confirmationPayload: ManpowerEnquiryConfirmationData = {
      reference: params.publicReference,
      companyName: params.companyName,
      contactPerson: params.contactPerson,
      rolesCount: params.positions.length,
      totalHeadcount: params.totalHeadcount,
      submittedAt: submittedAtStr,
    };

    const confirmationSubject = `Manpower Requirement Received — ${params.publicReference}`;

    // 3. Batch enqueue in outbox table
    await this.queueRepo.enqueueBatch(
      [
        {
          id: adminId,
          notification_type: 'manpower_enquiry_admin',
          reference_id: params.enquiryId,
          recipient_email: env.NOTIFICATION_ADMIN_EMAIL,
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
      ],
      trx
    );

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
  public async processBatch(options?: {
    batchSize?: number;
    staleTimeoutMs?: number;
  }): Promise<BatchProcessingResult> {
    const batchSize = options?.batchSize || env.NOTIFICATION_BATCH_SIZE;
    const staleTimeoutMs = options?.staleTimeoutMs || env.NOTIFICATION_STALE_TIMEOUT_MS;

    const claimed = await this.queueRepo.claimBatch(batchSize, staleTimeoutMs);

    const stats: BatchProcessingResult = {
      processed: claimed.length,
      sent: 0,
      failed: 0,
      exhausted: 0,
    };

    if (claimed.length === 0) {
      return stats;
    }

    logger.info(`Notification worker claimed ${claimed.length} queued items`);

    for (const record of claimed) {
      const startTime = Date.now();
      try {
        const { html, text, subject } = this.renderNotificationContent(record);

        // Send through SMTP transport
        const result = await this.transport.sendMail({
          to: record.recipient_email,
          subject: record.subject || subject,
          html,
          text,
        });

        // Mark as sent in DB
        await this.queueRepo.markSent(record.id, new Date());
        stats.sent++;

        const duration = Date.now() - startTime;
        logger.info(`Notification delivered successfully`, {
          notificationId: record.id,
          referenceId: record.reference_id,
          notificationType: record.notification_type,
          recipientDomain: record.recipient_email.split('@')[1] || 'unknown',
          messageId: result.messageId,
          durationMs: duration,
        });
      } catch (err: unknown) {
        const duration = Date.now() - startTime;
        const classification = this.transport.classifyError(err);
        const newRetryCount = record.retry_count + 1;
        const maxAttempts = env.NOTIFICATION_MAX_ATTEMPTS;

        const isExhausted = classification.isPermanent || newRetryCount >= maxAttempts;

        let nextRetryAt: Date | undefined;
        if (!isExhausted) {
          // Exponential backoff with random jitter
          const baseDelay = env.NOTIFICATION_RETRY_BASE_DELAY_MS;
          const maxDelay = env.NOTIFICATION_RETRY_MAX_DELAY_MS;
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
            logger.error(`SMTP authentication failure encountered; notification moved to exhausted immediately without retry loops to prevent account lockouts`, undefined, {
              notificationId: record.id,
              notificationType: record.notification_type,
              error: classification.sanitizedMessage,
            });
          } else if (classification.isConfigFailure) {
            logger.error(`SMTP configuration failure encountered; notification moved to exhausted`, undefined, {
              notificationId: record.id,
              notificationType: record.notification_type,
              error: classification.sanitizedMessage,
            });
          } else {
            logger.warn(`Notification exhausted all retry attempts or failed permanently`, {
              notificationId: record.id,
              notificationType: record.notification_type,
              retryCount: newRetryCount,
              error: classification.sanitizedMessage,
              durationMs: duration,
            });
          }
        } else {
          stats.failed++;
          logger.warn(`Notification delivery attempt failed; retry scheduled`, {
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
  private renderNotificationContent(record: NotificationQueueRecord): {
    html: string;
    text: string;
    subject: string;
  } {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(record.payload_json);
    } catch {
      throw new Error(`Invalid or corrupt JSON payload in notification ${record.id}`);
    }

    switch (record.notification_type) {
      case 'visa_enquiry_admin':
        return renderVisaAdminNotification(payload as unknown as VisaAdminNotificationData);

      case 'visa_enquiry_confirmation':
        return renderVisaApplicantConfirmation(payload as unknown as VisaApplicantConfirmationData);

      case 'job_application_admin':
        return renderJobApplicationAdminNotification(payload as unknown as JobApplicationAdminNotificationData);

      case 'job_application_confirmation':
        return renderJobApplicationConfirmation(payload as unknown as JobApplicationConfirmationData);

      case 'manpower_enquiry_admin':
        return renderManpowerEnquiryAdminNotification(payload as unknown as ManpowerEnquiryAdminNotificationData);

      case 'manpower_enquiry_confirmation':
        return renderManpowerEnquiryConfirmation(payload as unknown as ManpowerEnquiryConfirmationData);

      default:
        throw new Error(`Unsupported notification type: ${record.notification_type}`);
    }
  }

  /**
   * Cleans up aged sent and exhausted notifications according to retention policies.
   */
  public async cleanupOldNotifications(): Promise<{ deletedSent: number; deletedExhausted: number }> {
    return await this.queueRepo.cleanupOldRecords(
      env.NOTIFICATION_SENT_RETENTION_DAYS,
      env.NOTIFICATION_EXHAUSTED_RETENTION_DAYS
    );
  }

  /**
   * Graceful shutdown of SMTP transport.
   */
  public shutdown(): void {
    this.transport.close();
  }
}

export const notificationService = new NotificationService();
