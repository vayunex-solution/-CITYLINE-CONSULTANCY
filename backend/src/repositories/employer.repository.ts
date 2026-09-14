/**
 * CITYLINE CONSULTANCY — Employer Repository
 * Coordinates database operations for the employers master registry table.
 *
 * GOVERNANCE:
 * - Deduplication matches strictly on LOWER(TRIM(company_name)) AND LOWER(TRIM(email)).
 * - Public enquiries re-use existing employers WITHOUT mutating their master records.
 */

import { Knex } from 'knex';
import { AbstractKnexRepository } from './base.repository';
import { normalizeDatabaseError } from '../database/database-error';

export interface EmployerRecord {
  [key: string]: unknown;
  id: string;
  company_name: string;
  trade_license_number?: string | null;
  trn?: string | null;
  industry: string;
  contact_person: string;
  contact_designation?: string | null;
  email: string;
  phone: string;
  whatsapp?: string | null;
  country?: string | null;
  city: string;
  address?: string | null;
  website?: string | null;
  notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class EmployerRepository extends AbstractKnexRepository<EmployerRecord, string> {
  protected readonly tableName = 'employers';

  /**
   * Finds an existing employer by exact normalized match on company_name and email.
   */
  public async findExistingEmployer(
    companyName: string,
    email: string,
    trx?: Knex.Transaction
  ): Promise<EmployerRecord | null> {
    try {
      const query = this.getQuery(trx);
      const row = await query
        .whereRaw('LOWER(TRIM(company_name)) = ?', [companyName.trim().toLowerCase()])
        .andWhereRaw('LOWER(TRIM(email)) = ?', [email.trim().toLowerCase()])
        .first();

      return (row as EmployerRecord) || null;
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'EmployerRepository.findExistingEmployer');
    }
  }

  /**
   * Inserts a new employer record inside a transaction.
   */
  public async createEmployer(
    data: Omit<EmployerRecord, 'created_at' | 'updated_at'>,
    trx: Knex.Transaction
  ): Promise<EmployerRecord> {
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
      } as EmployerRecord;
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'EmployerRepository.createEmployer');
    }
  }

  /**
   * Finds an employer by ID.
   */
  public async findById(id: string, trx?: Knex.Transaction): Promise<EmployerRecord | null> {
    try {
      const query = this.getQuery(trx);
      const row = await query.where('id', id).first();
      return (row as EmployerRecord) || null;
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'EmployerRepository.findById');
    }
  }
}

export const employerRepository = new EmployerRepository();
