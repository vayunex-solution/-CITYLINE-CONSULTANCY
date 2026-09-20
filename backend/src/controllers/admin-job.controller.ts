/**
 * CITYLINE CONSULTANCY — Administrative Job & Recruitment Controller
 * Handles administrative vacancy management and candidate application triage.
 *
 * GOVERNANCE:
 * - Protected by Phase 4 authentication and RBAC guards.
 * - Records structured audit logs for all material state changes.
 * - Conforms to Phase 8 scope: provides backend foundation for future Phase 11 UI.
 */

import { Request, Response, NextFunction } from 'express';
import { adminCreateJobSchema, adminUpdateJobSchema, adminUpdateApplicationStatusSchema } from '../schemas/job.schema';
import { jobService, JobService } from '../services/job.service';
import { jobApplicationService, JobApplicationService } from '../services/job-application.service';
import { AppError } from '../utils/app-error';

export class AdminJobController {
  constructor(
    private readonly jobs: JobService = jobService,
    private readonly applications: JobApplicationService = jobApplicationService
  ) {}

  /**
   * GET /api/v1/admin/recruitment/jobs
   */
  public async listJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, category, search, page, limit } = req.query;
      const result = await this.jobs.listAllJobs({
        status: status as string | undefined,
        category: category as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/recruitment/jobs
   */
  public async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = adminCreateJobSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorDetails = parseResult.error.flatten().fieldErrors;
        const formattedErrors = Object.entries(errorDetails)
          .map(([k, v]) => `${k}: ${(v || []).join(', ')}`)
          .join('; ');
        throw new AppError(
          `Validation failed for job creation: ${formattedErrors}`,
          400,
          'VALIDATION_ERROR',
          { fieldErrors: errorDetails }
        );
      }

      const adminId = req.admin?.id || 'system';
      const created = await this.jobs.createJob(parseResult.data, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(201).json({
        success: true,
        message: 'Job vacancy created successfully.',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/recruitment/jobs/:id
   */
  public async getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const jobsList = await this.jobs.listAllJobs({ search: id, limit: 1 });
      const job = jobsList.data.find((j) => j.id === id);

      if (!job) {
        throw new AppError('Job vacancy not found.', 404, 'JOB_NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: job,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/admin/recruitment/jobs/:id
   */
  public async updateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const parseResult = adminUpdateJobSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError('Validation failed for job update.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parseResult.error.flatten().fieldErrors,
        });
      }

      const adminId = req.admin?.id || 'system';
      const updated = await this.jobs.updateJob(id, parseResult.data, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Job vacancy updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/admin/recruitment/jobs/:id
   */
  public async deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const adminId = req.admin?.id || 'system';

      await this.jobs.deleteJob(id, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Job vacancy archived successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/recruitment/applications
   */
  public async listApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId, status, search, page, limit } = req.query;
      const result = await this.applications.listApplications({
        jobId: jobId as string | undefined,
        status: status as string | undefined,
        search: search as string | undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/recruitment/applications/:id
   */
  public async getApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const result = await this.applications.getApplicationDetails(id);

      res.status(200).json({
        success: true,
        data: {
          application: result.application,
          documents: result.documents,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/recruitment/applications/:id/status
   */
  public async updateApplicationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const parseResult = adminUpdateApplicationStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError('Validation failed for status update.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parseResult.error.flatten().fieldErrors,
        });
      }

      const adminId = req.admin?.id || 'system';
      await this.applications.updateApplicationStatus(id, parseResult.data, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Application status updated successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminJobController = new AdminJobController();
