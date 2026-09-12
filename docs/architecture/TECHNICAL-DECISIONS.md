# CITYLINE CONSULTANCY — Architecture Decision Records (ADRs)

> **Document Status**: Confirmed Baseline  
> **Phase**: Phase 0 — Foundation, Discovery & Scope Lock  
> **Framework**: Michael Nygard ADR Format (Context, Decision, Consequences, Status)

---

## ADR-001: Deployment Topology & Component Separation on cPanel

- **Status**: `PROPOSED (HOST-DEPENDENT DECISION: UNVERIFIED PENDING HOST INSPECTION)`
- **Context**:  
  The target hosting environment is cPanel with an allocated 100 GB disk quota and Node.js application capability managed via Phusion Passenger or CloudLinux Node Selector. Next.js can be deployed either as:
  1. *Unified SSR Next.js App*: Running Next.js server directly in Passenger handling both pages and API routes.
  2. *Decoupled Architecture*: Next.js static export (`output: 'export'`) / hybrid client served via Apache webroot (`public_html/`), communicating with an independent Node.js REST API application running under cPanel Application Manager.
  3. *Standalone Next.js Node Server with Reverse Proxy*: Running Next.js Node server on a loopback port with Apache `.htaccess` reverse proxy rules.
- **Decision**:  
  Adopt the **Decoupled Service Model** as the primary recommendation:
  - `frontend/`: Next.js application delivering static export / pre-rendered public marketing pages and client-side admin portal deployed to `public_html/`.
  - `backend/`: Dedicated Node.js (Express/Fastify) REST API engine managing authentication, relational transactions, binary file upload/streaming, and SMTP queue workers.
  - *Verification Gate*: The final operational mode remains **UNVERIFIED** until the physical cPanel hosting environment is inspected (evaluating CloudLinux memory ceilings and Passenger stability).
- **Consequences & Rationale**:  
  - *Reliability*: If an unhandled exception or memory spike occurs during heavy multipart file uploads, it impacts only the Node.js API process without bringing down the public marketing website.
  - *cPanel Compatibility*: Passenger handles pure Express/Node.js REST APIs with high stability, whereas full Next.js SSR servers often encounter cold-start latency, memory exhaustion, and build quirks on shared cPanel environments.
  - *Security*: The backend API process controls the private disk directory directly, enforcing clear authorization boundaries.

---

## ADR-002: Private Local Storage on Hosting vs Cloud Object Storage

- **Status**: `CONFIRMED`
- **Context**:  
  Visa applicants submit sensitive identity documents (passports, national IDs, photos), and job candidates submit CVs. The client has an available 100 GB hosting allocation on cPanel.
- **Decision**:  
  Store all documents locally within a private directory located **outside the webroot** (`/home/<user>/clc_storage/`), completely bypassing public HTTP access. Zero third-party cloud buckets (e.g., AWS S3, Cloudflare R2) will be introduced in the current scope.
- **Consequences & Rationale**:  
  - *Cost Efficiency*: Zero additional cloud storage or egress billing; 100 GB is ample for tens of thousands of PDF/JPEG records under strict 10 MB caps.
  - *Security*: Eliminates cloud credential leakage risks and misconfigured S3 bucket permissions. All access is governed strictly by the internal Node.js authorization middleware.

---

## ADR-003: Database-First Notification Queue & Cron Dispatcher Pattern

- **Status**: `CONFIRMED`
- **Context**:  
  Email delivery over SMTP on shared hosting environments is vulnerable to transient network timeouts, rate limits, or mail server maintenance. If application persistence is coupled to SMTP execution, a mail server hiccup causes lead loss and throws 500 errors to prospective clients.
- **Decision**:  
  Enforce a **Database-First Notification Queue Pattern (Transactional Outbox)**:
  1. Form submission initiates an atomic database transaction.
  2. Lead data and document metadata are committed to the database first.
  3. A pending notification record is created in `notification_queue` with an `idempotency_hash`.
  4. The database transaction is committed, guaranteeing persistence, and a 200/201 response is returned to the client.
  5. A decoupled cron-based worker or background scheduler picks up pending/failed notifications and attempts SMTP dispatch.
  6. The queue maintains: `status` (`pending`, `sent`, `failed`, `exhausted`), `retry_count`, `next_retry_at` (exponential backoff), `last_error`, and `sent_at`.
- **Consequences & Rationale**:  
  - *Zero Lead Loss*: SMTP failure can NEVER roll back, corrupt, or delete an enquiry or job application.
  - *Idempotency*: Prevents duplicate email dispatches during retries.
  - Submissions remain 100% accessible to administrators in the Admin Panel even during total mail server blackouts.

---

## ADR-004: Dynamic Database-Driven Job Categories

- **Status**: `CONFIRMED`
- **Context**:  
  The business currently supplies 8 job categories (Hotel Staff, Cleaning, Mason, Steel Fixer, Carpenter, Bike Rider, Taxi Driver, Truck Driver). However, business operations will expand into additional commercial and industrial sectors.
- **Decision**:  
  Model job categories as an independent, dynamic database entity (`job_categories`) linked to `jobs` via foreign key relationship, backed by full CRUD capabilities in the Admin Panel.
- **Consequences & Rationale**:  
  - Prevents hardcoded enums or code redeployments when the business adds new recruitment disciplines.
  - Enables instant category filtering updates across the public job board.

---

## ADR-005: Form Submission User Experience Architecture

- **Status**: `PROPOSED`
- **Context**:  
  The platform requires multiple submission flows: Visa Enquiry, Job Application, and Employer Manpower Requisition.
- **Decision**:  
  Implement a **Hybrid Interaction Pattern**:
  - *Visa Enquiry*: Accessible as both a standalone deep-linkable route (`/visa-enquiry`) and as an interactive, multi-step stepper modal from any visa service subpage.
  - *Job Application*: Embedded directly within the Job Detail page (`/jobs/:slug`) as an expandable application drawer/form to maintain role context.
  - *Employer Requisition*: High-visibility dedicated section on `/recruitment` and deep-linkable `/recruitment/hire`.
- **Consequences & Rationale**:  
  - Maximizes ad conversion and social sharing while eliminating cognitive friction for browsing users.

---

## ADR-006: First-Party Privacy-Preserving Analytics Engine

- **Status**: `CONFIRMED`
- **Context**:  
  The client requires visibility into traffic volume, top pages, referrers, and conversion rates without invasive surveillance or GDPR/UAE Data Protection non-compliance.
- **Decision**:  
  Build a lightweight, first-party analytics collector into the Node.js backend:
  - Ephemeral daily-salted IP hashing (`SHA256(IP + daily_salt)`).
  - Explicitly classified as **pseudonymous processing** (not anonymous) with appropriate privacy notice.
  - No persistent tracking cookies or third-party ad scripts.
  - Storage in optimized database tables (`visitor_sessions`, `page_views`).
- **Consequences & Rationale**:  
  - Preserves site performance and eliminates third-party script bloat.
  - 100% compliant with privacy regulations while satisfying executive intelligence needs.

---

## ADR-007: Repository Architecture & Monorepo Structure

- **Status**: `PROPOSED (CTO AUDIT REQUIRED)`
- **Context**:  
  Need to maintain clear separation of concerns between frontend, backend, documentation, and shared contracts while ensuring streamlined deployment onto cPanel.
- **Decision**:  
  Adopt a modular Monorepo layout:
  ```
  / (Repository Root)
  ├── frontend/       <-- Next.js application (Public Web & Admin Interface)
  ├── backend/        <-- Node.js REST API, Auth, Storage, SMTP Engine
  ├── shared/         <-- Shared TypeScript interfaces, DTOs, and validation schemas
  └── docs/           <-- Architectural, security, and project governance documentation
  ```
- **Consequences & Rationale**:  
  - Eliminates type drift between frontend forms and backend validation endpoints.
  - Enables single git repository management while supporting independent deployment scripts for cPanel.

---

## ADR-008: Production Database Engine Decision Gate

- **Status**: `OPEN / UNVERIFIED`
- **Context**:  
  The exact database management system running on the target cPanel server has not been inspected. It may be MySQL (5.7, 8.0, 8.4) or MariaDB (10.3, 10.6, 10.11).
- **Decision**:  
  Establish a strict **Decision Gate**:
  - Engine & Version: Left OPEN / UNVERIFIED until physical host inspection.
  - Character Set: Mandated as `utf8mb4`.
  - Dialect Rule: In Phase 2, DDL and query builders must use standard ANSI SQL and MySQL/MariaDB compatible syntax without vendor-specific proprietary extensions.
- **Consequences & Rationale**:  
  - Prevents premature architectural lock-in or migration failures upon cPanel deployment.

---

## ADR-009: CSRF & CORS Security Architecture

- **Status**: `CONFIRMED`
- **Context**:  
  The administrative platform relies on cookie-based authentication sessions. Mutating API endpoints (POST, PUT, DELETE) must be hardened against Cross-Site Request Forgery and unauthorized cross-origin invocations.
- **Decision**:  
  Enforce multi-tier defense:
  1. `SameSite=Strict` cookie attribute for all session credentials.
  2. Strict verification of `Origin` and `Referer` HTTP headers on all state-changing endpoints.
  3. Custom header requirement (`X-Requested-With` or Anti-CSRF token).
  4. Explicit CORS origin whitelist allowing only verified platform hostnames.
- **Consequences & Rationale**:  
  - Protects against unauthorized cross-site submission attacks while preserving clean REST API integration.
