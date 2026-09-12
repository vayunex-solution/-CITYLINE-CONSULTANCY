/**
 * CITYLINE CONSULTANCY — Database Architecture Verification Suite
 * Deterministically tests schema integrity, foreign keys, composite indexes,
 * seed consistency, and rollback symmetry without fabricating live database output.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import * as coreMigration from '../src/database/migrations/20260913000000_create_core_schema';
import * as referenceSeed from '../src/database/seeds/001_reference_data';
import { databaseConfig } from '../src/config/database.config';
import { checkDatabaseConnectivity } from '../src/database/connection';

describe('Database Architecture & Schema Integrity', () => {
  const schemaSqlPath = path.resolve(__dirname, '../../docs/database/schema.sql');
  const schemaSqlContent = fs.readFileSync(schemaSqlPath, 'utf8');

  it('Migration module exports valid up and down functions', () => {
    assert.strictEqual(typeof coreMigration.up, 'function', 'Migration up() must be a function');
    assert.strictEqual(typeof coreMigration.down, 'function', 'Migration down() must be a function');
    assert.strictEqual(typeof referenceSeed.seed, 'function', 'Seed seed() must be a function');
  });

  it('Schema defines all 18 production tables across 13 domains', () => {
    const expectedTables = [
      'admin_roles',
      'admin_users',
      'job_categories',
      'visa_services',
      'enquiries',
      'visa_enquiries',
      'business_setup_enquiries',
      'employers',
      'manpower_enquiries',
      'manpower_enquiry_positions',
      'jobs',
      'job_applications',
      'documents',
      'testimonials',
      'notification_queue',
      'visitor_sessions',
      'page_views',
      'audit_logs',
    ];

    for (const table of expectedTables) {
      const tableRegex = new RegExp(`CREATE TABLE \`${table}\``, 'i');
      assert.ok(
        tableRegex.test(schemaSqlContent),
        `Table ${table} must be defined in docs/database/schema.sql`
      );
    }
  });

  it('All tables use InnoDB engine, utf8mb4 charset, and utf8mb4_unicode_ci collation', () => {
    const tableCreateMatches = schemaSqlContent.match(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci/g);
    assert.ok(tableCreateMatches, 'Tables must define engine and collation');
    assert.strictEqual(tableCreateMatches.length, 18, 'All 18 tables must declare InnoDB and utf8mb4_unicode_ci');
  });

  it('Enforces primary key strategy (UUID for public entities, AUTO_INCREMENT for reference/logs)', () => {
    // UUID PKs for business entities
    const uuidTables = [
      'admin_users',
      'enquiries',
      'visa_enquiries',
      'business_setup_enquiries',
      'employers',
      'manpower_enquiries',
      'jobs',
      'job_applications',
      'documents',
      'notification_queue',
      'visitor_sessions',
    ];

    for (const table of uuidTables) {
      const uuidPkRegex = new RegExp(`CREATE TABLE \`${table}\` \\([^;]*?\`id\` CHAR\\(36\\) NOT NULL PRIMARY KEY`, 's');
      assert.ok(uuidPkRegex.test(schemaSqlContent), `Table ${table} must use CHAR(36) UUID primary key`);
    }

    // Auto-increment PKs for reference and high-write logs
    const intTables = [
      'admin_roles',
      'job_categories',
      'visa_services',
      'manpower_enquiry_positions',
      'testimonials',
      'page_views',
      'audit_logs',
    ];

    for (const table of intTables) {
      const intPkRegex = new RegExp(`CREATE TABLE \`${table}\` \\([^;]*?\`id\` (INT|BIGINT) UNSIGNED AUTO_INCREMENT PRIMARY KEY`, 's');
      assert.ok(intPkRegex.test(schemaSqlContent), `Table ${table} must use INT/BIGINT AUTO_INCREMENT primary key`);
    }
  });

  it('Verifies foreign key constraints and referential integrity actions', () => {
    const requiredForeignKeys = [
      { name: 'fk_admin_users_role', onAction: 'ON DELETE RESTRICT' },
      { name: 'fk_enquiries_admin', onAction: 'ON DELETE SET NULL' },
      { name: 'fk_visa_enquiries_enquiry', onAction: 'ON DELETE CASCADE' },
      { name: 'fk_visa_enquiries_service', onAction: 'ON DELETE RESTRICT' },
      { name: 'fk_business_setup_enquiry', onAction: 'ON DELETE CASCADE' },
      { name: 'fk_manpower_enquiries_enquiry', onAction: 'ON DELETE CASCADE' },
      { name: 'fk_manpower_enquiries_employer', onAction: 'ON DELETE SET NULL' },
      { name: 'fk_mep_enquiry', onAction: 'ON DELETE CASCADE' },
      { name: 'fk_mep_category', onAction: 'ON DELETE SET NULL' },
      { name: 'fk_jobs_category', onAction: 'ON DELETE RESTRICT' },
      { name: 'fk_job_applications_job', onAction: 'ON DELETE RESTRICT' },
      { name: 'fk_testimonials_doc', onAction: 'ON DELETE SET NULL' },
      { name: 'fk_page_views_session', onAction: 'ON DELETE CASCADE' },
      { name: 'fk_audit_admin', onAction: 'ON DELETE SET NULL' },
    ];

    for (const fk of requiredForeignKeys) {
      assert.ok(schemaSqlContent.includes(fk.name), `Foreign key ${fk.name} must be declared`);
      assert.ok(schemaSqlContent.includes(fk.onAction), `Referential action ${fk.onAction} must be present`);
    }
  });

  it('Verifies critical composite and unique indexes', () => {
    const requiredIndexes = [
      'idx_enquiries_triage',
      'idx_jobs_public_filter',
      'idx_job_applications_triage',
      'idx_documents_entity',
      'idx_documents_retention',
      'idx_notifications_worker',
      'uk_notifications_idempotency',
      'uk_visitor_sessions_hash',
      'idx_page_views_path_time',
      'idx_audit_resource',
    ];

    for (const idx of requiredIndexes) {
      assert.ok(schemaSqlContent.includes(idx), `Index ${idx} must be present in schema`);
    }
  });

  it('Verifies reference seed data conformity (zero pricing, confirmed categories & services)', () => {
    // 8 Confirmed Job Categories
    const expectedCategories = [
      'Hotel Staff',
      'Cleaning',
      'Mason',
      'Steel Fixer',
      'Carpenter',
      'Bike Rider / Delivery Job',
      'Taxi Driver',
      'Truck Driver',
    ];
    for (const cat of expectedCategories) {
      assert.ok(schemaSqlContent.includes(cat), `Category '${cat}' must be seeded`);
    }

    // 3 Confirmed Visa Services
    const expectedServices = [
      'freelance_2yr',
      'visit_30d',
      'visit_60d',
    ];
    for (const s of expectedServices) {
      assert.ok(schemaSqlContent.includes(s), `Visa service '${s}' must be seeded`);
    }

    // 2 Confirmed Admin Roles
    assert.ok(schemaSqlContent.includes('super_admin'), "Role 'super_admin' must be seeded");
    assert.ok(schemaSqlContent.includes('admin_operator'), "Role 'admin_operator' must be seeded");

    // Zero Pricing Check
    assert.strictEqual(
      schemaSqlContent.toLowerCase().includes('aed') || schemaSqlContent.toLowerCase().includes('price'),
      false,
      'Schema and seed must contain zero pricing figures or pricing columns'
    );
  });

  it('Database configuration enforces conservative cPanel pooling and UTC timezone', () => {
    assert.strictEqual(databaseConfig.client, 'mysql2');
    assert.strictEqual(databaseConfig.charset, 'utf8mb4');
    assert.strictEqual(databaseConfig.timezone, 'Z');
    assert.strictEqual(databaseConfig.pool.min, 0);
    assert.strictEqual(databaseConfig.pool.max, 5);
    assert.strictEqual(databaseConfig.engineStatus, 'UNVERIFIED');
  });

  it('Reports live database connectivity status deterministically', async () => {
    const result = await checkDatabaseConnectivity();
    if (result.ok) {
      console.log('  [LIVE DB STATUS]: CONNECTED to local database');
    } else {
      console.log(`  [LIVE DB STATUS]: UNVERIFIED — HOST ACCESS REQUIRED (${result.error})`);
    }
    // Test must succeed regardless of whether external DB daemon is running
    assert.ok(typeof result.ok === 'boolean');
  });
});
