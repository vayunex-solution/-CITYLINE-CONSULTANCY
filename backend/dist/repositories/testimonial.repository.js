"use strict";
/**
 * CITYLINE CONSULTANCY — Testimonial Repository
 * Provides isolated, parameter-safe data access for public and administrative testimonial curation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testimonialRepository = exports.TestimonialRepository = void 0;
const base_repository_1 = require("./base.repository");
const connection_1 = require("../database/connection");
const database_error_1 = require("../database/database-error");
class TestimonialRepository extends base_repository_1.AbstractKnexRepository {
    tableName = 'testimonials';
    /**
     * Retrieves all published testimonials ordered deterministically by display_order ASC, created_at DESC.
     */
    async listPublished(trx) {
        try {
            const rows = await this.getQuery(trx)
                .whereNull('deleted_at')
                .where('is_published', true)
                .orderBy('display_order', 'asc')
                .orderBy('created_at', 'desc')
                .select('*');
            return rows;
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, 'TestimonialRepository.listPublished');
        }
    }
    /**
     * Retrieves paginated testimonials for administration with status filtering and text search.
     */
    async listAdmin(params, trx) {
        try {
            const page = Math.max(1, params.page || 1);
            const limit = Math.min(100, Math.max(1, params.limit || 20));
            const offset = (page - 1) * limit;
            const buildFilteredQuery = () => {
                let q = this.getQuery(trx).whereNull('deleted_at');
                if (params.status === 'published') {
                    q = q.where('is_published', true);
                }
                else if (params.status === 'unpublished') {
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
            const countResult = await buildFilteredQuery().count('* as total');
            const total = Number(countResult?.[0]?.total || 0);
            // Fetch paginated rows
            const items = (await buildFilteredQuery()
                .orderBy('display_order', 'asc')
                .orderBy('created_at', 'desc')
                .limit(limit)
                .offset(offset)
                .select('*'));
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
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, 'TestimonialRepository.listAdmin');
        }
    }
    /**
     * Finds an active (non-deleted) testimonial by ID.
     */
    async findById(id, trx) {
        try {
            const row = await this.getQuery(trx)
                .whereNull('deleted_at')
                .where('id', id)
                .first();
            return row || null;
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, 'TestimonialRepository.findById');
        }
    }
    /**
     * Atomically creates a new testimonial and returns the persisted record.
     */
    async createTestimonial(data, trx) {
        try {
            const db = trx || (0, connection_1.getDbClient)();
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
            const insertedId = typeof inserted[0] === 'number' ? inserted[0] : inserted[0]?.id || inserted[0];
            const record = await this.findById(Number(insertedId), trx);
            if (!record) {
                throw new Error('Failed to retrieve newly inserted testimonial record');
            }
            return record;
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, 'TestimonialRepository.createTestimonial');
        }
    }
    /**
     * Updates an existing testimonial record.
     */
    async updateTestimonial(id, data, trx) {
        try {
            const db = trx || (0, connection_1.getDbClient)();
            const updatePayload = {
                updated_at: db.fn.now(),
            };
            if (data.client_name !== undefined)
                updatePayload.client_name = data.client_name;
            if (data.client_designation !== undefined)
                updatePayload.client_designation = data.client_designation;
            if (data.company_name !== undefined)
                updatePayload.company_name = data.company_name;
            if (data.client_location !== undefined)
                updatePayload.client_location = data.client_location;
            if (data.service_category !== undefined)
                updatePayload.service_category = data.service_category;
            if (data.testimonial_text !== undefined)
                updatePayload.testimonial_text = data.testimonial_text;
            if (data.rating !== undefined)
                updatePayload.rating = data.rating;
            if (data.document_id !== undefined)
                updatePayload.document_id = data.document_id;
            if (data.display_order !== undefined)
                updatePayload.display_order = data.display_order;
            if (data.is_published !== undefined)
                updatePayload.is_published = data.is_published ? 1 : 0;
            await this.getQuery(trx)
                .whereNull('deleted_at')
                .where('id', id)
                .update(updatePayload);
            return await this.findById(id, trx);
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, 'TestimonialRepository.updateTestimonial');
        }
    }
    /**
     * Performs controlled soft-delete / archiving.
     */
    async softDelete(id, trx) {
        try {
            const db = trx || (0, connection_1.getDbClient)();
            const updated = await this.getQuery(trx)
                .whereNull('deleted_at')
                .where('id', id)
                .update({
                deleted_at: db.fn.now(),
                is_published: 0,
                updated_at: db.fn.now(),
            });
            return updated > 0;
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, 'TestimonialRepository.softDelete');
        }
    }
    /**
     * Updates display orders for a batch of testimonials.
     */
    async reorder(items, trx) {
        try {
            const db = trx || (0, connection_1.getDbClient)();
            for (const item of items) {
                await db(this.tableName)
                    .whereNull('deleted_at')
                    .where('id', item.id)
                    .update({
                    display_order: item.displayOrder,
                    updated_at: db.fn.now(),
                });
            }
        }
        catch (error) {
            throw (0, database_error_1.normalizeDatabaseError)(error, 'TestimonialRepository.reorder');
        }
    }
}
exports.TestimonialRepository = TestimonialRepository;
exports.testimonialRepository = new TestimonialRepository();
