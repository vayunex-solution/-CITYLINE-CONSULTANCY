"use strict";
/**
 * CITYLINE CONSULTANCY — Manpower Enquiry Repository
 * Manages atomic persistence, querying, and updates for manpower enquiries,
 * position breakdowns, parent enquiries, and corporate employer associations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.manpowerEnquiryRepository = exports.ManpowerEnquiryRepository = void 0;
const base_repository_1 = require("./base.repository");
const connection_1 = require("../database/connection");
const database_error_1 = require("../database/database-error");
class ManpowerEnquiryRepository extends base_repository_1.AbstractKnexRepository {
    tableName = 'manpower_enquiries';
    getClient(trx) {
        return trx || (0, connection_1.getDbClient)();
    }
    /**
     * Finds an enquiry by its explicit client idempotency key.
     */
    async findByIdempotencyKey(key, trx) {
        try {
            const query = this.getQuery(trx);
            const row = await query.where('idempotency_key', key.trim()).first();
            return row || null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'ManpowerEnquiryRepository.findByIdempotencyKey');
        }
    }
    /**
     * Finds an enquiry by its public reference code.
     */
    async findByReference(reference, trx) {
        try {
            const query = this.getQuery(trx);
            const row = await query.where('reference_number', reference.trim()).first();
            return row || null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'ManpowerEnquiryRepository.findByReference');
        }
    }
    /**
     * Checks for a recent identical duplicate submission within a time window (e.g. 15 minutes).
     * Matches on matching normalized company name, normalized email, and exact request_hash.
     */
    async findRecentDuplicate(companyName, email, requestHash, windowMs, trx) {
        try {
            const db = this.getClient(trx);
            const windowStart = new Date(Date.now() - windowMs);
            const row = await db('manpower_enquiries')
                .join('employers', 'manpower_enquiries.employer_id', 'employers.id')
                .where('manpower_enquiries.request_hash', requestHash)
                .where('manpower_enquiries.created_at', '>=', windowStart)
                .whereRaw('LOWER(TRIM(employers.company_name)) = ?', [companyName.trim().toLowerCase()])
                .whereRaw('LOWER(TRIM(employers.email)) = ?', [email.trim().toLowerCase()])
                .select('manpower_enquiries.*')
                .first();
            return row || null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'ManpowerEnquiryRepository.findRecentDuplicate');
        }
    }
    /**
     * Persists the parent enquiry, manpower enquiry header, and all position records inside a transaction.
     */
    async createEnquiryWithPositions(enquiryData, manpowerData, positions, trx) {
        try {
            // 1. Insert parent enquiries record
            await trx('enquiries').insert({
                ...enquiryData,
                created_at: trx.fn.now(),
                updated_at: trx.fn.now(),
            });
            // 2. Insert manpower_enquiries header
            await trx('manpower_enquiries').insert({
                ...manpowerData,
                created_at: trx.fn.now(),
                updated_at: trx.fn.now(),
            });
            // 3. Batch insert positions
            if (positions.length > 0) {
                const positionsToInsert = positions.map((p) => ({
                    ...p,
                    created_at: trx.fn.now(),
                }));
                await trx('manpower_enquiry_positions').insert(positionsToInsert);
            }
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'ManpowerEnquiryRepository.createEnquiryWithPositions');
        }
    }
    /**
     * Fetches full enquiry details with joined parent, employer, and positions.
     */
    async findFullDetailById(id, trx) {
        try {
            const db = this.getClient(trx);
            // Header record
            const manpower = await db('manpower_enquiries').where('id', id).first();
            if (!manpower)
                return null;
            // Parent enquiry record
            const parent = await db('enquiries').where('id', manpower.enquiry_id).first();
            // Employer record
            let employer = null;
            if (manpower.employer_id) {
                employer = await db('employers').where('id', manpower.employer_id).first();
            }
            // Positions with joined category info
            const positions = await db('manpower_enquiry_positions')
                .leftJoin('job_categories', 'manpower_enquiry_positions.job_category_id', 'job_categories.id')
                .where('manpower_enquiry_positions.manpower_enquiry_id', id)
                .select('manpower_enquiry_positions.*', 'job_categories.name as category_name', 'job_categories.slug as category_slug');
            return {
                enquiry: parent,
                manpowerEnquiry: manpower,
                employer,
                positions,
            };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'ManpowerEnquiryRepository.findFullDetailById');
        }
    }
    /**
     * Lists manpower enquiries with pagination, filters, and employer details for admin review.
     */
    async listEnquiries(params, trx) {
        try {
            const db = this.getClient(trx);
            const { page, limit, status, search, city, dateFrom, dateTo } = params;
            const offset = (page - 1) * limit;
            const baseQuery = db('manpower_enquiries')
                .join('employers', 'manpower_enquiries.employer_id', 'employers.id')
                .join('enquiries', 'manpower_enquiries.enquiry_id', 'enquiries.id');
            if (status) {
                baseQuery.where('manpower_enquiries.status', status);
            }
            if (city) {
                baseQuery.whereRaw('LOWER(employers.city) = ?', [city.trim().toLowerCase()]);
            }
            if (dateFrom) {
                baseQuery.where('manpower_enquiries.created_at', '>=', new Date(dateFrom));
            }
            if (dateTo) {
                baseQuery.where('manpower_enquiries.created_at', '<=', new Date(dateTo));
            }
            if (search && search.trim()) {
                const term = `%${search.trim().toLowerCase()}%`;
                baseQuery.where((builder) => {
                    builder
                        .whereRaw('LOWER(employers.company_name) LIKE ?', [term])
                        .orWhereRaw('LOWER(employers.contact_person) LIKE ?', [term])
                        .orWhereRaw('LOWER(employers.email) LIKE ?', [term])
                        .orWhereRaw('LOWER(manpower_enquiries.reference_number) LIKE ?', [term]);
                });
            }
            // Count query
            const countRes = await baseQuery.clone().count('* as count').first();
            const total = Number(countRes?.count || 0);
            // Select query
            const rows = await baseQuery
                .clone()
                .select('manpower_enquiries.id', 'manpower_enquiries.reference_number', 'manpower_enquiries.status', 'manpower_enquiries.total_headcount', 'manpower_enquiries.preferred_timeline', 'manpower_enquiries.deployment_location', 'employers.company_name', 'employers.contact_person', 'employers.email', 'employers.phone', 'employers.city', 'manpower_enquiries.created_at', db.raw('(SELECT COUNT(*) FROM manpower_enquiry_positions WHERE manpower_enquiry_positions.manpower_enquiry_id = manpower_enquiries.id) as positions_count'))
                .orderBy('manpower_enquiries.created_at', 'desc')
                .limit(limit)
                .offset(offset);
            return {
                data: rows.map((r) => ({
                    ...r,
                    positions_count: Number(r.positions_count || 0),
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit) || 1,
                },
            };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'ManpowerEnquiryRepository.listEnquiries');
        }
    }
    /**
     * Updates status of a manpower enquiry.
     */
    async updateStatus(id, status, trx) {
        try {
            const db = this.getClient(trx);
            await db('manpower_enquiries')
                .where('id', id)
                .update({
                status,
                updated_at: db.fn.now(),
            });
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'ManpowerEnquiryRepository.updateStatus');
        }
    }
    /**
     * Updates generic operational fields of a manpower enquiry.
     */
    async updateEnquiry(id, data, trx) {
        try {
            const db = this.getClient(trx);
            await db('manpower_enquiries')
                .where('id', id)
                .update({
                ...data,
                updated_at: db.fn.now(),
            });
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'ManpowerEnquiryRepository.updateEnquiry');
        }
    }
}
exports.ManpowerEnquiryRepository = ManpowerEnquiryRepository;
exports.manpowerEnquiryRepository = new ManpowerEnquiryRepository();
