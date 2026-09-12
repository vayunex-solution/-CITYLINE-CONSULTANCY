# CITYLINE CONSULTANCY — Digital Web Platform

> **Project Status**: Phase 1 — Repository & Development Environment Setup (CTO Corrections Applied)  
> **Operational State**: Ready for Final CTO Audit  
> **Public Brand Name**: `CITYLINE CONSULTANCY` (Strictly zero legal suffixes in public copy)

---

## 1. Project Overview

**CITYLINE CONSULTANCY** is an elite UAE-focused consultancy operating across three core pillars:
1. **Visa Services**: 2-Year Freelance Visa assistance, 30-Day Visit Visa, and 60-Day Visit Visa.
2. **Business Setup**: UAE Company Formation and Setup advisory.
3. **Recruitment / Manpower**: Workforce supply across commercial, hospitality, construction, and logistics sectors.

---

## 2. Monorepo Repository Structure

The project is organized as a clean npm workspaces monorepo:

```
/
├── frontend/                   # Next.js 14 App Router (Vanilla CSS Design Tokens)
├── backend/                    # Node.js TypeScript REST API (Express)
├── shared/                     # Shared TypeScript types, contracts & schemas
├── docs/                       # Authoritative Phase 0 & Phase 1 documentation
├── scripts/                    # Development verification & automation scripts
├── package.json                # Root monorepo workspace orchestrator
├── .env.example                # Root environment configuration template
├── .gitignore                  # Security-first Git exclusion rules
└── .nvmrc                      # Node.js development baseline (20)
```

---

## 3. Node.js Version Strategy

The project implements a three-tier version policy:
- **Local Engineering Workstation**: Node.js `v24.19.0` (active local runtime).
- **Development Baseline**: Node.js `v20.x` LTS (defined in `.nvmrc`).
- **Production cPanel Environment**: **OPEN / UNVERIFIED** (pending direct cPanel host inspection). The codebase strictly targets standard ES2022/CommonJS APIs supported across all modern active LTS runtimes (Node 18, 20, 22).

---

## 4. Development Setup & Pre-Flight Audit

### 4.1 Prerequisites
- **Node.js**: `>= 18.0.0` (Development baseline `20.x`, local runtime `v24.19.0`)
- **npm**: `>= 9.0.0` (Local runtime `11.17.0`)
- **Git**: Configured with credential-free remote

### 4.2 Quick Start
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```

3. **Run Pre-Flight Environment Audit**:
   ```bash
   npm run verify:env
   ```

4. **Compile All Workspaces**:
   ```bash
   npm run build
   ```

5. **Start Local Development Services**:
   ```bash
   # Concurrently start frontend & backend:
   npm run dev

   # Or run individually:
   npm run dev:backend    # Express API (http://localhost:5000)
   npm run dev:frontend   # Next.js App (http://localhost:3000)
   ```

---

## 5. Private File Storage Architecture

- **Security Boundary**: The physical location outside the webroot is the real security boundary.
- **Canonical Development Path**: `~/clc_storage/` (e.g. `C:\Users\<user>\clc_storage\` or `/home/<user>/clc_storage/`).
- **Canonical Production Path**: `/home/<cpanel-user>/clc_storage/` (strictly outside `public_html`).
- **Prohibited**: Under no circumstances may private files reside in `frontend/public/`, `public_html/`, `backend/public/`, or within the repository root.
- **Logical Structure**:
  - `~/clc_storage/documents/` (Client identity & visa documents)
  - `~/clc_storage/resumes/` (Candidate CVs / resumes)
  - `~/clc_storage/temporary/` (Quarantine / upload staging)

---

## 6. Available Root Scripts

| Command | Workspace Target | Description |
| :--- | :--- | :--- |
| `npm run dev` | All Workspaces | Starts backend API and frontend dev server |
| `npm run dev:backend` | `@cityline/backend` | Starts Express backend with tsx file-watcher |
| `npm run dev:frontend` | `@cityline/frontend` | Starts Next.js frontend dev server |
| `npm run build` | All Workspaces | Builds shared contracts, backend, and frontend |
| `npm run typecheck` | All Workspaces | Runs TypeScript strict typecheck across all workspaces |
| `npm run lint` | All Workspaces | Runs linter across all workspaces |
| `npm run test` | `@cityline/backend` | Runs automated test suite (node:test + supertest) |
| `npm run verify:env` | Scripts | Pre-flight validation of Node version, env files, and storage isolation |

---

## 7. Health Check & Minimal Information Disclosure

The backend exposes a hardened health check endpoint with minimal information disclosure:
- **Direct Probe**: `GET http://localhost:5000/health`
- **Versioned API Prefix**: `GET http://localhost:5000/api/v1/health`

Sample JSON response:
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

*Note: Environment, database state, storage details, uptime, and software versions are deliberately suppressed from public responses to prevent reconnaissance.*

---

## 8. Governance & Security Rules

- **Zero Pricing Rule**: No fees, packages, or costs are displayed on the public website.
- **Zero Unsupported Claims**: No guaranteed approvals or artificial processing turnaround claims.
- **Strict Private Storage**: All client documents, CVs, and passports reside in `~/clc_storage/` outside webroot.
- **Redacted Logging**: Sensitive fields (passwords, tokens, CVs, passports, cookies) are automatically masked in all structured logs.
- **Safe Error Handling**: Production environments suppress internal stack traces and error details.
- **Credential-Free Git**: Remote URLs must contain zero embedded tokens or credentials.

---

## 9. Project Governance & Phases

- **Phase 0**: Discovery, Planning & Scope Lock — 🟢 COMPLETED & LOCKED
- **Phase 1**: Repository & Development Environment Setup — 🟢 READY FOR FINAL CTO AUDIT
- **Phase 2**: Database Architecture & Migrations — ⏳ UPCOMING
