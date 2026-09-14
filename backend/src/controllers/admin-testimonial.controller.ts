/**
 * CITYLINE CONSULTANCY — Administrative Testimonials Controller
 * Handles administrative listing, creation, modification, ordering, and archiving of testimonials.
 *
 * GOVERNANCE:
 * - Restricted to authenticated operators ('super_admin', 'admin_operator').
 * - Strict schema parsing rejects mass assignment and unknown fields.
 * - All mutations trigger persistent audit logging.
 */

import { Request, Response, NextFunction } from 'express';
import {
  createTestimonialSchema,
  updateTestimonialSchema,
  reorderTestimonialsSchema,
  testimonialQuerySchema,
} from '../schemas/testimonial.schema';
import { testimonialService, TestimonialService } from '../services/testimonial.service';
import { AppError } from '../utils/app-error';

export class AdminTestimonialController {
  constructor(private readonly service: TestimonialService = testimonialService) {}

  /**
   * Helper to extract authenticated operator details.
   */
  private getActor(req: Request) {
    const adminUser = (req as any).admin;
    return {
      adminId: adminUser?.id || 'system',
      adminEmail: adminUser?.email || 'admin@cityline.ae',
      ip: req.ip,
    };
  }

  /**
   * GET /api/v1/admin/testimonials
   * Paginated listing of testimonials with search and status filtering.
   */
  public listTestimonials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = testimonialQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        throw new AppError('Invalid query parameters.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parseResult.error.flatten().fieldErrors,
        });
      }

      const result = await this.service.getAdminTestimonials(parseResult.data);
      res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/testimonials/:id
   * Single testimonial details.
   */
  public getTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid testimonial ID.', 400, 'INVALID_ID');
      }

      const record = await this.service.getTestimonialById(id);
      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/testimonials
   * Creates a new testimonial.
   */
  public createTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = createTestimonialSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError('Validation failed for testimonial creation.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parseResult.error.flatten().fieldErrors,
        });
      }

      const record = await this.service.createTestimonial(parseResult.data, this.getActor(req));
      res.status(201).json({
        success: true,
        message: 'Testimonial created successfully.',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/testimonials/:id
   * Updates an existing testimonial.
   */
  public updateTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid testimonial ID.', 400, 'INVALID_ID');
      }

      const parseResult = updateTestimonialSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError('Validation failed for testimonial update.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parseResult.error.flatten().fieldErrors,
        });
      }

      const updated = await this.service.updateTestimonial(id, parseResult.data, this.getActor(req));
      res.status(200).json({
        success: true,
        message: 'Testimonial updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/testimonials/:id
   * Safe soft-deletion / archiving of a testimonial.
   */
  public deleteTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid testimonial ID.', 400, 'INVALID_ID');
      }

      await this.service.deleteTestimonial(id, this.getActor(req));
      res.status(200).json({
        success: true,
        message: 'Testimonial archived successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/testimonials/reorder
   * Reorders testimonials display order.
   */
  public reorderTestimonials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = reorderTestimonialsSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError('Validation failed for testimonial reordering.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parseResult.error.flatten().fieldErrors,
        });
      }

      await this.service.reorderTestimonials(parseResult.data.items, this.getActor(req));
      res.status(200).json({
        success: true,
        message: 'Testimonials reordered successfully.',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const adminTestimonialController = new AdminTestimonialController();
