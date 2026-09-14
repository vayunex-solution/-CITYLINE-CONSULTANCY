/**
 * CITYLINE CONSULTANCY — Phase 10 Additive Migration
 * Extends the existing locked Phase 2 testimonials table with optional corporate & service categorization fields.
 *
 * GOVERNANCE:
 * - 100% additive: existing columns, primary key, indexes, foreign keys preserved.
 * - Adds company_name and service_category to support rich client attribution.
 * - Full down migration included for reversible rollbacks.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('testimonials');
  if (!hasTable) {
    return;
  }

  await knex.schema.alterTable('testimonials', (table) => {
    table.string('company_name', 150).nullable();
    table.string('service_category', 100).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('testimonials');
  if (!hasTable) {
    return;
  }

  await knex.schema.alterTable('testimonials', (table) => {
    table.dropColumn('company_name');
    table.dropColumn('service_category');
  });
}
