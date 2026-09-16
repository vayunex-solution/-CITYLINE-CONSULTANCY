"use strict";
/**
 * CITYLINE CONSULTANCY — Employer Repository
 * Coordinates database operations for the employers master registry table.
 *
 * GOVERNANCE:
 * - Deduplication matches strictly on LOWER(TRIM(company_name)) AND LOWER(TRIM(email)).
 * - Public enquiries re-use existing employers WITHOUT mutating their master records.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.employerRepository = exports.EmployerRepository = void 0;
const base_repository_1 = require("./base.repository");
const database_error_1 = require("../database/database-error");
class EmployerRepository extends base_repository_1.AbstractKnexRepository {
    tableName = 'employers';
    /**
     * Finds an existing employer by exact normalized match on company_name and email.
     */
    async findExistingEmployer(companyName, email, trx) {
        try {
            const query = this.getQuery(trx);
            const row = await query
                .whereRaw('LOWER(TRIM(company_name)) = ?', [companyName.trim().toLowerCase()])
                .andWhereRaw('LOWER(TRIM(email)) = ?', [email.trim().toLowerCase()])
                .first();
            return row || null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'EmployerRepository.findExistingEmployer');
        }
    }
    /**
     * Inserts a new employer record inside a transaction.
     */
    async createEmployer(data, trx) {
        try {
            const insertData = {
                ...data,
                country: data.country || 'United Arab Emirates',
                industry: data.industry || 'General',
                created_at: trx.fn.now(),
                updated_at: trx.fn.now(),
            };
            await trx('employers').insert(insertData);
            return {
                ...insertData,
                created_at: new Date(),
                updated_at: new Date(),
            };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'EmployerRepository.createEmployer');
        }
    }
    /**
     * Finds an employer by ID.
     */
    async findById(id, trx) {
        try {
            const query = this.getQuery(trx);
            const row = await query.where('id', id).first();
            return row || null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'EmployerRepository.findById');
        }
    }
}
exports.EmployerRepository = EmployerRepository;
exports.employerRepository = new EmployerRepository();
