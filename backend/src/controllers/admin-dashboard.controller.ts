/**
 * CITYLINE CONSULTANCY — Administrative Dashboard Controller
 * Exposes endpoints for real-time dashboard statistics, visa enquiry management,
 * notification queue inspection/retry, and audit log exploration.
 *
 * GOVERNANCE:
 * - Restricted to authenticated operators ('super_admin', 'admin_operator').
 * - Strict schema validation rejects mass assignment and unknown fields.
 * - Sensitive credentials and storage paths are never leaked.
 */

import { Request, Response, NextFunction } from 'express';
import {
  adminDashboardService,
  AdminDashboardService,
} from '../services/admin-dashboard.service';
import {
  adminVisaQuerySchema,
  adminUpdateVisaStatusSchema,
  adminNotificationQuerySchema,
  adminAuditLogQuerySchema,
} from '../schemas/admin-dashboard.schema';
import { AppError } from '../utils/app-error';

export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService = adminDashboardService) {}

  private getActor(req: Request) {
    const adminUser = req.admin;
    return {
      adminId: adminUser?.id || 'system',
      adminEmail: adminUser?.email || 'admin@cityline.ae',
      ip: req.ip,
    };
  }

  /**
   * GET /api/v1/admin/dashboard/stats
   * Aggregates real backend data across all domains.
   */
  public getDashboardStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/admin/visa-enquiries
   * Paginated listing of visa enquiries with search & status filters.
   */
  public listVisaEnquiries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = adminVisaQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        throw new AppError('Invalid query parameters.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parseResult.error.flatten().fieldErrors,
        });
      }

      const result = await this.service.listVisaEnquiries(parseResult.data);
      res.status(200).json({
        success: true,
        data: result.items,
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
  };

  /**
   * GET /api/v1/admin/visa-enquiries/:id
   * Single visa enquiry details with safe document metadata.
   */
  public getVisaEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const detail = await this.service.getVisaEnquiryById(id);
      res.status(200).json({
        success: true,
        data: detail,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/admin/visa-enquiries/:id/status
   * Updates visa enquiry status with audit logging.
   */
  public updateVisaEnquiryStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const parseResult = adminUpdateVisaStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError('Validation failed for visa status update.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parseResult.error.flatten().fieldErrors,
        });
      }

      const result = await this.service.updateVisaEnquiryStatus(id, parseResult.data, this.getActor(req));
      res.status(200).json({
        success: true,
        message: 'Visa enquiry status updated successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/admin/notifications
   * Paginated list of outbox notification queue items.
   */
  public listNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = adminNotificationQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        throw new AppError('Invalid query parameters.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parseResult.error.flatten().fieldErrors,
        });
      }

      const result = await this.service.listNotifications(parseResult.data);
      res.status(200).json({
        success: true,
        data: result.items,
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
  };

  /**
   * POST /api/v1/admin/notifications/:id/retry
   * Safely marks a failed/exhausted notification for retry.
   */
  public retryNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.service.retryNotification(id, this.getActor(req));
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/admin/audit-logs
   * Paginated list of audit events.
   */
  public listAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = adminAuditLogQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        throw new AppError('Invalid query parameters.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parseResult.error.flatten().fieldErrors,
        });
      }

      const result = await this.service.listAuditLogs(parseResult.data);
      res.status(200).json({
        success: true,
        data: result.items,
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
  };
}

export const adminDashboardController = new AdminDashboardController();
