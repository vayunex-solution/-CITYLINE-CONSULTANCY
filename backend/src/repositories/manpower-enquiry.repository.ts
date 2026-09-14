/**
 * CITYLINE CONSULTANCY — Manpower Enquiry Repository
 * Manages atomic persistence, querying, and updates for manpower enquiries,
 * position breakdowns, parent enquiries, and corporate employer associations.
 */

import { Knex } from 'knex';
import { AbstractKnexRepository } from './base.repository';
import { getDbClient } from '../database/connection';
import { normalizeDatabaseError } from '../database/database-error';
import { ManpowerQueryParams } from '../schemas/manpower-enquiry.schema';

export interface ManpowerEnquiryRecord {
  [key: string]: unknown;
  id: string;
  enquiry_id: string;
  employer_id?: string | null;
  reference_number?: string | null;
  idempotency_key?: string | null;
  request_hash?: string | null;
  status: string;
  total_headcount: number;
  deployment_location?: string | null;
  preferred_timeline?: string | null;
  special_requirements?: string | null;
  admin_notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ManpowerPositionRecord {
  [key: string]: unknown;
  id?: number;
  manpower_enquiry_id: string;
  job_category_id?: number | null;
  role_title: string;
  headcount: number;
  experience_years_required?: number | null;
  qualification?: string | null;
  gender_requirement?: string | null;
  language_requirements?: string | null;
  salary_offered?: string | null;
  accommodation_provided?: string | null;
  transport_provided?: string | null;
  food_provided?: string | null;
  notes?: string | null;
  created_at?: Date;
}

export interface FullManpowerEnquiryDetail {
  enquiry: {
    id: string;
    enquiry_type: string;
    status: string;
    full_name: string;
    email: string;
    phone: string;
    whatsapp?: string | null;
    subject?: string | null;
    message?: string | null;
    source_channel: string;
    created_at: Date;
  };
  manpowerEnquiry: ManpowerEnquiryRecord;
  employer: {
    id: string;
    company_name: string;
    contact_person: string;
    contact_designation?: string | null;
    email: string;
    phone: string;
    whatsapp?: string | null;
    city: string;
    country?: string | null;
    website?: string | null;
    industry: string;
  } | null;
  positions: Array<
    ManpowerPositionRecord & {
      category_name?: string | null;
      category_slug?: string | null;
    }
  >;
}

export interface PaginatedManpowerResult {
  data: Array<{
    id: string;
    reference_number: string;
    status: string;
    total_headcount: number;
    preferred_timeline?: string | null;
    deployment_location?: string | null;
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
    city: string;
    positions_count: number;
    created_at: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ManpowerEnquiryRepository extends AbstractKnexRepository<ManpowerEnquiryRecord, string> {
  protected readonly tableName = 'manpower_enquiries';

  protected getClient(trx?: Knex.Transaction): Knex {
    return trx || getDbClient();
  }

  /**
   * Finds an enquiry by its explicit client idempotency key.
   */
  public async findByIdempotencyKey(
    key: string,
    trx?: Knex.Transaction
  ): Promise<ManpowerEnquiryRecord | null> {
    try {
      const query = this.getQuery(trx);
      const row = await query.where('idempotency_key', key.trim()).first();
      return (row as ManpowerEnquiryRecord) || null;
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'ManpowerEnquiryRepository.findByIdempotencyKey');
    }
  }

  /**
   * Finds an enquiry by its public reference code.
   */
  public async findByReference(
    reference: string,
    trx?: Knex.Transaction
  ): Promise<ManpowerEnquiryRecord | null> {
    try {
      const query = this.getQuery(trx);
      const row = await query.where('reference_number', reference.trim()).first();
      return (row as ManpowerEnquiryRecord) || null;
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'ManpowerEnquiryRepository.findByReference');
    }
  }

  /**
   * Checks for a recent identical duplicate submission within a time window (e.g. 15 minutes).
   * Matches on matching normalized company name, normalized email, and exact request_hash.
   */
  public async findRecentDuplicate(
    companyName: string,
    email: string,
    requestHash: string,
    windowMs: number,
    trx?: Knex.Transaction
  ): Promise<ManpowerEnquiryRecord | null> {
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

      return (row as ManpowerEnquiryRecord) || null;
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'ManpowerEnquiryRepository.findRecentDuplicate');
    }
  }

  /**
   * Persists the parent enquiry, manpower enquiry header, and all position records inside a transaction.
   */
  public async createEnquiryWithPositions(
    enquiryData: {
      id: string;
      enquiry_type: string;
      status: string;
      full_name: string;
      email: string;
      phone: string;
      whatsapp?: string | null;
      subject: string;
      message?: string | null;
      source_channel: string;
    },
    manpowerData: Omit<ManpowerEnquiryRecord, 'created_at' | 'updated_at'>,
    positions: Array<Omit<ManpowerPositionRecord, 'id' | 'created_at'>>,
    trx: Knex.Transaction
  ): Promise<void> {
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
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'ManpowerEnquiryRepository.createEnquiryWithPositions');
    }
  }

  /**
   * Fetches full enquiry details with joined parent, employer, and positions.
   */
  public async findFullDetailById(
    id: string,
    trx?: Knex.Transaction
  ): Promise<FullManpowerEnquiryDetail | null> {
    try {
      const db = this.getClient(trx);

      // Header record
      const manpower = await db('manpower_enquiries').where('id', id).first();
      if (!manpower) return null;

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
        .select(
          'manpower_enquiry_positions.*',
          'job_categories.name as category_name',
          'job_categories.slug as category_slug'
        );

      return {
        enquiry: parent,
        manpowerEnquiry: manpower as ManpowerEnquiryRecord,
        employer,
        positions,
      };
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'ManpowerEnquiryRepository.findFullDetailById');
    }
  }

  /**
   * Lists manpower enquiries with pagination, filters, and employer details for admin review.
   */
  public async listEnquiries(
    params: ManpowerQueryParams,
    trx?: Knex.Transaction
  ): Promise<PaginatedManpowerResult> {
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
        baseQuery.where((builder: Knex.QueryBuilder) => {
          builder
            .whereRaw('LOWER(employers.company_name) LIKE ?', [term])
            .orWhereRaw('LOWER(employers.contact_person) LIKE ?', [term])
            .orWhereRaw('LOWER(employers.email) LIKE ?', [term])
            .orWhereRaw('LOWER(manpower_enquiries.reference_number) LIKE ?', [term]);
        });
      }

      // Count query
      const countRes = await baseQuery.clone().count<{ count: string | number }>('* as count').first();
      const total = Number(countRes?.count || 0);

      // Select query
      const rows = await baseQuery
        .clone()
        .select(
          'manpower_enquiries.id',
          'manpower_enquiries.reference_number',
          'manpower_enquiries.status',
          'manpower_enquiries.total_headcount',
          'manpower_enquiries.preferred_timeline',
          'manpower_enquiries.deployment_location',
          'employers.company_name',
          'employers.contact_person',
          'employers.email',
          'employers.phone',
          'employers.city',
          'manpower_enquiries.created_at',
          db.raw(
            '(SELECT COUNT(*) FROM manpower_enquiry_positions WHERE manpower_enquiry_positions.manpower_enquiry_id = manpower_enquiries.id) as positions_count'
          )
        )
        .orderBy('manpower_enquiries.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return {
        data: rows.map((r: any) => ({
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
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'ManpowerEnquiryRepository.listEnquiries');
    }
  }

  /**
   * Updates status of a manpower enquiry.
   */
  public async updateStatus(
    id: string,
    status: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    try {
      const db = this.getClient(trx);
      await db('manpower_enquiries')
        .where('id', id)
        .update({
          status,
          updated_at: db.fn.now(),
        });
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'ManpowerEnquiryRepository.updateStatus');
    }
  }

  /**
   * Updates generic operational fields of a manpower enquiry.
   */
  public async updateEnquiry(
    id: string,
    data: {
      admin_notes?: string | null;
      deployment_location?: string | null;
      preferred_timeline?: string | null;
      special_requirements?: string | null;
    },
    trx?: Knex.Transaction
  ): Promise<void> {
    try {
      const db = this.getClient(trx);
      await db('manpower_enquiries')
        .where('id', id)
        .update({
          ...data,
          updated_at: db.fn.now(),
        });
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'ManpowerEnquiryRepository.updateEnquiry');
    }
  }
}

export const manpowerEnquiryRepository = new ManpowerEnquiryRepository();
