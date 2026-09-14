/**
 * CITYLINE CONSULTANCY — Testimonial Repository
 * Provides isolated, parameter-safe data access for public and administrative testimonial curation.
 */

import { Knex } from 'knex';
import { AbstractKnexRepository, PaginatedResult } from './base.repository';
import { getDbClient } from '../database/connection';
import { normalizeDatabaseError } from '../database/database-error';
import { TestimonialQueryParams } from '../schemas/testimonial.schema';

export interface TestimonialRecord {
  [key: string]: unknown;
  id: number;
  client_name: string;
  client_designation: string | null;
  company_name: string | null;
  client_location: string | null;
  service_category: string | null;
  testimonial_text: string;
  rating: number | null;
  document_id: string | null;
  display_order: number;
  is_published: boolean | number;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
}

export class TestimonialRepository extends AbstractKnexRepository<TestimonialRecord, number> {
  protected readonly tableName = 'testimonials';

  /**
   * Retrieves all published testimonials ordered deterministically by display_order ASC, created_at DESC.
   */
  public async listPublished(trx?: Knex.Transaction): Promise<TestimonialRecord[]> {
    try {
      const rows = await this.getQuery(trx)
        .whereNull('deleted_at')
        .where('is_published', true)
        .orderBy('display_order', 'asc')
        .orderBy('created_at', 'desc')
        .select('*');

      return rows as TestimonialRecord[];
    } catch (error) {
      throw normalizeDatabaseError(error, 'TestimonialRepository.listPublished');
    }
  }

  /**
   * Retrieves paginated testimonials for administration with status filtering and text search.
   */
  public async listAdmin(
    params: TestimonialQueryParams,
    trx?: Knex.Transaction
  ): Promise<PaginatedResult<TestimonialRecord>> {
    try {
      const page = Math.max(1, params.page || 1);
      const limit = Math.min(100, Math.max(1, params.limit || 20));
      const offset = (page - 1) * limit;

      const buildFilteredQuery = () => {
        let q = this.getQuery(trx).whereNull('deleted_at');

        if (params.status === 'published') {
          q = q.where('is_published', true);
        } else if (params.status === 'unpublished') {
          q = q.where('is_published', false);
        }

        if (params.search) {
          const term = `%${params.search.trim()}%`;
          q = q.where((b) => {
            b.where('client_name', 'like', term)
              .orWhere('testimonial_text', 'like', term)
              .orWhere('client_designation', 'like', term)
              .orWhere('company_name', 'like', term);
          });
        }

        return q;
      };

      // Count total records
      const countResult = await buildFilteredQuery().count<{ total: number | string }[]>('* as total');
      const total = Number((countResult as any)?.[0]?.total || 0);

      // Fetch paginated rows
      const items = (await buildFilteredQuery()
        .orderBy('display_order', 'asc')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset)
        .select('*')) as TestimonialRecord[];

      const totalPages = Math.ceil(total / limit) || 1;

      return {
        items,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw normalizeDatabaseError(error, 'TestimonialRepository.listAdmin');
    }
  }

  /**
   * Finds an active (non-deleted) testimonial by ID.
   */
  public override async findById(id: number, trx?: Knex.Transaction): Promise<TestimonialRecord | null> {
    try {
      const row = await this.getQuery(trx)
        .whereNull('deleted_at')
        .where('id', id)
        .first();

      return (row as TestimonialRecord) || null;
    } catch (error) {
      throw normalizeDatabaseError(error, 'TestimonialRepository.findById');
    }
  }

  /**
   * Atomically creates a new testimonial and returns the persisted record.
   */
  public async createTestimonial(
    data: Omit<TestimonialRecord, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
    trx?: Knex.Transaction
  ): Promise<TestimonialRecord> {
    try {
      const db = trx || getDbClient();
      const insertPayload = {
        client_name: data.client_name,
        client_designation: data.client_designation ?? null,
        company_name: data.company_name ?? null,
        client_location: data.client_location ?? null,
        service_category: data.service_category ?? null,
        testimonial_text: data.testimonial_text,
        rating: data.rating ?? null,
        document_id: data.document_id ?? null,
        display_order: data.display_order ?? 0,
        is_published: data.is_published ? 1 : 0,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
        deleted_at: null,
      };

      const inserted = await db(this.tableName).insert(insertPayload);
      const insertedId = typeof inserted[0] === 'number' ? inserted[0] : (inserted[0] as any)?.id || inserted[0];

      const record = await this.findById(Number(insertedId), trx);
      if (!record) {
        throw new Error('Failed to retrieve newly inserted testimonial record');
      }
      return record;
    } catch (error) {
      throw normalizeDatabaseError(error, 'TestimonialRepository.createTestimonial');
    }
  }

  /**
   * Updates an existing testimonial record.
   */
  public async updateTestimonial(
    id: number,
    data: Partial<Omit<TestimonialRecord, 'id' | 'created_at' | 'deleted_at'>>,
    trx?: Knex.Transaction
  ): Promise<TestimonialRecord | null> {
    try {
      const db = trx || getDbClient();
      const updatePayload: Record<string, unknown> = {
        updated_at: db.fn.now(),
      };

      if (data.client_name !== undefined) updatePayload.client_name = data.client_name;
      if (data.client_designation !== undefined) updatePayload.client_designation = data.client_designation;
      if (data.company_name !== undefined) updatePayload.company_name = data.company_name;
      if (data.client_location !== undefined) updatePayload.client_location = data.client_location;
      if (data.service_category !== undefined) updatePayload.service_category = data.service_category;
      if (data.testimonial_text !== undefined) updatePayload.testimonial_text = data.testimonial_text;
      if (data.rating !== undefined) updatePayload.rating = data.rating;
      if (data.document_id !== undefined) updatePayload.document_id = data.document_id;
      if (data.display_order !== undefined) updatePayload.display_order = data.display_order;
      if (data.is_published !== undefined) updatePayload.is_published = data.is_published ? 1 : 0;

      await this.getQuery(trx)
        .whereNull('deleted_at')
        .where('id', id)
        .update(updatePayload);

      return await this.findById(id, trx);
    } catch (error) {
      throw normalizeDatabaseError(error, 'TestimonialRepository.updateTestimonial');
    }
  }

  /**
   * Performs controlled soft-delete / archiving.
   */
  public async softDelete(id: number, trx?: Knex.Transaction): Promise<boolean> {
    try {
      const db = trx || getDbClient();
      const updated = await this.getQuery(trx)
        .whereNull('deleted_at')
        .where('id', id)
        .update({
          deleted_at: db.fn.now(),
          is_published: 0,
          updated_at: db.fn.now(),
        });

      return updated > 0;
    } catch (error) {
      throw normalizeDatabaseError(error, 'TestimonialRepository.softDelete');
    }
  }

  /**
   * Updates display orders for a batch of testimonials.
   */
  public async reorder(
    items: { id: number; displayOrder: number }[],
    trx?: Knex.Transaction
  ): Promise<void> {
    try {
      const db = trx || getDbClient();
      for (const item of items) {
        await db(this.tableName)
          .whereNull('deleted_at')
          .where('id', item.id)
          .update({
            display_order: item.displayOrder,
            updated_at: db.fn.now(),
          });
      }
    } catch (error) {
      throw normalizeDatabaseError(error, 'TestimonialRepository.reorder');
    }
  }
}

export const testimonialRepository = new TestimonialRepository();
