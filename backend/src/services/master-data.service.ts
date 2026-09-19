/**
 * CITYLINE CONSULTANCY — Master Data Service
 * Orchestrates business logic, constraint checks, and audit logging for reference tables.
 */

import {
  masterDataRepository,
  MasterDataRepository,
  CategoryMasterRecord,
  LocationMasterRecord,
  VisaServiceMasterRecord,
  IndustryMasterRecord,
} from '../repositories/master-data.repository';
import { auditLogRepository, AuditLogRepository } from '../repositories/audit-log.repository';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateLocationInput,
  UpdateLocationInput,
  CreateVisaServiceInput,
  UpdateVisaServiceInput,
  CreateIndustryInput,
  UpdateIndustryInput,
} from '../schemas/master-data.schema';
import { AppError } from '../utils/app-error';

export interface AuditContext {
  clientIp?: string;
  requestId?: string;
}

export class MasterDataService {
  constructor(
    private readonly repo: MasterDataRepository = masterDataRepository,
    private readonly auditRepo: AuditLogRepository = auditLogRepository
  ) {}

  // ==========================================
  // 1. JOB CATEGORIES
  // ==========================================

  public async getAllCategories(includeInactive: boolean = true): Promise<CategoryMasterRecord[]> {
    return this.repo.listCategories(includeInactive);
  }

  public async createCategory(
    input: CreateCategoryInput,
    adminId: string,
    ctx: AuditContext = {}
  ): Promise<CategoryMasterRecord> {
    const existing = await this.repo.findCategoryBySlug(input.slug);
    if (existing) {
      throw new AppError(`A category with slug '${input.slug}' already exists.`, 409, 'SLUG_CONFLICT');
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

  public async updateCategory(
    id: number,
    input: UpdateCategoryInput,
    adminId: string,
    ctx: AuditContext = {}
  ): Promise<CategoryMasterRecord> {
    if (input.slug) {
      const existing = await this.repo.findCategoryBySlug(input.slug);
      if (existing && existing.id !== id) {
        throw new AppError(`A category with slug '${input.slug}' already exists.`, 409, 'SLUG_CONFLICT');
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

  public async toggleCategoryActive(
    id: number,
    adminId: string,
    ctx: AuditContext = {}
  ): Promise<CategoryMasterRecord> {
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

  public async deleteCategory(
    id: number,
    adminId: string,
    ctx: AuditContext = {}
  ): Promise<void> {
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

  public async getAllLocations(includeInactive: boolean = true): Promise<LocationMasterRecord[]> {
    return this.repo.listLocations(includeInactive);
  }

  public async createLocation(
    input: CreateLocationInput,
    adminId: string,
    ctx: AuditContext = {}
  ): Promise<LocationMasterRecord> {
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

  public async updateLocation(
    id: number,
    input: UpdateLocationInput,
    adminId: string,
    ctx: AuditContext = {}
  ): Promise<LocationMasterRecord> {
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

  public async toggleLocationActive(
    id: number,
    adminId: string,
    ctx: AuditContext = {}
  ): Promise<LocationMasterRecord> {
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

  public async deleteLocation(id: number, adminId: string, ctx: AuditContext = {}): Promise<void> {
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

  public async getAllVisaServices(includeInactive: boolean = true): Promise<VisaServiceMasterRecord[]> {
    return this.repo.listVisaServices(includeInactive);
  }

  public async createVisaService(
    input: CreateVisaServiceInput,
    adminId: string,
    ctx: AuditContext = {}
  ): Promise<VisaServiceMasterRecord> {
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

  public async updateVisaService(
    id: number,
    input: UpdateVisaServiceInput,
    adminId: string,
    ctx: AuditContext = {}
  ): Promise<VisaServiceMasterRecord> {
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

  public async toggleVisaServiceActive(
    id: number,
    adminId: string,
    ctx: AuditContext = {}
  ): Promise<VisaServiceMasterRecord> {
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

  public async deleteVisaService(id: number, adminId: string, ctx: AuditContext = {}): Promise<void> {
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

  public async getAllIndustries(includeInactive: boolean = true): Promise<IndustryMasterRecord[]> {
    return this.repo.listIndustries(includeInactive);
  }

  public async createIndustry(
    input: CreateIndustryInput,
    adminId: string,
    ctx: AuditContext = {}
  ): Promise<IndustryMasterRecord> {
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

  public async updateIndustry(
    id: number,
    input: UpdateIndustryInput,
    adminId: string,
    ctx: AuditContext = {}
  ): Promise<IndustryMasterRecord> {
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

  public async toggleIndustryActive(
    id: number,
    adminId: string,
    ctx: AuditContext = {}
  ): Promise<IndustryMasterRecord> {
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

  public async deleteIndustry(id: number, adminId: string, ctx: AuditContext = {}): Promise<void> {
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

export const masterDataService = new MasterDataService();
