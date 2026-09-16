"use strict";
/**
 * CITYLINE CONSULTANCY — Visa Service Repository
 * Manages database operations for the canonical visa_services reference table.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.visaServiceRepository = exports.VisaServiceRepository = void 0;
const base_repository_1 = require("./base.repository");
const database_error_1 = require("../database/database-error");
const SERVICE_CODE_ALIASES = {
    'freelance-visa': 'freelance_2yr',
    'visit-visa-30': 'visit_30d',
    'visit-visa-60': 'visit_60d',
    'freelance_visa': 'freelance_2yr',
    'visit_visa_30': 'visit_30d',
    'visit_visa_60': 'visit_60d',
};
class VisaServiceRepository extends base_repository_1.AbstractKnexRepository {
    tableName = 'visa_services';
    /**
     * Resolves an active visa service by code, slug, or friendly alias.
     */
    async findActiveByCodeOrSlug(codeOrSlug, trx) {
        try {
            const normalized = codeOrSlug.trim().toLowerCase();
            const resolvedCode = SERVICE_CODE_ALIASES[normalized] || normalized;
            const query = this.getQuery(trx);
            const row = await query
                .where((builder) => {
                builder
                    .where('service_code', resolvedCode)
                    .orWhere('slug', normalized)
                    .orWhere('slug', resolvedCode);
            })
                .andWhere('is_active', true)
                .first();
            return row || null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'VisaServiceRepository.findActiveByCodeOrSlug');
        }
    }
    /**
     * Lists all active visa services in display order.
     */
    async findAllActive(trx) {
        try {
            const rows = await this.getQuery(trx)
                .where('is_active', true)
                .orderBy('display_order', 'asc');
            return rows;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'VisaServiceRepository.findAllActive');
        }
    }
}
exports.VisaServiceRepository = VisaServiceRepository;
exports.visaServiceRepository = new VisaServiceRepository();
