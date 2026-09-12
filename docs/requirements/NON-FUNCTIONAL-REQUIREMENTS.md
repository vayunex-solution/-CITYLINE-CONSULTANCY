# CITYLINE CONSULTANCY — Non-Functional Requirements Specification (NFRS)

> **Document Status**: Confirmed Baseline  
> **Phase**: Phase 0 — Foundation, Discovery & Scope Lock  
> **Standard**: ISO/IEC 25010 Software Quality Standards  
> **Classification Tagging**: Tagged with `[CONFIRMED]`, `[PROPOSED]`, `[CONSTRAINT]`, or `[RISK]`.

---

## 1. Security Requirements (NFR-SEC)

| Req ID | Requirement Specification | Metric / Threshold | Classification |
| :--- | :--- | :--- | :--- |
| **NFR-SEC-01** | **Private File Isolation** | 100% of uploaded applicant documents stored in local filesystem outside webroot (`/home/user/clc_storage/`). Zero direct web HTTP access. | `[CONFIRMED]` |
| **NFR-SEC-02** | **File Upload Sanitization** | Cryptographic random filename generation (UUIDv4); whitelist MIME checking; binary magic-byte inspection; strict denial of `.php`, `.phtml`, `.js`, `.sh`, `.exe`, `.cgi`, `.bat`, `.svg`. | `[CONFIRMED]` |
| **NFR-SEC-03** | **Administrative Authentication** | Password hashing utilizing Argon2id or bcrypt (cost factor 12); session tokens transmitted exclusively via `HttpOnly`, `SameSite=Strict`, `Secure` cookies. | `[CONFIRMED]` |
| **NFR-SEC-04** | **Login Protection & Anti-DoS Throttling** | Multi-tier rate limiting avoiding account lockout Denial-of-Service: (1) IP-level throttling (max 10 attempts / 15 mins per IP), (2) Progressive exponential response delay (500ms, 1s, 2s, 4s) upon consecutive failures, (3) Generic failure messages ("Invalid credentials"), (4) Append-oriented audit logging of all attempts. Account-level temporary lockouts applied conservatively with admin unlock capability. | `[PROPOSED]` |
| **NFR-SEC-05** | **SQL Injection Prevention** | 100% of database queries executed via parameterized prepared statements / type-safe query builders. Raw string concatenation prohibited. | `[CONFIRMED]` |
| **NFR-SEC-06** | **XSS & Content Security Policy** | Strict output encoding on all user-supplied content; React auto-escaping; HTTP Content-Security-Policy (CSP) headers disallowing unsafe inline scripts. | `[CONFIRMED]` |
| **NFR-SEC-07** | **Indirect Object Reference (IDOR)** | Public download endpoints must not accept sequential integer IDs. Secure streaming endpoints must enforce authenticated admin session verification. | `[CONFIRMED]` |
| **NFR-SEC-08** | **Error Leakage Prevention** | Production environment must suppress stack traces, database schemas, and system paths. Generic error messages presented to clients; details logged internally. | `[CONFIRMED]` |
| **NFR-SEC-09** | **CSRF & CORS Defense** | State-changing administrative requests (POST, PUT, DELETE) protected via: (1) `SameSite=Strict` cookie policy, (2) Strict `Origin` and `Referer` validation, (3) Custom request header requirement (`X-Requested-With` or Anti-CSRF token), (4) Strict CORS whitelist restricting API access solely to authorized platform domains. | `[CONFIRMED]` |
| **NFR-SEC-10** | **DOCX Archive & Zip-Bomb Protection** | Uploaded `.docx` files validated against decompression bombs: maximum uncompressed payload cap 25 MB, maximum decompression ratio 10:1, maximum entry count 250 files, and rejection of recursive archives. | `[PROPOSED]` |

---

## 2. Storage & Environmental Constraints (NFR-STOR)

| Req ID | Requirement Specification | Metric / Threshold | Classification |
| :--- | :--- | :--- | :--- |
| **NFR-STOR-01** | **Hosting Disk Allocation** | Storage footprint for application code, database, and uploaded documents must operate safely within the confirmed **100 GB cPanel limit**. | `[CONSTRAINT]` |
| **NFR-STOR-02** | **File Upload Size Quotas** | Individual applicant document upload cap: 10 MB per file. Maximum aggregate payload per submission: 30 MB. Resume CV cap: 5 MB. | `[PROPOSED]` |
| **NFR-STOR-03** | **Storage Monitoring & Upload Rejection** | Admin Dashboard shall render an active storage meter. Proposed Warning Threshold: 80% (80 GB). Proposed Critical Threshold: 90% (90 GB), at which point new public file uploads are automatically rejected with a friendly capacity notice to protect server stability. | `[PROPOSED]` |
| **NFR-STOR-04** | **Document Retention & Secure Purge** | System architecture must support a defined lifecycle (`Active` -> `Processing` -> `Closed` -> `Retention` -> `Purge`). Authorized purge permanently unlinks binary files from disk and marks database metadata purged. Final retention window duration remains OPEN pending client decision. | `[PROPOSED]` |

---

## 3. Performance & Web Vitals (NFR-PERF)

| Req ID | Requirement Specification | Target Benchmark | Classification |
| :--- | :--- | :--- | :--- |
| **NFR-PERF-01** | **Largest Contentful Paint (LCP)** | LCP <= 2.5 seconds on desktop and <= 3.0 seconds on standard 4G mobile connections. | `[PROPOSED]` |
| **NFR-PERF-02** | **Interaction to Next Paint (INP)** | INP <= 200 milliseconds across all interactive components (modals, filters, theme toggles). | `[PROPOSED]` |
| **NFR-PERF-03** | **Cumulative Layout Shift (CLS)** | CLS <= 0.1 during initial page load, font rendering, and theme hydration. | `[PROPOSED]` |
| **NFR-PERF-04** | **Hero Video Optimization** | Cinematic hero background video encoded in highly compressed WebM (VP9) and MP4 (H.264); maximum file weight <= 4.5 MB; static fallback poster image rendered instantly. | `[CONFIRMED]` |
| **NFR-PERF-05** | **API Response Latency** | p95 API response time <= 300 ms for database reads and <= 800 ms for multipart file uploads. | `[PROPOSED]` |
| **NFR-PERF-06** | **Search & Filtering Latency** | Jobs board category and keyword filtering execution <= 50 ms client-side or <= 150 ms server-side. | `[PROPOSED]` |

---

## 4. Reliability & Fault Tolerance (NFR-REL)

| Req ID | Requirement Specification | Operational Behavior | Classification |
| :--- | :--- | :--- | :--- |
| **NFR-REL-01** | **Database-First Queue Persistence** | Form submissions are committed to the database prior to notification creation. Under no circumstances shall an SMTP failure roll back or delete a submitted lead or job application. | `[CONFIRMED]` |
| **NFR-REL-02** | **Cron-Based Queue Dispatcher & Idempotency** | Notification dispatching is executed via a cron-driven worker. The queue records: `status`, `retry_count`, `next_retry_at` (exponential backoff), `last_error`, `sent_at`, and an `idempotency_hash` ensuring zero duplicate emails during retries. | `[CONFIRMED]` |
| **NFR-REL-03** | **Process Supervision** | Node.js application running via cPanel Application Manager / Phusion Passenger must automatically restart upon uncaught process exceptions. | `[CONSTRAINT]` |
| **NFR-REL-04** | **Database Connection Resilience** | Database connection pool must implement reconnect logic and keep-alive pings to survive cPanel idle connection drops. Target engine/version remains UNVERIFIED until host inspection. | `[CONSTRAINT]` |

---

## 5. Usability & Accessibility (NFR-USAB)

| Req ID | Requirement Specification | Standard / Guideline | Classification |
| :--- | :--- | :--- | :--- |
| **NFR-USAB-01** | **Dual Lighting Fidelity** | Complete styling parity across Light and Dark modes. Contrast ratios for text and actionable elements must meet WCAG 2.1 AA (minimum 4.5:1 for standard text, 3:1 for large text). | `[CONFIRMED]` |
| **NFR-USAB-02** | **Mobile-First Responsiveness** | Flawless rendering across viewports from 320px (compact mobile) to 2560px (4K display). All touch targets must adhere to minimum 44px x 44px clickable area. | `[CONFIRMED]` |
| **NFR-USAB-03** | **Accessible Form Feedback** | Form fields must present explicit label associations, ARIA attributes for error states, and clear human-readable validation messages. | `[PROPOSED]` |

---

## 6. Compatibility & Code Standards (NFR-COMPAT)

| Req ID | Requirement Specification | Support Standard | Classification |
| :--- | :--- | :--- | :--- |
| **NFR-COMPAT-01**| **Browser Compatibility** | Verified compatibility with: Google Chrome (last 3 versions), Apple Safari (iOS & macOS last 3 versions), Mozilla Firefox (last 3 versions), Microsoft Edge (last 3 versions). | `[CONFIRMED]` |
| **NFR-COMPAT-02**| **Language & Typing** | 100% strict TypeScript across frontend and backend codebase to eliminate runtime type errors. | `[PROPOSED]` |
| **NFR-COMPAT-03**| **Code Modularity** | Modular architecture with strict separation between presentation, routing, business logic, and database persistence layers. | `[CONFIRMED]` |
