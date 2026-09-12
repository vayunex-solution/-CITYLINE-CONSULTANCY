# CITYLINE CONSULTANCY — Database Architecture Specification

**Document Version:** 2.0.0  
**Phase Status:** Phase 2 Implementation  
**Public Brand Name:** `CITYLINE CONSULTANCY` (Zero legal suffixes in public brand assets)

---

## 1. Executive Summary & Engine Status

This document defines the authoritative relational database architecture for **CITYLINE CONSULTANCY**. The schema models all 13 core business domains across 18 normalized, indexed, and constraint-enforced tables.

### Database Engine Status:
- **Production Status**: `UNVERIFIED — HOST ACCESS REQUIRED` (Pending direct cPanel host inspection).
- **Target Specification**: ANSI SQL-92/2003 compatible, optimized for MySQL 8.x and MariaDB 10.3+.
- **Default Storage Engine**: `InnoDB` (ACID transactions, foreign key enforcement, row-level locking).
- **Character Set & Collation**: `utf8mb4` with `utf8mb4_unicode_ci` (full multilingual support, emoji compatibility, standard casing).
- **Timezone**: UTC (`+00:00` / `Z`), consistent across all timestamps.

---

## 2. Architecture Decision Records (ADRs)

### ADR-DB-01: Migration & Query Tooling Selection
- **Context**: The deployment target is shared or managed cPanel hosting with Phusion Passenger. Heavy ORMs (such as Prisma) introduce native binary compilation dependencies (`libssl`, binary query engines) that frequently fail under restricted CloudLinux / cPanel environments.
- **Decision**: Adopt **Knex.js** with the **`mysql2`** pure JavaScript driver.
- **Rationale**:
  1. `mysql2` is 100% pure JavaScript with zero native C++ build requirements.
  2. Knex manages deterministic migration and lock tracking tables (`knex_migrations`, `knex_migrations_lock`).
  3. Low runtime memory footprint (critical for shared cPanel memory limits).
  4. Provides parameterized query building to guarantee SQL injection defense in future phases.
  5. Paired with a standalone SQL schema (`docs/database/schema.sql`) for direct phpMyAdmin import.

### ADR-DB-02: Primary Key Strategy (Hybrid UUID & BIGINT)
- **Context**: Exposing auto-incrementing sequential IDs on public APIs creates enumeration vulnerabilities (e.g. competitors scraping lead volumes or applicant totals). Conversely, high-volume internal logs benefit from compact B-tree sequential indexing.
- **Decision**:
  - **Business / Public Entities** (`enquiries`, `jobs`, `job_applications`, `documents`, `employers`, `manpower_enquiries`, `notification_queue`, `visitor_sessions`): Use `CHAR(36)` **UUIDv4**.
  - **Reference & High-Frequency Append Logs** (`job_categories`, `visa_services`, `admin_roles`, `testimonials`, `page_views`, `audit_logs`): Use `INT` / `BIGINT` auto-increment.
- **Benefits**: Eliminates ID guessing on public endpoints while maintaining optimal B-tree performance for internal logging.

### ADR-DB-03: Private Storage Object Key Abstraction
- **Context**: Uploaded applicant CVs and identity documents reside in private host storage (`~/clc_storage/`). Storing raw absolute OS file paths in the database violates portability and security boundaries.
- **Decision**: Store a relative `storage_key` (e.g., `resumes/2026/09/app_uuid_cv.pdf`) in the `documents` table, never an absolute operating system path. The application layer resolves this key against `STORAGE_ROOT`.

---

## 3. Complete Table Inventory (18 Tables Across 13 Domains)

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

## 4. Indexing & Query Optimization Strategy

Indexes are created deliberately based on expected query access patterns:

1. **`enquiries`**:
   - `idx_enquiries_triage` (`enquiry_type`, `status`, `created_at`): Accelerates admin panel triage filtering.
   - `idx_enquiries_email` (`email`) & `idx_enquiries_phone` (`phone`): High-speed customer search and duplicate detection.
2. **`jobs`**:
   - `idx_jobs_public_filter` (`status`, `is_featured`, `created_at`): Sub-millisecond filtering for active public job board listings.
   - `uk_jobs_slug` (`slug`): Instant unique route resolution (`/jobs/:slug`).
3. **`job_applications`**:
   - `idx_job_applications_triage` (`job_id`, `status`, `created_at`): Rapid candidate filtering per job vacancy.
4. **`documents`**:
   - `idx_documents_entity` (`entity_type`, `entity_id`): Instant retrieval of attached documents for any entity.
   - `idx_documents_retention` (`retention_status`, `retention_expires_at`): High-efficiency polling for the document retention purge worker.
5. **`notification_queue`**:
   - `idx_notifications_worker` (`status`, `next_retry_at`): Optimal polling for the background cron outbox dispatcher.
6. **`page_views`**:
   - `idx_page_views_path_time` (`page_path`, `created_at`): Rapid aggregation of page traffic over specified time windows.
7. **`audit_logs`**:
   - `idx_audit_resource` (`resource_type`, `resource_id`): Trace audit history for specific business records.
   - `idx_audit_actor_time` (`actor_admin_id`, `created_at`): Admin user accountability audits.

---

## 5. Document Lifecycle & Retention Strategy

In accordance with Phase 0 security requirements, uploaded candidate and customer documents follow a strict retention lifecycle:

```
[Upload & Staging] -> [Active Review] -> [Completed / Closed] -> [Retention Window] -> [Secure Physical Purge]
```

1. **Active**: File uploaded and undergoing active triage/review.
2. **Processing**: Application/visa in formal processing with relevant authorities.
3. **Completed**: Case closed (visa issued, candidate hired, or rejected).
4. **Retention**: File enters mandatory retention period (`retention_expires_at` populated).
5. **Purged**: Physical file securely wiped from `~/clc_storage/`; metadata row updated with `purged_at` timestamp and status `'purged'` to preserve audit trails without retaining PII.

*Note: The exact retention duration (e.g., 90 days vs 1 year) remains an open business policy decision (`OQ-BIZ-06`) tracked in `docs/requirements/OPEN-QUESTIONS.md`.*

---

## 6. Privacy & Sensitive Data Safeguards

- **Zero Plaintext Passwords**: Administrative passwords are stored exclusively as Argon2id / bcrypt hashes.
- **No Raw IP Storage in Analytics**: `visitor_sessions` stores only `session_hash` generated via daily-salted SHA-256 (`SHA256(IP + UserAgent + DailySalt)`), rendering it pseudonymous.
- **Decoupled Private Storage**: Files never reside inside the database or webroot. Only secure storage keys and cryptographic hashes (`sha256_hash`) are stored.

---

## 7. Backup & Disaster Recovery Architecture

1. **Database Backup**: Periodic automated SQL dumps (e.g., `mysqldump` or cPanel daily backup).
2. **Filesystem Backup**: Synchronized backup of `~/clc_storage/`.
3. **Recovery Rule**: Restoring the database without restoring `~/clc_storage/` results in dangling document metadata. Backup schedules for database and filesystem storage must be synchronized.
