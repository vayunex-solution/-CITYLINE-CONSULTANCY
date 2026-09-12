# CITYLINE CONSULTANCY — Database Naming & Schema Conventions

**Document Version:** 1.0.0  
**Phase Status:** Phase 2 Implementation  
**Public Brand Name:** `CITYLINE CONSULTANCY`

---

## 1. Identifier & Casing Standards

All database identifiers (tables, columns, indexes, foreign keys, constraints) must adhere strictly to **`snake_case`**:

- **Tables**: Lowercase plural for entity collections (e.g., `enquiries`, `jobs`, `documents`, `job_applications`, `audit_logs`).
- **Columns**: Lowercase snake_case (e.g., `created_at`, `applicant_name`, `storage_key`).
- **SQL Keywords**: Uppercase in raw SQL scripts (`SELECT`, `INSERT`, `CREATE TABLE`, `ENGINE=InnoDB`).

---

## 2. Primary Key Standards

- **Column Name**: Always `id`.
- **Business Entities**: `CHAR(36)` containing RFC 4122 UUIDv4 strings.
- **Reference & High-Write Log Tables**: `INT UNSIGNED` or `BIGINT UNSIGNED` with `AUTO_INCREMENT`.

---

## 3. Foreign Key & Index Naming Conventions

Foreign key columns and index constraints must follow deterministic prefixes:

- **Foreign Key Columns**: Singular referenced table name + `_id`:
  - `role_id` -> references `admin_roles(id)`
  - `enquiry_id` -> references `enquiries(id)`
  - `job_id` -> references `jobs(id)`
  - `employer_id` -> references `employers(id)`
- **Foreign Key Constraint Names**: `fk_<source_table>_<target_table>` (e.g., `fk_jobs_category`, `fk_visa_enquiries_enquiry`).
- **Unique Constraint Names**: `uk_<table_name>_<column_name>` (e.g., `uk_jobs_slug`, `uk_admin_users_email`).
- **Standard / Composite Index Names**: `idx_<table_name>_<descriptor>` (e.g., `idx_enquiries_triage`, `idx_jobs_public_filter`).

---

## 4. Timestamps & Temporal Integrity

1. **Timezone Baseline**: All timestamps are persisted in **UTC** (`+00:00` / `Z`). The application layer converts timestamps to local UAE time (`Asia/Dubai`, GST, UTC+4) solely for display.
2. **Standard Columns**:
   - `created_at`: `TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`
   - `updated_at`: `TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` (for mutable entities).
   - `deleted_at`: `TIMESTAMP NULL DEFAULT NULL` (strictly for soft-deletable entities).
3. **MariaDB 10.11 Engine Behavior**: MariaDB internally converts `TIMESTAMP` values from the connection timezone to UTC for storage and converts back from UTC to the connection timezone on retrieval. Because the application connection pool specifies `timezone: 'Z'` and SQL initialization executes `SET time_zone = '+00:00'`, all date-time exchanges occur with zero timezone offset, guaranteeing pristine UTC storage and retrieval without drift.
4. **No Mixed Formats**: UNIX epoch integers and local-time datetimes are strictly prohibited.

---

## 5. Status & Enum Lifecycle Standards

- Status columns use controlled strings (`VARCHAR(50)`) rather than rigid MySQL native `ENUM` types.
- **Rationale**: MySQL native `ENUM` requires costly DDL table locks to add new values on large production tables. String columns with application-layer Zod validation and database indexing provide flexibility without schema disruption.
- Standard lifecycle conventions:
  - `enquiries.status`: `'new'`, `'in_progress'`, `'contacted'`, `'completed'`, `'archived'`.
  - `jobs.status`: `'draft'`, `'active'`, `'paused'`, `'closed'`, `'archived'`.
  - `job_applications.status`: `'new'`, `'reviewed'`, `'shortlisted'`, `'rejected'`, `'hired'`.
  - `notification_queue.status`: `'pending'`, `'processing'`, `'sent'`, `'failed'`, `'exhausted'`.
  - `documents.retention_status`: `'active'`, `'processing'`, `'completed'`, `'retention'`, `'purged'`.

---

## 6. Soft Deletion Standards

Soft deletion (`deleted_at`) is applied **only where historical referential integrity is essential**:
- **Allowed**: `jobs` (so historical applications don't point to deleted rows), `job_applications` (to maintain applicant history), `enquiries` (prevent accidental lead loss), `testimonials` (de-list without losing copy).
- **Prohibited**: `audit_logs` (must never be deleted), `notification_queue` (retains dispatch history), `page_views` (historical analytics).
