/**
 * CITYLINE CONSULTANCY — Enquiry & Visa Enquiry Repository
 * Manages transactional insertion of public enquiries, visa detail models, and document links.
 */

import { Knex } from 'knex';
import { AbstractKnexRepository } from './base.repository';
import { getDbClient } from '../database/connection';
import { normalizeDatabaseError } from '../database/database-error';

export interface EnquiryRecord {
  [key: string]: unknown;
  id: string;
  enquiry_type: string;
  status: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp?: string | null;
  nationality?: string | null;
  subject?: string | null;
  message?: string | null;
  source_channel: string;
  assigned_admin_id?: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface VisaEnquiryRecord {
  [key: string]: unknown;
  id: string;
  enquiry_id: string;
  visa_service_id: number;
  intended_travel_date?: string | null;
  duration_days?: number | null;
  applicant_count: number;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export class EnquiryRepository extends AbstractKnexRepository<EnquiryRecord, string> {
  protected readonly tableName = 'enquiries';

  /**
   * Transactionally creates the parent enquiry and the normalized visa_enquiries record.
   */
  public async createVisaEnquiry(
    enquiryData: Omit<EnquiryRecord, 'created_at' | 'updated_at'>,
    visaDetailData: Omit<VisaEnquiryRecord, 'created_at' | 'updated_at'>,
    trx: Knex.Transaction
  ): Promise<void> {
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
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'EnquiryRepository.createVisaEnquiry');
    }
  }

  /**
   * Fetches enquiry with its visa enquiry details.
   */
  public async findVisaEnquiryById(
    enquiryId: string,
    trx?: Knex.Transaction
  ): Promise<{ enquiry: EnquiryRecord; visaDetail: VisaEnquiryRecord } | null> {
    try {
      const query = this.getQuery(trx);
      const enquiry = await query.where('id', enquiryId).first();
      if (!enquiry) return null;

      const db = trx || getDbClient();
      const visaDetail = await db('visa_enquiries')
        .where('enquiry_id', enquiryId)
        .first();

      return {
        enquiry: enquiry as EnquiryRecord,
        visaDetail: visaDetail as VisaEnquiryRecord,
      };
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'EnquiryRepository.findVisaEnquiryById');
    }
  }
}

export const enquiryRepository = new EnquiryRepository();
