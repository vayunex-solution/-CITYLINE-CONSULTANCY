# CITYLINE CONSULTANCY — Digital Web Platform

> **Project Status**: Phase 1 — Repository & Development Environment Setup Completed  
> **Operational State**: Ready for CTO Audit  
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
├── storage/                    # Local private file storage scaffold (strictly unexposed)
├── docs/                       # Authoritative Phase 0 & Phase 1 documentation
├── scripts/                    # Development verification & automation scripts
├── package.json                # Root monorepo workspace orchestrator
├── .env.example                # Root environment configuration template
├── .gitignore                  # Security-first Git exclusion rules
└── .nvmrc                      # Node.js development baseline
```

---

## 3. Prerequisites & Development Setup

### 3.1 Prerequisites
- **Node.js**: `>= 18.0.0` (Local Development Baseline: `v24.19.0`)
- **npm**: `>= 9.0.0` (Local Development Baseline: `11.17.0`)
- **Git**: Configured and initialized

### 3.2 Quick Start
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```

3. **Verify Development Environment**:
   ```bash
   npm run verify:env
   ```

4. **Build All Workspaces**:
   ```bash
   npm run build
   ```

5. **Start Local Development Services**:
   ```bash
   # Start both frontend & backend concurrently
   npm run dev

   # Or start individually:
   npm run dev:backend    # Express REST API (http://localhost:5000)
   npm run dev:frontend   # Next.js App Shell (http://localhost:3000)
   ```

---

## 4. Available Root Scripts

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

## 5. Health Check & API Monitoring

The backend exposes a machine-readable health check endpoint:
- **Direct Probe**: `GET http://localhost:5000/health`
- **Versioned API Prefix**: `GET http://localhost:5000/api/v1/health`

Sample JSON response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-09-12T18:00:00.000Z",
    "uptimeSeconds": 14,
    "environment": "development",
    "version": "1.0.0",
    "database": "unverified",
    "storage": "operational"
  },
  "timestamp": "2026-09-12T18:00:00.000Z",
  "requestId": "61a2931a-e8d1-4e78-8318-c2ba629fbdf9"
}
```

---

## 6. Security & Storage Rules

- **Zero Pricing Rule**: No fees, packages, or costs are displayed on the public website.
- **Zero Unsupported Claims**: No guaranteed approvals or artificial processing turnaround claims.
- **Strict Private Storage**: All client documents, CVs, and passports are saved to `./storage` (located strictly outside `frontend/public`, `backend/public`, or any web-accessible root).
- **Redacted Logging**: Sensitive fields (passwords, tokens, CVs, passports, cookies) are automatically redacted from all structured logs.
- **Safe Error Handling**: Production environments never return internal error messages or stack traces.

---

## 7. Project Governance & Phases

- **Phase 0**: Discovery, Planning & Scope Lock — 🟢 COMPLETED & LOCKED
- **Phase 1**: Repository & Development Environment Setup — 🟢 READY FOR CTO AUDIT
- **Phase 2**: Database Architecture & Migrations — ⏳ UPCOMING
