/**
 * CITYLINE CONSULTANCY — Public Job Controller
 * Handles public job discovery, category listings, slug resolution, and candidate applications.
 *
 * GOVERNANCE:
 * - Public responses strictly conceal draft/archived vacancies and internal administrative data.
 * - Input validation via Zod with structured field-error mapping.
 * - Responses contain strictly necessary public data (no private document keys, no internal SQL IDs).
 */

import { Request, Response, NextFunction } from 'express';
import { jobQuerySchema, jobApplicationInputSchema } from '../schemas/job.schema';
import { jobService, JobService } from '../services/job.service';
import { jobApplicationService, JobApplicationService } from '../services/job-application.service';
import { AppError } from '../utils/app-error';

export class JobController {
  constructor(
    private readonly jobs: JobService = jobService,
    private readonly applications: JobApplicationService = jobApplicationService
  ) {}

  /**
   * GET /api/v1/jobs
   */
  public async getJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParse = jobQuerySchema.safeParse(req.query);
      if (!queryParse.success) {
        throw new AppError('Invalid job search parameters.', 400, 'VALIDATION_ERROR');
      }

      const result = await this.jobs.getPublishedJobs(queryParse.data);

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
   * GET /api/v1/jobs/categories
   */
  public async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await this.jobs.getJobCategoriesWithCounts();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/jobs/:slug
   */
  public async getJobBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = req.params.slug;
      if (!slug) {
        throw new AppError('Job slug is required.', 400, 'INVALID_SLUG');
      }

      const result = await this.jobs.getPublishedJobBySlug(slug);

      res.status(200).json({
        success: true,
        data: result.job,
        relatedJobs: result.relatedJobs,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/jobs/:slug/apply
   */
  public async submitApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = req.params.slug;
      if (!slug) {
        throw new AppError('Job slug is required.', 400, 'INVALID_SLUG');
      }

      // 1. Authoritative Zod schema validation
      const parseResult = jobApplicationInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parseResult.error.issues) {
          const pathKey = issue.path.join('.');
          if (!fieldErrors[pathKey]) {
            fieldErrors[pathKey] = issue.message;
          }
        }

        throw new AppError('Validation failed for job application submission.', 400, 'VALIDATION_ERROR', {
          fieldErrors,
        });
      }

      // 2. Extract CV file from Multer (normalized by jobApplicationUploadMiddleware)
      const rawCvFile = req.file;

      // 3. Extract idempotency key from header or body
      const idempotencyKey = (req.headers['x-idempotency-key'] as string) || parseResult.data.idempotencyKey || undefined;

      // 4. Delegate to domain service
      const result = await this.applications.submitApplication(slug, parseResult.data, rawCvFile, {
        clientIp: req.ip || req.socket.remoteAddress,
        requestId: (req.headers['x-request-id'] as string) || undefined,
        idempotencyKey,
      });

      res.status(result.isDuplicate ? 200 : 201).json({
        success: true,
        message: result.message,
        data: {
          reference: result.reference,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const jobController = new JobController();
