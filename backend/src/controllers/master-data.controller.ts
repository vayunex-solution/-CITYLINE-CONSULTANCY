/**
 * CITYLINE CONSULTANCY — Administrative Master Data Controller
 * Handles CRUD and state toggling for system lookup tables.
 */

import { Request, Response, NextFunction } from 'express';
import { masterDataService, MasterDataService } from '../services/master-data.service';
import {
  createCategorySchema,
  updateCategorySchema,
  createLocationSchema,
  updateLocationSchema,
  createVisaServiceSchema,
  updateVisaServiceSchema,
  createIndustrySchema,
  updateIndustrySchema,
} from '../schemas/master-data.schema';
import { AppError } from '../utils/app-error';

export class MasterDataController {
  constructor(private readonly service: MasterDataService = masterDataService) {}

  // ==========================================
  // 1. JOB CATEGORIES
  // ==========================================

  public async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive !== 'false';
      const data = await this.service.getAllCategories(includeInactive);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parsed.error.flatten().fieldErrors,
        });
      }

      const adminId = req.admin?.id || 'system';
      const created = await this.service.createCategory(parsed.data, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(201).json({
        success: true,
        message: 'Job category created successfully.',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) throw new AppError('Invalid category ID.', 400, 'INVALID_ID');

      const parsed = updateCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parsed.error.flatten().fieldErrors,
        });
      }

      const adminId = req.admin?.id || 'system';
      const updated = await this.service.updateCategory(id, parsed.data, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Job category updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public async toggleCategoryActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) throw new AppError('Invalid category ID.', 400, 'INVALID_ID');

      const adminId = req.admin?.id || 'system';
      const updated = await this.service.toggleCategoryActive(id, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: `Category ${updated.is_active ? 'activated' : 'deactivated'} successfully.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) throw new AppError('Invalid category ID.', 400, 'INVALID_ID');

      const adminId = req.admin?.id || 'system';
      await this.service.deleteCategory(id, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Job category deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 2. JOB LOCATIONS
  // ==========================================

  public async listLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive !== 'false';
      const data = await this.service.getAllLocations(includeInactive);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async createLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createLocationSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parsed.error.flatten().fieldErrors,
        });
      }

      const adminId = req.admin?.id || 'system';
      const created = await this.service.createLocation(parsed.data, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(201).json({
        success: true,
        message: 'Location created successfully.',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) throw new AppError('Invalid location ID.', 400, 'INVALID_ID');

      const parsed = updateLocationSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parsed.error.flatten().fieldErrors,
        });
      }

      const adminId = req.admin?.id || 'system';
      const updated = await this.service.updateLocation(id, parsed.data, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Location updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public async toggleLocationActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) throw new AppError('Invalid location ID.', 400, 'INVALID_ID');

      const adminId = req.admin?.id || 'system';
      const updated = await this.service.toggleLocationActive(id, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: `Location ${updated.is_active ? 'activated' : 'deactivated'} successfully.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) throw new AppError('Invalid location ID.', 400, 'INVALID_ID');

      const adminId = req.admin?.id || 'system';
      await this.service.deleteLocation(id, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Location deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 3. VISA SERVICES
  // ==========================================

  public async listVisaServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive !== 'false';
      const data = await this.service.getAllVisaServices(includeInactive);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async createVisaService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createVisaServiceSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parsed.error.flatten().fieldErrors,
        });
      }

      const adminId = req.admin?.id || 'system';
      const created = await this.service.createVisaService(parsed.data, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(201).json({
        success: true,
        message: 'Visa service created successfully.',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateVisaService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) throw new AppError('Invalid visa service ID.', 400, 'INVALID_ID');

      const parsed = updateVisaServiceSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parsed.error.flatten().fieldErrors,
        });
      }

      const adminId = req.admin?.id || 'system';
      const updated = await this.service.updateVisaService(id, parsed.data, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Visa service updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public async toggleVisaServiceActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) throw new AppError('Invalid visa service ID.', 400, 'INVALID_ID');

      const adminId = req.admin?.id || 'system';
      const updated = await this.service.toggleVisaServiceActive(id, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: `Visa service ${updated.is_active ? 'activated' : 'deactivated'} successfully.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteVisaService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) throw new AppError('Invalid visa service ID.', 400, 'INVALID_ID');

      const adminId = req.admin?.id || 'system';
      await this.service.deleteVisaService(id, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Visa service deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 4. INDUSTRY SECTORS
  // ==========================================

  public async listIndustries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive !== 'false';
      const data = await this.service.getAllIndustries(includeInactive);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async createIndustry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createIndustrySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parsed.error.flatten().fieldErrors,
        });
      }

      const adminId = req.admin?.id || 'system';
      const created = await this.service.createIndustry(parsed.data, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(201).json({
        success: true,
        message: 'Industry sector created successfully.',
        data: created,
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateIndustry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) throw new AppError('Invalid industry ID.', 400, 'INVALID_ID');

      const parsed = updateIndustrySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
          fieldErrors: parsed.error.flatten().fieldErrors,
        });
      }

      const adminId = req.admin?.id || 'system';
      const updated = await this.service.updateIndustry(id, parsed.data, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Industry sector updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public async toggleIndustryActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) throw new AppError('Invalid industry ID.', 400, 'INVALID_ID');

      const adminId = req.admin?.id || 'system';
      const updated = await this.service.toggleIndustryActive(id, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: `Industry sector ${updated.is_active ? 'activated' : 'deactivated'} successfully.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteIndustry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) throw new AppError('Invalid industry ID.', 400, 'INVALID_ID');

      const adminId = req.admin?.id || 'system';
      await this.service.deleteIndustry(id, adminId, {
        clientIp: req.ip,
        requestId: req.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Industry sector deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const masterDataController = new MasterDataController();
