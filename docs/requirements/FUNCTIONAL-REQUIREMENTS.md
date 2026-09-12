# CITYLINE CONSULTANCY — Functional Requirements Specification (FRS)

> **Document Status**: Confirmed Baseline  
> **Phase**: Phase 0 — Foundation, Discovery & Scope Lock  
> **Standard**: IEEE 830-Aligned Structured Functional Requirements  
> **Classification Tagging**: Every requirement tagged with `[CONFIRMED]`, `[PROPOSED]`, `[OPEN QUESTION]`, `[CONSTRAINT]`, or `[RISK]`.

---

## 1. Classification Definitions

- **`[CONFIRMED]`**: Explicitly mandated by the project owner or core business specifications.
- **`[PROPOSED]`**: Architectural / engineering best-practice recommendation submitted for audit.
- **`[OPEN QUESTION]`**: Business or technical ambiguity requiring client determination before development.
- **`[CONSTRAINT]`**: Fixed technical, environmental, or hosting limitation.
- **`[RISK]`**: Potential failure point requiring explicit mitigation.

---

## 2. Public Platform & Navigation Requirements

### 2.1. Major Pages Catalog

| Req ID | Component / Page | Requirement Description | Classification |
| :--- | :--- | :--- | :--- |
| **FR-PUB-01** | **Home Page** | Cinematic AI video background hero, core vertical introductions (Visa, Business Setup, Recruitment), featured jobs preview, verified testimonials, trust badges, primary conversion CTAs. | `[CONFIRMED]` |
| **FR-PUB-02** | **About Us** | Presentation of corporate mission, ethical consultancy standards, UAE market presence, and leadership philosophy. | `[CONFIRMED]` |
| **FR-PUB-03** | **Visa Services Hub** | Comprehensive overview of UAE residency and entry assistance solutions. Central entry point to freelance and tourist visa offerings. | `[CONFIRMED]` |
| **FR-PUB-04** | **Freelance Visa Page** | Dedicated resource detailing the 2-Year UAE Freelance Visa process, benefits, and self-residency pathway. Strict zero-pricing display. | `[CONFIRMED]` |
| **FR-PUB-05** | **Visit Visa Page** | Detailed breakdown of short-term (30-Day) and extended (60-Day) UAE Visit Visas. Strict zero-pricing display. | `[CONFIRMED]` |
| **FR-PUB-06** | **Recruitment Hub** | Enterprise-focused presentation of corporate manpower capabilities, trades, and staffing deployment procedures across UAE emirates. | `[CONFIRMED]` |
| **FR-PUB-07** | **Jobs / Opportunities** | Searchable and filterable job board displaying active vacancies with dynamic category filters. | `[CONFIRMED]` |
| **FR-PUB-08** | **Job Detail Page** | Dynamic route (`/jobs/:slug`) providing comprehensive role requirements, duties, location, category, and direct application form. | `[CONFIRMED]` |
| **FR-PUB-09** | **Business Setup Page** | Corporate formation advisory page covering mainland, free zone, and offshore licensing assistance. Consultative only; no arbitrary pricing. | `[CONFIRMED]` |
| **FR-PUB-10** | **Testimonials Page** | Dedicated social proof page featuring client and candidate testimonials managed dynamically via the Admin Panel. | `[CONFIRMED]` |
| **FR-PUB-11** | **Contact Us Page** | Physical location details, office email/phone channels, and general contact inquiry form with anti-spam protection. | `[CONFIRMED]` |
| **FR-PUB-12** | **FAQ Page** | Grouped accordion-style answers addressing common immigration, setup, and job application questions. | `[CONFIRMED]` |

---

## 3. Experience Flow Architecture & Analysis

### 3.1. Recommendation on Conversion Experiences

| Experience | Evaluated Options | Recommended Approach | Architectural Justification | Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Visa Enquiry** | Standalone route vs Modal/Stepper | **Hybrid: Dedicated Route (`/visa-enquiry`) + Triggerable Stepper Modal** | Deep-linkable from marketing campaigns/ads, while remaining accessible via modal on any visa subpage without context loss. | `[PROPOSED]` |
| **Job Application** | Standalone page vs Embedded Drawer | **Embedded Drawer / Section on `/jobs/:slug`** | Minimizes drop-off by keeping the applicant focused on the specific job requirements while uploading their resume. | `[PROPOSED]` |
| **Employer Manpower** | Standalone route vs Section on `/recruitment` | **Prominent Section on `/recruitment` + Dedicated `/recruitment/hire` Route** | Accommodates both browsing B2B visitors and direct enterprise link sharing from business development outreach. | `[PROPOSED]` |

---

## 4. Visa Services & Document Upload Requirements

| Req ID | Requirement Statement | Classification |
| :--- | :--- | :--- |
| **FR-VISA-01** | The platform shall provide specialized informational structures for: 2-Year Freelance Visa, 30-Day Visit Visa, and 60-Day Visit Visa. | `[CONFIRMED]` |
| **FR-VISA-02** | The platform shall **strictly prohibit displaying any visa pricing, government fees, or processing charges** across all public pages. | `[CONFIRMED]` |
| **FR-VISA-03** | The platform shall **not display unsupported claims**, including guaranteed approval, fixed processing timelines, or governmental endorsements. | `[CONFIRMED]` |
| **FR-VISA-04** | The Visa Enquiry submission form shall capture: Full Name, Email Address, Contact Number / WhatsApp (with international dial code), Nationality, Selected Visa Category, and Message/Notes. | `[CONFIRMED]` |
| **FR-VISA-05** | The Visa Enquiry form shall support multi-file document uploads (e.g., passport copy, national ID, photograph). | `[CONFIRMED]` |
| **FR-VISA-06** | **Configurable Document Checklist**: The system architecture shall permit document upload requirements to be configurable dynamically rather than hardcoded in the codebase. | `[CONFIRMED]` |
| **FR-VISA-07** | The exact mandatory vs optional visa document checklist is pending regulatory/business determination. | `[OPEN QUESTION]` |
| **FR-VISA-08** | **Content Governance Rule**: Later implementation phases must NOT invent visa eligibility rules, mandatory documents, government fees, processing times, approval rates, government affiliations, or guarantees. Only confirmed client-supplied copy may be published. | `[CONFIRMED]` |

---

## 5. Document Storage, Security & Lifecycle Requirements

| Req ID | Requirement Statement | Classification |
| :--- | :--- | :--- |
| **FR-DOC-01** | All uploaded documents (Visa documents, Resumes/CVs) shall be stored locally within the allocated 100 GB hosting environment on cPanel. | `[CONSTRAINT]` |
| **FR-DOC-02** | Uploaded documents shall be placed in a **strictly private directory located outside the public web document root** (e.g., `/home/username/clc_storage/documents/`). | `[CONFIRMED]` |
| **FR-DOC-03** | Under no circumstances shall uploaded documents be reachable via direct public HTTP/HTTPS URLs. | `[CONFIRMED]` |
| **FR-DOC-04** | All uploaded files shall be renamed using cryptographic UUIDv4 identifiers coupled with timestamps to prevent file enumeration and overwriting. | `[CONFIRMED]` |
| **FR-DOC-05** | The backend shall enforce multi-layer file validation: file size limits (max 10 MB/file, max 30 MB aggregate submission, max 5 MB CV), whitelisted extensions (`.pdf`, `.jpg`, `.jpeg`, `.png`, `.docx`), strict MIME-type validation, and binary magic-byte header inspection. | `[CONFIRMED]` |
| **FR-DOC-06** | The system shall reject and abort any file containing executable or script payloads (`.php`, `.phtml`, `.js`, `.sh`, `.exe`, `.cgi`, `.bat`, `.svg`). | `[CONFIRMED]` |
| **FR-DOC-07** | **DOCX ZIP/Package & Zip-Bomb Protection**: Uploaded `.docx` files (which are OpenXML ZIP archives) must undergo archive structural validation, inspecting file count limits (max 250 files per archive), maximum uncompressed size cap (max 25 MB), decompression ratio ceiling (max 10:1), and recursive entry blocking to prevent zip-bomb denial of service. | `[PROPOSED]` |
| **FR-DOC-08** | **Malware Scanning Strategy & Fallback**: If an enterprise antivirus/malware scanner (e.g., ClamAV) is unavailable on the shared cPanel server, the architecture must enforce strict containment fallbacks: complete file isolation outside webroot, stripping execution flags (`chmod 0600`), enforcing `nosniff` headers, and streaming binary downloads strictly as attachments. | `[PROPOSED]` |
| **FR-DOC-09** | Admin document retrieval shall occur strictly through an **authenticated streaming proxy endpoint** (`/api/admin/documents/:id/download`) validating active admin session credentials before piping binary data. | `[CONFIRMED]` |
| **FR-DOC-10** | **Document Lifecycle & Secure Retention**: The system shall support a formal document lifecycle: `Active` -> `Processing` -> `Completed/Closed` -> `Retention Window` -> `Secure Purge`. Once authorized for deletion, files must be securely unlinked from the private disk, database references marked purged, and the action logged. | `[CONFIRMED]` |
| **FR-DOC-11** | **Storage Quota Monitoring & Thresholds**: The platform shall actively monitor storage usage across `clc_storage/`. The Admin Dashboard shall provide visual storage metrics with a proposed Warning Threshold (80% / 80 GB) and a proposed Critical Threshold (90% / 90 GB) that triggers upload rejection protection to prevent disk exhaustion. | `[PROPOSED]` |

---

## 6. Email / SMTP Queue & Resilient Dispatcher Requirements

| Req ID | Requirement Statement | Classification |
| :--- | :--- | :--- |
| **FR-MAIL-01** | The backend shall integrate with an SMTP server to dispatch administrative email alerts upon new submissions (Visa Enquiries, Job Applications, Employer Requisitions, Contact Enquiries). | `[CONFIRMED]` |
| **FR-MAIL-02** | **Concrete Database-First Notification Queue**: Form submission processing must follow a strict pipeline: (1) Ingest & validate -> (2) Persist submission record in MySQL -> (3) Commit transaction -> (4) Create pending record in `notification_queue` with idempotency key -> (5) Return success response to user -> (6) Cron-based or background worker dispatches SMTP message -> (7) Update delivery status. | `[CONFIRMED]` |
| **FR-MAIL-03** | **Zero-Loss Guarantee & Idempotent Retries**: SMTP failure can **NEVER** roll back, corrupt, or delete the original enquiry or job application. The `notification_queue` entity must maintain: `status` (`pending`, `processing`, `sent`, `failed`), `retry_count`, `next_retry_at` (exponential backoff: 2m, 10m, 30m, 1h), `last_error`, `sent_at`, and an `idempotency_hash` to prevent duplicate emails. | `[CONFIRMED]` |
| **FR-MAIL-04** | Outgoing notifications shall feature branded HTML templates matching Cityline Consultancy visual identity without exposing sensitive applicant passport attachments via plaintext email. | `[PROPOSED]` |

---

## 7. Jobs & Recruitment System Requirements

| Req ID | Requirement Statement | Classification |
| :--- | :--- | :--- |
| **FR-JOB-01** | Public visitors shall be able to browse open job postings with real-time text search and category filtering. | `[CONFIRMED]` |
| **FR-JOB-02** | Initial supplied job categories shall include: (1) Hotel Staff, (2) Cleaning, (3) Mason, (4) Steel Fixer, (5) Carpenter, (6) Bike Rider / Delivery Job, (7) Taxi Driver, (8) Truck Driver. | `[CONFIRMED]` |
| **FR-JOB-03** | The job category schema shall be **dynamic and database-driven**, allowing administrators to create, rename, and archive categories without code changes. | `[CONFIRMED]` |
| **FR-JOB-04** | Each job listing shall maintain: Title, Slug, Category, Employment Type (Full-Time, Contract), Location (Emirate), Requirements Summary, Full Description, Status (Active, Paused, Closed), and Creation Timestamp. | `[CONFIRMED]` |
| **FR-JOB-05** | Job application submission shall record: Candidate Full Name, Email, Phone/WhatsApp, Nationality, Current Location, Years of Experience, and Resume/CV file attachment. | `[CONFIRMED]` |
| **FR-JOB-06** | Salary information on job postings: Strict zero salary display unless explicitly confirmed per role by business stakeholders. | `[CONFIRMED]` |

---

## 8. Employer / Manpower Requisition Requirements

| Req ID | Requirement Statement | Classification |
| :--- | :--- | :--- |
| **FR-EMP-01** | UAE employers shall have access to an intake requisition form to request commercial workforce and staffing. | `[CONFIRMED]` |
| **FR-EMP-02** | Form submission fields (Current Business Assumptions): Company Name, Contact Person, Corporate Email, Phone/WhatsApp, Industry Sector, Required Position / Skill, Number of Workers, Deployment Location (Emirate), and Project Timeline / Requirements. | `[PROPOSED]` |
| **FR-EMP-03** | Verification of corporate legitimacy: Determination of whether Trade License copy or UAE Tax Registration Number (TRN) is mandatory at intake. | `[OPEN QUESTION]` |

---

## 9. Testimonials Management Requirements

| Req ID | Requirement Statement | Classification |
| :--- | :--- | :--- |
| **FR-TEST-01** | The platform shall maintain a dedicated testimonial module displaying client and candidate feedback on the homepage and `/testimonials`. | `[CONFIRMED]` |
| **FR-TEST-02** | Administrators shall have complete CRUD capabilities: Add new testimonial, Edit content, Publish / Unpublish toggle, and Archive/Delete. | `[CONFIRMED]` |
| **FR-TEST-03** | Testimonial entities shall support: Client/Candidate Full Name, Location / Designation (where applicable), Optional Photo / Avatar, Testimonial Body Text, and Display Order. | `[CONFIRMED]` |
| **FR-TEST-04** | Inclusion of star ratings (1 to 5) requires formal business approval. | `[OPEN QUESTION]` |
| **FR-TEST-05** | Testimonial content must be curated by the business; **no fabricated reviews or synthetic testimonials** shall be generated during development. | `[CONFIRMED]` |

---

## 10. Visitor & Privacy-Preserving Analytics Requirements

| Req ID | Requirement Statement | Classification |
| :--- | :--- | :--- |
| **FR-ANA-01** | The platform shall incorporate an internal, privacy-preserving analytics engine to provide visibility into website traffic without relying on invasive third-party ad trackers. | `[CONFIRMED]` |
| **FR-ANA-02** | Metrics tracked shall include: Pseudonymous visitor sessions, total page views, popular page URLs, traffic referrers, device breakdown (Mobile/Desktop/Tablet), browser classification, approximate country location, CTA button clicks, and form conversion funnels. | `[CONFIRMED]` |
| **FR-ANA-03** | **Pseudonymous Processing & Data Minimization**: Daily salted IP hashing (`SHA256(IP + daily_salt)`) constitutes **pseudonymous processing** under UAE and international privacy frameworks, and must **NOT** be represented as strictly anonymous. Raw IP addresses must never be stored on disk. | `[CONFIRMED]` |
| **FR-ANA-04** | **Fields Explicitly NOT Collected**: The analytics engine shall strictly NOT collect: personal identity, persistent cross-site cookies, canvas fingerprints, precise geolocation coordinates, mouse tracking heatmaps, or keystroke logs. | `[CONFIRMED]` |
| **FR-ANA-05** | **Privacy Notice Requirement**: A public privacy notice must clearly inform visitors of first-party pseudonymous telemetry collected for operational load analysis and security monitoring. | `[CONFIRMED]` |
| **FR-ANA-06** | Admin Panel shall render clean graphical charts summarizing daily/weekly visitor volume, conversion funnel drop-offs, and top acquisition sources. Access is strictly restricted to authenticated administrators. | `[CONFIRMED]` |

---

## 11. Protected Admin Panel Governance & RBAC Requirements

| Req ID | Requirement Statement | Classification |
| :--- | :--- | :--- |
| **FR-ADM-01** | The Admin Panel shall be secured behind credential authentication utilizing bcrypt/Argon2id password hashing and secure, HttpOnly, SameSite cookies. | `[CONFIRMED]` |
| **FR-ADM-02** | **Role-Based Access Control (RBAC)**: The authorization engine shall enforce granular permissions. The baseline architecture supports `Super Admin` (full system governance, account management, purge authority) and `Admin / Operator` (lead triage, job editing, document viewing), while remaining extensible to viewer/auditor roles. | `[PROPOSED]` |
| **FR-ADM-03** | **Sensitive Operations Authorization**: Explicit permission verification is required for: (1) Document viewing/streaming, (2) Document purging/deletion, (3) Enquiry status modification, (4) Job creation/publishing/archiving, (5) Testimonial moderation, (6) System settings modification, (7) Analytics viewing, and (8) Admin account provisioning/suspension. | `[CONFIRMED]` |
| **FR-ADM-04** | **Admin Dashboard**: Real-time operational aggregates: Pending Enquiries, Recent Applications, Active Vacancies, Total Monthly Submissions, Storage Utilization Meter, and Visitor Trends. | `[CONFIRMED]` |
| **FR-ADM-05** | **Visa Enquiries Manager**: Paginated table with search, status filters (New, In Progress, Contacted, Completed, Archived), detail view, and secure document download triggers. | `[CONFIRMED]` |
| **FR-ADM-06** | **Job Management Module**: Interface to author, preview, publish, modify, and delete job postings and job categories. | `[CONFIRMED]` |
| **FR-ADM-07** | **Application Manager**: Interface to review candidates per job, filter by date, download resumes via streaming proxy, and update candidate triage status. | `[CONFIRMED]` |
| **FR-ADM-08** | **Employer Inquiries Module**: Review and triage enterprise workforce requisitions. | `[CONFIRMED]` |
| **FR-ADM-09** | **Testimonial Manager**: Interface to add, edit, approve, reorder, and unpublish social proof entries. | `[CONFIRMED]` |
| **FR-ADM-10** | **Site Settings Module**: Manage operational parameters (e.g., notification email recipient addresses, maintenance banner toggle). | `[PROPOSED]` |
| **FR-ADM-11** | **Append-Oriented Administrative Audit Log**: The system shall record an append-oriented audit log for: login success/failure, document view/stream, document deletion/purge, enquiry status change, job publish/unpublish, testimonial changes, and admin account modifications. Protections against ordinary application-level alteration/deletion shall be enforced. | `[CONFIRMED]` |
