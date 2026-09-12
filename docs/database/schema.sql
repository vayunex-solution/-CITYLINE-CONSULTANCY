-- ==============================================================================
-- CITYLINE CONSULTANCY — Authoritative Production Database DDL Schema
-- ==============================================================================
-- Engine: MySQL 8.x / MariaDB 10.3+ / ANSI SQL Relational Baseline
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- Storage Engine: InnoDB
-- Timestamp Handling: UTC (Z)
--
-- Target Deployment: cPanel MySQL / MariaDB via phpMyAdmin or MySQL CLI
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ------------------------------------------------------------------------------
-- 1. Administrative Roles (RBAC Reference)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `admin_roles`;
CREATE TABLE `admin_roles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role_key` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_admin_roles_key` (`role_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Administrative Users
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `admin_users`;
CREATE TABLE `admin_users` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `role_id` INT UNSIGNED NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_admin_users_username` (`username`),
  UNIQUE KEY `uk_admin_users_email` (`email`),
  KEY `idx_admin_users_role` (`role_id`),
  CONSTRAINT `fk_admin_users_role` FOREIGN KEY (`role_id`) REFERENCES `admin_roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Job Categories Reference Table
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `job_categories`;
CREATE TABLE `job_categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_job_categories_name` (`name`),
  UNIQUE KEY `uk_job_categories_slug` (`slug`),
  KEY `idx_job_categories_order` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Visa Services Reference Table
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `visa_services`;
CREATE TABLE `visa_services` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `service_code` VARCHAR(50) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_visa_services_code` (`service_code`),
  UNIQUE KEY `uk_visa_services_slug` (`slug`),
  KEY `idx_visa_services_order` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Central Inquiries Table
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `enquiries`;
CREATE TABLE `enquiries` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `enquiry_type` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'new',
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `whatsapp` VARCHAR(50) NULL,
  `nationality` VARCHAR(100) NULL,
  `subject` VARCHAR(255) NULL,
  `message` TEXT NULL,
  `source_channel` VARCHAR(50) NOT NULL DEFAULT 'website',
  `assigned_admin_id` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  KEY `idx_enquiries_triage` (`enquiry_type`, `status`, `created_at`),
  KEY `idx_enquiries_email` (`email`),
  KEY `idx_enquiries_phone` (`phone`),
  KEY `idx_enquiries_assigned` (`assigned_admin_id`),
  CONSTRAINT `fk_enquiries_admin` FOREIGN KEY (`assigned_admin_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Visa Inquiries Detail Table (Normalized 1-to-1)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `visa_enquiries`;
CREATE TABLE `visa_enquiries` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `enquiry_id` CHAR(36) NOT NULL,
  `visa_service_id` INT UNSIGNED NOT NULL,
  `intended_travel_date` DATE NULL DEFAULT NULL,
  `duration_days` INT NULL DEFAULT NULL,
  `applicant_count` INT NOT NULL DEFAULT 1,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_visa_enquiries_enquiry` (`enquiry_id`),
  KEY `idx_visa_enquiries_service` (`visa_service_id`),
  CONSTRAINT `fk_visa_enquiries_enquiry` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_visa_enquiries_service` FOREIGN KEY (`visa_service_id`) REFERENCES `visa_services` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Business Setup Inquiries Detail Table
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `business_setup_enquiries`;
CREATE TABLE `business_setup_enquiries` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `enquiry_id` CHAR(36) NOT NULL,
  `preferred_jurisdiction` VARCHAR(100) NULL,
  `activity_type` VARCHAR(255) NULL,
  `shareholders_count` INT NULL DEFAULT NULL,
  `visa_quota_needed` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_business_setup_enquiry` (`enquiry_id`),
  CONSTRAINT `fk_business_setup_enquiry` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Reusable Corporate Employers Table
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `employers`;
CREATE TABLE `employers` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `company_name` VARCHAR(255) NOT NULL,
  `trade_license_number` VARCHAR(100) NULL,
  `trn` VARCHAR(100) NULL,
  `industry` VARCHAR(100) NOT NULL,
  `contact_person` VARCHAR(150) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `whatsapp` VARCHAR(50) NULL,
  `city` VARCHAR(100) NOT NULL DEFAULT 'Dubai',
  `address` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_employers_company` (`company_name`),
  KEY `idx_employers_email` (`email`),
  KEY `idx_employers_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Manpower Inquiries Table
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `manpower_enquiries`;
CREATE TABLE `manpower_enquiries` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `enquiry_id` CHAR(36) NOT NULL,
  `employer_id` CHAR(36) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'new',
  `total_headcount` INT NOT NULL DEFAULT 1,
  `deployment_location` VARCHAR(150) NULL,
  `special_requirements` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_manpower_enquiries_enquiry` (`enquiry_id`),
  KEY `idx_manpower_employer` (`employer_id`),
  KEY `idx_manpower_status` (`status`),
  CONSTRAINT `fk_manpower_enquiries_enquiry` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_manpower_enquiries_employer` FOREIGN KEY (`employer_id`) REFERENCES `employers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. Multi-Role Positions Breakdown per Manpower Inquiry
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `manpower_enquiry_positions`;
CREATE TABLE `manpower_enquiry_positions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `manpower_enquiry_id` CHAR(36) NOT NULL,
  `job_category_id` INT UNSIGNED NULL,
  `role_title` VARCHAR(150) NOT NULL,
  `headcount` INT NOT NULL DEFAULT 1,
  `experience_years_required` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_mep_enquiry` (`manpower_enquiry_id`),
  KEY `idx_mep_category` (`job_category_id`),
  CONSTRAINT `fk_mep_enquiry` FOREIGN KEY (`manpower_enquiry_id`) REFERENCES `manpower_enquiries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mep_category` FOREIGN KEY (`job_category_id`) REFERENCES `job_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. Career Vacancies Table
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `category_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `location` VARCHAR(100) NOT NULL DEFAULT 'Dubai, UAE',
  `employment_type` VARCHAR(50) NOT NULL DEFAULT 'Full-time',
  `description` TEXT NOT NULL,
  `requirements` TEXT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'draft',
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY `uk_jobs_slug` (`slug`),
  KEY `idx_jobs_public_filter` (`status`, `is_featured`, `created_at`),
  KEY `idx_jobs_category` (`category_id`),
  CONSTRAINT `fk_jobs_category` FOREIGN KEY (`category_id`) REFERENCES `job_categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. Job Candidate Applications Table
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `job_applications`;
CREATE TABLE `job_applications` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `job_id` CHAR(36) NOT NULL,
  `applicant_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `whatsapp` VARCHAR(50) NULL,
  `nationality` VARCHAR(100) NOT NULL,
  `current_location` VARCHAR(100) NOT NULL,
  `years_experience` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'new',
  `admin_notes` TEXT NULL,
  `source_channel` VARCHAR(50) NOT NULL DEFAULT 'website',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  KEY `idx_job_applications_triage` (`job_id`, `status`, `created_at`),
  KEY `idx_job_applications_email` (`email`),
  KEY `idx_job_applications_phone` (`phone`),
  CONSTRAINT `fk_job_applications_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. Centralized Document Metadata Table (Storage in ~/clc_storage/)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` CHAR(36) NOT NULL,
  `document_category` VARCHAR(50) NOT NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `storage_key` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `file_extension` VARCHAR(10) NOT NULL,
  `file_size_bytes` BIGINT UNSIGNED NOT NULL,
  `sha256_hash` CHAR(64) NOT NULL,
  `validation_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `malware_scan_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `retention_status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `retention_expires_at` TIMESTAMP NULL DEFAULT NULL,
  `purged_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_documents_key` (`storage_key`),
  KEY `idx_documents_entity` (`entity_type`, `entity_id`),
  KEY `idx_documents_retention` (`retention_status`, `retention_expires_at`),
  KEY `idx_documents_hash` (`sha256_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. Testimonials Curation Table
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `testimonials`;
CREATE TABLE `testimonials` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `client_name` VARCHAR(150) NOT NULL,
  `client_designation` VARCHAR(150) NULL,
  `client_location` VARCHAR(150) NULL,
  `testimonial_text` TEXT NOT NULL,
  `rating` TINYINT UNSIGNED NULL,
  `document_id` CHAR(36) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_published` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  KEY `idx_testimonials_publish` (`is_published`, `display_order`),
  KEY `idx_testimonials_doc` (`document_id`),
  CONSTRAINT `fk_testimonials_doc` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 15. Transactional Outbox Notification Queue
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `notification_queue`;
CREATE TABLE `notification_queue` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `notification_type` VARCHAR(50) NOT NULL,
  `reference_id` CHAR(36) NOT NULL,
  `recipient_email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `payload_json` TEXT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `retry_count` INT NOT NULL DEFAULT 0,
  `next_retry_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_error` TEXT NULL,
  `sent_at` TIMESTAMP NULL DEFAULT NULL,
  `idempotency_hash` CHAR(64) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_notifications_idempotency` (`idempotency_hash`),
  KEY `idx_notifications_worker` (`status`, `next_retry_at`),
  KEY `idx_notifications_reference` (`reference_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 16. Visitor Sessions (First-Party Privacy Analytics)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `visitor_sessions`;
CREATE TABLE `visitor_sessions` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `session_hash` CHAR(64) NOT NULL,
  `device_category` VARCHAR(50) NULL,
  `browser` VARCHAR(100) NULL,
  `os` VARCHAR(100) NULL,
  `country_code` CHAR(2) NULL,
  `referrer_source` VARCHAR(255) NULL,
  `first_seen_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_visitor_sessions_hash` (`session_hash`),
  KEY `idx_visitor_sessions_time` (`first_seen_at`),
  KEY `idx_visitor_sessions_country` (`country_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 17. Page Views & Interactions
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `page_views`;
CREATE TABLE `page_views` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `session_id` CHAR(36) NOT NULL,
  `page_path` VARCHAR(255) NOT NULL,
  `event_name` VARCHAR(100) NOT NULL DEFAULT 'pageview',
  `duration_seconds` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_page_views_path_time` (`page_path`, `created_at`),
  KEY `idx_page_views_session` (`session_id`),
  CONSTRAINT `fk_page_views_session` FOREIGN KEY (`session_id`) REFERENCES `visitor_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 18. Append-Oriented Administrative Audit Logs
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `actor_admin_id` CHAR(36) NULL,
  `action` VARCHAR(100) NOT NULL,
  `resource_type` VARCHAR(100) NOT NULL,
  `resource_id` VARCHAR(100) NULL,
  `request_id` VARCHAR(64) NULL,
  `client_ip` VARCHAR(45) NULL,
  `details_json` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_audit_resource` (`resource_type`, `resource_id`),
  KEY `idx_audit_actor_time` (`actor_admin_id`, `created_at`),
  KEY `idx_audit_action_time` (`action`, `created_at`),
  CONSTRAINT `fk_audit_admin` FOREIGN KEY (`actor_admin_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- REFERENCE DATA SEEDING (Idempotent)
-- ==============================================================================

-- Admin Roles
INSERT INTO `admin_roles` (`id`, `role_key`, `name`, `description`) VALUES
(1, 'super_admin', 'Super Administrator', 'Complete system governance, security policies, purge authority, and admin management.'),
(2, 'admin_operator', 'Administrative Operator', 'Operational lead triage, candidate review, job vacancy editing, and document viewing.')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`);

-- Job Categories (8 Confirmed Verticals)
INSERT INTO `job_categories` (`id`, `name`, `slug`, `display_order`) VALUES
(1, 'Hotel Staff', 'hotel-staff', 1),
(2, 'Cleaning', 'cleaning', 2),
(3, 'Mason', 'mason', 3),
(4, 'Steel Fixer', 'steel-fixer', 4),
(5, 'Carpenter', 'carpenter', 5),
(6, 'Bike Rider / Delivery Job', 'bike-rider-delivery', 6),
(7, 'Taxi Driver', 'taxi-driver', 7),
(8, 'Truck Driver', 'truck-driver', 8)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `display_order` = VALUES(`display_order`);

-- Visa Services (3 Confirmed Services — Zero Pricing)
INSERT INTO `visa_services` (`id`, `service_code`, `title`, `slug`, `description`, `display_order`) VALUES
(1, 'freelance_2yr', '2-Year Freelance Visa Dubai Assistance', '2-year-freelance-visa', 'Comprehensive assistance for the 2-Year UAE Freelance Residency Visa.', 1),
(2, 'visit_30d', '30-Day Visit Visa', '30-day-visit-visa', 'Short-term UAE single entry tourist and visit visa assistance.', 2),
(3, 'visit_60d', '60-Day Visit Visa', '60-day-visit-visa', 'Extended UAE tourist and visit visa assistance.', 3)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `description` = VALUES(`description`), `display_order` = VALUES(`display_order`);

SET FOREIGN_KEY_CHECKS = 1;
