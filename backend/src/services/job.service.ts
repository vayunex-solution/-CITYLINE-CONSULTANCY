/**
 * CITYLINE CONSULTANCY — Job Vacancy Service
 * Coordinates public job vacancy discovery and administrative job lifecycle management.
 *
 * GOVERNANCE:
 * - Public operations strictly restrict visibility to published/active jobs where deleted_at IS NULL.
 * - Non-existent or unpublished jobs return standard 404 without leaking draft presence.
 * - Administrative mutations record structured audit logs.
 */

import crypto from 'crypto';
import { JobRepository, jobRepository, JobRecord, JobCategoryRecord, JobQueryParams, JobPaginatedResult } from '../repositories/job.repository';
import { AuditLogRepository, auditLogRepository } from '../repositories/audit-log.repository';
import { AppError } from '../utils/app-error';
import { AdminCreateJobInput, AdminUpdateJobInput } from '../schemas/job.schema';

export interface PublicJobDTO {
  id: string;
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  location: string;
  employmentType: string;
  description: string;
  requirements: string;
  shortDescription?: string | null;
  responsibilities?: string | null;
  qualification?: string | null;
  experienceYearsRequired?: number | null;
  salaryRange?: string | null;
  benefits?: string | null;
  isFeatured: boolean;
  publishedAt?: string | null;
  createdAt: string;
}

export class JobService {
  constructor(
    private readonly jobRepo: JobRepository = jobRepository,
    private readonly auditRepo: AuditLogRepository = auditLogRepository
  ) {}

  /**
   * Sanitizes internal database record into public-facing Job DTO.
   */
  public toPublicDTO(job: JobRecord): PublicJobDTO {
    return {
      id: job.id,
      slug: job.slug,
      title: job.title,
      category: job.category_name || '',
      categorySlug: job.category_slug || '',
      location: job.location,
      employmentType: job.employment_type,
      description: job.description,
      requirements: job.requirements,
      shortDescription: job.short_description || null,
      responsibilities: job.responsibilities || null,
      qualification: job.qualification || null,
      experienceYearsRequired: job.experience_years_required ?? null,
      salaryRange: job.salary_range || null,
      benefits: job.benefits || null,
      isFeatured: Boolean(job.is_featured),
      publishedAt: job.published_at ? new Date(job.published_at).toISOString() : null,
      createdAt: new Date(job.created_at).toISOString(),
    };
  }

  /**
   * Retrieves paginated public jobs matching search and filter criteria.
   */
  public async getPublishedJobs(params: JobQueryParams = {}): Promise<JobPaginatedResult<PublicJobDTO>> {
    const result = await this.jobRepo.findPublishedJobs(params);
    return {
      data: result.data.map((j) => this.toPublicDTO(j)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Resolves a public job by its slug.
   * Throws 404 AppError if not found or not published.
   */
  public async getPublishedJobBySlug(slug: string): Promise<{ job: PublicJobDTO; relatedJobs: PublicJobDTO[] }> {
    const job = await this.jobRepo.findPublishedBySlug(slug);
    if (!job) {
      throw new AppError('The requested job vacancy was not found or is currently closed.', 404, 'JOB_NOT_FOUND');
    }

    const related = await this.jobRepo.findRelatedPublishedJobs(job.id, job.category_id, 3);

    return {
      job: this.toPublicDTO(job),
      relatedJobs: related.map((j) => this.toPublicDTO(j)),
    };
  }

  /**
   * Retrieves all active job categories with published job counts.
   */
  public async getJobCategoriesWithCounts(): Promise<JobCategoryRecord[]> {
    return await this.jobRepo.findCategoriesWithCounts();
  }

  /**
   * Administrative method to query all vacancies (including drafts and archived).
   */
  public async listAllJobs(params: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<JobPaginatedResult<JobRecord>> {
    return await this.jobRepo.listAllJobs(params);
  }

  /**
   * Administrative method to create a new job vacancy.
   */
  public async createJob(
    input: AdminCreateJobInput,
    adminId: string,
    context: { clientIp?: string; requestId?: string } = {}
  ): Promise<JobRecord> {
    const category = await this.jobRepo.findCategoryById(input.categoryId);
    if (!category) {
      throw new AppError('The specified job category does not exist.', 400, 'INVALID_JOB_CATEGORY');
    }

    const jobId = crypto.randomUUID();
    const isPublic = input.status === 'active' || input.status === 'published';

    const jobRecord: Omit<JobRecord, 'created_at' | 'updated_at'> = {
      id: jobId,
      category_id: input.categoryId,
      title: input.title,
      slug: input.slug,
      location: input.location,
      employment_type: input.employmentType,
      description: input.description,
      requirements: input.requirements,
      short_description: input.shortDescription || null,
      responsibilities: input.responsibilities || null,
      qualification: input.qualification || null,
      experience_years_required: input.experienceYearsRequired ?? null,
      salary_range: input.salaryRange || null,
      benefits: input.benefits || null,
      status: input.status,
      is_featured: Boolean(input.isFeatured),
      published_at: isPublic ? new Date() : null,
      deleted_at: null,
    };

    await this.jobRepo.create(jobRecord as any);

    // Audit log
    await this.auditRepo.logEvent({
      actor_admin_id: adminId,
      action: 'job_created',
      resource_type: 'job',
      resource_id: jobId,
      client_ip: context.clientIp,
      request_id: context.requestId,
      details_json: JSON.stringify({
        title: input.title,
        slug: input.slug,
        status: input.status,
      }),
    });

    const created = await this.jobRepo.findById(jobId);
    return created!;
  }

  /**
   * Administrative method to update an existing vacancy.
   */
  public async updateJob(
    id: string,
    input: AdminUpdateJobInput,
    adminId: string,
    context: { clientIp?: string; requestId?: string } = {}
  ): Promise<JobRecord> {
    const existing = await this.jobRepo.findById(id);
    if (!existing || existing.deleted_at) {
      throw new AppError('Job vacancy not found.', 404, 'JOB_NOT_FOUND');
    }

    if (input.categoryId !== undefined) {
      const category = await this.jobRepo.findCategoryById(input.categoryId);
      if (!category) {
        throw new AppError('The specified job category does not exist.', 400, 'INVALID_JOB_CATEGORY');
      }
    }

    const updates: Partial<JobRecord> = {};
    if (input.categoryId !== undefined) updates.category_id = input.categoryId;
    if (input.title !== undefined) updates.title = input.title;
    if (input.slug !== undefined) updates.slug = input.slug;
    if (input.location !== undefined) updates.location = input.location;
    if (input.employmentType !== undefined) updates.employment_type = input.employmentType;
    if (input.description !== undefined) updates.description = input.description;
    if (input.requirements !== undefined) updates.requirements = input.requirements;
    if (input.shortDescription !== undefined) updates.short_description = input.shortDescription;
    if (input.responsibilities !== undefined) updates.responsibilities = input.responsibilities;
    if (input.qualification !== undefined) updates.qualification = input.qualification;
    if (input.experienceYearsRequired !== undefined) updates.experience_years_required = input.experienceYearsRequired;
    if (input.salaryRange !== undefined) updates.salary_range = input.salaryRange;
    if (input.benefits !== undefined) updates.benefits = input.benefits;
    if (input.isFeatured !== undefined) updates.is_featured = input.isFeatured;

    if (input.status !== undefined) {
      updates.status = input.status;
      if ((input.status === 'active' || input.status === 'published') && !existing.published_at) {
        updates.published_at = new Date();
      }
    }

    updates.updated_at = new Date();

    await this.jobRepo.update(id, updates);

    // Audit log
    await this.auditRepo.logEvent({
      actor_admin_id: adminId,
      action: 'job_updated',
      resource_type: 'job',
      resource_id: id,
      client_ip: context.clientIp,
      request_id: context.requestId,
      details_json: JSON.stringify({
        updatedFields: Object.keys(updates),
      }),
    });

    const updated = await this.jobRepo.findById(id);
    return updated!;
  }

  /**
   * Administrative safe delete for a job.
   */
  public async deleteJob(
    id: string,
    adminId: string,
    context: { clientIp?: string; requestId?: string } = {}
  ): Promise<void> {
    const existing = await this.jobRepo.findById(id);
    if (!existing || existing.deleted_at) {
      throw new AppError('Job vacancy not found.', 404, 'JOB_NOT_FOUND');
    }

    // Soft delete preserves all application links and applicant documents
    await this.jobRepo.softDeleteJob(id);

    // Audit log
    await this.auditRepo.logEvent({
      actor_admin_id: adminId,
      action: 'job_deleted',
      resource_type: 'job',
      resource_id: id,
      client_ip: context.clientIp,
      request_id: context.requestId,
      details_json: JSON.stringify({
        title: existing.title,
        status: 'archived',
      }),
    });
  }
}

export const jobService = new JobService();
