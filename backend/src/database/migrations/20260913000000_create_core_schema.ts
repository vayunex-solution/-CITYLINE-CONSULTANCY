/**
 * CITYLINE CONSULTANCY — Core Database Schema Migration
 * Defines all 18 production tables across 13 business domains.
 *
 * Engine: ANSI SQL / MySQL 8.x / MariaDB 10.3+ compatible
 * Baseline: InnoDB, utf8mb4, utf8mb4_unicode_ci, UTC timestamps
 */

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Administrative Roles (RBAC Reference)
  await knex.schema.createTable('admin_roles', (table) => {
    table.increments('id').primary();
    table.string('role_key', 50).notNullable().unique();
    table.string('name', 100).notNullable();
    table.string('description', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
  });

  // 2. Administrative Users
  await knex.schema.createTable('admin_users', (table) => {
    table.string('id', 36).primary(); // UUIDv4
    table.integer('role_id').unsigned().notNullable()
      .references('id').inTable('admin_roles').onDelete('RESTRICT').onUpdate('CASCADE');
    table.string('username', 100).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('full_name', 150).notNullable();
    table.boolean('is_active').defaultTo(true).notNullable();
    table.timestamp('last_login_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['role_id'], 'idx_admin_users_role');
  });

  // 3. Job Categories Reference Table
  await knex.schema.createTable('job_categories', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();
    table.string('slug', 100).notNullable().unique();
    table.string('description', 255).nullable();
    table.integer('display_order').defaultTo(0).notNullable();
    table.boolean('is_active').defaultTo(true).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['is_active', 'display_order'], 'idx_job_categories_order');
  });

  // 4. Visa Services Reference Table
  await knex.schema.createTable('visa_services', (table) => {
    table.increments('id').primary();
    table.string('service_code', 50).notNullable().unique();
    table.string('title', 150).notNullable();
    table.string('slug', 150).notNullable().unique();
    table.text('description').nullable();
    table.boolean('is_active').defaultTo(true).notNullable();
    table.integer('display_order').defaultTo(0).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['is_active', 'display_order'], 'idx_visa_services_order');
  });

  // 5. Central Inquiries Table
  await knex.schema.createTable('enquiries', (table) => {
    table.string('id', 36).primary(); // UUIDv4
    table.string('enquiry_type', 50).notNullable(); // 'visa', 'business_setup', 'employer_manpower', 'general_contact', 'other'
    table.string('status', 50).defaultTo('new').notNullable(); // 'new', 'in_progress', 'contacted', 'completed', 'archived'
    table.string('full_name', 150).notNullable();
    table.string('email', 255).notNullable();
    table.string('phone', 50).notNullable();
    table.string('whatsapp', 50).nullable();
    table.string('nationality', 100).nullable();
    table.string('subject', 255).nullable();
    table.text('message').nullable();
    table.string('source_channel', 50).defaultTo('website').notNullable();
    table.string('assigned_admin_id', 36).nullable()
      .references('id').inTable('admin_users').onDelete('SET NULL').onUpdate('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('deleted_at').nullable(); // Soft delete

    table.index(['enquiry_type', 'status', 'created_at'], 'idx_enquiries_triage');
    table.index(['email'], 'idx_enquiries_email');
    table.index(['phone'], 'idx_enquiries_phone');
    table.index(['assigned_admin_id'], 'idx_enquiries_assigned');
  });

  // 6. Visa Inquiries Detail Table (Normalized 1-to-1)
  await knex.schema.createTable('visa_enquiries', (table) => {
    table.string('id', 36).primary();
    table.string('enquiry_id', 36).notNullable().unique()
      .references('id').inTable('enquiries').onDelete('CASCADE').onUpdate('CASCADE');
    table.integer('visa_service_id').unsigned().notNullable()
      .references('id').inTable('visa_services').onDelete('RESTRICT').onUpdate('CASCADE');
    table.date('intended_travel_date').nullable();
    table.integer('duration_days').nullable();
    table.integer('applicant_count').defaultTo(1).notNullable();
    table.text('notes').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['visa_service_id'], 'idx_visa_enquiries_service');
  });

  // 7. Business Setup Inquiries Detail Table
  await knex.schema.createTable('business_setup_enquiries', (table) => {
    table.string('id', 36).primary();
    table.string('enquiry_id', 36).notNullable().unique()
      .references('id').inTable('enquiries').onDelete('CASCADE').onUpdate('CASCADE');
    table.string('preferred_jurisdiction', 100).nullable(); // Mainland, Free Zone, Offshore
    table.string('activity_type', 255).nullable();
    table.integer('shareholders_count').nullable();
    table.integer('visa_quota_needed').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
  });

  // 8. Reusable Corporate Employers Table
  await knex.schema.createTable('employers', (table) => {
    table.string('id', 36).primary();
    table.string('company_name', 255).notNullable();
    table.string('trade_license_number', 100).nullable();
    table.string('trn', 100).nullable();
    table.string('industry', 100).notNullable();
    table.string('contact_person', 150).notNullable();
    table.string('email', 255).notNullable();
    table.string('phone', 50).notNullable();
    table.string('whatsapp', 50).nullable();
    table.string('city', 100).defaultTo('Dubai').notNullable();
    table.text('address').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['company_name'], 'idx_employers_company');
    table.index(['email'], 'idx_employers_email');
    table.index(['phone'], 'idx_employers_phone');
  });

  // 9. Manpower Inquiries Table
  await knex.schema.createTable('manpower_enquiries', (table) => {
    table.string('id', 36).primary();
    table.string('enquiry_id', 36).notNullable().unique()
      .references('id').inTable('enquiries').onDelete('CASCADE').onUpdate('CASCADE');
    table.string('employer_id', 36).nullable()
      .references('id').inTable('employers').onDelete('SET NULL').onUpdate('CASCADE');
    table.string('status', 50).defaultTo('new').notNullable();
    table.integer('total_headcount').defaultTo(1).notNullable();
    table.string('deployment_location', 150).nullable();
    table.text('special_requirements').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['employer_id'], 'idx_manpower_employer');
    table.index(['status'], 'idx_manpower_status');
  });

  // 10. Multi-Role Positions Breakdown per Manpower Inquiry
  await knex.schema.createTable('manpower_enquiry_positions', (table) => {
    table.increments('id').primary();
    table.string('manpower_enquiry_id', 36).notNullable()
      .references('id').inTable('manpower_enquiries').onDelete('CASCADE').onUpdate('CASCADE');
    table.integer('job_category_id').unsigned().nullable()
      .references('id').inTable('job_categories').onDelete('SET NULL').onUpdate('CASCADE');
    table.string('role_title', 150).notNullable();
    table.integer('headcount').defaultTo(1).notNullable();
    table.integer('experience_years_required').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['manpower_enquiry_id'], 'idx_mep_enquiry');
    table.index(['job_category_id'], 'idx_mep_category');
  });

  // 11. Career Vacancies Table
  await knex.schema.createTable('jobs', (table) => {
    table.string('id', 36).primary();
    table.integer('category_id').unsigned().notNullable()
      .references('id').inTable('job_categories').onDelete('RESTRICT').onUpdate('CASCADE');
    table.string('title', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.string('location', 100).defaultTo('Dubai, UAE').notNullable();
    table.string('employment_type', 50).defaultTo('Full-time').notNullable();
    table.text('description').notNullable();
    table.text('requirements').notNullable();
    table.string('status', 50).defaultTo('draft').notNullable(); // 'draft', 'active', 'paused', 'closed', 'archived'
    table.boolean('is_featured').defaultTo(false).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('deleted_at').nullable(); // Soft delete preserves application links

    table.index(['status', 'is_featured', 'created_at'], 'idx_jobs_public_filter');
    table.index(['category_id', 'status', 'created_at'], 'idx_jobs_category_status');
  });

  // 12. Job Candidate Applications Table
  await knex.schema.createTable('job_applications', (table) => {
    table.string('id', 36).primary();
    table.string('job_id', 36).notNullable()
      .references('id').inTable('jobs').onDelete('RESTRICT').onUpdate('CASCADE');
    table.string('applicant_name', 150).notNullable();
    table.string('email', 255).notNullable();
    table.string('phone', 50).notNullable();
    table.string('whatsapp', 50).nullable();
    table.string('nationality', 100).notNullable();
    table.string('current_location', 100).notNullable();
    table.integer('years_experience').defaultTo(0).notNullable();
    table.string('status', 50).defaultTo('new').notNullable(); // 'new', 'reviewed', 'shortlisted', 'rejected', 'hired'
    table.text('admin_notes').nullable();
    table.string('source_channel', 50).defaultTo('website').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('deleted_at').nullable();

    table.index(['job_id', 'status', 'created_at'], 'idx_job_applications_triage');
    table.index(['email'], 'idx_job_applications_email');
    table.index(['phone'], 'idx_job_applications_phone');
  });

  // 13. Centralized Document Metadata Table (Storage in ~/clc_storage/)
  await knex.schema.createTable('documents', (table) => {
    table.string('id', 36).primary();
    table.string('entity_type', 50).notNullable(); // 'enquiry', 'job_application', 'testimonial', 'employer'
    table.string('entity_id', 36).notNullable();
    table.string('document_category', 50).notNullable(); // 'resume', 'passport_copy', 'national_id', 'photo', 'trade_license', 'other'
    table.string('original_filename', 255).notNullable();
    table.string('storage_key', 255).notNullable().unique(); // Relative key in ~/clc_storage/
    table.string('mime_type', 100).notNullable();
    table.string('file_extension', 10).notNullable();
    table.bigInteger('file_size_bytes').unsigned().notNullable();
    table.string('sha256_hash', 64).notNullable();
    table.string('validation_status', 50).defaultTo('pending').notNullable(); // 'pending', 'valid', 'invalid'
    table.string('malware_scan_status', 50).defaultTo('pending').notNullable(); // 'pending', 'clean', 'infected', 'skipped'
    table.string('retention_status', 50).defaultTo('active').notNullable(); // 'active', 'processing', 'completed', 'retention', 'purged'
    table.timestamp('retention_expires_at').nullable();
    table.timestamp('purged_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['entity_type', 'entity_id'], 'idx_documents_entity');
    table.index(['retention_status', 'retention_expires_at'], 'idx_documents_retention');
    table.index(['sha256_hash'], 'idx_documents_hash');
  });

  // 14. Testimonials Curation Table
  await knex.schema.createTable('testimonials', (table) => {
    table.increments('id').primary();
    table.string('client_name', 150).notNullable();
    table.string('client_designation', 150).nullable();
    table.string('client_location', 150).nullable();
    table.text('testimonial_text').notNullable();
    table.tinyint('rating').unsigned().nullable(); // 1-5, nullable pending business approval
    table.string('document_id', 36).nullable()
      .references('id').inTable('documents').onDelete('SET NULL').onUpdate('CASCADE');
    table.integer('display_order').defaultTo(0).notNullable();
    table.boolean('is_published').defaultTo(false).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('deleted_at').nullable();

    table.index(['is_published', 'display_order'], 'idx_testimonials_publish');
    table.index(['document_id'], 'idx_testimonials_doc');
  });

  // 15. Transactional Outbox Notification Queue
  await knex.schema.createTable('notification_queue', (table) => {
    table.string('id', 36).primary();
    table.string('notification_type', 50).notNullable(); // 'visa_enquiry', 'job_application', 'employer_manpower', 'contact_form'
    table.string('reference_id', 36).notNullable();
    table.string('recipient_email', 255).notNullable();
    table.string('subject', 255).notNullable();
    table.text('payload_json').notNullable();
    table.string('status', 50).defaultTo('pending').notNullable(); // 'pending', 'processing', 'sent', 'failed', 'exhausted'
    table.integer('retry_count').defaultTo(0).notNullable();
    table.timestamp('next_retry_at').defaultTo(knex.fn.now()).notNullable();
    table.text('last_error').nullable();
    table.timestamp('sent_at').nullable();
    table.string('idempotency_hash', 64).notNullable().unique();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['status', 'next_retry_at'], 'idx_notifications_worker');
    table.index(['reference_id'], 'idx_notifications_reference');
  });

  // 16. Visitor Sessions (First-Party Privacy Analytics)
  await knex.schema.createTable('visitor_sessions', (table) => {
    table.string('id', 36).primary();
    table.string('session_hash', 64).notNullable().unique(); // Daily-salted SHA-256
    table.string('device_category', 50).nullable(); // 'mobile', 'desktop', 'tablet'
    table.string('browser', 100).nullable();
    table.string('os', 100).nullable();
    table.string('country_code', 2).nullable();
    table.string('referrer_source', 255).nullable();
    table.timestamp('first_seen_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('last_seen_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['first_seen_at'], 'idx_visitor_sessions_time');
    table.index(['country_code'], 'idx_visitor_sessions_country');
  });

  // 17. Page Views & Interactions
  await knex.schema.createTable('page_views', (table) => {
    table.bigIncrements('id').primary();
    table.string('session_id', 36).notNullable()
      .references('id').inTable('visitor_sessions').onDelete('CASCADE').onUpdate('CASCADE');
    table.string('page_path', 255).notNullable();
    table.string('event_name', 100).defaultTo('pageview').notNullable();
    table.integer('duration_seconds').defaultTo(0).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['page_path', 'created_at'], 'idx_page_views_path_time');
    table.index(['session_id'], 'idx_page_views_session');
  });

  // 18. Append-Oriented Administrative Audit Logs
  await knex.schema.createTable('audit_logs', (table) => {
    table.bigIncrements('id').primary();
    table.string('actor_admin_id', 36).nullable()
      .references('id').inTable('admin_users').onDelete('SET NULL').onUpdate('CASCADE');
    table.string('action', 100).notNullable(); // 'login_success', 'view_document', 'purge_document', 'update_job'
    table.string('resource_type', 100).notNullable();
    table.string('resource_id', 100).nullable();
    table.string('request_id', 64).nullable(); // Correlation ID
    table.string('client_ip', 45).nullable();
    table.text('details_json').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['resource_type', 'resource_id'], 'idx_audit_resource');
    table.index(['actor_admin_id', 'created_at'], 'idx_audit_actor_time');
    table.index(['action', 'created_at'], 'idx_audit_action_time');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in strict reverse-dependency order
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('page_views');
  await knex.schema.dropTableIfExists('visitor_sessions');
  await knex.schema.dropTableIfExists('notification_queue');
  await knex.schema.dropTableIfExists('testimonials');
  await knex.schema.dropTableIfExists('documents');
  await knex.schema.dropTableIfExists('job_applications');
  await knex.schema.dropTableIfExists('jobs');
  await knex.schema.dropTableIfExists('manpower_enquiry_positions');
  await knex.schema.dropTableIfExists('manpower_enquiries');
  await knex.schema.dropTableIfExists('employers');
  await knex.schema.dropTableIfExists('business_setup_enquiries');
  await knex.schema.dropTableIfExists('visa_enquiries');
  await knex.schema.dropTableIfExists('enquiries');
  await knex.schema.dropTableIfExists('visa_services');
  await knex.schema.dropTableIfExists('job_categories');
  await knex.schema.dropTableIfExists('admin_users');
  await knex.schema.dropTableIfExists('admin_roles');
}
