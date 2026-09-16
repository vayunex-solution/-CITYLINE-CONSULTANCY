"use strict";
/**
 * CITYLINE CONSULTANCY — Enquiry & Visa Enquiry Repository
 * Manages transactional insertion of public enquiries, visa detail models, and document links.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.enquiryRepository = exports.EnquiryRepository = void 0;
const base_repository_1 = require("./base.repository");
const connection_1 = require("../database/connection");
const database_error_1 = require("../database/database-error");
class EnquiryRepository extends base_repository_1.AbstractKnexRepository {
    tableName = 'enquiries';
    /**
     * Transactionally creates the parent enquiry and the normalized visa_enquiries record.
     */
    async createVisaEnquiry(enquiryData, visaDetailData, trx) {
        try {
            // 1. Insert parent enquiry
            await trx('enquiries').insert({
                ...enquiryData,
                created_at: trx.fn.now(),
                updated_at: trx.fn.now(),
            });
            // 2. Insert normalized visa enquiry detail
            await trx('visa_enquiries').insert({
                ...visaDetailData,
                created_at: trx.fn.now(),
                updated_at: trx.fn.now(),
            });
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'EnquiryRepository.createVisaEnquiry');
        }
    }
    /**
     * Fetches enquiry with its visa enquiry details.
     */
    async findVisaEnquiryById(enquiryId, trx) {
        try {
            const query = this.getQuery(trx);
            const enquiry = await query.where('id', enquiryId).first();
            if (!enquiry)
                return null;
            const db = trx || (0, connection_1.getDbClient)();
            const visaDetail = await db('visa_enquiries')
                .where('enquiry_id', enquiryId)
                .first();
            return {
                enquiry: enquiry,
                visaDetail: visaDetail,
            };
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'EnquiryRepository.findVisaEnquiryById');
        }
    }
}
exports.EnquiryRepository = EnquiryRepository;
exports.enquiryRepository = new EnquiryRepository();
