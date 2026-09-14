/**
 * CITYLINE CONSULTANCY — Phase 8 Additive Migration
 * Extends jobs and job_applications with nullable supporting columns.
 *
 * GOVERNANCE:
 * - 100% additive: existing tables, columns, indexes, foreign keys, charset/collation preserved.
 * - Idempotency supported without permanently restricting legitimate future re-applications.
 * - Supports rich job metadata while remaining strictly optional where data is unavailable.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Add supporting fields to jobs table
  await knex.schema.alterTable('jobs', (table) => {
    table.text('short_description').nullable();
    table.text('responsibilities').nullable();
    table.string('qualification', 255).nullable();
    table.integer('experience_years_required').nullable();
    table.string('salary_range', 100).nullable();
    table.text('benefits').nullable();
    table.timestamp('published_at').nullable();

    table.index(['status', 'published_at'], 'idx_jobs_status_published');
  });

  // 2. Add supporting fields to job_applications table
  await knex.schema.alterTable('job_applications', (table) => {
    table.string('reference_number', 50).nullable().unique('uniq_job_app_reference');
    table.string('idempotency_key', 100).nullable().index('idx_job_app_idempotency_key');
    table.text('cover_letter').nullable();
    table.string('qualification', 255).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('job_applications', (table) => {
    table.dropIndex([], 'uniq_job_app_reference');
    table.dropIndex([], 'idx_job_app_idempotency_key');
    table.dropColumn('reference_number');
    table.dropColumn('idempotency_key');
    table.dropColumn('cover_letter');
    table.dropColumn('qualification');
  });

  await knex.schema.alterTable('jobs', (table) => {
    table.dropIndex([], 'idx_jobs_status_published');
    table.dropColumn('short_description');
    table.dropColumn('responsibilities');
    table.dropColumn('qualification');
    table.dropColumn('experience_years_required');
    table.dropColumn('salary_range');
    table.dropColumn('benefits');
    table.dropColumn('published_at');
  });
}
