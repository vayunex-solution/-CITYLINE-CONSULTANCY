# CITYLINE CONSULTANCY — Database Architecture Specification

**Document Version:** 2.1.0  
**Phase Status:** Phase 2 Consolidated Implementation & Audit  
**Public Brand Name:** `CITYLINE CONSULTANCY` (Strictly zero legal suffixes in public brand assets)

---

## 1. Executive Summary & Engine Discovery

This document defines the authoritative, production-grade relational database architecture for **CITYLINE CONSULTANCY**. The architecture models all 13 core business domains across 18 normalized, constraint-enforced tables.

### 1.1 Verified Production Database Engine
- **Database Engine & Version**: **`10.11.16-MariaDB-cll-lve`** (MariaDB 10.11 LTS on CloudLinux / cPanel environment `s1-nnvp.crazzydns.com`).
- **Engine Discovery**: Live TCP authentication probe confirmed MariaDB 10.11.
- **Storage Engine**: `InnoDB` across all 18 tables (ACID transactions, row-level locking, foreign key referential integrity).
- **Character Set & Collation**:
  - Global Server Default: `latin1` / `latin1_swedish_ci`.
  - Schema Standard: Explicitly enforced `utf8mb4` with collation `utf8mb4_unicode_ci` on every table, column, and connection handshake (`SET NAMES utf8mb4`).
- **Timezone**: All timestamps stored and queried strictly in **UTC** (`+00:00` / `Z`). Node.js database pool specifies `timezone: 'Z'`.
- **Max Connections**: Host configured limit is `151`.

---

## 2. Remote Database Security & Host Evaluation

### 2.1 Network Exposure Audit
- **Reachable Endpoint**: `135.181.217.49:3306` is open and accepts TCP connections.
- **Host SSL Capability**: Direct inspection via `SHOW VARIABLES LIKE 'have_ssl'` returned `DISABLED`.
- **Security Assessment**:
  1. Unencrypted traffic traversing the public internet on port 3306 is vulnerable to inspection.
  2. The database user account `'cityline_admin'@'%'` uses a wildcard host (`%`), allowing connection attempts from any IP.

### 2.2 Security Architecture Recommendations
1. **Production Co-Location**: When the Node.js backend is deployed in cPanel (via Node.js Selector / Phusion Passenger), database traffic **must connect via `127.0.0.1` or UNIX socket (`localhost`)**. This completely eliminates public network exposure.
2. **Narrow Remote Access**: In cPanel -> **Remote MySQL**, the wildcard `%` should be removed and restricted strictly to trusted static IP addresses (or disabled entirely once backend is deployed locally).
3. **Host Controls Status**: `UNVERIFIED — HOST ACCESS REQUIRED` (Host-side firewall, cPanel Remote MySQL ACL, and server-wide SSL certificates require cPanel administrator access).

---

## 3. Database User Privilege Model (Least-Privilege Architecture)

The application user must **never** be granted `ALL PRIVILEGES`. Access is segregated into distinct privilege profiles:

### 3.1 Profile A: Runtime Application User (`clc_app_user`)
- **Required Privileges**: `SELECT`, `INSERT`, `UPDATE`, `DELETE` (DML only).
- **Strictly Prohibited**:
  - `CREATE`, `ALTER`, `DROP`, `TRUNCATE` (No DDL during normal runtime).
  - `CREATE DATABASE`, `DROP DATABASE` (Application never creates or destroys databases).
  - `SUPER`, `FILE`, `GRANT OPTION`, `PROCESS`, `SHUTDOWN` (No administrative rights).
- **Transaction Safety**: Row-level locking (`SELECT ... FOR UPDATE`) operates under standard DML permissions in InnoDB.

### 3.2 Profile B: Migration / Deployment User (`clc_migrator`)
- **Required Privileges**:
  - DML: `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
  - DDL: `CREATE`, `ALTER`, `DROP`, `INDEX`, `REFERENCES`.
- **Scope**: Restricted strictly to the pre-created target database (`cityline_db`).
- **Strictly Prohibited**: `SUPER`, `FILE`, `CREATE DATABASE`, `GRANT OPTION`.

### 3.3 cPanel Single-User Constraint Model
If cPanel hosting enforces a single user assignment per database:
- **cPanel Action**: Assign `cityline_admin` to `cityline_db`.
- **Checked Privileges**: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER`, `DROP`, `INDEX`, `REFERENCES`.
- **Unchecked Privileges**: Do **NOT** grant administrative or database-creation privileges.

---

## 4. Database Creation Boundary

- **Boundary Definition**: The runtime application, Knex migration runner, and diagnostic scripts (`npm run db:test`) **never create databases**.
- **Provisioning Authority**: Database creation belongs exclusively to:
  - cPanel MySQL Databases interface (`MySQL® Databases -> Create New Database`).
  - phpMyAdmin / authorized database administrator.
- Migrations and connection pools operate solely against the existing, designated `DB_NAME`.

---

## 5. Architectural Decision Records (ADRs)

### ADR-DB-01: Driver & Migration Technology Selection
- **Decision**: Adopt **Knex.js** with **`mysql2`** pure JavaScript driver.
- **Rationale**:
  1. `mysql2` requires zero C++ native compilation, ensuring 100% compatibility with restricted cPanel CloudLinux environments.
  2. Knex manages deterministic migration tracking (`knex_migrations`) and concurrent execution locks (`knex_migrations_lock`).
  3. Low runtime memory footprint suitable for shared cPanel memory limits.
  4. Parameterized query construction eliminates SQL injection risks.
  5. Paired with standalone DDL export (`docs/database/schema.sql`) for direct phpMyAdmin import.

### ADR-DB-02: Hybrid Primary Key Strategy
- **Decision**:
  - **Business / Public Entities** (`enquiries`, `jobs`, `job_applications`, `documents`, `employers`, `manpower_enquiries`, `notification_queue`, `visitor_sessions`): `CHAR(36)` **UUIDv4**.
  - **Reference & High-Frequency Append Logs** (`job_categories`, `visa_services`, `admin_roles`, `testimonials`, `page_views`, `audit_logs`): `INT` / `BIGINT` auto-increment.
- **Rationale**: Prevents ID enumeration attacks on public endpoints while maintaining optimal B-tree performance for high-write internal logs.

### ADR-DB-03: Private Storage Reference Abstraction
- **Decision**: Store a relative `storage_key` (e.g. `resumes/2026/09/app_uuid_cv.pdf`) in the `documents` table, never an absolute operating system path.
- **Rationale**: Physical files reside in `~/clc_storage/` (outside webroot). Relative keys maintain host environment portability and prevent filesystem path disclosures.

---

## 6. Complete Table Inventory (18 Tables Across 13 Domains)

| Table Name | Domain | Primary Key | Key Relationships | Description |
| :--- | :--- | :--- | :--- | :--- |
| `admin_roles` | Admin / RBAC | `id` (INT) | Referenced by `admin_users` | System authorization roles (`super_admin`, `admin_operator`). |
| `admin_users` | Admin / RBAC | `id` (UUID) | FK -> `admin_roles` | Back-office administrative operators (secure password hashes). |
| `job_categories` | Careers | `id` (INT) | Referenced by `jobs`, `manpower_enquiry_positions` | Career vertical categories (8 confirmed verticals). |
| `visa_services` | Visa Services | `id` (INT) | Referenced by `visa_enquiries` | Catalog of visa services (3 confirmed services; zero pricing). |
| `enquiries` | Customer Leads | `id` (UUID) | Referenced by detail tables; FK -> `admin_users` | Central lead intake table for all incoming inquiries. |
| `visa_enquiries` | Visa Services | `id` (UUID) | FK -> `enquiries` (1:1), FK -> `visa_services` | Normalized visa details (travel dates, duration, headcount). |
| `business_setup_enquiries`| Business Setup | `id` (UUID) | FK -> `enquiries` (1:1) | UAE company formation details (jurisdiction, activities). |
| `employers` | Recruitment | `id` (UUID) | Referenced by `manpower_enquiries` | Reusable corporate employer master records. |
| `manpower_enquiries` | Recruitment | `id` (UUID) | FK -> `enquiries`, FK -> `employers` | B2B corporate manpower requisitions. |
| `manpower_enquiry_positions`| Recruitment | `id` (INT) | FK -> `manpower_enquiries`, FK -> `job_categories`| Multi-role headcount breakdown per requisition. |
| `jobs` | Careers | `id` (UUID) | FK -> `job_categories`; Referenced by `job_applications`| Public career board job postings (status, description, requirements). |
| `job_applications` | Careers | `id` (UUID) | FK -> `jobs` | Candidate job applications with triage status. |
| `documents` | Private Storage | `id` (UUID) | Polymorphic reference to business entities | Document metadata referencing `~/clc_storage/` files. |
| `testimonials` | Social Proof | `id` (INT) | FK -> `documents` (photo attachment) | Curated social proof entries (order, publication status). |
| `notification_queue` | Notifications | `id` (UUID) | References originating business entity ID | Transactional outbox for asynchronous, reliable email dispatch. |
| `visitor_sessions` | Analytics | `id` (UUID) | Referenced by `page_views` | Privacy-preserving sessions using daily-salted SHA-256 hashes. |
| `page_views` | Analytics | `id` (BIGINT) | FK -> `visitor_sessions` | Lightweight page view and interaction event logging. |
| `audit_logs` | Security / Audit | `id` (BIGINT) | FK -> `admin_users` | Append-oriented administrative activity trail. |

---

## 7. Domain Model Audits & Normalization

### 7.1 Enquiry Model Normalization
- Central `enquiries` table holds common applicant/customer details (`full_name`, `email`, `phone`, `whatsapp`, `nationality`, `subject`, `message`, `source_channel`).
- Specific detail tables (`visa_enquiries`, `business_setup_enquiries`, `manpower_enquiries`) maintain strict **1:1 relationships** enforced via `enquiry_id CHAR(36) NOT NULL UNIQUE`.
- **Benefits**:
  1. No duplicate contact information across sub-tables.
  2. No orphan detail rows (detail tables cascade on enquiry deletion).
  3. No wide catch-all sparse table with dozens of NULL columns.

### 7.2 Visa Services Scope Lock
- Catalog contains strictly the **3 confirmed reference services**:
  1. `2-Year Freelance Visa Dubai` (`freelance_2yr`)
  2. `30-Day Visit Visa` (`visit_30d`)
  3. `60-Day Visit Visa` (`visit_60d`)
- Commercial Governance: **Zero pricing columns, zero fake eligibility claims, zero approval guarantees, zero invented processing times**.

### 7.3 Documents Metadata & Lifecycle
- Documents table stores file metadata only. Binary files reside in `~/clc_storage/`.
- Fields: `id`, `entity_type`, `entity_id`, `document_category`, `original_filename`, `storage_key` (unique), `mime_type`, `file_extension`, `file_size_bytes`, `sha256_hash`, `validation_status`, `malware_scan_status`, `retention_status`, `retention_expires_at`, `purged_at`, timestamps.
- Lifecycle: `active` -> `processing` -> `completed` -> `retention` -> `purged`.
- Purge Action: Physical file wiped from filesystem; metadata row updated with `purged_at = NOW()` and `retention_status = 'purged'`, preserving compliance audit hash without retaining PII.

### 7.4 Jobs & Applications Deletion Safeguards
- Foreign key `job_applications.job_id` -> `jobs.id` uses `ON DELETE RESTRICT`.
- A job vacancy with candidate applications **cannot be deleted**. Vacancies are deactivated via `status = 'archived'` or soft delete (`deleted_at`).
- Seed data contains strictly the 8 confirmed job categories. Zero mock jobs or fake candidate applications.

### 7.5 Employers & Manpower Requisitions
- Corporate client details stored in reusable `employers` table.
- Multi-role headcount requirements are normalized in `manpower_enquiry_positions` (`role_title`, `headcount`, `experience_years_required`, `job_category_id`), avoiding unstructured JSON blobs.

### 7.6 Testimonials Curation
- Public display controlled via `is_published` (default `false`) and `display_order`.
- `rating` is optional (`TINYINT UNSIGNED NULL`), not forced.
- Zero fake testimonial seed rows.

### 7.7 Admin RBAC
- Roles: `super_admin`, `admin_operator` seeded idempotently.
- Password hashes stored in `admin_users.password_hash` (Argon2id / bcrypt). Zero plaintext passwords.
- No admin accounts seeded. Authentication implementation deferred to Phase 4.

### 7.8 Transactional Outbox (Notification Queue)
- Decouples notification creation from external SMTP transport.
- Enforceable idempotency via `UNIQUE KEY uk_notifications_idempotency (idempotency_hash)`.
- Worker polling index: `KEY idx_notifications_worker (status, next_retry_at)`.
- Mailer implementation strictly deferred to Phase 7.

### 7.9 Analytics Privacy Compliance
- `visitor_sessions` stores `session_hash` (daily-salted SHA-256).
- Strictly prohibited: Raw IP addresses, GPS coordinates, canvas fingerprints, keystrokes, PII.
- 90-day retention purge lifecycle.

### 7.10 Append-Oriented Audit Logs
- Records admin activity: `actor_admin_id`, `action`, `resource_type`, `resource_id`, `request_id`, `client_ip`, `details_json`, `created_at`.
- Append-oriented: Zero `updated_at` or `deleted_at` columns.
- Not claimed to be mathematically immutable.

---

## 8. Foreign Key & Referential Integrity Policy Matrix

| Source Table | Column | Target Table | ON DELETE | ON UPDATE | Architectural Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `admin_users` | `role_id` | `admin_roles` | **RESTRICT** | CASCADE | Prevents deleting a role assigned to active operators. |
| `enquiries` | `assigned_admin_id`| `admin_users` | **SET NULL** | CASCADE | Deleting an admin unassigns the lead without deleting the enquiry. |
| `visa_enquiries` | `enquiry_id` | `enquiries` | **CASCADE** | CASCADE | 1:1 detail record is removed if parent enquiry is purged. |
| `visa_enquiries` | `visa_service_id` | `visa_services` | **RESTRICT** | CASCADE | Active visa service catalog items cannot be deleted if referenced. |
| `business_setup_enquiries`| `enquiry_id`| `enquiries` | **CASCADE** | CASCADE | 1:1 detail record is removed if parent enquiry is purged. |
| `manpower_enquiries` | `enquiry_id` | `enquiries` | **CASCADE** | CASCADE | 1:1 detail record is removed if parent enquiry is purged. |
| `manpower_enquiries` | `employer_id` | `employers` | **SET NULL** | CASCADE | Removing an employer profile preserves the historical requisition. |
| `manpower_enquiry_positions`| `manpower_enquiry_id`| `manpower_enquiries`| **CASCADE** | CASCADE | Position breakdowns are removed if requisition is purged. |
| `manpower_enquiry_positions`| `job_category_id` | `job_categories`| **SET NULL** | CASCADE | Removing a job category does not delete position line items. |
| `jobs` | `category_id` | `job_categories` | **RESTRICT** | CASCADE | Job category cannot be deleted if active jobs exist. |
| `job_applications` | `job_id` | `jobs` | **RESTRICT** | CASCADE | **Critical**: Jobs with candidate applications cannot be deleted. |
| `testimonials` | `document_id` | `documents` | **SET NULL** | CASCADE | Purging a photo attachment does not delete the testimonial copy. |
| `page_views` | `session_id` | `visitor_sessions` | **CASCADE** | CASCADE | Page views cascade when a session is purged after 90 days. |
| `audit_logs` | `actor_admin_id` | `admin_users` | **SET NULL** | CASCADE | Removing an admin user preserves all historical audit log entries. |

---

## 9. Comprehensive Index Inventory

| Table | Index Name | Columns | Type | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `admin_roles` | `uk_admin_roles_key` | `role_key` | UNIQUE | Fast role key lookup |
| `admin_users` | `uk_admin_users_username` | `username` | UNIQUE | Login lookup |
| `admin_users` | `uk_admin_users_email` | `email` | UNIQUE | Email deduplication |
| `admin_users` | `idx_admin_users_role` | `role_id` | INDEX | Role membership queries |
| `job_categories` | `uk_job_categories_slug` | `slug` | UNIQUE | Public category routing |
| `job_categories` | `idx_job_categories_order`| `is_active`, `display_order` | INDEX | Category dropdown ordering |
| `visa_services` | `uk_visa_services_slug` | `slug` | UNIQUE | Public visa service routing |
| `visa_services` | `idx_visa_services_order` | `is_active`, `display_order` | INDEX | Service catalog ordering |
| `enquiries` | `idx_enquiries_triage` | `enquiry_type`, `status`, `created_at` | INDEX | Admin panel lead triage |
| `enquiries` | `idx_enquiries_email` | `email` | INDEX | Applicant deduplication |
| `enquiries` | `idx_enquiries_phone` | `phone` | INDEX | Contact lookup |
| `enquiries` | `idx_enquiries_assigned` | `assigned_admin_id` | INDEX | Operator assignment filter |
| `jobs` | `uk_jobs_slug` | `slug` | UNIQUE | Career detail routing |
| `jobs` | `idx_jobs_public_filter` | `status`, `is_featured`, `created_at` | INDEX | Public job board listing |
| `jobs` | `idx_jobs_category_status` | `category_id`, `status`, `created_at` | INDEX | Category job board filtering |
| `job_applications` | `idx_job_applications_triage`| `job_id`, `status`, `created_at` | INDEX | Candidate application triage |
| `job_applications` | `idx_job_applications_email` | `email` | INDEX | Candidate application lookup |
| `documents` | `uk_documents_key` | `storage_key` | UNIQUE | Storage key deduplication |
| `documents` | `idx_documents_entity` | `entity_type`, `entity_id` | INDEX | Attached document resolution |
| `documents` | `idx_documents_retention` | `retention_status`, `retention_expires_at` | INDEX | Retention worker polling |
| `documents` | `idx_documents_hash` | `sha256_hash` | INDEX | Checksum integrity checks |
| `testimonials` | `idx_testimonials_publish`| `is_published`, `display_order` | INDEX | Curated testimonial display |
| `notification_queue` | `uk_notifications_idempotency`| `idempotency_hash` | UNIQUE | Outbox deduplication |
| `notification_queue` | `idx_notifications_worker` | `status`, `next_retry_at` | INDEX | Dispatcher worker polling |
| `visitor_sessions` | `uk_visitor_sessions_hash` | `session_hash` | UNIQUE | Session resolution |
| `visitor_sessions` | `idx_visitor_sessions_time`| `first_seen_at` | INDEX | Retention purge queries |
| `page_views` | `idx_page_views_path_time` | `page_path`, `created_at` | INDEX | Traffic analytics aggregation |
| `page_views` | `idx_page_views_session` | `session_id` | INDEX | Session interaction joining |
| `audit_logs` | `idx_audit_resource` | `resource_type`, `resource_id` | INDEX | Entity audit history |
| `audit_logs` | `idx_audit_actor_time` | `actor_admin_id`, `created_at` | INDEX | Admin activity audits |
| `audit_logs` | `idx_audit_action_time` | `action`, `created_at` | INDEX | Action frequency audits |

---

## 10. Credential Security Disclosure

> [!WARNING]
> **COMPROMISED CREDENTIAL DISCLOSURE**:
> Any database password previously utilized during command-line discovery commands is treated as **COMPROMISED**.
> The database administrator / account owner must **rotate the database password in cPanel** (`cPanel -> MySQL® Databases -> Set Password`).
> The repository utilizes environment variables exclusively (`.env` / `backend/.env`), which are strictly ignored in `.gitignore`. Zero credentials are tracked in version control.
