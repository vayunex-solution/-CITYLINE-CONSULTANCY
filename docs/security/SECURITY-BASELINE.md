# CITYLINE CONSULTANCY — Security Baseline & Threat Model

> **Document Status**: Confirmed Baseline  
> **Phase**: Phase 0 — Foundation, Discovery & Scope Lock  
> **Standard**: OWASP Top 10 (2021) & STRIDE Threat Modeling Framework

---

## 1. Threat Model & STRIDE Analysis

| STRIDE Category | Potential Vector | Platform Target | Mitigation Architecture | Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates an administrator to access applicant files. | Admin Login (`/api/admin/login`) | Argon2id password hashing, IP-level throttling, progressive exponential delay, generic error responses, HttpOnly SameSite=Strict secure session cookies. | `[CONFIRMED]` |
| **Tampering** | Malicious file upload masquerading as a PDF passport copy or DOCX resume. | Document Upload (`/api/enquiries/visa`, `/api/jobs/apply`) | Binary magic-byte header inspection, strict MIME whitelist, DOCX zip-bomb package checks, cryptographic UUID renaming, storage outside webroot. | `[CONFIRMED]` |
| **Repudiation** | An admin claims they did not download or delete an applicant's dossier. | Admin Audit Trail | Append-oriented administrative audit log recording admin user ID, action, target resource ID, client IP, and UTC timestamp, protected against application-level alteration. | `[CONFIRMED]` |
| **Information Disclosure** | Direct URL browsing to access sensitive passports or server stack traces. | File Storage & Error Handlers | Zero public URL exposure; streaming proxy requires active admin session and RBAC permissions; production error sanitizer suppressing stack traces. | `[CONFIRMED]` |
| **Denial of Service** | Flood of fake form submissions, bulk uploads, or brute-force lockouts. | Public Forms & Login | Multi-tier rate limiting avoiding account lockout DoS (progressive delays, IP throttling), file size caps (10 MB/file, 30 MB aggregate), payload parsing limits. | `[CONFIRMED]` |
| **Elevation of Privilege** | An unauthenticated visitor or operator queries `/api/admin/documents/:id`. | Document Streaming API | Mandatory backend authentication middleware enforcing admin role-based authorization (RBAC) prior to disk read stream. | `[CONFIRMED]` |

---

## 2. File Upload Defense-in-Depth Pipeline

```
[Incoming Multipart File Stream]
             │
             ▼
[Step 1: Extension Whitelist Verification]
  - Allow ONLY: .pdf, .jpg, .jpeg, .png, .docx
  - Deny: .php, .phtml, .js, .sh, .exe, .cgi, .bat, .svg, .html
             │
             ▼
[Step 2: Payload Size Cap Verification]
  - Reject any single file > 10 MB (Resumes capped at 5 MB)
  - Reject aggregate payload > 30 MB
             │
             ▼
[Step 3: Binary Magic-Byte Header Verification]
  - Verify binary file signatures (e.g., %PDF- for PDFs, FF D8 FF for JPEGs, 89 50 4E 47 for PNGs, 50 4B 03 04 for DOCX)
  - Prevent MIME spoofing (e.g., PHP script renamed to document.pdf)
             │
             ▼
[Step 4: DOCX ZIP/Package & Zip-Bomb Decompression Defense]
  - Inspect ZIP structure before processing:
      ├── Max entry count: <= 250 files
      ├── Max uncompressed size: <= 25 MB
      ├── Max decompression ratio: <= 10:1
      └── Reject nested/recursive archive entries
             │
             ▼
[Step 5: Malware Scanning Strategy & Hosting Fallback]
  - If ClamAV / command-line scanner is available: execute stream scan.
  - If scanner is UNAVAILABLE on shared cPanel: enforce strict containment fallback:
      ├── Strict file isolation outside webroot
      ├── Strip executable bits (chmod 0600)
      ├── Mandatory attachment disposition with nosniff
      └── Never execute or render inline in browser
             │
             ▼
[Step 6: Cryptographic Filename Sanitization & Path Traversal Guard]
  - Discard original filename on disk
  - Generate target name: ${crypto.randomUUID()}_${Date.now()}.${safeExt}
  - Enforce absolute resolution check: path.resolve(targetPath).startsWith(STORAGE_ROOT)
             │
             ▼
[Step 7: Private Isolation Outside Web Document Root]
  - Write directly to: /home/<user>/clc_storage/documents/
  - Enforce filesystem permissions 0600 (read/write owner only, no execution)
  - Place protective .htaccess in storage folder: Deny from all
```

---

## 3. Sensitive Document Access & Lifecycle Architecture

1. **Zero Direct Public URLs**: Uploaded assets reside strictly above `public_html`. Web servers cannot serve these files under any HTTP route.
2. **Authenticated Streaming Proxy**:
   - Authorized administrators request: `GET /api/admin/documents/:id/download`.
   - The backend validates the admin's session cookie and checks RBAC permissions.
   - The backend verifies document record existence in the database.
   - An internal Node.js read stream pipes binary data directly to the client:
     ```http
     Content-Type: application/pdf
     Content-Disposition: attachment; filename="sanitized_original_filename.pdf"
     X-Content-Type-Options: nosniff
     Cache-Control: private, no-cache, no-store, must-revalidate
     ```
3. **Document Retention Lifecycle & Secure Purge**:
   - Lifecycle: `Active` -> `Processing` -> `Completed/Closed` -> `Retention Window` -> `Secure Purge`.
   - When an administrator initiates an authorized purge (or when automated retention cleanup fires):
     - The physical file is unlinked from `/home/<user>/clc_storage/`.
     - The database record status is updated to `purged` and the file path cleared.
     - An append-oriented audit entry is committed recording user ID, target file ID, and timestamp.
   - Final retention window duration remains an **OPEN QUESTION (OQ-BIZ-06)**.

---

## 4. Administrative Authentication, Rate Limiting & Anti-DoS

1. **Password Hashing**:
   - Argon2id (memory: 64MB, iterations: 3, parallelism: 4) or bcrypt (cost factor: 12).
   - Zero plaintext passwords or reversible encryptions stored.
2. **Anti-DoS Login Rate Limiting & Progressive Delay**:
   - To prevent Account Lockout Denial-of-Service (where an attacker locks out legitimate admins by intentionally failing logins), rate limiting is decoupled:
     - **IP-Level Throttling**: Maximum 10 failed login attempts per 15-minute window per IP.
     - **Progressive Delay (Exponential Backoff)**: Successive failed attempts from the same IP/account introduce artificial response delays (500ms, 1s, 2s, 4s).
     - **Generic Error Responses**: Always respond with "Invalid username or password" to prevent user enumeration.
     - **Conservative Temporary Lockout**: Temporary account suspension triggered only after sustained abusive patterns, with manual unlock capability for Super Admins.
     - **Append-Oriented Audit Log**: Every authentication attempt (success or failure) is logged with IP and timestamp.
3. **Session Hardening**:
   - Tokens delivered exclusively via cookies configured with:
     - `HttpOnly`: Inaccessible to client-side scripts.
     - `Secure`: Transmitted only over HTTPS connections.
     - `SameSite=Strict`: Blocks cross-site request leakage.
     - Idle session expiration: 60 minutes.

---

## 5. CSRF & CORS Security Architecture

1. **Cross-Site Request Forgery (CSRF) Defense**:
   - Because cookie-based sessions are utilized, all mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) are protected via:
     - Strict `SameSite=Strict` cookie attribute.
     - Verification of `Origin` and `Referer` headers against the approved domain whitelist.
     - Custom request header verification (`X-Requested-With: XMLHttpRequest` or anti-CSRF token).
2. **Cross-Origin Resource Sharing (CORS)**:
   - The backend enforces a strict CORS policy:
     - Whitelist restricted to verified production domains (e.g., `https://citylineconsultancy.ae` and local development host).
     - Credentials permitted (`credentials: true`) exclusively for whitelisted origins.
     - Wildcard `*` origins are strictly prohibited.

---

## 6. Role-Based Access Control (RBAC)

The platform implements a structured authorization architecture:
1. **Roles Hierarchy**:
   - **Super Admin**: Complete platform authority, including admin user provisioning, security settings, and document purge authorization.
   - **Admin / Operator**: Day-to-day lead management, job publishing, document viewing, and applicant review.
   - *Extensibility*: Architecture supports future granular roles (e.g., `HR Viewer`, `Auditor`).
2. **Operations Requiring Explicit Authorization**:
   - Document viewing / streaming
   - Document deletion / purging
   - Enquiry status triage & notes
   - Job creation, editing, publishing, and archiving
   - Testimonial approval & moderation
   - Platform site settings modification
   - Visitor analytics inspection
   - Admin user account creation / status suspension

---

## 7. Append-Oriented Administrative Audit Log

1. **Immutability Clarification**: The audit log is implemented as an **append-oriented administrative audit log** within the relational database. It is not cryptographically immutable, but is architecturally protected against normal application-level tampering.
2. **Tamper-Resistance Controls**:
   - The application backend exposes **zero** `UPDATE` or `DELETE` endpoints for the `audit_logs` table.
   - Records are insert-only.
3. **Audited Security Events**:
   - Admin authentication (success and failure with client IP)
   - Document access / streaming download
   - Document deletion / purge
   - Enquiry status transition
   - Job creation, modification, and publish/unpublish
   - Testimonial creation, modification, and deletion
   - Admin account provisioning, role changes, and suspensions

---

## 8. Secrets & Environment Configuration

1. **Location**: Configuration secrets (`.env`) reside strictly in the backend application directory **outside** `public_html`.
2. **File Permissions**: Filesystem permissions on `.env` locked down to `0600` (read/write by application user only).
3. **Zero Secrets in Version Control**: `.env`, `.env.local`, and private storage paths are strictly registered in `.gitignore`.
4. **Environment Separation**: Distinct configuration profiles for `development`, `staging`, and `production`.
