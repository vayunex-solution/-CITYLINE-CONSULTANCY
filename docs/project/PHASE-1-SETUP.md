# CITYLINE CONSULTANCY — Phase 1: Repository & Development Environment Setup

**Document Version:** 1.0.0  
**Phase Status:** Ready for CTO Audit  
**Phase Ownership:** DevOps Engineer, Full-Stack Architect, Security Engineer  
**Brand Compliance:** CITYLINE CONSULTANCY (Zero legal suffixes in public brand assets)

---

## 1. Executive Summary

Phase 1 establishes the foundational engineering infrastructure for **CITYLINE CONSULTANCY**. It transitions the project from Phase 0 (Planning, Scope & Architecture Lock) into a fully executable, reproducible monorepo development environment.

No business features (visa applications, job postings, recruitment forms, admin dashboard, auth credentials) or database schemas/migrations are implemented in Phase 1. All work is strictly confined to tooling, architectural skeletons, security baselines, and development environment discovery.

---

## 2. Monorepo Architecture

The repository uses native **npm workspaces** to avoid extraneous build tooling overhead while ensuring strict module isolation.

```
/
├── .env.example                # Root environment template with security documentation
├── .gitignore                  # Comprehensive Git exclusion rules
├── .nvmrc                      # Node.js baseline (v20 development baseline)
├── package.json                # Root workspace orchestrator
├── README.md                   # Primary project onboarding guide
│
├── frontend/                   # Next.js 14 App Router (Vanilla CSS Design Tokens)
│   ├── app/
│   │   ├── globals.css         # Foundational design token architecture
│   │   ├── layout.tsx          # Root layout with theme initialization & SEO headers
│   │   └── page.tsx            # Minimal development verification shell
│   ├── components/             # Reusable UI primitives (e.g., ThemeToggle)
│   ├── lib/                    # Client utilities & API client
│   ├── public/                 # Static public assets strictly (no private files)
│   ├── next.config.mjs         # Next.js compiler & export configuration
│   ├── package.json            # @cityline/frontend package manifest
│   ├── tsconfig.json           # Strict TypeScript configuration
│   └── .env.example            # Frontend environment template
│
├── backend/                    # Node.js TypeScript REST API (Express)
│   ├── src/
│   │   ├── config/             # Zod environment & storage configurations
│   │   ├── controllers/        # Health controller
│   │   ├── middleware/         # Request ID, request logger, centralized error handler, validation
│   │   ├── repositories/       # Base repository interface contract (Phase 2 ready)
│   │   ├── routes/             # Root & versioned API routes (/health, /api/v1/health)
│   │   ├── services/           # Health check service
│   │   ├── types/              # Express type augmentations
│   │   ├── utils/              # Structured logger, AppError, ApiResponse helpers
│   │   ├── app.ts              # Express application factory
│   │   └── server.ts           # Server entry point & graceful shutdown
│   ├── tests/                  # Automated integration tests (node:test + supertest)
│   ├── package.json            # @cityline/backend package manifest
│   ├── tsconfig.json           # Strict TypeScript configuration
│   └── .env.example            # Backend environment template
│
├── shared/                     # Shared TypeScript contracts & schemas
│   ├── src/
│   │   ├── types/              # API envelopes, common domain enums
│   │   ├── schemas/            # Reusable Zod validation schemas
│   │   └── index.ts            # Central package exports
│   ├── package.json            # @cityline/shared package manifest
│   └── tsconfig.json           # Strict declaration generator
│
├── storage/                    # Local development private file storage scaffold
│   ├── documents/              # Client identity & visa documents (strictly unexposed)
│   ├── resumes/                # Candidate CVs/resumes (strictly unexposed)
│   └── temporary/              # Temporary upload staging
│
├── scripts/
│   └── verify-dev-env.js       # Pre-flight environment & storage isolation checker
│
└── docs/                       # Authoritative Phase 0 & Phase 1 documentation
```

---

## 3. Technology Evaluation & Key Decisions

### 3.1 Backend Framework: Express vs Fastify
- **Decision:** **Express 4.x**
- **Rationale:** 
  1. The target deployment environment is cPanel with Phusion Passenger. Phusion Passenger's Node.js loader natively binds to standard Node `http.Server` request listener interfaces.
  2. Express has zero native compilation dependencies, minimizing deployment friction across shared hosting environments.
  3. Fastify's performance benefits are negligible at the anticipated traffic volume and introduce Passenger lifecycle complexities.

### 3.2 Frontend Styling: Vanilla CSS Design Tokens vs TailwindCSS
- **Decision:** **Vanilla CSS with CSS Custom Properties (Design Tokens)**
- **Rationale:**
  1. Adheres to strict system guidelines against unsolicited TailwindCSS installations.
  2. Full control over glassmorphism, backdrop filters, glossy surfaces, and UAE-oriented metallic accents without build-tool post-processing fragility.
  3. Native browser support for runtime theme switching (`data-theme="light"` / `data-theme="dark"`).

### 3.3 Test Runner: Node.js Native Test Runner (`node:test`) + `supertest`
- **Decision:** Native Node.js Test Runner executed via `tsx --test`
- **Rationale:**
  1. Zero extra test framework bloat (no Jest, Vitest, or Babel transforms required).
  2. Native execution speed and full TypeScript compatibility via TSX.

---

## 4. Security Architecture

### 4.1 Private Storage Isolation
- Private client documents, CVs, and passports **must never be accessible via HTTP GET directly from the web root**.
- The `storage/` directory is isolated outside `frontend/public`, `public_html`, and `backend/public`.
- Tested and verified by `scripts/verify-dev-env.js`.
- Actual upload endpoints and authenticated streaming handlers are strictly reserved for Phase 6.

### 4.2 Error Handling & Information Leakage Prevention
- All errors are captured by `errorHandlerMiddleware`.
- In `production`, internal error messages and stack traces are suppressed, returning a safe generic message: `"An unexpected internal error occurred. Please contact support."`
- In `development`, detailed diagnostic traces are returned for efficient debugging.
- No database credentials, server paths, or secrets are ever leaked in responses.

### 4.3 Structured Logging & Data Redaction
- Structured JSON logging via `src/utils/logger.ts`.
- Every incoming request is stamped with a unique `x-request-id` (UUIDv4) that propagates through logs and API response headers.
- Automatic deep redaction filters out sensitive keys: `password`, `token`, `authorization`, `cookie`, `secret`, `cv`, `passport`, `buffer`, etc.

---

## 5. Host Discovery Status (cPanel / Production)

As established in the Phase 0 CTO Audit, all production host parameters remain strictly **UNVERIFIED** pending direct cPanel / SSH access.

| Host Parameter | Status | Phase 1 Finding / Baseline |
| :--- | :--- | :--- |
| **Local Node.js** | VERIFIED | `v24.19.0` (Development Baseline) |
| **Local npm** | VERIFIED | `11.17.0` (Development Baseline) |
| **Production Node.js** | UNVERIFIED | Pending cPanel inspection (baseline: `>= 18.0.0`) |
| **Production DB Engine** | UNVERIFIED | MySQL / MariaDB version unknown |
| **Production DB Collation**| UNVERIFIED | Baseline `utf8mb4_unicode_ci` planned |
| **Production DB max_connections** | UNVERIFIED | Host inspection required |
| **Phusion Passenger** | UNVERIFIED | Host inspection required |
| **Outbound SMTP Ports** | UNVERIFIED | Ports 587 / 465 status unconfirmed |
| **ClamAV Antivirus** | UNVERIFIED | Antivirus binary availability unconfirmed |
| **Deployment Mode** | PROPOSED | Next.js Static Export + Node.js REST API under Passenger |

---

## 6. Verification & Quality Gates

The development environment satisfies all Phase 1 requirements:
- [x] Workspace orchestration with npm workspaces.
- [x] Strict TypeScript configuration across `shared`, `backend`, and `frontend`.
- [x] Zero Phase 2+ features implemented (no database tables, no mock forms, no fake marketing copy).
- [x] `verify:env` script confirms Node version, `.env` presence/template, and storage isolation.
- [x] Automated test suite verifies health endpoint and 404 handler.
- [x] Git repository state inspected and preserved.

---

## 7. Next Phase: Phase 2 (Database Architecture)

Upon CTO approval of Phase 1, Phase 2 will implement:
1. Production database engine verification or adapter compatibility layer.
2. Migration tooling (Knex / Prisma / native SQL migrations).
3. Schema definitions based on the Phase 0 Domain Model (`enquiries`, `jobs`, `applications`, `admin_users`, `audit_logs`).
4. Connection pooling and health checks.
5. Repository implementations adhering to `BaseRepository<T>`.
