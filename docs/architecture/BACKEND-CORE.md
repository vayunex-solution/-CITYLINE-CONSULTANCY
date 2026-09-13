# CITYLINE CONSULTANCY — Backend Core Architecture Specification

**Document Version:** 3.0.0  
**Phase Status:** Phase 3 Implementation  
**Public Brand Name:** `CITYLINE CONSULTANCY` (Zero legal suffixes in public brand assets)

---

## 1. Executive Summary

This document specifies the backend core infrastructure for **CITYLINE CONSULTANCY**. Phase 3 establishes a clean, secure, scalable, and resilient foundation using **Node.js**, **Express**, **TypeScript**, **Knex.js**, and the pure JavaScript **`mysql2`** driver, targeting **MariaDB 10.11 LTS** on CloudLinux / cPanel.

In strict compliance with project governance:
- **Phase 0, 1, and 2 remain locked.**
- **Phase 3 is infrastructure only.**
- Strictly **zero** business domain logic, authentication endpoints, file upload handlers, or mail dispatchers are implemented in this phase.

---

## 2. Directory Structure & Layer Responsibilities

```
backend/src/
├── app.ts                  # Express application factory & middleware pipeline wiring
├── server.ts               # HTTP listener entry point & graceful shutdown manager
├── config/
│   ├── env.config.ts       # Strictly typed environment variables with Zod validation
│   ├── database.config.ts  # Database connection, pooling, and MariaDB engine settings
│   ├── knex.config.ts      # Knexfile providing migration/seed configuration
│   └── storage.config.ts   # Private storage filesystem initialization (~/clc_storage/)
├── database/
│   ├── index.ts            # Central database exports
│   ├── connection.ts       # Singleton Knex client & pool lifecycle hooks
│   ├── transaction.ts      # Atomic transaction lifecycle runner (withTransaction)
│   ├── database-error.ts   # MariaDB/mysql2 error normalizer (prevents SQL leaks)
│   ├── migrations/         # Authoritative Phase 2 schema migrations
│   └── seeds/              # Phase 2 reference data seeds (Roles, Categories, Services)
├── repositories/
│   ├── index.ts            # Central repository foundation exports
│   └── base.repository.ts  # Generic BaseRepository interface & AbstractKnexRepository
├── middleware/
│   ├── index.ts            # Central middleware exports
│   ├── request-id.middleware.ts     # Correlation ID assignment & sanitation (X-Request-ID)
│   ├── request-logger.middleware.ts # Structured HTTP request/response logging
│   ├── error-handler.middleware.ts  # Centralized error handler with leak suppression
│   ├── not-found.middleware.ts      # Centralized 404 Route Not Found envelope
│   └── validate.middleware.ts       # Reusable Zod schema validation middleware
├── routes/
│   ├── index.ts            # Versioned API root router (/api/v1)
│   └── health.routes.ts    # Minimal information-disclosure health endpoints
├── utils/
│   ├── api-response.ts     # Uniform API response wrappers (sendSuccess, sendError)
│   ├── app-error.ts        # Operational application error classes with HTTP status codes
│   └── logger.ts           # Structured JSON logger with deep sensitive field redaction
└── types/
    └── express.d.ts        # Express Request augmentation (requestId typing)
```

---

## 3. Environment Configuration Reference

All backend runtime behavior is driven exclusively by validated environment variables.

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Enum | `development` | Runtime environment (`development`, `production`, `test`). |
| `PORT` | Number | `5000` | HTTP server listening port. |
| `HOST` | String | `0.0.0.0` | HTTP server binding interface. |
| `API_PREFIX` | String | `/api/v1` | Versioned route namespace prefix. |
| `CORS_ORIGIN` | String | `http://localhost:3000` | Comma-separated allowed CORS origins. |
| `STORAGE_ROOT` | Path | `~/clc_storage` | Private file storage directory (strictly outside webroot). |
| `DB_HOST` | String | `127.0.0.1` | Database server hostname or IP address. |
| `DB_PORT` | Number | `3306` | Database server TCP port. |
| `DB_NAME` | String | `clc_db` | Target database name (pre-created in cPanel). |
| `DB_USER` | String | `clc_user` | Database user account (least-privilege runtime account). |
| `DB_PASSWORD` | String | `""` | Database password (never logged or exposed). |
| `DB_SSL` | Boolean | `false` | Enable TLS/SSL connection to MariaDB. |
| `DB_POOL_MIN` | Number | `0` | Minimum active database pool connections (cPanel-tuned). |
| `DB_POOL_MAX` | Number | `5` | Maximum active database pool connections (cPanel-tuned). |
| `DB_TIMEOUT_MS` | Number | `10000` | Connection and query acquire timeout in milliseconds. |
| `LOG_LEVEL` | Enum | `info` | Minimum log level (`debug`, `info`, `warn`, `error`). |

### Fail-Fast Production Validation Rules:
1. **Empty Password Rejection**: In `NODE_ENV=production`, `DB_PASSWORD` must not be empty.
2. **Wildcard CORS Prohibition**: In `NODE_ENV=production`, `CORS_ORIGIN` must not contain `*`.
3. **Localhost CORS Prohibition**: In `NODE_ENV=production`, `CORS_ORIGIN` must not contain `localhost` or `127.0.0.1`.
4. **Physical Webroot Isolation**: `STORAGE_ROOT` must not resolve inside `frontend/public`, `backend/public`, `public_html`, or repository root.
5. **Secret Protection**: Error messages never echo raw passwords, tokens, or encryption keys.

---

## 4. Database Connection Architecture & Lifecycle

Phase 2 established the locked 18-table MariaDB schema, including normalized entities, foreign keys, indexes, lifecycle/delete policies, notification outbox infrastructure, document metadata, analytics tables, and audit logging. Phase 3 establishes the runtime connection, transaction runner, and error handling layers on top of this foundation.

### 4.1 Single Controlled Knex Client
- Connection management is centralized in [`src/database/connection.ts`](file:///d:/VAYUNEX/vayu-backup/CLC-Website/backend/src/database/connection.ts).
- Avoids connection leaks by enforcing a singleton Knex instance across the entire backend.
- Pure JavaScript `mysql2` driver avoids binary compilation failures on CloudLinux / cPanel.

### 4.2 Pool Sizing & Timezone Strategy
- **cPanel Conservative Limits**: `min: 0, max: 5` ensures processes that are idle release connection handles back to the MariaDB server without exhausting host limits (`max_connections = 151`).
- **UTC Timezone Enforcement**: Persists all timestamps in UTC (`timezone: 'Z'`). Schema and session initialize with `SET time_zone = '+00:00'`.

### 4.3 Lifecycle Hooks
- `initializeDatabase()`: Runs initial connectivity ping (`SELECT 1 as ping`) on startup.
- `checkDatabaseConnectivity()`: Returns safe `{ ok: boolean, error?: string }` without throwing unhandled exceptions.
- `closeDatabaseConnection()`: Gracefully destroys the connection pool during shutdown.

### 4.4 SSL & Deployment Topology Policy
- **Remote MariaDB SSL Status**: Port 3306 on the remote MariaDB host currently reports SSL disabled (`have_ssl: DISABLED`).
- **Network Security Policy**: Direct internet-facing remote DB connections should not be used for production.
- **Production Deployment Strategy**: Production connection topology remains to be verified during Phase 17 deployment. If the application and database are co-located on the cPanel host, use local connectivity (`127.0.0.1` or UNIX/local socket) and avoid exposing database traffic over the public network.

---

## 5. Transaction Foundation

The backend provides a reusable, atomic transaction runner in [`src/database/transaction.ts`](file:///d:/VAYUNEX/vayu-backup/CLC-Website/backend/src/database/transaction.ts):

```typescript
import { withTransaction } from '../database/transaction';

// Usage in future business modules
const result = await withTransaction(async (trx) => {
  const enquiry = await enquiryRepo.create({ full_name: 'Applicant' }, trx);
  await visaEnquiryRepo.create({ enquiry_id: enquiry.id }, trx);
  return enquiry;
});
```

### Key Guarantees:
1. **Atomic Boundaries**: Automatically issues `COMMIT` on successful callback resolution.
2. **Automatic Rollback**: Automatically issues `ROLLBACK` if the callback throws, preventing partial state corruption.
3. **Error Propagation**: Normalizes and propagates the original exception without swallowing.
4. **Nested Propagation**: Accepts an optional `existingTrx` parameter. If present, the callback executes within the existing transaction context rather than creating duplicate sub-transactions.

---

## 6. Generic Repository & Data Access Foundation

Data access conventions are formalized in [`src/repositories/base.repository.ts`](file:///d:/VAYUNEX/vayu-backup/CLC-Website/backend/src/repositories/base.repository.ts) via `AbstractKnexRepository`:

### 6.1 Generic Operations Provided
- `findById(id: TId, trx?: Knex.Transaction): Promise<T | null>`
- `findAll(filter?: Partial<T>, trx?: Knex.Transaction): Promise<T[]>`
- `findPaginated(options?: PaginationOptions, filter?: Partial<T>, trx?: Knex.Transaction): Promise<PaginatedResult<T>>`
- `create(item: Partial<T>, trx?: Knex.Transaction): Promise<T>`
- `update(id: TId, item: Partial<T>, trx?: Knex.Transaction): Promise<T | null>`
- `delete(id: TId, trx?: Knex.Transaction): Promise<boolean>`
- `count(filter?: Partial<T>, trx?: Knex.Transaction): Promise<number>`

### 6.2 Standard Pagination Convention
- Default page size: `20` (clamped between `1` and `100`).
- Mathematical response envelope:
  ```json
  {
    "items": [],
    "total": 45,
    "page": 2,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": true
  }
  ```
- Transparent error normalization: All query executions wrap errors with `normalizeDatabaseError` to ensure zero internal schema leaks.

---

## 7. API Versioning & Response Conventions

### 7.1 Namespace Hierarchy
All API endpoints reside strictly under the versioned prefix:
```
/api/v1/
```
Direct `/health` is additionally provided for load balancers and cPanel Passenger monitoring.

### 7.2 Uniform Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-09-13T00:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 7.3 Uniform Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_RECORD",
    "message": "A record with the specified unique information already exists."
  },
  "timestamp": "2026-09-13T00:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 8. Database Error Normalization

Low-level database exceptions are normalized in [`src/database/database-error.ts`](file:///d:/VAYUNEX/vayu-backup/CLC-Website/backend/src/database/database-error.ts):

| MariaDB / MySQL Error | Errno | Normalized HTTP Status | Normalized App Code | Client Message |
| :--- | :---: | :---: | :--- | :--- |
| `ER_DUP_ENTRY` | 1062 | **409 Conflict** | `DUPLICATE_RECORD` | A record with the specified unique information already exists. |
| `ER_NO_REFERENCED_ROW_2` | 1452 | **400 Bad Request** | `FOREIGN_KEY_VIOLATION` | Referenced entity does not exist. |
| `ER_ROW_IS_REFERENCED_2` | 1451 | **409 Conflict** | `RECORD_IN_USE` | Cannot complete operation because the record is referenced by other active entities. |
| `ER_DATA_TOO_LONG` | 1406 | **400 Bad Request** | `DATA_TOO_LONG` | Input value exceeds the maximum allowable length for this field. |
| `ECONNREFUSED` / `ETIMEDOUT` | - | **503 Unavailable** | `DATABASE_UNAVAILABLE` | Database service is temporarily unavailable. Please try again later. |
| Unhandled SQL Exception | - | **500 Internal** | `DATABASE_ERROR` | A database error occurred while processing your request. |

**Information Disclosure Safeguard:** The raw SQL statement, table name, constraint key, and bound parameters are strictly redacted from client-facing responses.

---

## 9. Security Baseline & Middleware Pipeline

1. **Helmet HTTP Headers**:
   - `X-Content-Type-Options: nosniff` (MIME sniffing defense).
   - `X-Frame-Options: SAMEORIGIN` (Clickjacking defense).
   - Content Security Policy (CSP) enabled in production.
2. **Controlled CORS**:
   - Explicit whitelist origin matching via `CORS_ORIGIN`.
   - Wildcards (`*`) with credentials strictly prohibited in production.
   - Allowed headers: `Content-Type`, `Authorization`, `X-Request-ID`.
3. **Payload Size Limits**:
   - `express.json({ limit: '100kb' })`
   - `express.urlencoded({ extended: true, limit: '100kb' })`
   - Payloads exceeding 100kb are immediately rejected with HTTP `413 PAYLOAD_TOO_LARGE`.
4. **Correlation Tracing (`X-Request-ID`)**:
   - Incoming IDs validated against alphanumeric pattern (`^[a-zA-Z0-9_\-.]{8,64}$`).
   - If invalid or missing, generated via cryptographically strong `crypto.randomUUID()`.
   - Forwarded on outgoing responses and included in all structured logs.
5. **Structured Logging & Redaction**:
   - Structured JSON output with timestamp, level, method, path, statusCode, durationMs, and requestId.
   - Deep recursive redaction of sensitive property keys: `password`, `token`, `authorization`, `cookie`, `secret`, `cv`, `passport`, `buffer`.

---

## 10. Graceful Server Teardown

Graceful termination is orchestrated in [`src/server.ts`](file:///d:/VAYUNEX/vayu-backup/CLC-Website/backend/src/server.ts):
- Listens for `SIGTERM` and `SIGINT`.
- **Deduplication**: Flag `isShuttingDown` ignores duplicate signals.
- **Teardown Sequence**:
  1. Stops accepting new HTTP connections via `server.close()`.
  2. Waits for active in-flight requests to complete.
  3. Destroys the Knex connection pool via `closeDatabaseConnection()`.
  4. Exits with code `0`.
- **Safety Watchdog**: A 10-second unref timeout forces exit (`code 1`) if teardown is stalled by lingering connections.

---

## 11. Testing & Quality Verification

All automated tests are executable via:
```bash
npm run test
```

### Test Suite Inventory (44 Automated Tests Across 7 Suites):
1. **`Database Architecture & Schema Integrity`** (9 tests): All 18 tables, DDL constraints, foreign key actions, indexes, and seed conformity.
2. **`Health Check API Foundation`** (3 tests): Minimal health disclosure on `/health` and `/api/v1/health`.
3. **`Environment Configuration Architecture`** (6 tests): Valid configs, production fail-fast rules, CORS localhost bans, storage root validation, and secret protection.
4. **`Database Core & Transaction Foundation`** (9 tests): Pool configuration, singleton client, error normalizations, transaction commit, transaction rollback, and pool destruction.
5. **`HTTP Pipeline & Middleware Baseline`** (9 tests): Request ID generation, request ID forwarding, 404 responses, malformed JSON defense, 100kb body limit, Helmet headers, and CORS reflection.
6. **`Generic Repository Data Access Foundation`** (4 tests): CRUD contracts, pagination calculations, out-of-bounds sanitation, and error normalization.
7. **`Security Baseline & Information Leakage Defense`** (3 tests): Stack trace suppression, SQL leak defense, and logger deep redaction.

---

## 12. Phase Boundaries & Deferred Items
 
The following business features are **strictly deferred** to later phases:
- **PHASE 4** — Admin Authentication & Security Foundation
- **PHASE 5** — Public Website Implementation
- **PHASE 6** — Visa Enquiry + Document Upload System
- **PHASE 7** — SMTP Notification System
- **PHASE 8** — Jobs & Recruitment System
- **PHASE 9** — Employer / Manpower Enquiry System
- **PHASE 10** — Testimonials Management
- **PHASE 11** — Admin Dashboard & Management
- **PHASE 12** — Analytics / Visitor Intelligence
- **PHASE 13** — Frontend ↔ Backend Integration
- **PHASE 14** — Security Audit
- **PHASE 15** — QA / Testing
- **PHASE 16** — Performance + SEO
- **PHASE 17** — cPanel Production Deployment
- **PHASE 18** — Production Verification
- **PHASE 19** — Final Handover
