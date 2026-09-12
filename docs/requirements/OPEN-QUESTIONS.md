# CITYLINE CONSULTANCY — Open Questions & Business Decision Register

> **Document Status**: Active Register  
> **Phase**: Phase 0 — Foundation, Discovery & Scope Lock  
> **Rule**: No unverified business assumptions. Unconfirmed details are tracked here and require client sign-off prior to Phase 1 / Phase 2 execution.

---

## 1. Business & Service Open Questions

| Question ID | Category | Question Description | Impacted Components / Phases | Decision Status |
| :--- | :--- | :--- | :--- | :--- |
| **OQ-BIZ-01** | **Visa Services** | What is the exact document checklist required for: (a) 2-Year Freelance Visa, (b) 30-Day Visit Visa, and (c) 60-Day Visit Visa? Which documents are mandatory at initial intake versus optional? | Visa Enquiry Form, Document Storage Schema, Phase 6 | **PENDING CLIENT CONFIRMATION** |
| **OQ-BIZ-02** | **Employer Requisition** | For corporate manpower submissions, what business verification fields are required? Should the form mandate a UAE Trade License upload, TRN (Tax Registration Number), or remain a streamlined lead capture? | Employer Manpower Form, Phase 9 | **PENDING CLIENT CONFIRMATION** |
| **OQ-BIZ-03** | **Job Postings** | Should any job listing ever display a salary or compensation range, or should all positions strictly state "Disclosed upon interview / As per UAE Labor Law"? | Jobs Board, Job Detail Page, Phase 8 | **PENDING CLIENT CONFIRMATION** |
| **OQ-BIZ-04** | **Testimonials** | Are testimonials to include numeric star ratings (1 to 5 stars), or solely written commentary, client name, and designation? Will client photos or corporate logos be provided for initial launch? | Testimonials Page, Admin Module, Phase 10 | **PENDING CLIENT CONFIRMATION** |
| **OQ-BIZ-05** | **Legal & Regulatory Disclaimers** | What specific legal disclaimer wording is mandated by UAE regulatory bodies (e.g., MOHRE, GDRFA, ICP) to clearly clarify Cityline Consultancy's role as a private advisory/intermediary consultancy and not a government body? | Footer, Visa Forms, FAQ, Phase 5 | **PENDING CLIENT CONFIRMATION** |
| **OQ-BIZ-06** | **Document Retention Lifecycle** | **Production-Readiness Gate**: What is the mandatory data retention window before applicant dossiers (passports, CVs) transition from `Closed` to `Secure Purge` (e.g., 90 days, 180 days, 365 days)? How long should rejected/unsuccessful candidate CVs be stored on the 100 GB hosting allocation? | Storage Subsystem, Retention Worker, Phase 6 | **PENDING CLIENT CONFIRMATION** |
| **OQ-BIZ-07** | **Business Setup Discovery** | What exact Business Setup services does CITYLINE CONSULTANCY currently provide beyond general Company Formation and Company Setup advisory? (e.g., specific free zones, mainland jurisdictions, visa package bundling)? | Business Setup Page, Lead Forms, Phase 5 | **PENDING CLIENT CONFIRMATION** |

---

## 2. Production Database Engine Decision Gate

Until direct inspection of the physical cPanel hosting environment is performed, the target database engine and operational parameters are strictly unverified:

| Parameter | Current Status | Verification Action | Classification |
| :--- | :--- | :--- | :--- |
| **Production DB Engine** | **OPEN / UNVERIFIED** | Inspect cPanel Server Information (`mysql -V` or phpMyAdmin banner) | `[OPEN QUESTION]` |
| **Production DB Version** | **OPEN / UNVERIFIED** | Check whether MySQL (5.7, 8.0, 8.4) or MariaDB (10.3, 10.6, 10.11) | `[OPEN QUESTION]` |
| **Character Set** | `utf8mb4` | Mandated baseline for international & Arabic character support | `[CONFIRMED]` |
| **Production Collation** | **OPEN / UNVERIFIED** | Determine server default (`utf8mb4_0900_ai_ci` vs `utf8mb4_unicode_ci`) | `[OPEN QUESTION]` |
| **max_connections Limit** | **OPEN / UNVERIFIED** | Query `SHOW VARIABLES LIKE 'max_connections'` on host | `[OPEN QUESTION]` |
| **wait_timeout Limit** | **OPEN / UNVERIFIED** | Query `SHOW VARIABLES LIKE 'wait_timeout'` on host | `[OPEN QUESTION]` |

---

## 3. Technical & Hosting Infrastructure Open Questions

| Question ID | Category | Question Description | Impacted Components / Phases | Decision Status |
| :--- | :--- | :--- | :--- | :--- |
| **OQ-TECH-01** | **Email / SMTP Routing** | Should all notification emails route to a single master inbox (e.g., `info@citylineconsultancy.ae`), or should notifications route to dedicated department mailboxes (e.g., `visa@`, `jobs@`, `recruitment@`, `setup@`)? | SMTP Notification Subsystem, Phase 7 | **PENDING CLIENT CONFIRMATION** |
| **OQ-TECH-02** | **cPanel Node.js Version** | Which specific Node.js runtime version is enabled within the cPanel Application Manager / CloudLinux Node Selector (e.g., v18.x LTS, v20.x LTS, or v22.x LTS)? | Repository Setup, CI/CD, Phase 1 | **UNVERIFIED HOSTING CONSTRAINT** |
| **OQ-TECH-03** | **cPanel Proxy Timeouts & Body Limits** | Does the hosting provider's web server (Apache/LiteSpeed reverse proxy) enforce upload body limits (`LimitRequestBody`) lower than 30 MB or proxy timeouts under 60s? | Multipart Upload Pipeline, Phase 6 | **UNVERIFIED HOSTING CONSTRAINT** |
| **OQ-TECH-04** | **SSH & CLI Access** | Is direct SSH terminal access enabled on the cPanel hosting account for executing migration scripts and builds? | Deployment Pipeline, Phase 1 & 17 | **UNVERIFIED HOSTING CONSTRAINT** |
| **OQ-TECH-05** | **Memory Ceiling** | What is the exact CloudLinux LVE memory allocation (RAM ceiling) assigned to the cPanel account (e.g., 512 MB, 1024 MB, 2048 MB)? | Deployment Strategy, Phase 17 | **UNVERIFIED HOSTING CONSTRAINT** |
| **OQ-TECH-06** | **Cron Job Permissions** | Are standard cPanel Crontab jobs supported down to 1-minute or 5-minute intervals for executing the notification dispatcher? | Notification Dispatcher, Phase 7 | **UNVERIFIED HOSTING CONSTRAINT** |
| **OQ-TECH-07** | **Outbound SMTP Port Policies** | Does the hosting provider block outbound SMTP ports (e.g., port 25, 465, or 587) requiring authenticated relay through localhost? | SMTP Dispatcher, Phase 7 | **UNVERIFIED HOSTING CONSTRAINT** |
| **OQ-TECH-08** | **Host Antivirus / Malware Scanner** | Is ClamAV or an equivalent command-line antivirus scanner accessible to Node.js on the hosting filesystem? | File Upload Pipeline, Phase 6 | **UNVERIFIED HOSTING CONSTRAINT** |
| **OQ-TECH-09** | **Domain & SSL Status** | Has the primary domain DNS been configured, and is an active SSL/TLS certificate (cPanel AutoSSL or Sectigo/Let's Encrypt) provisioned on the target hosting? | Production Deployment, Phase 17 | **PENDING HOSTING AUDIT** |

---

## 4. Risk Mitigation for Unconfirmed Items

To prevent project delays, the architecture is engineered with flexibility:
1. **Database Agnosticism**: Schema queries and DDL will be designed using standard ANSI SQL / standard MySQL/MariaDB dialects supported across MySQL 8.x and MariaDB 10.x.
2. **Document Checklist**: Schema implements an abstract `enquiry_documents` relational model with document category tags rather than rigid column tables.
3. **Email Routing**: The notification subsystem will reference environment variables (`SMTP_RECIPIENT_VISA`, `SMTP_RECIPIENT_JOBS`, etc.) with fallback to a global default.
4. **Storage Retention**: Deletion endpoints and cron cleanup routines will be parameterized by a configurable retention day count (`DOCUMENT_RETENTION_DAYS`).
