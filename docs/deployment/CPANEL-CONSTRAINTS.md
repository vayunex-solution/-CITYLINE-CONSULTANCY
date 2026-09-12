# CITYLINE CONSULTANCY — cPanel Deployment & Technical Constraints Analysis

> **Document Status**: Confirmed Baseline  
> **Phase**: Phase 0 — Foundation, Discovery & Scope Lock  
> **Classification Standard**: Every item classified as [CONFIRMED], [UNVERIFIED HOSTING CONSTRAINT], [PROPOSED], or [OPEN QUESTION].

---

## 1. Executive Deployment Context & Verification Gates

Deploying a modern web application stack (**Next.js + Node.js + Relational Database + Private Local Storage**) on **cPanel shared/managed hosting** introduces critical environmental constraints distinct from unconstrained cloud Virtual Private Servers (VPS) or container orchestrators (Docker/Kubernetes).

To avoid false architectural assumptions, the following parameters are explicitly cataloged by their verification status:

| Deployment Parameter | Current Status | Impact / Strategy | Classification |
| :--- | :--- | :--- | :--- |
| **Available Storage Quota** | **100 GB Confirmed** | Confirmed hosting allocation for code, database, and applicant files. | `[CONFIRMED]` |
| **Private Storage Isolation** | **Confirmed** | Directory above webroot (`~/clc_storage/`) with permissions `0700`. | `[CONFIRMED]` |
| **Production DB Engine & Version** | **OPEN / UNVERIFIED** | Whether MySQL 5.7/8.0/8.4 or MariaDB 10.3/10.6/10.11 is provisioned. | `[OPEN QUESTION]` |
| **cPanel Node.js Version** | **UNVERIFIED** | Specific LTS runtime in Application Manager (v18, v20, v22). | `[UNVERIFIED HOSTING CONSTRAINT]` |
| **Memory Ceiling (LVE RAM)** | **UNVERIFIED** | Physical RAM cap per process (typically 512 MB to 1024 MB). | `[UNVERIFIED HOSTING CONSTRAINT]` |
| **Passenger Process Model** | **UNVERIFIED** | Idle sleep timeout and process recycling behavior under load. | `[UNVERIFIED HOSTING CONSTRAINT]` |
| **SSH Terminal Availability** | **UNVERIFIED** | Direct CLI access vs cPanel Git Version Control & File Manager. | `[UNVERIFIED HOSTING CONSTRAINT]` |
| **Crontab Execution Interval** | **UNVERIFIED** | Support for 1-minute cron intervals for notification queue worker. | `[UNVERIFIED HOSTING CONSTRAINT]` |
| **Reverse Proxy Body Limit** | **UNVERIFIED** | Web server `LimitRequestBody` setting (must support 30 MB aggregate). | `[UNVERIFIED HOSTING CONSTRAINT]` |
| **Outbound SMTP Ports** | **UNVERIFIED** | Whether external ports 465/587 are open or require local relay. | `[UNVERIFIED HOSTING CONSTRAINT]` |
| **Malware Scanner (ClamAV)** | **UNVERIFIED** | Command-line scanner accessibility on the hosting server. | `[UNVERIFIED HOSTING CONSTRAINT]` |

---

## 2. cPanel Runtime & Application Manager Analysis

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              cPanel HOSTING TOPOLOGY                         │
│                                                                              │
│  [Incoming Public Request (HTTPS: 443)]                                      │
│                     │                                                        │
│                     ▼                                                        │
│  [Apache / LiteSpeed Web Server] ──► AutoSSL Termination                     │
│         │                                                                    │
│         ├───► Static Webroot (`~/public_html/`)                              │
│         │     (HTML, CSS, JS bundles, Video assets, Favicons)                │
│         │                                                                    │
│         └───► Reverse Proxy (`.htaccess` / Passenger)                        │
│                     │ (UNIX Domain Socket / Localhost Loopback)              │
│                     ▼                                                        │
│               [Node.js Engine (Phusion Passenger / CloudLinux)]              │
│                     │                                                        │
│                     ├───► Relational Database Engine (`localhost:3306`)      │
│                     │     [Engine/Version: UNVERIFIED PENDING AUDIT]         │
│                     ├───► Private Document Storage (`~/clc_storage/`)        │
│                     └───► cPanel Crontab Worker ──► SMTP Gateway             │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Component | cPanel Mechanism | Constraint / Behavior | Architectural Mitigation | Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js Execution** | Phusion Passenger / CloudLinux Node Selector | Spawns Node processes dynamically; spins down idle processes after inactivity timeout (sleep state). | Keep cold-start times minimal by avoiding heavy ORM reflection on startup. | `[UNVERIFIED HOSTING CONSTRAINT]` |
| **Process Memory** | CloudLinux LVE Memory Caps | Shared cPanel accounts commonly enforce strict memory ceilings (typically 512 MB to 1024 MB RAM). | Avoid executing `npm run build` directly on the cPanel server. Pre-build all Next.js bundles locally or in CI before deployment. | `[UNVERIFIED HOSTING CONSTRAINT]` |
| **Next.js Deployment Mode** | Dual Process Overhead | Running both Next.js SSR server and Node.js API server simultaneously may exceed Passenger memory caps. | **Recommended Strategy**: Next.js static export / hybrid client served directly by Apache in `public_html/`, while Node.js runs as the dedicated API backend. Mode remains UNVERIFIED until host inspection. | `[PROPOSED]` |
| **Long-Running Daemons** | Absence of Redis / Docker | Shared cPanel accounts disallow standalone background daemon processes (e.g., Redis, BullMQ workers). | Decoupled background jobs (e.g., email queue retries, storage pruning) run via standard **cPanel Crontab** executing Node.js CLI worker scripts. | `[UNVERIFIED HOSTING CONSTRAINT]` |

---

## 3. Storage & Filesystem Architecture (100 GB Quota)

1. **Storage Distribution**:
   - Total Available Quota: **100 GB** `[CONFIRMED]`
   - System & Database Footprint (Projected): **~2 GB**
   - Headroom for Uploaded Assets: **~90 GB**
   - At a 10 MB maximum file cap and an average file size of 2 MB, the 90 GB allocation accommodates approximately **45,000 document attachments**.
2. **Directory Isolation**:
   ```bash
   # User Home Directory Structure
   /home/<cpanel_user>/
   ├── public_html/              # Webroot: strictly public static assets
   ├── apps/
   │   └── api/                  # Node.js backend application source (compiled)
   └── clc_storage/              # PRIVATE STORAGE (chmod 0700)
       ├── documents/            # Sensitive Visa files (chmod 0600)
       ├── resumes/              # Candidate CVs (chmod 0600)
       └── logs/                 # Internal application logs
   ```
3. **Hard Web Access Block**:
   A root `.htaccess` inside `clc_storage/` enforces:
   ```apache
   Deny from all
   Options -Indexes
   ```
   Ensuring Apache will return 403 Forbidden even if path aliasing occurs.

---

## 4. Web Server & Proxy Configuration (`.htaccess`)

To route incoming API traffic seamlessly to the Node.js backend without cross-origin issues:

```apache
# Root public_html/.htaccess Proxy Rules
RewriteEngine On

# 1. Force HTTPS
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# 2. Route API & Admin Endpoints to Node.js Application
RewriteRule ^api/(.*)$ http://127.0.0.1:PORT/api/$1 [P,L]

# 3. Static Next.js Fallback for SPA/Client Routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

---

## 5. Database Connection Constraints on Shared Hosting

| Parameter | Current Status / cPanel Limit | Impact on Node.js App | Mitigation Strategy | Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Engine & Version** | **OPEN / UNVERIFIED** | DDL dialect and optimization features vary across MySQL 5.7/8.x and MariaDB 10.x. | Use standard ANSI SQL DDL compatible with both engines. | `[OPEN QUESTION]` |
| `max_connections` | **UNVERIFIED** (Typical: 30 to 50) | Connection exhaustion if connection pools are unconstrained. | Set Node.js connection pool `connectionLimit: 10`. | `[UNVERIFIED HOSTING CONSTRAINT]` |
| `wait_timeout` | **UNVERIFIED** (Typical: 60s to 120s) | Unhandled idle connections drop silently, causing connection lost errors. | Configure connection pool with auto-reconnect, keep-alive query pings (`SELECT 1`), and idle timeouts under 45s. | `[UNVERIFIED HOSTING CONSTRAINT]` |
| `max_allowed_packet` | **UNVERIFIED** (Typical: 16 MB to 64 MB) | Binary document storage directly in DB will crash connections. | **Confirmed Rule**: Zero binary files stored in database BLOBs. Files reside on private disk; database stores metadata only. | `[CONFIRMED]` |

---

## 6. Upload Payload, Proxy Timeouts & Malware Strategy

1. **Proxy Body Size Limits**:
   - Standard Apache/LiteSpeed reverse proxies may drop requests exceeding `LimitRequestBody` (typically 10 MB or 50 MB default).
   - In Phase 17 deployment, verify that hosting provider configuration permits multipart uploads up to 30 MB aggregate payload.
2. **Gateway Timeout (`504 Gateway Timeout`)**:
   - Slow mobile uploads over 3G/4G connections can encounter proxy timeouts if chunk processing is blocked.
   - Streaming multipart parser (`busboy` / disk storage) must process incoming byte streams incrementally to maintain socket activity.
3. **Malware Scanner Fallback Strategy**:
   - If ClamAV / command-line scanner is unavailable on the shared host, the system enforces **containment fallbacks**:
     - Complete physical file isolation outside `public_html/`.
     - Removal of executable permissions (`chmod 0600`).
     - Header hardening on download streams (`nosniff`, attachment disposition).
     - Prohibition of server-side script execution in storage paths.

---

## 7. Build & Deployment Workflow (Zero-Downtime Pipeline)

To avoid breaking the production environment and circumventing server memory constraints:

```
[Development Environment]
           │
           ▼
[Compile & Build Artifacts Locally / CI]
  ├── Next.js Static / Production Build
  └── TypeScript Backend Compilation (tsc)
           │
           ▼
[Deploy to cPanel via Git / rsync / SSH]
  ├── Deploy public assets to ~/public_html/
  └── Deploy backend bundles to ~/apps/api/
           │
           ▼
[Restart Node.js App in cPanel Application Manager]
  - Trigger `touch tmp/restart.txt` (Passenger restart hook)
```

1. **Rule**: Never run `npm install --production=false` or heavy webpack/next builds on the live cPanel server.
2. **Process Restart**: Passenger supports zero-downtime hot reload by touching the `tmp/restart.txt` marker file inside the application directory.

---

## 8. Host Inspection Checklist (Phase 1 / Phase 17 Prerequisite)

Before commencing deployment configuration, the following commands/checks must be executed on the physical cPanel host:
- [ ] `node -v` (Verify active Node.js version)
- [ ] `mysql -V` or phpMyAdmin banner (Verify database engine and exact version)
- [ ] `SHOW VARIABLES LIKE 'max_connections'` (Record pool capacity)
- [ ] `SHOW VARIABLES LIKE 'wait_timeout'` (Record connection timeout)
- [ ] `which clamscan` (Verify if ClamAV CLI is present)
- [ ] Verify `crontab -l` permissions and minimum execution intervals
- [ ] Verify outbound SMTP port connectivity to mail gateway via `nc` / `curl`
