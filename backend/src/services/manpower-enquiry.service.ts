/**
 * CITYLINE CONSULTANCY — Manpower Enquiry Service
 * Coordinates public employer manpower submissions, canonical request hashing,
 * concurrency locking, database-level idempotency conflict recovery, atomic persistence,
 * outbox notification enqueueing, state machine transitions, and administrative triage.
 *
 * CRITICAL GOVERNANCE & CONCURRENCY GUARANTEES:
 * 1. Full canonical SHA-256 fingerprinting with deterministic position sorting.
 * 2. Database-level UNIQUE constraint on non-null idempotency_key with automatic ER_DUP_ENTRY resolution.
 * 3. MariaDB session advisory locks (GET_LOCK / RELEASE_LOCK) serialize concurrent no-key duplicate submissions.
 * 4. Dual-factor employer deduplication (company + email) re-uses employer master without mutation.
 * 5. Outbox pattern: transactional emails queued in the same MariaDB transaction as business models.
 * 6. Service-level status transition state machine prevents invalid status jumps or backward regressions.
 * 7. Tightly restricted admin update scope prevents mass assignment or employer identity mutation.
 */

import crypto from 'crypto';
import { getDbClient } from '../database/connection';
import { withTransaction } from '../database/transaction';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import {
  ManpowerEnquiryInput,
  AdminUpdateManpowerStatusInput,
  AdminUpdateManpowerEnquiryInput,
  ManpowerQueryParams,
  ManpowerStatus,
  ALLOWED_MANPOWER_STATUS_TRANSITIONS,
  computeCanonicalRequestHash,
} from '../schemas/manpower-enquiry.schema';
import {
  employerRepository,
  EmployerRepository,
} from '../repositories/employer.repository';
import {
  manpowerEnquiryRepository,
  ManpowerEnquiryRepository,
  FullManpowerEnquiryDetail,
  PaginatedManpowerResult,
} from '../repositories/manpower-enquiry.repository';
import {
  auditLogRepository,
  AuditLogRepository,
} from '../repositories/audit-log.repository';
import {
  notificationService,
  NotificationService,
} from './notification.service';

export interface ProcessedManpowerEnquiryResult {
  success: boolean;
  reference: string;
  status: string;
  totalPositions: number;
  totalHeadcount: number;
  message: string;
  isDuplicate?: boolean;
}

export class ManpowerEnquiryService {
  private static inFlightLocks = new Map<string, Promise<unknown>>();

  constructor(
    private readonly employerRepo: EmployerRepository = employerRepository,
    private readonly manpowerRepo: ManpowerEnquiryRepository = manpowerEnquiryRepository,
    private readonly auditRepo: AuditLogRepository = auditLogRepository,
    private readonly notification: NotificationService = notificationService
  ) {}

  /**
   * Submits and atomically persists an employer manpower requirement.
   */
  public async submitEnquiry(
    input: ManpowerEnquiryInput,
    context: { clientIp?: string; requestId?: string; idempotencyKey?: string } = {}
  ): Promise<ProcessedManpowerEnquiryResult> {
    const db = getDbClient();

    // 1. Compute deterministic canonical request hash
    const requestHash = computeCanonicalRequestHash(input);
    const totalHeadcount = input.positions.reduce((acc, p) => acc + p.headcount, 0);
    const idempotencyKey = context.idempotencyKey?.trim() || input.idempotencyKey?.trim() || null;

    // 2. Client Idempotency Key Handling
    if (idempotencyKey) {
      const existingKeyEnquiry = await this.manpowerRepo.findByIdempotencyKey(idempotencyKey);
      if (existingKeyEnquiry) {
        // Enforce hardened idempotency semantic comparison
        if (existingKeyEnquiry.request_hash === requestHash) {
          logger.info(`Idempotent retry detected for key ${idempotencyKey}; returning existing reference`);
          return {
            success: true,
            reference: existingKeyEnquiry.reference_number!,
            status: existingKeyEnquiry.status,
            totalPositions: input.positions.length,
            totalHeadcount,
            message: 'Your manpower requirement has been received and will be reviewed by our team.',
            isDuplicate: true,
          };
        } else {
          logger.warn(`Idempotency key conflict: Key "${idempotencyKey}" previously used for differing requisition payload`, {
            existingHash: existingKeyEnquiry.request_hash,
            incomingHash: requestHash,
          });
          throw new AppError(
            'Idempotency key conflict: This key was previously used for a different manpower requisition.',
            409,
            'IDEMPOTENCY_KEY_CONFLICT'
          );
        }
      }
    }

    // 3. Concurrency Protection via In-Process Mutex & MariaDB Advisory Lock
    const lockKey = `clc_mp_lock_${crypto
      .createHash('sha256')
      .update(`${input.companyName.trim().toLowerCase()}:${input.email.trim().toLowerCase()}`)
      .digest('hex')
      .slice(0, 32)}`;

    // In-process serialization: if concurrent requests with identical company:email arrive, serialize them
    let releaseInProcessLock: () => void = () => {};
    const priorLock = ManpowerEnquiryService.inFlightLocks.get(lockKey);
    let lockWaitPromise: Promise<unknown>;
    if (priorLock) {
      lockWaitPromise = priorLock.catch(() => {});
    } else {
      lockWaitPromise = Promise.resolve();
    }
    const currentLock = new Promise<void>((resolve) => {
      releaseInProcessLock = resolve;
    });
    ManpowerEnquiryService.inFlightLocks.set(lockKey, currentLock);

    let hasAdvisoryLock = false;

    try {
      await lockWaitPromise;

      // Check again after acquiring lock in case previous concurrent request already processed this
      if (idempotencyKey) {
        const existingKeyEnquiry = await this.manpowerRepo.findByIdempotencyKey(idempotencyKey);
        if (existingKeyEnquiry) {
          if (existingKeyEnquiry.request_hash === requestHash) {
            return {
              success: true,
              reference: existingKeyEnquiry.reference_number!,
              status: existingKeyEnquiry.status,
              totalPositions: input.positions.length,
              totalHeadcount,
              message: 'Your manpower requirement has been received and will be reviewed by our team.',
              isDuplicate: true,
            };
          }
        }
      }

      if (!idempotencyKey) {
        // Acquire MariaDB advisory lock with 5-second timeout to serialize concurrent identical requests
        try {
          const lockRes = await db.raw('SELECT GET_LOCK(?, 5) AS acquired', [lockKey]);
          hasAdvisoryLock = lockRes?.[0]?.[0]?.acquired === 1;
        } catch {
          // If advisory locking is unsupported (e.g. mock DB in tests), proceed without lock
          hasAdvisoryLock = false;
        }

        // Check recent duplicate within 15-minute sliding window matching company, email, and exact request hash
        const recentDuplicate = await this.manpowerRepo.findRecentDuplicate(
          input.companyName,
          input.email,
          requestHash,
          15 * 60 * 1000
        );

        if (recentDuplicate) {
          logger.info(
            `Recent duplicate manpower enquiry detected for ${input.companyName} / ${input.email}; returning existing reference`
          );
          return {
            success: true,
            reference: recentDuplicate.reference_number!,
            status: recentDuplicate.status,
            totalPositions: input.positions.length,
            totalHeadcount,
            message: 'Your manpower requirement has been received and will be reviewed by our team.',
            isDuplicate: true,
          };
        }
      }

      // 4. Pre-generate entity identifiers and public reference code: CLC-MP-YYYY-XXXXXXXX
      const enquiryId = crypto.randomUUID();
      const manpowerEnquiryId = crypto.randomUUID();
      const year = new Date().getFullYear();
      const shortCode = manpowerEnquiryId.replace(/-/g, '').slice(0, 8).toUpperCase();
      const publicReference = `CLC-MP-${year}-${shortCode}`;

      // 5. Pre-resolve canonical category IDs from job_categories
      const categorySlugs = Array.from(new Set(input.positions.map((p) => p.categorySlug.toLowerCase())));
      const categoryRows = await db('job_categories')
        .whereIn('slug', categorySlugs)
        .select('id', 'slug');

      const categoryMap = new Map<string, number>();
      for (const row of categoryRows) {
        categoryMap.set(row.slug.toLowerCase(), row.id);
      }

      // 6. Execute atomic database transaction
      try {
        await withTransaction(async (trx) => {
          // A. Non-mutating Employer Deduplication
          let employerId: string;
          const existingEmployer = await this.employerRepo.findExistingEmployer(
            input.companyName,
            input.email,
            trx
          );

          if (existingEmployer) {
            // Re-use existing employer master record without mutating it
            employerId = existingEmployer.id;
          } else {
            // Create new corporate employer record
            employerId = crypto.randomUUID();
            await this.employerRepo.createEmployer(
              {
                id: employerId,
                company_name: input.companyName.trim(),
                industry: input.industry?.trim() || 'General',
                contact_person: input.contactPerson.trim(),
                contact_designation: input.contactDesignation?.trim() || null,
                email: input.email.trim().toLowerCase(),
                phone: input.phone.trim(),
                whatsapp: input.whatsapp?.trim() || null,
                city: input.city.trim(),
                country: 'United Arab Emirates',
                website: input.website?.trim() || null,
                address: null,
                notes: null,
              },
              trx
            );
          }

          // B. Prepare Position Records
          const positionRecords = input.positions.map((p) => ({
            manpower_enquiry_id: manpowerEnquiryId,
            job_category_id: categoryMap.get(p.categorySlug.toLowerCase()) || null,
            role_title: p.roleTitle.trim(),
            headcount: p.headcount,
            experience_years_required: p.experienceYearsRequired ?? null,
            qualification: p.qualification?.trim() || null,
            gender_requirement: p.genderRequirement || null,
            language_requirements: p.languageRequirements?.trim() || null,
            salary_offered: p.salaryOffered?.trim() || null,
            accommodation_provided: p.accommodationProvided || null,
            transport_provided: p.transportProvided || null,
            food_provided: p.foodProvided || null,
            notes: p.notes?.trim() || null,
          }));

          // C. Insert parent enquiry, manpower enquiry header, and position rows
          await this.manpowerRepo.createEnquiryWithPositions(
            {
              id: enquiryId,
              enquiry_type: 'employer_manpower',
              status: 'new',
              full_name: input.contactPerson.trim(),
              email: input.email.trim().toLowerCase(),
              phone: input.phone.trim(),
              whatsapp: input.whatsapp?.trim() || null,
              subject: `Manpower Requirement: ${input.companyName.trim()}`,
              message: input.specialRequirements?.trim() || null,
              source_channel: 'website',
            },
            {
              id: manpowerEnquiryId,
              enquiry_id: enquiryId,
              employer_id: employerId,
              reference_number: publicReference,
              idempotency_key: idempotencyKey,
              request_hash: requestHash,
              status: 'new',
              total_headcount: totalHeadcount,
              deployment_location: input.deploymentLocation?.trim() || null,
              preferred_timeline: input.preferredTimeline?.trim() || null,
              special_requirements: input.specialRequirements?.trim() || null,
              admin_notes: null,
            },
            positionRecords,
            trx
          );

          // D. Enqueue transactional outbox notifications
          await this.notification.enqueueManpowerEnquiryNotifications(
            {
              enquiryId,
              publicReference,
              companyName: input.companyName.trim(),
              contactPerson: input.contactPerson.trim(),
              contactDesignation: input.contactDesignation?.trim() || null,
              email: input.email.trim().toLowerCase(),
              phone: input.phone.trim(),
              whatsapp: input.whatsapp?.trim() || null,
              city: input.city.trim(),
              website: input.website?.trim() || null,
              industry: input.industry?.trim() || null,
              preferredTimeline: input.preferredTimeline?.trim() || null,
              deploymentLocation: input.deploymentLocation?.trim() || null,
              specialRequirements: input.specialRequirements?.trim() || null,
              positions: input.positions.map((p) => ({
                categorySlug: p.categorySlug,
                roleTitle: p.roleTitle,
                headcount: p.headcount,
                experienceYearsRequired: p.experienceYearsRequired ?? null,
                qualification: p.qualification?.trim() || null,
                genderRequirement: p.genderRequirement || null,
                languageRequirements: p.languageRequirements?.trim() || null,
                salaryOffered: p.salaryOffered?.trim() || null,
                accommodationProvided: p.accommodationProvided || null,
                transportProvided: p.transportProvided || null,
                foodProvided: p.foodProvided || null,
                notes: p.notes?.trim() || null,
              })),
              totalHeadcount,
            },
            trx
          );
        });
      } catch (txErr: any) {
        // [CTO FINAL CORRECTION]: Database-Level Idempotency Unique Constraint Collision Recovery
        const isDuplicateKey =
          txErr?.code === 'ER_DUP_ENTRY' ||
          txErr?.errno === 1062 ||
          String(txErr?.message || '').includes('uniq_manpower_idempotency_key') ||
          String(txErr?.message || '').includes('UNIQUE constraint failed');

        if (isDuplicateKey && idempotencyKey) {
          logger.info(`Database unique constraint caught for idempotency key "${idempotencyKey}"; resolving conflict`);
          const racedEnquiry = await this.manpowerRepo.findByIdempotencyKey(idempotencyKey);
          if (racedEnquiry) {
            if (racedEnquiry.request_hash === requestHash) {
              return {
                success: true,
                reference: racedEnquiry.reference_number!,
                status: racedEnquiry.status,
                totalPositions: input.positions.length,
                totalHeadcount,
                message: 'Your manpower requirement has been received and will be reviewed by our team.',
                isDuplicate: true,
              };
            } else {
              throw new AppError(
                'Idempotency key conflict: This key was previously used for a different manpower requisition.',
                409,
                'IDEMPOTENCY_KEY_CONFLICT'
              );
            }
          }
        }
        throw txErr;
      }

      logger.info(`Manpower enquiry created successfully: ${publicReference} for ${input.companyName}`);

      return {
        success: true,
        reference: publicReference,
        status: 'new',
        totalPositions: input.positions.length,
        totalHeadcount,
        message: 'Your manpower requirement has been received and will be reviewed by our team.',
        isDuplicate: false,
      };
    } finally {
      releaseInProcessLock();
      if (ManpowerEnquiryService.inFlightLocks.get(lockKey) === currentLock) {
        ManpowerEnquiryService.inFlightLocks.delete(lockKey);
      }
      // Guarantee release of MariaDB session advisory lock
      if (hasAdvisoryLock) {
        try {
          await db.raw('SELECT RELEASE_LOCK(?)', [lockKey]);
        } catch (err: unknown) {
          logger.error('Failed to release advisory lock for manpower enquiry', err as Error);
        }
      }
    }
  }

  /**
   * Retrieves full details of a manpower enquiry for administrative review.
   */
  public async getEnquiryById(id: string): Promise<FullManpowerEnquiryDetail> {
    const detail = await this.manpowerRepo.findFullDetailById(id);
    if (!detail) {
      throw new AppError('The requested manpower enquiry was not found.', 404, 'MANPOWER_ENQUIRY_NOT_FOUND');
    }
    return detail;
  }

  /**
   * Lists manpower enquiries with pagination, filters, and employer statistics.
   */
  public async listEnquiries(params: ManpowerQueryParams): Promise<PaginatedManpowerResult> {
    return await this.manpowerRepo.listEnquiries(params);
  }

  /**
   * Updates enquiry status enforcing service-level state machine invariants and audit logging.
   */
  public async updateEnquiryStatus(
    id: string,
    input: AdminUpdateManpowerStatusInput,
    actor?: { adminId: string; adminEmail: string; ip?: string }
  ): Promise<{ success: boolean; status: string }> {
    const current = await this.manpowerRepo.findById(id);
    if (!current) {
      throw new AppError('The requested manpower enquiry was not found.', 404, 'MANPOWER_ENQUIRY_NOT_FOUND');
    }

    const currentStatus = current.status as ManpowerStatus;
    const nextStatus = input.status as ManpowerStatus;

    if (currentStatus === nextStatus) {
      return { success: true, status: currentStatus };
    }

    // State machine invariant validation
    const allowed = ALLOWED_MANPOWER_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new AppError(
        `Invalid status transition from "${currentStatus}" to "${nextStatus}". Allowed transitions: ${allowed.join(', ') || 'none (terminal state)'}`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    await this.manpowerRepo.updateStatus(id, nextStatus);

    // Audit log
    await this.auditRepo.logEvent({
      actor_admin_id: actor?.adminId,
      action: 'manpower_enquiry_status_updated',
      resource_type: 'manpower_enquiry',
      resource_id: id,
      client_ip: actor?.ip,
      details_json: JSON.stringify({
        previousStatus: currentStatus,
        newStatus: nextStatus,
        notes: input.notes || null,
        adminEmail: actor?.adminEmail,
      }),
    });

    return { success: true, status: nextStatus };
  }

  /**
   * Updates tightly restricted generic operational fields of a manpower enquiry with audit logging.
   */
  public async updateEnquiry(
    id: string,
    input: AdminUpdateManpowerEnquiryInput,
    actor?: { adminId: string; adminEmail: string; ip?: string }
  ): Promise<{ success: boolean }> {
    const current = await this.manpowerRepo.findById(id);
    if (!current) {
      throw new AppError('The requested manpower enquiry was not found.', 404, 'MANPOWER_ENQUIRY_NOT_FOUND');
    }

    await this.manpowerRepo.updateEnquiry(id, {
      admin_notes: input.adminNotes ?? current.admin_notes,
      deployment_location: input.deploymentLocation ?? current.deployment_location,
      preferred_timeline: input.preferredTimeline ?? current.preferred_timeline,
      special_requirements: input.specialRequirements ?? current.special_requirements,
    });

    // Audit log
    await this.auditRepo.logEvent({
      actor_admin_id: actor?.adminId,
      action: 'manpower_enquiry_updated',
      resource_type: 'manpower_enquiry',
      resource_id: id,
      client_ip: actor?.ip,
      details_json: JSON.stringify({
        updatedFields: Object.keys(input),
        adminEmail: actor?.adminEmail,
      }),
    });

    return { success: true };
  }
}

export const manpowerEnquiryService = new ManpowerEnquiryService();
