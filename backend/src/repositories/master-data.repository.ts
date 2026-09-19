/**
 * CITYLINE CONSULTANCY — Master Data Repository
 * Handles direct database operations for system lookup tables:
 * - job_categories
 * - job_locations
 * - visa_services
 * - master_industries
 *
 * GOVERNANCE:
 * - Safe error normalization via normalizeDatabaseError.
 * - Integrity protection: blocks hard-deletion if dependent foreign records exist.
 * - Graceful fallback if new tables (job_locations, master_industries) are pending migration.
 */

import { Knex } from 'knex';
import { getDbClient } from '../database/connection';
import { normalizeDatabaseError } from '../database/database-error';
import { AppError } from '../utils/app-error';

export interface CategoryMasterRecord {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  job_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface LocationMasterRecord {
  id: number;
  name: string;
  city: string;
  country: string;
  display_order: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface VisaServiceMasterRecord {
  id: number;
  service_code: string;
  title: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IndustryMasterRecord {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class MasterDataRepository {
  private get db(): Knex {
    return getDbClient();
  }

  // ============================================================================
  // 1. JOB CATEGORIES
  // ============================================================================

  public async listCategories(includeInactive: boolean = true): Promise<CategoryMasterRecord[]> {
    try {
      const query = this.db('job_categories').select('*');
      if (!includeInactive) {
        query.where('is_active', true);
      }
      query.orderBy('display_order', 'asc').orderBy('name', 'asc');

      const categories = await query;

      // Calculate job counts for each category
      const counts = await this.db('jobs')
        .whereNull('deleted_at')
        .groupBy('category_id')
        .select('category_id')
        .count<{ category_id: number; count: number | string }[]>('id as count');

      const countMap = new Map<number, number>();
      for (const c of counts) {
        countMap.set(c.category_id, parseInt(String(c.count), 10) || 0);
      }

      return categories.map((cat: any) => ({
        ...cat,
        is_active: Boolean(cat.is_active),
        job_count: countMap.get(cat.id) || 0,
      }));
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.listCategories');
    }
  }

  public async findCategoryById(id: number): Promise<CategoryMasterRecord | null> {
    try {
      const row = await this.db('job_categories').where({ id }).first();
      return row ? { ...row, is_active: Boolean(row.is_active) } : null;
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.findCategoryById');
    }
  }

  public async findCategoryBySlug(slug: string): Promise<CategoryMasterRecord | null> {
    try {
      const row = await this.db('job_categories').where({ slug }).first();
      return row ? { ...row, is_active: Boolean(row.is_active) } : null;
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.findCategoryBySlug');
    }
  }

  public async createCategory(data: {
    name: string;
    slug: string;
    description?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  }): Promise<CategoryMasterRecord> {
    try {
      const insertPayload = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        display_order: data.displayOrder ?? 0,
        is_active: data.isActive !== false ? 1 : 0,
      };

      const [insertId] = await this.db('job_categories').insert(insertPayload);
      const id = typeof insertId === 'number' ? insertId : Number(insertId);
      const created = await this.findCategoryById(id);
      if (!created) {
        throw new AppError('Failed to retrieve newly created category.', 500, 'DATABASE_ERROR');
      }
      return created;
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.createCategory');
    }
  }

  public async updateCategory(
    id: number,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    }
  ): Promise<CategoryMasterRecord> {
    try {
      const updatePayload: Record<string, any> = {
        updated_at: new Date(),
      };
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.slug !== undefined) updatePayload.slug = data.slug;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.displayOrder !== undefined) updatePayload.display_order = data.displayOrder;
      if (data.isActive !== undefined) updatePayload.is_active = data.isActive ? 1 : 0;

      await this.db('job_categories').where({ id }).update(updatePayload);
      const updated = await this.findCategoryById(id);
      if (!updated) {
        throw new AppError('Category not found.', 404, 'CATEGORY_NOT_FOUND');
      }
      return updated;
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.updateCategory');
    }
  }

  public async toggleCategoryActive(id: number): Promise<CategoryMasterRecord> {
    const existing = await this.findCategoryById(id);
    if (!existing) {
      throw new AppError('Category not found.', 404, 'CATEGORY_NOT_FOUND');
    }
    return this.updateCategory(id, { isActive: !existing.is_active });
  }

  public async deleteCategory(id: number): Promise<void> {
    try {
      // 1. Check linked vacancies
      const jobCountRow = await this.db('jobs')
        .where('category_id', id)
        .whereNull('deleted_at')
        .count<{ count: number | string }>('id as count')
        .first();
      const jobCount = jobCountRow ? parseInt(String(jobCountRow.count), 10) : 0;
      if (jobCount > 0) {
        throw new AppError(
          `Cannot delete category. There are ${jobCount} active job vacancies linked to it. Please deactivate the category or reassign vacancies first.`,
          409,
          'CATEGORY_HAS_ACTIVE_JOBS'
        );
      }

      // 2. Check linked manpower positions
      const mepCountRow = await this.db('manpower_enquiry_positions')
        .where('job_category_id', id)
        .count<{ count: number | string }>('id as count')
        .first();
      const mepCount = mepCountRow ? parseInt(String(mepCountRow.count), 10) : 0;
      if (mepCount > 0) {
        throw new AppError(
          `Cannot delete category. It is referenced in ${mepCount} historical manpower enquiry position(s). Please deactivate instead.`,
          409,
          'CATEGORY_REFERENCED_IN_ENQUIRIES'
        );
      }

      await this.db('job_categories').where({ id }).delete();
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw normalizeDatabaseError(err, 'MasterDataRepository.deleteCategory');
    }
  }

  // ============================================================================
  // 2. JOB LOCATIONS
  // ============================================================================

  private readonly fallbackLocations: LocationMasterRecord[] = [
    { id: 1, name: 'Dubai, UAE', city: 'Dubai', country: 'UAE', display_order: 1, is_active: true },
    { id: 2, name: 'Abu Dhabi, UAE', city: 'Abu Dhabi', country: 'UAE', display_order: 2, is_active: true },
    { id: 3, name: 'Sharjah, UAE', city: 'Sharjah', country: 'UAE', display_order: 3, is_active: true },
    { id: 4, name: 'Ajman, UAE', city: 'Ajman', country: 'UAE', display_order: 4, is_active: true },
    { id: 5, name: 'Ras Al Khaimah, UAE', city: 'Ras Al Khaimah', country: 'UAE', display_order: 5, is_active: true },
    { id: 6, name: 'Fujairah, UAE', city: 'Fujairah', country: 'UAE', display_order: 6, is_active: true },
    { id: 7, name: 'Umm Al Quwain, UAE', city: 'Umm Al Quwain', country: 'UAE', display_order: 7, is_active: true },
    { id: 8, name: 'Riyadh, Saudi Arabia', city: 'Riyadh', country: 'Saudi Arabia', display_order: 8, is_active: true },
    { id: 9, name: 'Doha, Qatar', city: 'Doha', country: 'Qatar', display_order: 9, is_active: true },
  ];

  public async listLocations(includeInactive: boolean = true): Promise<LocationMasterRecord[]> {
    try {
      const hasTable = await this.db.schema.hasTable('job_locations').catch(() => false);
      if (!hasTable) {
        return includeInactive ? this.fallbackLocations : this.fallbackLocations.filter((l) => l.is_active);
      }

      const query = this.db('job_locations').select('*');
      if (!includeInactive) {
        query.where('is_active', true);
      }
      query.orderBy('display_order', 'asc').orderBy('name', 'asc');
      const rows = await query;
      return rows.map((r: any) => ({ ...r, is_active: Boolean(r.is_active) }));
    } catch {
      return this.fallbackLocations;
    }
  }

  public async findLocationById(id: number): Promise<LocationMasterRecord | null> {
    try {
      const row = await this.db('job_locations').where({ id }).first();
      return row ? { ...row, is_active: Boolean(row.is_active) } : null;
    } catch {
      return this.fallbackLocations.find((l) => l.id === id) || null;
    }
  }

  public async createLocation(data: {
    name: string;
    city: string;
    country?: string;
    displayOrder?: number;
    isActive?: boolean;
  }): Promise<LocationMasterRecord> {
    try {
      const insertPayload = {
        name: data.name,
        city: data.city,
        country: data.country || 'UAE',
        display_order: data.displayOrder ?? 0,
        is_active: data.isActive !== false ? 1 : 0,
      };

      const [insertId] = await this.db('job_locations').insert(insertPayload);
      const id = typeof insertId === 'number' ? insertId : Number(insertId);
      const created = await this.findLocationById(id);
      return created || { id, ...insertPayload, is_active: Boolean(insertPayload.is_active) };
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.createLocation');
    }
  }

  public async updateLocation(
    id: number,
    data: {
      name?: string;
      city?: string;
      country?: string;
      displayOrder?: number;
      isActive?: boolean;
    }
  ): Promise<LocationMasterRecord> {
    try {
      const updatePayload: Record<string, any> = {
        updated_at: new Date(),
      };
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.city !== undefined) updatePayload.city = data.city;
      if (data.country !== undefined) updatePayload.country = data.country;
      if (data.displayOrder !== undefined) updatePayload.display_order = data.displayOrder;
      if (data.isActive !== undefined) updatePayload.is_active = data.isActive ? 1 : 0;

      await this.db('job_locations').where({ id }).update(updatePayload);
      const updated = await this.findLocationById(id);
      if (!updated) throw new AppError('Location not found.', 404, 'LOCATION_NOT_FOUND');
      return updated;
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.updateLocation');
    }
  }

  public async toggleLocationActive(id: number): Promise<LocationMasterRecord> {
    const existing = await this.findLocationById(id);
    if (!existing) throw new AppError('Location not found.', 404, 'LOCATION_NOT_FOUND');
    return this.updateLocation(id, { isActive: !existing.is_active });
  }

  public async deleteLocation(id: number): Promise<void> {
    try {
      await this.db('job_locations').where({ id }).delete();
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.deleteLocation');
    }
  }

  // ============================================================================
  // 3. VISA SERVICES
  // ============================================================================

  public async listVisaServices(includeInactive: boolean = true): Promise<VisaServiceMasterRecord[]> {
    try {
      const query = this.db('visa_services').select('*');
      if (!includeInactive) {
        query.where('is_active', true);
      }
      query.orderBy('display_order', 'asc').orderBy('title', 'asc');
      const rows = await query;
      return rows.map((r: any) => ({ ...r, is_active: Boolean(r.is_active) }));
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.listVisaServices');
    }
  }

  public async findVisaServiceById(id: number): Promise<VisaServiceMasterRecord | null> {
    try {
      const row = await this.db('visa_services').where({ id }).first();
      return row ? { ...row, is_active: Boolean(row.is_active) } : null;
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.findVisaServiceById');
    }
  }

  public async createVisaService(data: {
    serviceCode: string;
    title: string;
    slug: string;
    description?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  }): Promise<VisaServiceMasterRecord> {
    try {
      const insertPayload = {
        service_code: data.serviceCode,
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        display_order: data.displayOrder ?? 0,
        is_active: data.isActive !== false ? 1 : 0,
      };

      const [insertId] = await this.db('visa_services').insert(insertPayload);
      const id = typeof insertId === 'number' ? insertId : Number(insertId);
      const created = await this.findVisaServiceById(id);
      if (!created) throw new AppError('Failed to retrieve newly created visa service.', 500, 'DATABASE_ERROR');
      return created;
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.createVisaService');
    }
  }

  public async updateVisaService(
    id: number,
    data: {
      serviceCode?: string;
      title?: string;
      slug?: string;
      description?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    }
  ): Promise<VisaServiceMasterRecord> {
    try {
      const updatePayload: Record<string, any> = {
        updated_at: new Date(),
      };
      if (data.serviceCode !== undefined) updatePayload.service_code = data.serviceCode;
      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.slug !== undefined) updatePayload.slug = data.slug;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.displayOrder !== undefined) updatePayload.display_order = data.displayOrder;
      if (data.isActive !== undefined) updatePayload.is_active = data.isActive ? 1 : 0;

      await this.db('visa_services').where({ id }).update(updatePayload);
      const updated = await this.findVisaServiceById(id);
      if (!updated) throw new AppError('Visa service not found.', 404, 'VISA_SERVICE_NOT_FOUND');
      return updated;
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.updateVisaService');
    }
  }

  public async toggleVisaServiceActive(id: number): Promise<VisaServiceMasterRecord> {
    const existing = await this.findVisaServiceById(id);
    if (!existing) throw new AppError('Visa service not found.', 404, 'VISA_SERVICE_NOT_FOUND');
    return this.updateVisaService(id, { isActive: !existing.is_active });
  }

  public async deleteVisaService(id: number): Promise<void> {
    try {
      const enquiryCountRow = await this.db('visa_enquiries')
        .where('visa_service_id', id)
        .count<{ count: number | string }>('id as count')
        .first();
      const count = enquiryCountRow ? parseInt(String(enquiryCountRow.count), 10) : 0;
      if (count > 0) {
        throw new AppError(
          `Cannot delete visa service. There are ${count} visa enquiries linked to it. Please deactivate instead.`,
          409,
          'VISA_SERVICE_HAS_ENQUIRIES'
        );
      }

      await this.db('visa_services').where({ id }).delete();
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw normalizeDatabaseError(err, 'MasterDataRepository.deleteVisaService');
    }
  }

  // ============================================================================
  // 4. INDUSTRY SECTORS
  // ============================================================================

  private readonly fallbackIndustries: IndustryMasterRecord[] = [
    { id: 1, name: 'Hospitality & Tourism', slug: 'hospitality-tourism', description: 'Hotels, resorts, luxury dining, and catering operations.', display_order: 1, is_active: true },
    { id: 2, name: 'Cleaning & Facility Management', slug: 'cleaning-facility-management', description: 'Commercial janitorial, corporate towers, and residential complexes.', display_order: 2, is_active: true },
    { id: 3, name: 'Civil Construction & Infrastructure', slug: 'civil-construction-infrastructure', description: 'High-rise contracting, civil finishing, MEP, and civil engineering.', display_order: 3, is_active: true },
    { id: 4, name: 'Logistics & Warehousing', slug: 'logistics-warehousing', description: 'E-commerce fulfillment centers, parcel dispatch, and freight hubs.', display_order: 4, is_active: true },
    { id: 5, name: 'Transport & Fleet Operations', slug: 'transport-fleet-operations', description: 'Metropolitan passenger taxis, bus fleets, and heavy goods vehicles.', display_order: 5, is_active: true },
    { id: 6, name: 'Retail & Customer Operations', slug: 'retail-customer-operations', description: 'Supermarket chains, shopping centers, and retail stores.', display_order: 6, is_active: true },
  ];

  public async listIndustries(includeInactive: boolean = true): Promise<IndustryMasterRecord[]> {
    try {
      const hasTable = await this.db.schema.hasTable('master_industries').catch(() => false);
      if (!hasTable) {
        return includeInactive ? this.fallbackIndustries : this.fallbackIndustries.filter((i) => i.is_active);
      }

      const query = this.db('master_industries').select('*');
      if (!includeInactive) {
        query.where('is_active', true);
      }
      query.orderBy('display_order', 'asc').orderBy('name', 'asc');
      const rows = await query;
      return rows.map((r: any) => ({ ...r, is_active: Boolean(r.is_active) }));
    } catch {
      return this.fallbackIndustries;
    }
  }

  public async findIndustryById(id: number): Promise<IndustryMasterRecord | null> {
    try {
      const row = await this.db('master_industries').where({ id }).first();
      return row ? { ...row, is_active: Boolean(row.is_active) } : null;
    } catch {
      return this.fallbackIndustries.find((i) => i.id === id) || null;
    }
  }

  public async createIndustry(data: {
    name: string;
    slug: string;
    description?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  }): Promise<IndustryMasterRecord> {
    try {
      const insertPayload = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        display_order: data.displayOrder ?? 0,
        is_active: data.isActive !== false ? 1 : 0,
      };

      const [insertId] = await this.db('master_industries').insert(insertPayload);
      const id = typeof insertId === 'number' ? insertId : Number(insertId);
      const created = await this.findIndustryById(id);
      return created || { id, ...insertPayload, is_active: Boolean(insertPayload.is_active) };
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.createIndustry');
    }
  }

  public async updateIndustry(
    id: number,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    }
  ): Promise<IndustryMasterRecord> {
    try {
      const updatePayload: Record<string, any> = {
        updated_at: new Date(),
      };
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.slug !== undefined) updatePayload.slug = data.slug;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.displayOrder !== undefined) updatePayload.display_order = data.displayOrder;
      if (data.isActive !== undefined) updatePayload.is_active = data.isActive ? 1 : 0;

      await this.db('master_industries').where({ id }).update(updatePayload);
      const updated = await this.findIndustryById(id);
      if (!updated) throw new AppError('Industry sector not found.', 404, 'INDUSTRY_NOT_FOUND');
      return updated;
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.updateIndustry');
    }
  }

  public async toggleIndustryActive(id: number): Promise<IndustryMasterRecord> {
    const existing = await this.findIndustryById(id);
    if (!existing) throw new AppError('Industry sector not found.', 404, 'INDUSTRY_NOT_FOUND');
    return this.updateIndustry(id, { isActive: !existing.is_active });
  }

  public async deleteIndustry(id: number): Promise<void> {
    try {
      await this.db('master_industries').where({ id }).delete();
    } catch (err) {
      throw normalizeDatabaseError(err, 'MasterDataRepository.deleteIndustry');
    }
  }
}

export const masterDataRepository = new MasterDataRepository();
