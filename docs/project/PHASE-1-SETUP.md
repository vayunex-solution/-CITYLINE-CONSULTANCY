# CITYLINE CONSULTANCY — Phase 1: Repository & Development Environment Setup

**Document Version:** 1.1.0 (CTO Consolidated Correction Pass)  
**Phase Status:** Ready for Final CTO Audit  
**Phase Ownership:** DevOps Engineer, Full-Stack Architect, Security Engineer  
**Brand Compliance:** CITYLINE CONSULTANCY (Strictly zero legal suffixes in public copy)

---

## 1. Executive Summary

Phase 1 establishes the development foundation, tooling, configuration, layered architectural skeletons, and hosting-discovery baselines for **CITYLINE CONSULTANCY**.

Following the consolidated CTO correction pass:
1. **GitHub Remote Security**: All remote URLs are verified completely credential-free.
2. **Private File Storage**: Re-anchored to configuration-driven canonical paths outside the repository (`~/clc_storage/` for development, `/home/<cpanel-user>/clc_storage/` for production).
3. **Node Version Strategy**: Clarified three-tier strategy distinguishing local runtime (`v24.19.0`), development baseline (`v20.x`), and unverified production cPanel status.
4. **Health Endpoint Information Disclosure**: Minimized public responses to strictly `{ status: "ok" }`, suppressing environment, database, storage, and version details.
5. **Express ADR Justification**: Strengthened architectural rationale covering ecosystem maturity, maintainability, middleware support, operational simplicity, and deployment reliability.
6. **Shared Package Boundaries**: Formally demarcated shared cross-layer contracts from Phase 2 database authority.

---

## 2. Monorepo Architecture

The repository employs native **npm workspaces** managing three decoupled packages:

```
/
├── .env.example                # Root environment template (STORAGE_ROOT=~/clc_storage)
├── .gitignore                  # Security exclusions (.env, storage, dist, node_modules)
├── .nvmrc                      # Node.js development baseline (20)
├── package.json                # Root workspace orchestrator
├── README.md                   # Primary project onboarding guide
│
├── frontend/                   # Next.js 14 App Router (Vanilla CSS Design Tokens)
│   ├── app/
│   │   ├── globals.css         # Foundational design token architecture
│   │   ├── layout.tsx          # Root layout with theme initialization & SEO headers
│   │   └── page.tsx            # Minimal development verification shell
│   ├── components/             # Reusable UI primitives (ThemeToggle)
│   ├── lib/                    # Client utilities & API client
│   ├── public/                 # Static public assets strictly (no private files)
│   ├── next.config.mjs         # Next.js compiler & transpilePackages configuration
│   ├── package.json            # @cityline/frontend package manifest
│   ├── tsconfig.json           # Strict TypeScript configuration
│   └── .env.example            # Frontend environment template
│
├── backend/                    # Node.js TypeScript REST API (Express)
│   ├── src/
│   │   ├── config/             # Zod environment, database, & storage configurations
│   │   ├── controllers/        # Health controller (minimal disclosure)
│   │   ├── middleware/         # Request ID, request logger, error handler, validation
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
├── scripts/
│   └── verify-dev-env.js       # Pre-flight environment, Node & storage isolation auditor
│
└── docs/                       # Authoritative Phase 0 & Phase 1 documentation
```

---

## 3. Technology Evaluation & Architectural Decisions

### 3.1 Backend Framework Selection: Express 4.x
The project adopts **Express 4.x** based on the following comprehensive evaluation:
1. **cPanel & Phusion Passenger Deployment Simplicity**: Phusion Passenger natively boots standard Node.js applications that export an `http.Server` request listener callback (`(req, res) => ...`). Express integrates directly with this mechanism with zero translation wrappers or IPC socket configurations.
2. **Ecosystem Maturity & Battle-Tested Stability**: Express has over a decade of production hardening, ensuring zero unexpected edge cases or breaking framework churn during the platform lifecycle.
3. **Project & Team Maintainability**: Idiomatic Express patterns are universally understood across full-stack engineering teams, minimizing onboarding overhead and cognitive burden.
4. **Rich Middleware Ecosystem**: Native integration with enterprise-grade middleware (`helmet`, `cors`, custom correlation tracers, body parsers) without plugin encapsulation overhead.
5. **Operational Simplicity**: Clean, transparent request pipeline where debugging, stack tracing, and middleware ordering are predictable and easily auditable.
6. **Proportional Complexity**: Cityline Consultancy’s REST API (handling enquiry submissions, job vacancies, applications, and admin operations) does not require asynchronous stream-based micro-framework optimizations that introduce operational friction on shared hosting.

### 3.2 Frontend Styling: Vanilla CSS Design Tokens
1. **No TailwindCSS Bloat**: Strictly adheres to system instructions against unrequested TailwindCSS.
2. **Runtime Theme Control**: CSS custom properties natively support dynamic theme switching (`data-theme="light"` / `data-theme="dark"`) without hydration mismatches.
3. **Glassmorphism & Brand Aesthetics**: Direct control over backdrop filters, glossy gradients, and UAE-oriented metallic accents.

### 3.3 Test Runner: Node.js Native Test Runner (`node:test`) + `supertest`
1. Zero framework overhead (no Jest/Vitest bundle complexity).
2. Native execution speed and direct TypeScript execution via TSX.

---

## 4. Security Architecture & Corrections

### 4.1 GitHub Credential Security
- **Correction Applied**: Remote configuration is strictly verified as credential-free:
  `https://github.com/vayunex-solution/-CITYLINE-CONSULTANCY.git`
- **Security Notice**: Credential-bearing GitHub URL was detected during initial setup. Remote configuration was normalized to a credential-free URL. The previously exposed PAT must be revoked/rotated by the repository owner.

### 4.2 Canonical Private Storage Physical Isolation
- **Security Boundary**: The physical location outside the webroot is the real security boundary. `.gitignore` is an exclusion tool, not a security boundary.
- **Canonical Locations**:
  - **Local Development**: `~/clc_storage/` (e.g. `C:\Users\<user>\clc_storage\` or `/home/<user>/clc_storage/`).
  - **Production cPanel**: `/home/<cpanel-user>/clc_storage/` (strictly outside `public_html`).
- **Prohibited Locations**:
  - `frontend/public/`
  - `frontend/public_html/`
  - `public_html/`
  - `backend/public/`
  - `repository-root/storage/`
- **Directory Structure**:
  - `~/clc_storage/documents/` (passports, identity files)
  - `~/clc_storage/resumes/` (candidate CVs)
  - `~/clc_storage/temporary/` (quarantine / staging)
- **Enforcement**: `backend/src/config/env.config.ts` and `scripts/verify-dev-env.js` programmatically abort execution if `STORAGE_ROOT` resolves inside any public webroot or repository-local storage directory.

### 4.3 Health Endpoint Information Disclosure Defense
- Public endpoints `GET /health` and `GET /api/v1/health` return strictly:
  ```json
  {
    "success": true,
    "data": {
      "status": "ok"
    },
    "timestamp": "2026-09-12T18:25:00.000Z",
    "requestId": "5e1f7a0c-4c6e-4e58-9a3d-c12b7a9e6d01"
  }
  ```
- **Information Suppressed**: `environment`, `database`, `storage`, `uptimeSeconds`, and `version` are strictly withheld from public probes to prevent reconnaissance by malicious actors.

### 4.4 Structured Logging & Data Redaction
- Correlation ID (`x-request-id` UUIDv4) stamped on all logs.
- Automatic deep redaction for sensitive keys (`password`, `token`, `authorization`, `cookie`, `secret`, `cv`, `passport`, `buffer`).

---

## 5. Node Version Strategy

The project implements a clear three-tier version policy:

1. **Local Development Runtime**: `v24.19.0` (Detected on local engineering workstation).
2. **Development Target Baseline**: `v20.x` LTS (Pinned in `.nvmrc` as development baseline).
3. **Production cPanel Target**: **UNVERIFIED — PENDING CPANEL INSPECTION**. The production Node.js runtime available in cPanel Application Manager must be inspected directly. The codebase targets ES2022/CommonJS and standard Node APIs compatible with any modern active LTS release (Node 18, 20, or 22).

---

## 6. Shared Package Boundary vs Phase 2 Database Authority

- **Shared Package Scope (`shared/`)**:
  - Encapsulates cross-layer contracts, uniform API envelopes (`ApiResponse<T>`, `ApiErrorResponse`), and generic query schemas (`paginationQuerySchema`).
  - Defines shared domain enums (`EnquiryType`, `JobStatus`, `AdminRole`) used across frontend forms and backend validation.
- **Phase 2 Database Authority**:
  - Phase 2 retains exclusive ownership of database schema definitions, table creation, migrations, column types, foreign keys, indexes, persistence logic, and transaction boundaries.
  - The shared package does NOT duplicate the database model.

---

## 7. Quality Gate Verification Results

| Target | Command | Result |
| :--- | :--- | :--- |
| **Pre-Flight Audit** | `npm run verify:env` | **PASS (0)** — Node runtime verified; canonical storage verified at `~/clc_storage/` |
| **Shared Build** | `npm run build:shared` | **PASS (0)** — TypeScript declarations generated in `shared/dist` |
| **Backend Build** | `npm run build:backend` | **PASS (0)** — Express backend compiled to `backend/dist` |
| **Frontend Build** | `npm run build:frontend` | **PASS (0)** — Next.js 14 static optimization complete |
| **Unified Build** | `npm run build` | **PASS (0)** — All workspaces compiled successfully |
| **Strict Typecheck** | `npm run typecheck` | **PASS (0)** — Zero TypeScript errors across all workspaces |
| **Linting** | `npm run lint` | **PASS (0)** — `✔ No ESLint warnings or errors` |
| **Automated Tests** | `npm run test` | **PASS (0)** — 3/3 passed (Health minimal disclosure, Prefix, 404 handler) |
| **Git Remote** | `git remote -v` | **PASS** — Clean credential-free GitHub URL |
