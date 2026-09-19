"use strict";
/**
 * CITYLINE CONSULTANCY — Administrative Master Data Controller
 * Handles CRUD and state toggling for system lookup tables.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.masterDataController = exports.MasterDataController = void 0;
const master_data_service_1 = require("../services/master-data.service");
const master_data_schema_1 = require("../schemas/master-data.schema");
const app_error_1 = require("../utils/app-error");
class MasterDataController {
    service;
    constructor(service = master_data_service_1.masterDataService) {
        this.service = service;
    }
    // ==========================================
    // 1. JOB CATEGORIES
    // ==========================================
    async listCategories(req, res, next) {
        try {
            const includeInactive = req.query.includeInactive !== 'false';
            const data = await this.service.getAllCategories(includeInactive);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    async createCategory(req, res, next) {
        try {
            const parsed = master_data_schema_1.createCategorySchema.safeParse(req.body);
            if (!parsed.success) {
                throw new app_error_1.AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
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
        }
        catch (err) {
            next(err);
        }
    }
    async updateCategory(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id))
                throw new app_error_1.AppError('Invalid category ID.', 400, 'INVALID_ID');
            const parsed = master_data_schema_1.updateCategorySchema.safeParse(req.body);
            if (!parsed.success) {
                throw new app_error_1.AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
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
        }
        catch (err) {
            next(err);
        }
    }
    async toggleCategoryActive(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id))
                throw new app_error_1.AppError('Invalid category ID.', 400, 'INVALID_ID');
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
        }
        catch (err) {
            next(err);
        }
    }
    async deleteCategory(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id))
                throw new app_error_1.AppError('Invalid category ID.', 400, 'INVALID_ID');
            const adminId = req.admin?.id || 'system';
            await this.service.deleteCategory(id, adminId, {
                clientIp: req.ip,
                requestId: req.requestId,
            });
            res.status(200).json({
                success: true,
                message: 'Job category deleted successfully.',
            });
        }
        catch (err) {
            next(err);
        }
    }
    // ==========================================
    // 2. JOB LOCATIONS
    // ==========================================
    async listLocations(req, res, next) {
        try {
            const includeInactive = req.query.includeInactive !== 'false';
            const data = await this.service.getAllLocations(includeInactive);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    async createLocation(req, res, next) {
        try {
            const parsed = master_data_schema_1.createLocationSchema.safeParse(req.body);
            if (!parsed.success) {
                throw new app_error_1.AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
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
        }
        catch (err) {
            next(err);
        }
    }
    async updateLocation(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id))
                throw new app_error_1.AppError('Invalid location ID.', 400, 'INVALID_ID');
            const parsed = master_data_schema_1.updateLocationSchema.safeParse(req.body);
            if (!parsed.success) {
                throw new app_error_1.AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
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
        }
        catch (err) {
            next(err);
        }
    }
    async toggleLocationActive(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id))
                throw new app_error_1.AppError('Invalid location ID.', 400, 'INVALID_ID');
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
        }
        catch (err) {
            next(err);
        }
    }
    async deleteLocation(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id))
                throw new app_error_1.AppError('Invalid location ID.', 400, 'INVALID_ID');
            const adminId = req.admin?.id || 'system';
            await this.service.deleteLocation(id, adminId, {
                clientIp: req.ip,
                requestId: req.requestId,
            });
            res.status(200).json({
                success: true,
                message: 'Location deleted successfully.',
            });
        }
        catch (err) {
            next(err);
        }
    }
    // ==========================================
    // 3. VISA SERVICES
    // ==========================================
    async listVisaServices(req, res, next) {
        try {
            const includeInactive = req.query.includeInactive !== 'false';
            const data = await this.service.getAllVisaServices(includeInactive);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    async createVisaService(req, res, next) {
        try {
            const parsed = master_data_schema_1.createVisaServiceSchema.safeParse(req.body);
            if (!parsed.success) {
                throw new app_error_1.AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
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
        }
        catch (err) {
            next(err);
        }
    }
    async updateVisaService(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id))
                throw new app_error_1.AppError('Invalid visa service ID.', 400, 'INVALID_ID');
            const parsed = master_data_schema_1.updateVisaServiceSchema.safeParse(req.body);
            if (!parsed.success) {
                throw new app_error_1.AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
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
        }
        catch (err) {
            next(err);
        }
    }
    async toggleVisaServiceActive(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id))
                throw new app_error_1.AppError('Invalid visa service ID.', 400, 'INVALID_ID');
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
        }
        catch (err) {
            next(err);
        }
    }
    async deleteVisaService(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id))
                throw new app_error_1.AppError('Invalid visa service ID.', 400, 'INVALID_ID');
            const adminId = req.admin?.id || 'system';
            await this.service.deleteVisaService(id, adminId, {
                clientIp: req.ip,
                requestId: req.requestId,
            });
            res.status(200).json({
                success: true,
                message: 'Visa service deleted successfully.',
            });
        }
        catch (err) {
            next(err);
        }
    }
    // ==========================================
    // 4. INDUSTRY SECTORS
    // ==========================================
    async listIndustries(req, res, next) {
        try {
            const includeInactive = req.query.includeInactive !== 'false';
            const data = await this.service.getAllIndustries(includeInactive);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    async createIndustry(req, res, next) {
        try {
            const parsed = master_data_schema_1.createIndustrySchema.safeParse(req.body);
            if (!parsed.success) {
                throw new app_error_1.AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
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
        }
        catch (err) {
            next(err);
        }
    }
    async updateIndustry(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id))
                throw new app_error_1.AppError('Invalid industry ID.', 400, 'INVALID_ID');
            const parsed = master_data_schema_1.updateIndustrySchema.safeParse(req.body);
            if (!parsed.success) {
                throw new app_error_1.AppError('Validation failed.', 400, 'VALIDATION_ERROR', {
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
        }
        catch (err) {
            next(err);
        }
    }
    async toggleIndustryActive(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id))
                throw new app_error_1.AppError('Invalid industry ID.', 400, 'INVALID_ID');
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
        }
        catch (err) {
            next(err);
        }
    }
    async deleteIndustry(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id))
                throw new app_error_1.AppError('Invalid industry ID.', 400, 'INVALID_ID');
            const adminId = req.admin?.id || 'system';
            await this.service.deleteIndustry(id, adminId, {
                clientIp: req.ip,
                requestId: req.requestId,
            });
            res.status(200).json({
                success: true,
                message: 'Industry sector deleted successfully.',
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.MasterDataController = MasterDataController;
exports.masterDataController = new MasterDataController();
