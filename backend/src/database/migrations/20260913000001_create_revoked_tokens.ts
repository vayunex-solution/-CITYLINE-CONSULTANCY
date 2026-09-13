/**
 * CITYLINE CONSULTANCY — Administrative Revoked Tokens Migration (Phase 4 Extension)
 * Creates the persistent storage table for tracking revoked JWT identifiers (jti).
 *
 * RATIONALE:
 * - Phase 4 Security Hardening: Revocation must persist across application restarts
 *   and synchronize across multiple Node/Passenger worker processes.
 * - Indexed by `jti` for fast lookups on every authenticated request.
 * - Indexed by `expires_at` for bounded background purges of naturally expired records.
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('revoked_tokens', (table) => {
    table.bigIncrements('id').primary();
    table.string('jti', 36).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.timestamp('revoked_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['jti'], 'idx_revoked_tokens_jti');
    table.index(['expires_at'], 'idx_revoked_tokens_expires');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('revoked_tokens');
}
