/**
 * CITYLINE CONSULTANCY — Visa Service Repository
 * Manages database operations for the canonical visa_services reference table.
 */

import { Knex } from 'knex';
import { AbstractKnexRepository } from './base.repository';
import { normalizeDatabaseError } from '../database/database-error';

export interface VisaServiceRecord {
  [key: string]: unknown;
  id: number;
  service_code: string;
  title: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

const SERVICE_CODE_ALIASES: Record<string, string> = {
  'freelance-visa': 'freelance_2yr',
  'visit-visa-30': 'visit_30d',
  'visit-visa-60': 'visit_60d',
  'freelance_visa': 'freelance_2yr',
  'visit_visa_30': 'visit_30d',
  'visit_visa_60': 'visit_60d',
};

export class VisaServiceRepository extends AbstractKnexRepository<VisaServiceRecord, number> {
  protected readonly tableName = 'visa_services';

  /**
   * Resolves an active visa service by code, slug, or friendly alias.
   */
  public async findActiveByCodeOrSlug(
    codeOrSlug: string,
    trx?: Knex.Transaction
  ): Promise<VisaServiceRecord | null> {
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

      return (row as VisaServiceRecord) || null;
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'VisaServiceRepository.findActiveByCodeOrSlug');
    }
  }

  /**
   * Lists all active visa services in display order.
   */
  public async findAllActive(trx?: Knex.Transaction): Promise<VisaServiceRecord[]> {
    try {
      const rows = await this.getQuery(trx)
        .where('is_active', true)
        .orderBy('display_order', 'asc');
      return rows as VisaServiceRecord[];
    } catch (err: unknown) {
      throw normalizeDatabaseError(err, 'VisaServiceRepository.findAllActive');
    }
  }
}

export const visaServiceRepository = new VisaServiceRepository();
