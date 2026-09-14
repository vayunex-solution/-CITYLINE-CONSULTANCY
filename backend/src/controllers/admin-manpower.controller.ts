/**
 * CITYLINE CONSULTANCY — Administrative Manpower Enquiry Controller
 * Handles administrative listing, inspection, status updates, and operational field updates.
 *
 * GOVERNANCE:
 * - Strictly guarded by Phase 4 authentication and RBAC ('super_admin', 'admin_operator').
 * - Tightly restricted update schema prevents mass assignment.
 * - Writes audit log records for all status and field modifications.
 */

import { Request, Response, NextFunction } from 'express';
import {
  manpowerQuerySchema,
  adminUpdateManpowerStatusSchema,
  adminUpdateManpowerEnquirySchema,
} from '../schemas/manpower-enquiry.schema';
import { manpowerEnquiryService } from '../services/manpower-enquiry.service';
import { AppError } from '../utils/app-error';

export class AdminManpowerController {
  /**
   * GET /api/v1/admin/manpower-enquiries
   * Lists manpower enquiries with pagination and filters.
   */
  public async listEnquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams = manpowerQuerySchema.parse(req.query);
      const result = await manpowerEnquiryService.listEnquiries(queryParams);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/manpower-enquiries/:id
   * Retrieves full details of a single manpower enquiry.
   */
  public async getEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const detail = await manpowerEnquiryService.getEnquiryById(id);

      res.status(200).json({
        success: true,
        data: detail,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/manpower-enquiries/:id/status
   * Dedicated status state machine transition endpoint.
   */
  public async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parseResult = adminUpdateManpowerStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError('Validation failed for status update.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parseResult.error.flatten().fieldErrors,
        });
      }

      const adminUser = (req as any).admin;
      const result = await manpowerEnquiryService.updateEnquiryStatus(
        id,
        parseResult.data,
        {
          adminId: adminUser?.id || 'system',
          adminEmail: adminUser?.email || 'admin@cityline.ae',
          ip: req.ip,
        }
      );

      res.status(200).json({
        success: true,
        message: `Manpower enquiry status successfully updated to "${result.status}".`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/manpower-enquiries/:id
   * Tightly restricted operational field update endpoint.
   */
  public async updateEnquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const parseResult = adminUpdateManpowerEnquirySchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError('Validation failed for enquiry update.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parseResult.error.flatten().fieldErrors,
        });
      }

      const adminUser = (req as any).admin;
      await manpowerEnquiryService.updateEnquiry(id, parseResult.data, {
        adminId: adminUser?.id || 'system',
        adminEmail: adminUser?.email || 'admin@cityline.ae',
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Manpower enquiry updated successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminManpowerController = new AdminManpowerController();
