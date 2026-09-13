# CITYLINE CONSULTANCY — Phase 6 Architecture: Visa Enquiry & Document Upload System

**Status:** IMPLEMENTED, CONSOLIDATED & LOCKED
**Authority:** Phase 0 Scope Lock + Phase 1 Repository Foundation + Phase 2 Database Architecture + Phase 3 Backend Core + Phase 4 Admin Authentication & Security + Phase 5 Public Website  
**Date:** 2026-09-13  

---

## 1. Executive Summary

Phase 6 transitions the frontend-only visa consultation form (`/visa-enquiry`) into an authoritative, production-grade, secure backend ingestion pipeline. The implementation adheres strictly to the locked project architecture without introducing unauthorized cloud dependencies, parallel databases, or external frameworks.

```
USER
  │
  ▼
Visa Enquiry Form (/visa-enquiry)
  │ [Client-side Pre-checks & Drag/Drop UX]
  ▼
POST /api/v1/visa-enquiries [Multipart Form-Data / JSON]
  │ [IP Sliding Window Rate Limiter: 10 per 15 min]
  ▼
Content-Length Pre-Check & BoundedMemoryStorage Pipeline
  │ [Strict Limits: 10MB/file, 25MB aggregate stream limit, max 5 files, max 20 fields]
  ▼
Authoritative Zod Schema Validation
  │ [fullName, email, phone, whatsapp, visaType, nationality, timeline, details, consent]
  ▼
Canonical Visa Service Verification
  │ [Resolves active service in visa_services table by code/slug]
  ▼
Binary Signature & Magic-Byte Inspection
  │ [Pure buffer inspection: PDF, JPEG, PNG, DOCX]
  ▼
DOCX Zip-Bomb & Structural Validation
  │ [In-memory header inspection: entry count <= 500, ratio <= 20:1, decompressed <= 50MB, OOXML check]
  ▼
Private Filesystem Storage Write
  │ [STORAGE_ROOT/visa-enquiries/<enquiryId>/<randomUUID>.<ext> with 0o600 permissions]
  ▼
Pluggable Malware Scanner Adapter (Fail-Closed)
  │ ├── [SCANNER ENABLED + CLEAN] ──► Accepted / Trusted (valid / clean)
  │ ├── [SCANNER ENABLED + INFECTED] ──► Rejected (400 MALICIOUS_FILE_DETECTED) + Unlink files + Audit log
  │ ├── [SCANNER ENABLED + COMMAND FAILED] ──► Fail-Closed (500 SCANNER_UNAVAILABLE) + Unlink files + Audit log
  │ └── [SCANNER DISABLED] ──► Quarantined / Untrusted (pending / skipped)
  ▼
Atomic MariaDB Transaction
  │ ├── enquiries (parent enquiry record)
  │ ├── visa_enquiries (1-to-1 detail record)
  │ └── documents (batch metadata insertion with accurate trust statuses)
  │
  ├── [FAILURE] ──► Rollback + Compensation: Unlink newly written physical files
  │
  ▼ [SUCCESS]
Append-Only Operational Audit Event
  │ [audit_logs: visa_enquiry_submitted (non-fatal if logging fails)]
  ▼
Public-Safe Response (HTTP 201)
  └─► { success: true, data: { reference: "CLC-V-2026-XXXXXXXX", ... } }
```

---

## 2. API Contract & Endpoint Specification

### Public Submission Endpoint
- **URL:** `POST /api/v1/visa-enquiries`
- **Content-Type:** `multipart/form-data` or `application/json`
- **Authentication:** Public (Unauthenticated)
- **Rate Limit:** 10 submissions per 15 minutes per IP (sliding window)

### Request Payload Fields

| Field | Type | Required | Constraints / Description |
| :--- | :--- | :--- | :--- |
| `fullName` | String | **Yes** | 2–150 characters, trimmed. |
| `email` | String | **Yes** | Valid email address, lowercase, max 255 chars. |
| `phone` | String | **Yes** | 7–50 chars, allowed: digits, spaces, `+`, `-`, `()`. |
| `whatsapp` | String | No | Optional WhatsApp number, max 50 chars. |
| `visaType` | String | **Yes** | Canonical service identifier (`freelance-visa`, `visit-visa-30`, `visit-visa-60`). |
| `nationality` | String | **Yes** | 2–100 characters. |
| `timeline` | String | No | Client timeline requirement (`immediate`, `1-month`, `1-3-months`, `exploring`). |
| `applicantCount` | Number | No | Integer >= 1 (defaults to 1). |
| `details` | String | No | Additional requirements or questions (max 2000 chars). |
| `consent` | Boolean | **Yes** | Must be explicitly `true` (`"true"` string coerced). |
| `documents` | File(s) | No | Up to 5 attached documents (PDF, JPG, PNG, DOCX). |

### Success Response (`HTTP 201 Created`)
```json
{
  "success": true,
  "message": "Your visa consultation enquiry has been submitted successfully.",
  "data": {
    "reference": "CLC-V-2026-A1B2C3D4",
    "serviceTitle": "2-Year Freelance Visa Dubai",
    "documentsUploaded": 2
  }
}
```

### Error Responses
- **`400 VALIDATION_ERROR`**: Structured `fieldErrors` object returning safe field-specific validation failures.
- **`400 INVALID_VISA_SERVICE`**: Selected visa service is unknown or currently deactivated in `visa_services`.
- **`400 FILE_TYPE_PROHIBITED`**: Uploaded file has an executable or dangerous extension (`.exe`, `.sh`, `.php`, etc.).
- **`415 UNSUPPORTED_MEDIA_TYPE`**: File binary signature / magic bytes do not match approved formats.
- **`413 FILE_TOO_LARGE`**: An individual file exceeds 10MB.
- **`413 PAYLOAD_TOO_LARGE`**: Total request/upload payload exceeds 25MB (checked before and during parsing).
- **`400 TOO_MANY_FILES`**: More than 5 documents submitted.
- **`400 TOO_MANY_FIELDS`**: More than 20 multipart text fields submitted.
- **`429 RATE_LIMIT_EXCEEDED`**: Client exceeded rate limits (returns `Retry-After` header).
- **`500 SCANNER_UNAVAILABLE`**: Active malware scanner command execution failed closed.
- **`500 DATABASE_ERROR`**: Safe sanitized error message suppressing all raw SQL, column names, and stack traces.

---

## 3. Multipart RAM Exhaustion Defense (`BoundedMemoryStorage`)

To prevent memory exhaustion and multipart Denial of Service (DoS) attacks, Phase 6 implements parser-level streaming protection:

1. **Pre-flight Header Check:**
   Before Multer begins buffering, `req.headers['content-length']` is evaluated. Any request declaring a body > 25MB (`UPLOAD_MAX_TOTAL_SIZE_BYTES`) is rejected immediately (`HTTP 413 PAYLOAD_TOO_LARGE`) without allocating buffer memory.
2. **Active Streaming Byte Tracking:**
   `BoundedMemoryStorage` tracks cumulative uploaded bytes across all file streams in real-time. As chunks stream from the socket:
   - If an individual file exceeds 10MB, the stream is destroyed immediately (`LIMIT_FILE_SIZE`).
   - If cumulative bytes across all files exceed 25MB, the stream is destroyed immediately (`LIMIT_TOTAL_FILE_SIZE`).
   - Sockets are aborted before unmanaged RAM buffering occurs.
3. **Multipart Field Flood Defense:**
   Busboy parsing limits are strictly enforced:
   - `fileSize`: 10MB
   - `files`: 5
   - `fields`: 20 (prevents multipart non-file flooding)
   - `fieldSize`: 100KB (limits text field length)
   - `parts`: 30 (limits total multipart components)

---

## 4. Document Security & Storage Architecture

### Physical Storage Isolation
- **Storage Location:** Configured via `STORAGE_ROOT` (defaults to `~/clc_storage` in production and local isolated directories in development/testing).
- **Webroot Isolation:** Storage is physically and architecturally located **strictly outside** the Next.js static root (`/public`), the backend root, and web server document roots (`/public_html`).
- **Permissions:** Written with restricted POSIX mode `0o600` (read/write for process owner only).
- **No Direct Serving:** Zero static web server aliases or public download URLs exist for uploaded enquiry documents.

### Storage Hierarchy
```
STORAGE_ROOT/
  └── visa-enquiries/
        └── <enquiry-uuid>/
              ├── <random-uuid-1>.pdf
              └── <random-uuid-2>.jpg
```
- **Directory:** Named after the cryptographically generated UUID of the parent enquiry (`crypto.randomUUID()`).
- **Filename:** Cryptographically random UUID (`<randomUUID>.<canonicalExt>`).
- **Database Key:** Persisted as a relative POSIX key (`visa-enquiries/<enquiryId>/<randomUUID>.<canonicalExt>`).
- **Absolute Path Suppression:** Server-side absolute disk paths are strictly internal and are never returned in public HTTP responses.

### Approved File Types & Binary Signatures

| Type | Allowed Extensions | Approved MIME Types | Binary Signature (Magic Bytes) |
| :--- | :--- | :--- | :--- |
| **PDF** | `.pdf` | `application/pdf` | `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`) |
| **JPEG** | `.jpg`, `.jpeg` | `image/jpeg` | `0xFF 0xD8 0xFF` |
| **PNG** | `.png` | `image/png` | `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A` |
| **DOCX** | `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `PK\x03\x04` (`0x50 0x4B 0x03 0x04`) + OOXML package validation |

### DOCX / ZIP-Bomb Defense Engine
Microsoft Word `.docx` documents are ZIP archives. Rather than blindly extracting or parsing untrusted archives to disk:
1. **In-Memory Buffer Inspection:** The local ZIP header chain (`PK\x03\x04`) is walked directly in RAM without extracting file data.
2. **Entry Count Limit:** Capped at a maximum of 500 entries (exceeding count triggers immediate rejection).
3. **Decompressed Size Limit:** Capped at a maximum of 50MB aggregate declared uncompressed bytes.
4. **Compression Ratio Limit:** Capped at a maximum ratio of 20:1 (rejects files exceeding 20:1 ratio where uncompressed size > 1MB).
5. **Office Open XML Structure Verification:** Mandatory presence of `[Content_Types].xml`, `word/`, or `_rels/`. Arbitrary ZIP archives (e.g. scripts or malware packages renamed to `.docx`) are rejected with `INVALID_DOCX_PACKAGE`.

### Path Traversal Defense
- Untrusted filenames are sanitized with `path.basename()`, stripping directory traversal (`../`, `..\`), null bytes (`\0`), and control characters.
- Containment is asserted using Node's `path.relative(resolvedRoot, resolvedTarget)`. If the relative path begins with `..` or is absolute, `PATH_TRAVERSAL_BLOCKED` (`403`) is thrown.

---

## 5. Malware Scanner Architecture & Trust Lifecycle

### Fail-Closed Scanner Execution Flow
The `MalwareScannerService` adapter manages virus scanner execution (`child_process.execFile` with argument arrays to prevent shell injection).

```
File Uploaded & Binary Validated
           │
           ▼
MALWARE_SCANNER_ENABLED?
  ├── [YES] ──► Execute scanner command (e.g. clamscan)
  │               ├── Clean exit (0 threats) ──► validation_status: 'valid' | malware_scan_status: 'clean' (ACCEPTED)
  │               ├── Virus detected (exit 1 / FOUND) ──► 400 MALICIOUS_FILE_DETECTED + Unlink files + Audit event
  │               └── Command failure (ENOENT / error / timeout) ──► 500 SCANNER_UNAVAILABLE + Unlink files + Fail closed
  │
  └── [NO] ──► validation_status: 'pending' | malware_scan_status: 'skipped' (QUARANTINED / UNTRUSTED)
```

### Trust Boundary Verification (`isDocumentTrusted` & `assertDocumentTrusted`)
To enforce that pending or skipped documents cannot be casually treated as verified:
- **`isDocumentTrusted(doc)`**: Returns `true` IF AND ONLY IF `doc.validation_status === 'valid' && doc.malware_scan_status === 'clean'`.
- **`assertDocumentTrusted(doc)`**: Throws HTTP 403 `DOCUMENT_UNTRUSTED` if any document has status `pending`, `skipped`, `scan_failed`, or `infected`.
- **Private Access:** No public document download route exists in Phase 6. Future authenticated retrieval services in Phase 11 must call `assertDocumentTrusted` before streaming file bytes.

---

## 6. Database Integration & Transactional Consistency

### Database Baseline (Phase 2 Schema Preservation)
Phase 6 uses the existing Phase 2 MariaDB relational schema without requiring structural alterations or migrations:
- **`visa_services`**: Canonical catalog queried by `slug` or `service_code` (`freelance_2y`, `visit_30d`, `visit_60d`).
- **`enquiries`**: Root parent record (`id`, `enquiry_type: 'visa'`, `status: 'new'`, `full_name`, `email`, `phone`, `whatsapp`, `nationality`, `subject`, `message`, `source_channel: 'website'`).
- **`visa_enquiries`**: 1-to-1 extension record (`enquiry_id`, `visa_service_id`, `duration_days`, `applicant_count`, `notes`).
- **`documents`**: Document metadata records (`entity_type: 'enquiry'`, `entity_id`, `document_category: 'passport_copy'`, `original_filename`, `storage_key`, `mime_type`, `file_extension`, `file_size_bytes`, `sha256_hash`, `validation_status`, `malware_scan_status`, `retention_status: 'active'`).
- **`audit_logs`**: Append-only security audit log (`actor_admin_id: null`, `action: 'visa_enquiry_submitted'`, `resource_type: 'enquiry'`, `client_ip`, `request_id`, `details_json`).

### Transaction & Rollback Compensation Strategy
Because filesystem writes cannot participate directly in MariaDB two-phase commit:
1. Files are validated in RAM and written to physical storage.
2. The atomic MariaDB transaction (`withTransaction`) begins.
3. If MariaDB persistence fails (e.g. database timeout, deadlock, constraint violation):
   - MariaDB automatically issues `ROLLBACK`.
   - The application catches the failure and triggers explicit **compensation cleanup** (`storageService.cleanupFiles`), immediately unlinking all newly written files and removing the empty enquiry directory.
4. If transaction commits successfully:
   - File bytes and database metadata remain consistent.
   - Non-fatal audit log is recorded asynchronously.

---

## 7. Frontend Integration & User Experience

- **Route:** `/visa-enquiry`
- **Component:** `frontend/components/forms/VisaEnquiryForm.tsx`
- **Styling:** `frontend/components/forms/Forms.module.css`
- **Features:**
  - Drag-and-drop interactive dropzone.
  - File picker browse button with accessible keyboard navigation (`Tab`, `Space`, `Enter`).
  - Real-time client-side pre-validation (extension check, 10MB per file limit, 5 files max).
  - Selected files preview list showing filename, formatted size, and accessible "Remove document" button.
  - Total upload size indicator (e.g. `1.24 MB / 25 MB maximum`).
  - Form submission loading state with animated spinner and button disabling.
  - Dedicated success screen displaying the unique public reference badge (`CLC-V-YYYY-XXXX`) and clear follow-up instructions.
  - Accessible error callouts announcing server-side validation and rate-limiting messages (`role="alert"`).
  - Preserved light/dark mode glassmorphic styling, responsive layout, and UAE editorial visual identity.

---

## 8. Verification & Quality Gates

| Quality Gate | Command | Status | Result |
| :--- | :--- | :--- | :--- |
| **TypeScript Typecheck** | `npm run typecheck` | **PASS** | 0 errors across `@cityline/shared`, `@cityline/backend`, `@cityline/frontend` |
| **Code Style & Linting** | `npm run lint` | **PASS** | 0 ESLint warnings or errors |
| **Full Backend Test Suite** | `npm run test` | **PASS** | **146 passing tests** across 25 test suites (0 failures) |
| **Document Security Tests** | `tsx --test tests/document-security.test.ts` | **PASS** | 24 tests: magic bytes, sanitization, zip bomb, mime check |
| **Storage Isolation Tests** | `tsx --test tests/storage-service.test.ts` | **PASS** | 5 tests: webroot isolation, path traversal, orphan cleanup |
| **Visa Integration Tests** | `tsx --test tests/visa-enquiry.test.ts` | **PASS** | 20 tests: submission, validation, rate limits, compensation, private storage, scanner paths, trust boundary, multipart limits |
| **Environment Pre-Flight** | `npm run verify:env` | **PASS** | Storage isolation verified outside webroot |
| **Production Build** | `npm run build` | **PASS** | Next.js 19 routes + Shared + Backend built successfully |
| **Git Diff Check** | `git diff --check` | **PASS** | Clean whitespace, no merge markers |

---

## 9. Deferred Functionality (Strictly Out of Scope)

The following capabilities are deliberately **not** implemented in Phase 6 and remain strictly deferred:
- **Phase 7:** SMTP notification dispatch, email queue, and admin email alerts.
- **Phase 8:** Job applications, recruitment resumes, and candidate document storage.
- **Phase 9:** Employer manpower enquiry processing.
- **Phase 10:** Testimonials management.
- **Phase 11:** Admin dashboard enquiry review UI, document download endpoints, and status management.
- **Phase 12:** Analytics / visitor intelligence.
