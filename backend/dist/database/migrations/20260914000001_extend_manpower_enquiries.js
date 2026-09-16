"use strict";
/**
 * CITYLINE CONSULTANCY — Phase 9 Additive Migration
 * Extends employers, manpower_enquiries, and manpower_enquiry_positions.
 *
 * GOVERNANCE:
 * - 100% additive: existing tables, columns, indexes, foreign keys, charset/collation preserved.
 * - Idempotency supported with database-level uniqueness on non-null idempotency_key.
 * - Request fingerprint hash stored for deterministic conflict detection.
 * - Detailed manpower requirements supported while remaining strictly optional.
 * - Zero sensitive business documentation (no trade license, no TRN).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    // 1. Extend employers table with optional corporate profile fields
    await knex.schema.alterTable('employers', (table) => {
        table.string('country', 100).defaultTo('United Arab Emirates').nullable();
        table.string('contact_designation', 150).nullable();
        table.string('website', 255).nullable();
        table.text('notes').nullable();
    });
    // 2. Extend manpower_enquiries with reference, unique idempotency key, request hash, timeline, and admin notes
    await knex.schema.alterTable('manpower_enquiries', (table) => {
        table.string('reference_number', 50).nullable().unique('uniq_manpower_reference');
        table.string('idempotency_key', 100).nullable().unique('uniq_manpower_idempotency_key');
        table.string('request_hash', 64).nullable().index('idx_manpower_request_hash');
        table.string('preferred_timeline', 100).nullable();
        table.text('admin_notes').nullable();
    });
    // 3. Extend manpower_enquiry_positions with specification fields
    await knex.schema.alterTable('manpower_enquiry_positions', (table) => {
        table.string('qualification', 255).nullable();
        table.string('gender_requirement', 50).nullable();
        table.string('language_requirements', 255).nullable();
        table.string('salary_offered', 100).nullable();
        table.string('accommodation_provided', 100).nullable();
        table.string('transport_provided', 100).nullable();
        table.string('food_provided', 100).nullable();
        table.text('notes').nullable();
    });
}
async function down(knex) {
    await knex.schema.alterTable('manpower_enquiry_positions', (table) => {
        table.dropColumn('qualification');
        table.dropColumn('gender_requirement');
        table.dropColumn('language_requirements');
        table.dropColumn('salary_offered');
        table.dropColumn('accommodation_provided');
        table.dropColumn('transport_provided');
        table.dropColumn('food_provided');
        table.dropColumn('notes');
    });
    await knex.schema.alterTable('manpower_enquiries', (table) => {
        table.dropUnique(['reference_number'], 'uniq_manpower_reference');
        table.dropUnique(['idempotency_key'], 'uniq_manpower_idempotency_key');
        table.dropIndex(['request_hash'], 'idx_manpower_request_hash');
        table.dropColumn('reference_number');
        table.dropColumn('idempotency_key');
        table.dropColumn('request_hash');
        table.dropColumn('preferred_timeline');
        table.dropColumn('admin_notes');
    });
    await knex.schema.alterTable('employers', (table) => {
        table.dropColumn('country');
        table.dropColumn('contact_designation');
        table.dropColumn('website');
        table.dropColumn('notes');
    });
}
