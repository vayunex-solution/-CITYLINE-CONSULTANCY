/**
 * CITYLINE CONSULTANCY — Administrative Trash Controller
 * Handles trash listing, item restoration, permanent removal, and 30-day automated purge.
 */

import { Request, Response, NextFunction } from 'express';
import { adminTrashService, AdminTrashService } from '../services/admin-trash.service';
import { AppError } from '../utils/app-error';

export class AdminTrashController {
  constructor(private service: AdminTrashService = adminTrashService) {}

  public listTrash = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = (req.query.search as string) || undefined;
      const result = await this.service.listTrashItems(search);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: 1,
          limit: result.total,
          totalPages: 1,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public restoreItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type, id } = req.params;
      if (!['visa_enquiry', 'business_enquiry', 'job_application'].includes(type)) {
        throw new AppError('Invalid trash item type.', 400, 'INVALID_TYPE');
      }

      const admin = (req as any).admin;
      await this.service.restoreTrashItem(type as any, id, {
        adminId: admin?.id,
        adminEmail: admin?.email,
        ip: req.ip || req.socket.remoteAddress,
      });

      res.status(200).json({
        success: true,
        message: 'Item has been restored to active list successfully.',
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type, id } = req.params;
      if (!['visa_enquiry', 'business_enquiry', 'job_application'].includes(type)) {
        throw new AppError('Invalid trash item type.', 400, 'INVALID_TYPE');
      }

      const admin = (req as any).admin;
      await this.service.permanentlyDeleteItem(type as any, id, {
        adminId: admin?.id,
        adminEmail: admin?.email,
        ip: req.ip || req.socket.remoteAddress,
      });

      res.status(200).json({
        success: true,
        message: 'Item and associated files have been permanently deleted.',
      });
    } catch (err) {
      next(err);
    }
  };

  public purgeTrash = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = (req as any).admin;
      const emptyAll = req.body?.emptyAll === true;

      const result = emptyAll
        ? await this.service.emptyAllTrash({
            adminId: admin?.id,
            adminEmail: admin?.email,
            ip: req.ip || req.socket.remoteAddress,
          })
        : await this.service.purgeExpiredTrash(30, {
            adminId: admin?.id,
            adminEmail: admin?.email,
            ip: req.ip || req.socket.remoteAddress,
          });

      res.status(200).json({
        success: true,
        message: `Successfully purged ${result.purgedCount} item(s) from Trash.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const adminTrashController = new AdminTrashController();
