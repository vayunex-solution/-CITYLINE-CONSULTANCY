/**
 * CITYLINE CONSULTANCY — Job Application Repository
 * Manages database persistence for candidate job applications.
 *
 * GOVERNANCE:
 * - Atomic persistence of candidate applications and reference numbers.
 * - Idempotency support: checks idempotency_key and recent submission windows without permanently blocking future applications.
 * - Safe admin listing and status updates.
 */

import { Knex } from 'knex';
import { AbstractKnexRepository } from './base.repository';
import { normalizeDatabaseError } from '../database/database-error';
import { JobPaginatedResult } from './job.repository';

export interface JobApplicationRecord {
  [key: string]: unknown;
  id: string;
  job_id: string;
  applicant_name: string;
  email: string;
  phone: string;
  whatsapp?: string | null;
  nationality: string;
  current_location: string;
  years_experience: number;
  qualification?: string | null;
  cover_letter?: string | null;
  reference_number: string;
  idempotency_key?: string | null;
  status: string; // 'new', 'reviewed', 'shortlisted', 'rejected', 'hired'
  admin_notes?: string | null;
  source_channel: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
  // Joined fields
  job_title?: string;
  job_slug?: string;
  job_category_name?: string;
}

export interface ApplicationQueryParams {
  jobId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class JobApplicationRepository extends AbstractKnexRepository<JobApplicationRecord, string> {
  protected readonly tableName = 'job_applications';

  /**
   * Inserts a candidate job application within an active transaction.
   */
  public async createApplication(
    data: Omit<JobApplicationRecord, 'created_at' | 'updated_at'>,
    trx: Knex.Transaction
  ): Promise<void> {
    try {
      await trx('job_applications').insert({
        ...data,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      });
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'JobApplicationRepository.createApplication');
    }
  }

  /**
   * Resolves an application by its public reference number (e.g. CLC-J-YYYY-XXXXXXXX).
   */
  public async findByReference(
    reference: string,
    trx?: Knex.Transaction
  ): Promise<JobApplicationRecord | null> {
    try {
      const row = await this.getQuery(trx)
        .from('job_applications')
        .join('jobs', 'job_applications.job_id', 'jobs.id')
        .where('job_applications.reference_number', reference.trim().toUpperCase())
        .whereNull('job_applications.deleted_at')
        .select(
          'job_applications.*',
          'jobs.title as job_title',
          'jobs.slug as job_slug'
        )
        .first();

      return (row as JobApplicationRecord) || null;
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'JobApplicationRepository.findByReference');
    }
  }

  /**
   * Resolves an application by its client idempotency key.
   */
  public async findByIdempotencyKey(
    key: string,
    trx?: Knex.Transaction
  ): Promise<JobApplicationRecord | null> {
    try {
      const row = await this.getQuery(trx)
        .from('job_applications')
        .where('idempotency_key', key.trim())
        .whereNull('deleted_at')
        .first();

      return (row as JobApplicationRecord) || null;
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'JobApplicationRepository.findByIdempotencyKey');
    }
  }

  /**
   * Checks whether an identical application was submitted within a recent short window (e.g. 15 minutes)
   * to suppress accidental double-clicks without permanently blocking future applications.
   */
  public async findRecentDuplicate(
    jobId: string,
    email: string,
    windowMs: number = 15 * 60 * 1000,
    trx?: Knex.Transaction
  ): Promise<JobApplicationRecord | null> {
    try {
      const cutoff = new Date(Date.now() - windowMs);
      const row = await this.getQuery(trx)
        .from('job_applications')
        .where({
          job_id: jobId,
          email: email.trim().toLowerCase(),
        })
        .where('created_at', '>=', cutoff)
        .whereNull('deleted_at')
        .orderBy('created_at', 'desc')
        .first();

      return (row as JobApplicationRecord) || null;
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'JobApplicationRepository.findRecentDuplicate');
    }
  }

  /**
   * Lists applications for administrative review with filtering and pagination.
   */
  public async listApplications(
    params: ApplicationQueryParams = {},
    trx?: Knex.Transaction
  ): Promise<JobPaginatedResult<JobApplicationRecord>> {
    try {
      const page = Math.max(1, params.page || 1);
      const limit = Math.min(50, Math.max(1, params.limit || 20));
      const offset = (page - 1) * limit;

      const baseQuery = this.getQuery(trx)
        .from('job_applications')
        .join('jobs', 'job_applications.job_id', 'jobs.id')
        .leftJoin('job_categories', 'jobs.category_id', 'job_categories.id')
        .whereNull('job_applications.deleted_at');

      if (params.jobId && params.jobId.trim()) {
        baseQuery.where('job_applications.job_id', params.jobId.trim());
      }

      if (params.status && params.status.trim()) {
        baseQuery.where('job_applications.status', params.status.trim().toLowerCase());
      }

      if (params.search && params.search.trim()) {
        const term = `%${params.search.trim().toLowerCase()}%`;
        baseQuery.where((b) => {
          b.whereRaw('LOWER(job_applications.applicant_name) LIKE ?', [term])
            .orWhereRaw('LOWER(job_applications.email) LIKE ?', [term])
            .orWhereRaw('LOWER(job_applications.phone) LIKE ?', [term])
            .orWhereRaw('LOWER(job_applications.reference_number) LIKE ?', [term])
            .orWhereRaw('LOWER(jobs.title) LIKE ?', [term]);
        });
      }

      const countResult = await baseQuery.clone().count<{ count: number | string }>('job_applications.id as count').first();
      const total = countResult ? parseInt(String(countResult.count), 10) : 0;

      const rows = await baseQuery
        .clone()
        .select(
          'job_applications.*',
          'jobs.title as job_title',
          'jobs.slug as job_slug',
          'job_categories.name as job_category_name'
        )
        .orderBy('job_applications.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return {
        data: rows as JobApplicationRecord[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'JobApplicationRepository.listApplications');
    }
  }

  /**
   * Resolves a single application with associated job and document metadata for administrative review.
   */
  public async findByIdWithDetails(
    id: string,
    trx?: Knex.Transaction
  ): Promise<{ application: JobApplicationRecord; documents: any[] } | null> {
    try {
      const app = await this.getQuery(trx)
        .from('job_applications')
        .join('jobs', 'job_applications.job_id', 'jobs.id')
        .leftJoin('job_categories', 'jobs.category_id', 'job_categories.id')
        .where('job_applications.id', id)
        .whereNull('job_applications.deleted_at')
        .select(
          'job_applications.*',
          'jobs.title as job_title',
          'jobs.slug as job_slug',
          'job_categories.name as job_category_name'
        )
        .first();

      if (!app) return null;

      const documents = await this.getQuery(trx)
        .from('documents')
        .where({
          entity_type: 'job_application',
          entity_id: id,
        })
        .select(
          'id',
          'document_category',
          'original_filename',
          'mime_type',
          'file_extension',
          'file_size_bytes',
          'validation_status',
          'malware_scan_status',
          'created_at'
        );

      return {
        application: app as JobApplicationRecord,
        documents,
      };
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'JobApplicationRepository.findByIdWithDetails');
    }
  }

  /**
   * Updates application triage status.
   * If status is 'rejected', automatically soft-deletes into 30-day trash retention.
   */
  public async updateStatus(
    id: string,
    status: string,
    adminNotes?: string | null,
    trx?: Knex.Transaction
  ): Promise<void> {
    try {
      const updatePayload: Record<string, unknown> = {
        status,
        updated_at: new Date(),
      };
      if (adminNotes !== undefined) {
        updatePayload.admin_notes = adminNotes;
      }
      if (status === 'rejected') {
        updatePayload.deleted_at = new Date();
      }

      await this.getQuery(trx)
        .from('job_applications')
        .where({ id })
        .update(updatePayload);
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'JobApplicationRepository.updateStatus');
    }
  }

  /**
   * Explicitly moves a job application to the 30-day trash bin.
   */
  public async softDelete(id: string, trx?: Knex.Transaction): Promise<void> {
    try {
      await this.getQuery(trx)
        .from('job_applications')
        .where({ id })
        .update({
          deleted_at: new Date(),
          status: 'rejected',
          updated_at: new Date(),
        });
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'JobApplicationRepository.softDelete');
    }
  }
}

export const jobApplicationRepository = new JobApplicationRepository();
