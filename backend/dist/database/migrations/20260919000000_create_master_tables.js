"use strict";
/**
 * CITYLINE CONSULTANCY — Master Tables Migration
 * Creates reference tables for job locations and employer industry sectors.
 *
 * GOVERNANCE:
 * - Compatible with MariaDB 10.3+ / MySQL 8.0+.
 * - UTF-8 mb4 collation, UTC timestamps.
 * - Idempotent reference data seeding included.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    // 1. Job Locations Reference Table
    const hasLocations = await knex.schema.hasTable('job_locations');
    if (!hasLocations) {
        await knex.schema.createTable('job_locations', (table) => {
            table.increments('id').primary();
            table.string('name', 100).notNullable().unique();
            table.string('city', 100).notNullable();
            table.string('country', 100).defaultTo('UAE').notNullable();
            table.integer('display_order').defaultTo(0).notNullable();
            table.boolean('is_active').defaultTo(true).notNullable();
            table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
            table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
            table.index(['is_active', 'display_order'], 'idx_job_locations_order');
        });
        // Seed standard UAE and GCC operational locations
        const initialLocations = [
            { name: 'Dubai, UAE', city: 'Dubai', country: 'UAE', display_order: 1 },
            { name: 'Abu Dhabi, UAE', city: 'Abu Dhabi', country: 'UAE', display_order: 2 },
            { name: 'Sharjah, UAE', city: 'Sharjah', country: 'UAE', display_order: 3 },
            { name: 'Ajman, UAE', city: 'Ajman', country: 'UAE', display_order: 4 },
            { name: 'Ras Al Khaimah, UAE', city: 'Ras Al Khaimah', country: 'UAE', display_order: 5 },
            { name: 'Fujairah, UAE', city: 'Fujairah', country: 'UAE', display_order: 6 },
            { name: 'Umm Al Quwain, UAE', city: 'Umm Al Quwain', country: 'UAE', display_order: 7 },
            { name: 'Riyadh, Saudi Arabia', city: 'Riyadh', country: 'Saudi Arabia', display_order: 8 },
            { name: 'Doha, Qatar', city: 'Doha', country: 'Qatar', display_order: 9 },
        ];
        for (const loc of initialLocations) {
            await knex('job_locations').insert(loc);
        }
    }
    // 2. Master Industry Sectors Table
    const hasIndustries = await knex.schema.hasTable('master_industries');
    if (!hasIndustries) {
        await knex.schema.createTable('master_industries', (table) => {
            table.increments('id').primary();
            table.string('name', 100).notNullable().unique();
            table.string('slug', 100).notNullable().unique();
            table.string('description', 255).nullable();
            table.integer('display_order').defaultTo(0).notNullable();
            table.boolean('is_active').defaultTo(true).notNullable();
            table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
            table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
            table.index(['is_active', 'display_order'], 'idx_master_industries_order');
        });
        // Seed core industry sectors for corporate employer requisitions
        const initialIndustries = [
            { name: 'Hospitality & Tourism', slug: 'hospitality-tourism', description: 'Hotels, resorts, luxury dining, and catering operations.', display_order: 1 },
            { name: 'Cleaning & Facility Management', slug: 'cleaning-facility-management', description: 'Commercial janitorial, corporate towers, and residential complexes.', display_order: 2 },
            { name: 'Civil Construction & Infrastructure', slug: 'civil-construction-infrastructure', description: 'High-rise contracting, civil finishing, MEP, and civil engineering.', display_order: 3 },
            { name: 'Logistics & Warehousing', slug: 'logistics-warehousing', description: 'E-commerce fulfillment centers, parcel dispatch, and freight hubs.', display_order: 4 },
            { name: 'Transport & Fleet Operations', slug: 'transport-fleet-operations', description: 'Metropolitan passenger taxis, bus fleets, and heavy goods vehicles.', display_order: 5 },
            { name: 'Retail & Customer Operations', slug: 'retail-customer-operations', description: 'Supermarket chains, shopping centers, and retail stores.', display_order: 6 },
        ];
        for (const ind of initialIndustries) {
            await knex('master_industries').insert(ind);
        }
    }
}
async function down(knex) {
    await knex.schema.dropTableIfExists('master_industries');
    await knex.schema.dropTableIfExists('job_locations');
}
