/**
 * CITYLINE CONSULTANCY — Testimonials Service
 * Encapsulates business logic, public DTO projection, administrative curation,
 * state transitions, and audit logging for client testimonials.
 */

import {
  TestimonialRepository,
  testimonialRepository,
  TestimonialRecord,
} from '../repositories/testimonial.repository';
import {
  AuditLogRepository,
  auditLogRepository,
} from '../repositories/audit-log.repository';
import {
  CreateTestimonialInput,
  UpdateTestimonialInput,
  TestimonialQueryParams,
} from '../schemas/testimonial.schema';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import { PaginatedResult } from '../repositories/base.repository';

export interface PublicTestimonialDto {
  id: number;
  clientName: string;
  clientDesignation: string | null;
  companyName: string | null;
  clientLocation: string | null;
  serviceCategory: string | null;
  quote: string;
  rating: number | null;
  displayOrder: number;
}

export class TestimonialService {
  constructor(
    private readonly repo: TestimonialRepository = testimonialRepository,
    private readonly auditRepo: AuditLogRepository = auditLogRepository
  ) {}

  /**
   * Transforms an internal database record into a rich admin DTO supporting both camelCase and snake_case.
   */
  public toAdminDto(record: TestimonialRecord) {
    return {
      id: record.id,
      clientName: record.client_name,
      clientDesignation: record.client_designation,
      companyName: record.company_name,
      clientLocation: record.client_location,
      serviceCategory: record.service_category,
      testimonialText: record.testimonial_text,
      rating: record.rating !== null && record.rating !== undefined ? Number(record.rating) : null,
      documentId: record.document_id,
      displayOrder: record.display_order,
      isPublished: Boolean(record.is_published),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      client_name: record.client_name,
      client_designation: record.client_designation,
      company_name: record.company_name,
      client_location: record.client_location,
      service_category: record.service_category,
      testimonial_text: record.testimonial_text,
      display_order: record.display_order,
      is_published: Boolean(record.is_published),
    };
  }

  /**
   * Transforms an internal database record into a clean, public-facing DTO.
   */
  private toPublicDto(record: TestimonialRecord): PublicTestimonialDto {
    return {
      id: record.id,
      clientName: record.client_name,
      clientDesignation: record.client_designation,
      companyName: record.company_name,
      clientLocation: record.client_location,
      serviceCategory: record.service_category || 'Client Experience',
      quote: record.testimonial_text,
      rating: record.rating !== null ? Number(record.rating) : null,
      displayOrder: record.display_order,
    };
  }

  /**
   * Retrieves only published testimonials for public website consumption.
   */
  public async getPublishedTestimonials(): Promise<PublicTestimonialDto[]> {
    const records = await this.repo.listPublished();
    return records.map((r) => this.toPublicDto(r));
  }

  /**
   * Administrative listing with filtering, pagination, and status views.
   */
  public async getAdminTestimonials(
    params: TestimonialQueryParams
  ): Promise<PaginatedResult<any>> {
    const result = await this.repo.listAdmin(params);
    return {
      ...result,
      items: result.items.map((r) => this.toAdminDto(r)),
    };
  }

  /**
   * Retrieves single testimonial details by ID for administrative review.
   */
  public async getTestimonialById(id: number): Promise<any> {
    const record = await this.repo.findById(id);
    if (!record) {
      throw new AppError('The requested testimonial was not found.', 404, 'TESTIMONIAL_NOT_FOUND');
    }
    return this.toAdminDto(record);
  }

  /**
   * Creates a new client testimonial with audit logging.
   */
  public async createTestimonial(
    input: CreateTestimonialInput,
    actor?: { adminId?: string; adminEmail?: string; ip?: string }
  ): Promise<any> {
    const record = await this.repo.createTestimonial({
      client_name: input.clientName,
      client_designation: input.clientDesignation ?? null,
      company_name: input.companyName ?? null,
      client_location: input.clientLocation ?? null,
      service_category: input.serviceCategory ?? null,
      testimonial_text: input.testimonialText,
      rating: input.rating ?? null,
      document_id: input.documentId ?? null,
      display_order: input.displayOrder ?? 0,
      is_published: input.isPublished ?? false,
    });

    logger.info(`Testimonial #${record.id} created by admin ${actor?.adminEmail || 'system'}`);

    // Structured Audit Log
    await this.auditRepo.logEvent({
      actor_admin_id: actor?.adminId,
      action: 'testimonial_created',
      resource_type: 'testimonial',
      resource_id: String(record.id),
      client_ip: actor?.ip,
      details_json: JSON.stringify({
        clientName: record.client_name,
        companyName: record.company_name,
        isPublished: record.is_published === 1 || record.is_published === true,
        adminEmail: actor?.adminEmail,
      }),
    });

    return this.toAdminDto(record);
  }

  /**
   * Updates an existing testimonial with state change tracking and audit logging.
   */
  public async updateTestimonial(
    id: number,
    input: UpdateTestimonialInput,
    actor?: { adminId?: string; adminEmail?: string; ip?: string }
  ): Promise<any> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError('The requested testimonial was not found.', 404, 'TESTIMONIAL_NOT_FOUND');
    }

    const updateData: Partial<TestimonialRecord> = {};
    if (input.clientName !== undefined) updateData.client_name = input.clientName;
    if (input.clientDesignation !== undefined) updateData.client_designation = input.clientDesignation;
    if (input.companyName !== undefined) updateData.company_name = input.companyName;
    if (input.clientLocation !== undefined) updateData.client_location = input.clientLocation;
    if (input.serviceCategory !== undefined) updateData.service_category = input.serviceCategory;
    if (input.testimonialText !== undefined) updateData.testimonial_text = input.testimonialText;
    if (input.rating !== undefined) updateData.rating = input.rating;
    if (input.documentId !== undefined) updateData.document_id = input.documentId;
    if (input.displayOrder !== undefined) updateData.display_order = input.displayOrder;
    if (input.isPublished !== undefined) updateData.is_published = input.isPublished;

    const updated = await this.repo.updateTestimonial(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update testimonial.', 500, 'TESTIMONIAL_UPDATE_FAILED');
    }

    // Determine audit action type
    let action = 'testimonial_updated';
    if (
      input.isPublished !== undefined &&
      Boolean(existing.is_published) !== Boolean(input.isPublished)
    ) {
      action = input.isPublished ? 'testimonial_published' : 'testimonial_unpublished';
    }

    await this.auditRepo.logEvent({
      actor_admin_id: actor?.adminId,
      action,
      resource_type: 'testimonial',
      resource_id: String(id),
      client_ip: actor?.ip,
      details_json: JSON.stringify({
        updatedFields: Object.keys(input),
        adminEmail: actor?.adminEmail,
      }),
    });

    return this.toAdminDto(updated);
  }

  /**
   * Performs controlled soft-delete / archiving with audit logging.
   */
  public async deleteTestimonial(
    id: number,
    actor?: { adminId?: string; adminEmail?: string; ip?: string }
  ): Promise<{ success: boolean }> {
    const existing = await this.getTestimonialById(id);

    const deleted = await this.repo.softDelete(id);
    if (!deleted) {
      throw new AppError('Failed to archive testimonial.', 500, 'TESTIMONIAL_DELETE_FAILED');
    }

    logger.info(`Testimonial #${id} archived by admin ${actor?.adminEmail || 'system'}`);

    await this.auditRepo.logEvent({
      actor_admin_id: actor?.adminId,
      action: 'testimonial_deleted',
      resource_type: 'testimonial',
      resource_id: String(id),
      client_ip: actor?.ip,
      details_json: JSON.stringify({
        clientName: existing.client_name,
        adminEmail: actor?.adminEmail,
      }),
    });

    return { success: true };
  }

  /**
   * Reorders testimonials display positions with audit logging.
   */
  public async reorderTestimonials(
    items: { id: number; displayOrder: number }[],
    actor?: { adminId?: string; adminEmail?: string; ip?: string }
  ): Promise<{ success: boolean }> {
    await this.repo.reorder(items);

    await this.auditRepo.logEvent({
      actor_admin_id: actor?.adminId,
      action: 'testimonials_reordered',
      resource_type: 'testimonial',
      client_ip: actor?.ip,
      details_json: JSON.stringify({
        itemCount: items.length,
        adminEmail: actor?.adminEmail,
      }),
    });

    return { success: true };
  }
}

export const testimonialService = new TestimonialService();
