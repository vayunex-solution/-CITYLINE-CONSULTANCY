"use strict";
/**
 * CITYLINE CONSULTANCY — Master Data Service
 * Orchestrates business logic, constraint checks, and audit logging for reference tables.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.masterDataService = exports.MasterDataService = void 0;
const master_data_repository_1 = require("../repositories/master-data.repository");
const audit_log_repository_1 = require("../repositories/audit-log.repository");
const app_error_1 = require("../utils/app-error");
class MasterDataService {
    repo;
    auditRepo;
    constructor(repo = master_data_repository_1.masterDataRepository, auditRepo = audit_log_repository_1.auditLogRepository) {
        this.repo = repo;
        this.auditRepo = auditRepo;
    }
    // ==========================================
    // 1. JOB CATEGORIES
    // ==========================================
    async getAllCategories(includeInactive = true) {
        return this.repo.listCategories(includeInactive);
    }
    async createCategory(input, adminId, ctx = {}) {
        const existing = await this.repo.findCategoryBySlug(input.slug);
        if (existing) {
            throw new app_error_1.AppError(`A category with slug '${input.slug}' already exists.`, 409, 'SLUG_CONFLICT');
        }
        const created = await this.repo.createCategory({
            name: input.name,
            slug: input.slug,
            description: input.description,
            displayOrder: input.displayOrder,
            isActive: input.isActive,
        });
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'create_job_category',
            resourceType: 'job_category',
            resourceId: String(created.id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { name: created.name, slug: created.slug },
        });
        return created;
    }
    async updateCategory(id, input, adminId, ctx = {}) {
        if (input.slug) {
            const existing = await this.repo.findCategoryBySlug(input.slug);
            if (existing && existing.id !== id) {
                throw new app_error_1.AppError(`A category with slug '${input.slug}' already exists.`, 409, 'SLUG_CONFLICT');
            }
        }
        const updated = await this.repo.updateCategory(id, input);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'update_job_category',
            resourceType: 'job_category',
            resourceId: String(id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { changes: input },
        });
        return updated;
    }
    async toggleCategoryActive(id, adminId, ctx = {}) {
        const toggled = await this.repo.toggleCategoryActive(id);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'toggle_job_category_status',
            resourceType: 'job_category',
            resourceId: String(id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { isActive: toggled.is_active },
        });
        return toggled;
    }
    async deleteCategory(id, adminId, ctx = {}) {
        await this.repo.deleteCategory(id);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'delete_job_category',
            resourceType: 'job_category',
            resourceId: String(id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { deletedCategoryId: id },
        });
    }
    // ==========================================
    // 2. JOB LOCATIONS
    // ==========================================
    async getAllLocations(includeInactive = true) {
        return this.repo.listLocations(includeInactive);
    }
    async createLocation(input, adminId, ctx = {}) {
        const created = await this.repo.createLocation(input);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'create_job_location',
            resourceType: 'job_location',
            resourceId: String(created.id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { name: created.name, city: created.city },
        });
        return created;
    }
    async updateLocation(id, input, adminId, ctx = {}) {
        const updated = await this.repo.updateLocation(id, input);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'update_job_location',
            resourceType: 'job_location',
            resourceId: String(id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { changes: input },
        });
        return updated;
    }
    async toggleLocationActive(id, adminId, ctx = {}) {
        const toggled = await this.repo.toggleLocationActive(id);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'toggle_job_location_status',
            resourceType: 'job_location',
            resourceId: String(id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { isActive: toggled.is_active },
        });
        return toggled;
    }
    async deleteLocation(id, adminId, ctx = {}) {
        await this.repo.deleteLocation(id);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'delete_job_location',
            resourceType: 'job_location',
            resourceId: String(id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { deletedLocationId: id },
        });
    }
    // ==========================================
    // 3. VISA SERVICES
    // ==========================================
    async getAllVisaServices(includeInactive = true) {
        return this.repo.listVisaServices(includeInactive);
    }
    async createVisaService(input, adminId, ctx = {}) {
        const created = await this.repo.createVisaService(input);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'create_visa_service',
            resourceType: 'visa_service',
            resourceId: String(created.id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { serviceCode: created.service_code, title: created.title },
        });
        return created;
    }
    async updateVisaService(id, input, adminId, ctx = {}) {
        const updated = await this.repo.updateVisaService(id, input);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'update_visa_service',
            resourceType: 'visa_service',
            resourceId: String(id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { changes: input },
        });
        return updated;
    }
    async toggleVisaServiceActive(id, adminId, ctx = {}) {
        const toggled = await this.repo.toggleVisaServiceActive(id);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'toggle_visa_service_status',
            resourceType: 'visa_service',
            resourceId: String(id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { isActive: toggled.is_active },
        });
        return toggled;
    }
    async deleteVisaService(id, adminId, ctx = {}) {
        await this.repo.deleteVisaService(id);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'delete_visa_service',
            resourceType: 'visa_service',
            resourceId: String(id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { deletedVisaServiceId: id },
        });
    }
    // ==========================================
    // 4. INDUSTRY SECTORS
    // ==========================================
    async getAllIndustries(includeInactive = true) {
        return this.repo.listIndustries(includeInactive);
    }
    async createIndustry(input, adminId, ctx = {}) {
        const created = await this.repo.createIndustry(input);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'create_master_industry',
            resourceType: 'master_industry',
            resourceId: String(created.id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { name: created.name, slug: created.slug },
        });
        return created;
    }
    async updateIndustry(id, input, adminId, ctx = {}) {
        const updated = await this.repo.updateIndustry(id, input);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'update_master_industry',
            resourceType: 'master_industry',
            resourceId: String(id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { changes: input },
        });
        return updated;
    }
    async toggleIndustryActive(id, adminId, ctx = {}) {
        const toggled = await this.repo.toggleIndustryActive(id);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'toggle_master_industry_status',
            resourceType: 'master_industry',
            resourceId: String(id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { isActive: toggled.is_active },
        });
        return toggled;
    }
    async deleteIndustry(id, adminId, ctx = {}) {
        await this.repo.deleteIndustry(id);
        await this.auditRepo.logEvent({
            actorAdminId: adminId,
            action: 'delete_master_industry',
            resourceType: 'master_industry',
            resourceId: String(id),
            clientIp: ctx.clientIp,
            requestId: ctx.requestId,
            details: { deletedIndustryId: id },
        });
    }
}
exports.MasterDataService = MasterDataService;
exports.masterDataService = new MasterDataService();
