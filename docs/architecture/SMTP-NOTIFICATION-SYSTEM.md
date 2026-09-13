# CITYLINE CONSULTANCY — SMTP Transactional Notification Subsystem Architecture

**Phase:** Phase 7 — SMTP Notification System  
**Status:** Locked & Complete  
**Governance Authority:** Phase 0 Scope Lock + MariaDB Outbox Architecture  

---

## 1. System Objective & Core Philosophy

The transactional notification system provides high-reliability email dispatches for Cityline Consultancy inquiries (such as public Visa Enquiries) using a database-backed **Transactional Outbox** pattern.

### The Inviolable Core Philosophy:
> **DATABASE PERSISTENCE MUST NEVER DEPEND ON SMTP AVAILABILITY.**

If the mail server (`mail.citylineconsultancy.com`) is offline, unreachable, slow, drops connections, encounters authentication failures, or rate limits messages:
1. **The original business entity** (e.g. Visa Enquiry, customer details, quarantined document metadata) remains safely and completely committed in MariaDB.
2. **The outbound notification records** remain safely persisted in the `notification_queue` table in `pending` status.
3. **The public API response** returns HTTP 201 Created with the reference immediately without blocking on SMTP socket handshakes.
4. **SMTP failures never trigger a transaction rollback** or data loss.

---

## 2. Architectural Overview

```
[Public Website Client]
           │
           │ 1. POST /api/v1/visa-enquiries (Multipart/JSON)
           ▼
[VisaEnquiryService]
           │
           │ 2. Atomic MariaDB Transaction (BEGIN)
           ├───► Persist enquiries record
           ├───► Persist visa_enquiries record
           ├───► Persist documents metadata (quarantined)
           ├───► Enqueue Admin Notification (notification_queue)
           └───► Enqueue Applicant Confirmation (notification_queue)
           │
           │ 3. COMMIT Transaction
           ▼
[Client Response: HTTP 201 Created (Reference: CLC-V-YYYY-XXXXXXXX)]
           │
           │ (Asynchronous / Independent Execution)
           ▼
[Outbox Worker (Cron or CLI: npm run queue:process)]
           │
           ├───► 1. Atomically claims batch via row-level locking (FOR UPDATE)
           ├───► 2. Renders branded Cityline HTML & plain-text templates
           ├───► 3. Dispatches via Nodemailer pooled TLS connection (Port 465)
           ├───► 4. Success  ──► status = 'sent', sent_at = NOW()
           ├───► 5. Transient ──► status = 'failed', exponential backoff + jitter
           └───► 6. Exhausted ──► status = 'exhausted' (dead-letter after 5 attempts)
```

---

## 3. Environment Configuration & Secret Protection

All SMTP configurations are read strictly from environment variables via `@cityline/backend` Zod schema validation.

### Configuration Variables

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `SMTP_HOST` | string | `mail.citylineconsultancy.com` | Production SMTP hostname |
| `SMTP_PORT` | number | `465` | Implicit TLS port |
| `SMTP_USER` | string | `no-reply@citylineconsultancy.com` | Authenticated mailbox user |
| `SMTP_PASSWORD` | string | *(None)* | Authenticated mailbox password |
| `SMTP_FROM` | string | `"Cityline Consultancy <no-reply@citylineconsultancy.com>"` | Server-controlled From address |
| `SMTP_SECURE` | boolean | `true` | Implicit TLS connection flag |
| `SMTP_POOL` | boolean | `true` | Reusable pooled TCP connection |
| `SMTP_MAX_CONNECTIONS` | number | `3` | Conservative connection limit |
| `SMTP_MAX_MESSAGES` | number | `100` | Max messages per connection |
| `SMTP_CONNECTION_TIMEOUT_MS`| number | `10000` | Connection timeout (10s) |
| `SMTP_GREETING_TIMEOUT_MS` | number | `5000` | SMTP greeting timeout (5s) |
| `SMTP_SOCKET_TIMEOUT_MS` | number | `15000` | Socket inactivity timeout (15s)|
| `NOTIFICATION_ENABLED` | boolean | `true` | Subsystem master switch |
| `NOTIFICATION_MOCK_TRANSPORT` | boolean | `false` | Development / test mock flag |
| `NOTIFICATION_ADMIN_EMAIL` | string | REQUIRED in production (Dev: `dev-admin@example.test`) | Internal alert recipient. Cannot equal unmonitored sender `no-reply@citylineconsultancy.com` in production |
| `NOTIFICATION_MAX_ATTEMPTS` | number | `5` | Maximum retry attempts |
| `NOTIFICATION_RETRY_BASE_DELAY_MS` | number | `30000` | Base retry delay (30 seconds) |
| `NOTIFICATION_RETRY_MAX_DELAY_MS` | number | `3600000` | Maximum backoff cap (1 hour) |
| `NOTIFICATION_BATCH_SIZE` | number | `20` | Bounded batch per worker run |
| `NOTIFICATION_STALE_TIMEOUT_MS`| number | `600000` | Stale worker recovery (10 min) |

### Zero-Secret Leakage Guarantee:
- The actual `SMTP_PASSWORD` is **NEVER** hardcoded in repository files, tests, scripts, logs, error payloads, or Git commits.
- All operational and error loggers automatically sanitize and redact passwords and secret patterns.
- In `.env.example`, `SMTP_PASSWORD=` is strictly empty.

---

## 4. Notification Queue Lifecycle & State Transitions

The database table `notification_queue` acts as the authoritative outbox queue.

```
                  ┌──────────────────────┐
                  │       PENDING        │
                  └──────────┬───────────┘
                             │ Atomic claimBatch()
                             ▼
                  ┌──────────────────────┐
                  │      PROCESSING      │
                  └─────┬──────────┬─────┘
           Success      │          │ Failure
           ┌────────────┘          └────────────┐
           ▼                                    ▼
┌──────────────────────┐             ┌──────────────────────┐
│         SENT         │             │        FAILED        │
└──────────────────────┘             └──────────┬───────────┘
                                                │ retry_count < max
                                                ▼ (next_retry_at)
                                     ┌──────────────────────┐
                                     │      PROCESSING      │
                                     └──────────┬───────────┘
                                                │ retry_count >= max
                                                ▼ OR Permanent 5xx
                                     ┌──────────────────────┐
                                     │      EXHAUSTED       │
                                     │    (Dead Letter)     │
                                     └──────────────────────┘
```

1. **`pending`**: Record inserted during transaction. Ready for worker pickup.
2. **`processing`**: Atomically claimed by an active worker via `FOR UPDATE`.
3. **`sent`**: Successfully accepted by SMTP server. `sent_at` timestamp recorded.
4. **`failed`**: Delivery failed due to transient network timeout, socket reset, or temporary SMTP 4xx response. `retry_count` incremented, `next_retry_at` scheduled with exponential backoff.
5. **`exhausted`**: Dead-letter state. Triggered when:
   - `retry_count >= 5` max retry attempts reached.
   - Permanent SMTP failure occurs (e.g., SMTP 550 recipient rejected, syntax failure, invalid recipient format).
   - Permanent SMTP authentication failure (`EAUTH`, SMTP 535) or configuration failure (`ECONFIG`) occurs: transitions immediately to `exhausted` without wasting retries, preventing repeated failed authentication attempts that could lock out the mail account or trigger IP throttling.

---

## 5. Idempotency & Duplicate Prevention

Transactional emails must never be sent multiple times due to retries or redundant API submissions.

- Every queued notification generates a deterministic **SHA-256 Idempotency Hash**:
  - Admin Alert: `sha256("visa-enquiry:" + enquiryId + ":admin")`
  - Applicant Confirmation: `sha256("visa-enquiry:" + enquiryId + ":confirmation")`
- The `notification_queue` table enforces a **UNIQUE** index on `idempotency_hash`.
- Enqueue operations verify whether the idempotency hash is already registered and use `onConflict('idempotency_hash').ignore()` to prevent duplicate entries and avoid unhandled database errors.

---

## 6. Retry Strategy & Error Classification

Error classification strictly separates retryable transient failures from immediate permanent failures:

| Category | Indicators / Error Codes | Action |
| :--- | :--- | :--- |
| **Transient Network** | `ETIMEDOUT`, `ECONNRESET`, `ECONNREFUSED`, `ESOCKETTIMEDOUT` | Retry with exponential backoff + jitter |
| **Temporary SMTP (4xx)**| SMTP Status `4xx` (e.g. 421, 450, 451, 452) | Retry with exponential backoff + jitter |
| **Permanent Rejection** | SMTP Status `5xx` (e.g. 550, 551, 553), RFC syntax errors | Immediately `exhausted` (no retry) |
| **Authentication Failure**| Code `EAUTH`, SMTP Status 535, "invalid login" | Immediately `exhausted` (no retry; prevents lockout) |
| **Configuration Missing**| Code `ECONFIG`, missing host/credentials | Immediately `exhausted` (no retry; controlled error) |

Retry backoff calculation for transient errors:
$$\text{delay} = \min(\text{maxDelay}, \text{baseDelay} \times 2^{\text{retry\_count}}) + \text{random\_jitter}(0 \dots 1000\text{ms})$$

- **Attempt 1:** 30s delay + jitter
- **Attempt 2:** 60s delay + jitter
- **Attempt 3:** 120s delay + jitter
- **Attempt 4:** 240s delay + jitter
- **Attempt 5:** Final retry. If failed, moves directly to `exhausted`.

---

## 7. cPanel & Passenger Compatibility

The production environment is hosted on cPanel with CloudLinux/Passenger where continuous long-lived background daemons may be terminated or memory-constrained.

### Execution Model:
- **Bounded Single-Run Batch Worker:** The worker executes via `npm run queue:process` (invoking `backend/src/scripts/process-notification-queue.ts`).
- **Atomic Locking:** Because row-level locks (`FOR UPDATE`) are used during batch claiming, multiple cron runs overlapping will never process the same records.
- **Stale Worker Recovery:** If a process crashes or is killed by CloudLinux LVE while a notification is in `processing` status, subsequent worker runs automatically reclaim any record stuck in `processing` for longer than `NOTIFICATION_STALE_TIMEOUT_MS` (10 minutes).
- **Graceful Shutdown:** The worker destroys database pools and closes pooled SMTP sockets before exiting with exit code 0.

### Recommended cPanel Cron Setup:
To execute the worker every 2 minutes via cPanel Cron:
```bash
*/2 * * * * cd /home/<cpanel_user>/repositories/CLC-Website/backend && npm run queue:process >> /home/<cpanel_user>/logs/notification_worker.log 2>&1
```

> [!IMPORTANT]
> **Phase 17 Deployment Verification Notice:**
> Do NOT assume `/usr/local/bin/node` or `tsx/register` exists on the target production cPanel environment. Exact production binary paths (`node`, `npm`) vary across cPanel / CloudLinux installations and will be verified and bound in Phase 17 (Deployment & Production Setup). The cron command above represents the standardized repository script invocation.

---

## 8. Email Templates & Content Security

Branded templates represent the visual identity of **Cityline Consultancy** (Navy `#0B192C`, Sand/Gold `#C5A880`, Slate `#334155`).

### Supported Templates:
1. **Admin Visa Enquiry Notification (`visa_enquiry_admin`)**:
   - Provides reference ID, applicant contact details, nationality, visa service title, timeline, and applicant count.
   - **Zero Document Attachments:** Sensitive passport scans and identity documents are **NEVER** transmitted as email attachments.
   - **Zero Storage Path Exposure:** Private filesystem paths and keys are withheld. Staff are instructed to review quarantined files securely via the authenticated admin portal.
2. **Applicant Visa Confirmation (`visa_enquiry_confirmation`)**:
   - Acknowledges receipt of the submission with the unique public reference ID (`CLC-V-YYYY-XXXXXXXX`).
   - Outlines subsequent advisory verification steps.
   - **Compliance Guarantee:** Contains strictly **NO** outcome promises, guarantees, or timeline promises ("guaranteed visa", "100% approval", "instant visa").
   - **No Pricing:** Strictly displays zero fee or price claims.
   - Discloses official UAE authority jurisdiction (GDRFA / ICP).

---

## 9. Operational Health & Observability

- Public endpoint `/api/v1/health` verifies application status without leaking SMTP host, credentials, or internal queues.
- Structured logs output JSON records including `notificationId`, `referenceId`, `notificationType`, sanitized recipient domain, and delivery duration in milliseconds.

---

## 10. Production Deployment Checklist
 
 1. [ ] Configure `SMTP_PASSWORD` in cPanel environment or private `.env` file.
 2. [ ] Ensure `NOTIFICATION_ADMIN_EMAIL` is explicitly set to the authorized administrative receiving inbox (never defaulted to `no-reply@citylineconsultancy.com`).
 3. [ ] Configure cPanel cron job executing `npm run queue:process` using the cPanel Node.js Selector resolved path.
 4. [ ] Verify outbound SMTP connection over port 465 implicit TLS.
 5. [ ] Inspect `notification_worker.log` for successful batch runs.
 
 ---
 
 ## 11. Verification Environment & Protocol Accuracy
 
 | Verification Item | Environment | Verified? | Notes |
 | :--- | :--- | :--- | :--- |
 | **SMTP TCP Connectivity** | Local Development | **YES** | TCP socket connection to `mail.citylineconsultancy.com:465` succeeds. |
 | **TLS Handshake** | Local Development | **YES** | Implicit TLS negotiated over port 465 with server certificates accepted. |
 | **SMTP AUTH Protocol Handshake** | Local Development | **YES** | Direct socket AUTH handshake authenticated with `235 Authentication succeeded`. |
 | **Actual Email Delivery to Inboxes** | Production Mailbox | **UNVERIFIED (Phase 17 Item)** | Live message dispatch was intentionally **NOT** executed to avoid polluting live recipient inboxes with test emails. Actual end-to-end delivery is deferred to Phase 17 staging/deployment verification. |
 | **Worker Cron Invocation** | cPanel Production | **UNVERIFIED (Phase 17 Item)** | Cron path and execution schedule will be installed and verified in Phase 17. |
 | **Transactional Outbox Decoupling**| Local Test Suite | **YES (Mocked)** | 179 automated tests confirm atomicity, retry backoff, error classification, and dead-letter handling. |
