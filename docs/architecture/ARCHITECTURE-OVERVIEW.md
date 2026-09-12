# CITYLINE CONSULTANCY — System Architecture Overview

> **Document Status**: Confirmed Baseline  
> **Phase**: Phase 0 — Foundation, Discovery & Scope Lock  
> **Target Environment**: Next.js + Node.js + Relational Database (Engine UNVERIFIED) + Private Local Storage + SMTP on cPanel

---

## 1. System Topology & Deployment Architecture

```
                        ┌────────────────────────────────────────────────────────┐
                        │                     CLIENT TIER                        │
                        │  Browser (Desktop / Tablet / Mobile Touch)             │
                        └───────────┬────────────────────────────────┬───────────┘
                                    │ HTTPS (Port 443)               │
                                    ▼                                ▼
                        ┌───────────────────────┐        ┌───────────────────────┐
                        │   PUBLIC WEB CLIENT   │        │     ADMIN PORTAL      │
                        │   Next.js Frontend    │        │   Protected Admin UI  │
                        └───────────┬───────────┘        └───────────┬───────────┘
                                    │                                │
                                    │ REST API (JSON / Multipart)    │
                                    ▼                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                    HOSTING TIER (cPanel)                               │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                            WEB SERVER & PROXY GATEWAY                            │  │
│  │  Apache / LiteSpeed (cPanel Frontline Server)                                    │  │
│  │  ├── AutoSSL (TLS Termination)                                                   │  │
│  │  ├── Static Assets Routing (`public_html/`)                                      │  │
│  │  └── Reverse Proxy / Passenger Hook to Backend Node.js Engine                    │  │
│  └──────────────────────────────────────────┬───────────────────────────────────────┘  │
│                                             │ UNIX Socket / Localhost Loopback         │
│                                             ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         APPLICATION BACKEND ENGINE (Node.js)                     │  │
│  │                                                                                  │  │
│  │  ├── Security & Routing Middleware (Helmet, CORS Whitelist, CSRF Guard, Auth)    │  │
│  │  ├── Business Logic Controllers (Visas, Jobs, Applications, Requisitions)        │  │
│  │  ├── Multi-Tier File Upload Validator (UUID Renamer, Magic Bytes, DOCX Checker)  │  │
│  │  ├── Secure Document Streamer API (Authenticated Binary Download Pipe)           │  │
│  │  └── Database-First Notification Queue Ingestion (Idempotent Job Dispatch)       │  │
│  └──────────────┬───────────────────────────┬───────────────────────────┬───────────┘  │
│                 │                           │                           │              │
│                 ▼                           ▼                           ▼              │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │     DATABASE TIER      │  │     STORAGE TIER       │  │    NOTIFICATION TIER     │  │
│  │  Production DB Engine  │  │  Private Host Storage  │  │  cPanel Cron Worker      │  │
│  │  [OPEN / UNVERIFIED]   │  │  (Outside public_html, │  │          │               │  │
│  │  (utf8mb4, Relational  │  │   Quota: 100 GB)       │  │          ▼               │  │
│  │   Foreign Keys, Pools) │  │                        │  │  SMTP Mailer Dispatcher  │  │
│  └────────────────────────┘  └────────────────────────┘  └──────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Subsystem Architecture

### 2.1. Frontend Architecture & Next.js Deployment Topology
- **Framework**: Next.js App Router (TypeScript).
- **Styling & Theming**: Vanilla CSS / CSS Modules utilizing a structured design token system (`:root[data-theme='dark']` and `:root[data-theme='light']`).
- **Visual Design**:
  - Frosted glassmorphism using CSS `backdrop-filter: blur(16px)` and translucent RGBA border gradients.
  - Cinematic hero component utilizing optimized WebM/MP4 background video with seamless loop and fallback poster image.
  - GPU-accelerated micro-animations (`transform`, `opacity`) ensuring high frame-rate responsiveness.
- **cPanel Deployment Topology**:
  - *Intended Production Pattern*: Next.js static export (`output: 'export'`) or hybrid client deployed to `public_html/` served directly by Apache/LiteSpeed, while the dynamic Node.js backend runs under cPanel Application Manager / Phusion Passenger.
  - *Alternative Mode*: Full SSR Next.js server managed as a Passenger Node application.
  - *Decision Gate*: Marked **OPEN / UNVERIFIED** until the physical cPanel hosting environment is inspected (evaluating CloudLinux memory ceilings and Passenger stability).

### 2.2. Backend Engine (Node.js REST API)
- **Runtime**: Node.js managed via cPanel Application Manager / Phusion Passenger.
- **Architecture Pattern**: Layered Separation of Concerns:
  - `routes/`: Express/Fastify route declarations and parameter validation guards.
  - `controllers/`: HTTP request parsing, payload sanitation, and HTTP response formatting.
  - `services/`: Core business logic, transaction boundaries, and orchestration.
  - `repositories/`: Database abstraction queries executed against the relational database.
  - `middleware/`: Authentication guards, rate limiters, error boundaries, CSRF/CORS filters, and file interceptors.

### 2.3. Database Architecture & Decision Gate
- **Engine Status**: **OPEN / UNVERIFIED** (Pending physical host inspection to identify whether MySQL 5.7, 8.0, 8.4 or MariaDB 10.3, 10.6, 10.11 is provisioned).
- **Encoding**: Mandated baseline is `utf8mb4` supporting international names, Arabic characters, and symbols. Collation remains UNVERIFIED (`utf8mb4_unicode_ci` vs `utf8mb4_0900_ai_ci`).
- **Connection Management**: Connection pooling with keep-alive pingers and automatic connection resurrection. Pool sizing will be constrained (`connectionLimit: 10`) to avoid exceeding unverified host `max_connections` limits.

### 2.4. Private Document Storage Subsystem
- **Physical Location**: Uploads are saved directly to a dedicated directory on the hosting filesystem located **above the public webroot**:
  ```
  /home/<cpanel_user>/
  ├── public_html/              <-- Public web document root (NO SENSITIVE FILES)
  └── clc_storage/              <-- RESTRICTED PRIVATE STORAGE (chmod 0700)
      ├── documents/            <-- Passports, National IDs, Visa paperwork (chmod 0600)
      └── resumes/              <-- Candidate CVs (chmod 0600)
  ```
- **Ingestion Pipeline**:
  1. Incoming multipart stream parsed in memory chunks.
  2. Multi-layer validation: extension whitelist, binary magic-byte header inspection, and DOCX zip-bomb decompression protection.
  3. File assigned a cryptographically random filename: `${UUIDv4()}_${Date.now()}.${safeExt}`.
  4. File written to `/home/<cpanel_user>/clc_storage/documents/`.
  5. Metadata recorded in `enquiry_documents` database table.
- **Secure Retrieval Pipeline**:
  1. Admin requests `GET /api/admin/documents/:id/download`.
  2. Middleware verifies active admin session cookie and RBAC permissions.
  3. Controller verifies document record existence in database.
  4. Node.js opens a read stream from private disk and pipes it directly into the HTTP response with `Content-Disposition: attachment; filename="sanitized_original.pdf"` and `X-Content-Type-Options: nosniff`.
  5. Stream closed; zero public URLs are ever exposed.

### 2.5. Concrete Database-First SMTP Queue & Resilient Dispatcher
- **Design Pattern**: Resilient Database-First Notification Queue (Transactional Outbox Pattern).
- **Core Principle**: Under no circumstances shall an SMTP failure roll back, corrupt, or delete the original enquiry or job application.
- **Workflow**:
  ```
  [User Submits Form]
           │
           ▼
  [Validate Payload] ──► Invalid? ──► Return 400 Bad Request
           │
           ▼ Valid
  [START Database Transaction]
    ├── 1. Insert Submission Record (enquiries / job_applications)
    ├── 2. Insert Document Metadata Records (enquiry_documents)
    └── 3. Insert Pending Notification Record (notification_queue)
           - status = 'pending'
           - retry_count = 0
           - next_retry_at = CURRENT_TIMESTAMP
           - idempotency_hash = SHA256(submission_id + type)
  [COMMIT Database Transaction] ──► (Persistence 100% Guaranteed)
           │
           ▼
  [Return 200/201 Success Response to Client]
           │
  ═══════════════════════════════════════════════════════════════════
  [Asynchronous Execution via cPanel Cron Dispatcher (e.g. every minute)]
           │
           ▼
  [Fetch Batch of 'pending' or 'failed' records WHERE next_retry_at <= NOW()]
           │
  [Attempt SMTP Transport via Nodemailer]
    ├── SUCCESS:
    │     ├── UPDATE notification_queue SET status = 'sent', sent_at = NOW()
    │     └── Record audit entry
    │
    └── FAILURE:
          ├── UPDATE notification_queue SET
          │     retry_count = retry_count + 1,
          │     next_retry_at = NOW() + INTERVAL (retry_count * 5) MINUTE,
          │     last_error = error_message,
          │     status = IF(retry_count >= 5, 'exhausted', 'failed')
          └── Trigger alert in Admin Dashboard
  ```

### 2.6. Privacy-Preserving Analytics Subsystem
- **Pseudonymous Processing Notice**: Daily salted IP hashing (`SHA256(IP + daily_salt)`) constitutes **pseudonymous data processing** under UAE and international privacy frameworks, and must **NOT** be represented as strictly anonymous.
- **Data Minimization & Scope**:
  - *Collected Fields*: Ephemeral `session_hash` (truncated 16 chars), request path, HTTP Referrer, device classification (Mobile/Desktop/Tablet), browser category, approximate country code, CTA interaction clicks, form funnel milestones.
  - *Fields Explicitly NOT Collected*: Raw IP addresses, GPS coordinates, canvas fingerprints, keystroke dynamics, or personal identity.
- **Access Control & Retention**: Analytics views are restricted to authenticated administrators. Raw event tables (`page_views`) are aggregated daily and pruned after a configurable retention window (e.g., 90 days).

### 2.7. CSRF & CORS Security Architecture
- **Session Protection**: Administrative sessions rely on cookies configured with `SameSite=Strict`, `HttpOnly`, and `Secure`.
- **State-Changing Request Defense**: All mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) require:
  1. `Origin` and `Referer` header inspection against the allowed origin whitelist.
  2. Custom request header verification (`X-Requested-With: XMLHttpRequest` or anti-CSRF token).
- **CORS Whitelist**: The API rejects requests originating from unauthorized external domains.

### 2.8. Storage Quota Monitoring & Safety Thresholds
- **Confirmed Capacity**: 100 GB total hosting allocation.
- **Usage Monitoring**: A lightweight background utility calculates disk consumption across `clc_storage/` plus database size.
- **Safety Thresholds (PROPOSED)**:
  - *Warning Threshold (80% / 80 GB)*: Admin dashboard renders an amber warning banner.
  - *Critical Threshold (90% / 90 GB)*: Admin dashboard renders a red alert banner; new public file uploads are gracefully paused with a user-friendly capacity message to prevent host disk exhaustion.
  - *Storage Cleanup*: Administrators are provided with tools to trigger retention-based purging of completed/archived dossiers.
