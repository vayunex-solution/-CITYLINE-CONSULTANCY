# CITYLINE CONSULTANCY — Database Migration & Runbook Guide

**Document Version:** 2.0.0  
**Phase Status:** Phase 2 Consolidated Implementation & Audit  
**Public Brand Name:** `CITYLINE CONSULTANCY`

---

## 1. Migration Tooling & Architecture

Database schema lifecycle is orchestrated using **Knex.js** with the pure JavaScript **`mysql2`** driver.

- **Verified Production Engine**: **`10.11.16-MariaDB-cll-lve`** (MariaDB 10.11 LTS on CloudLinux / cPanel).
- **Migration Directory**: `backend/src/database/migrations/`
- **Seeds Directory**: `backend/src/database/seeds/`
- **Standalone DDL Export**: `docs/database/schema.sql` (for direct cPanel phpMyAdmin import)
- **Tracking Tables**:
  - `knex_migrations`: Records executed migration batch numbers and timestamps.
  - `knex_migrations_lock`: Advisory lock table preventing concurrent migration runs.

---

## 2. Database Creation Boundary & Prerequisites

1. **Pre-Existing Target Database**: The migration runner (`npm run db:migrate`) and diagnostic tool (`npm run db:test`) **never create databases**.
2. **cPanel Creation Step**: The target database (`cityline_db`) must be created beforehand in cPanel:
   - Go to **cPanel -> MySQL® Databases -> Create New Database**.
   - Note the exact database name (including any cPanel account username prefix, e.g. `<prefix>_cityline_db`).
3. **Least-Privilege User Assignment**:
   - In cPanel -> **Add User to Database**, assign the migration user.
   - Select required DDL + DML privileges:
     - DML: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
     - DDL: `CREATE`, `ALTER`, `DROP`, `INDEX`, `REFERENCES`
   - **Do NOT grant administrative privileges**: Never grant `SUPER`, `FILE`, `CREATE DATABASE`, or `GRANT OPTION`.

---

## 3. Migration Commands

All database commands are executable from the repository root:

| Command | Description |
| :--- | :--- |
| `npm run db:test` | Safely diagnoses remote/local database authentication, engine version, charset, collation, max connections, and authorization status without exposing secrets or creating databases. |
| `npm run db:migrate` | Runs all pending database migrations against the configured database. Operates on an already-created target database. |
| `npm run db:rollback` | Reverts the most recent migration batch using the `down()` methods in reverse-dependency order. |
| `npm run db:seed` | Executes deterministic reference data seeding (Roles, Job Categories, Visa Services). |
| `npm run db:validate` | Runs offline deterministic syntax, constraint, and relationship validation suite without requiring an active database server. |

---

## 4. Production Execution Strategies (cPanel)

Depending on host access permissions, deployment follows one of two verified runbooks:

### Strategy A: Automated Node.js Migration (SSH / Terminal Access)
1. Ensure `.env` is populated with production database credentials (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
2. Run connectivity diagnostic:
   ```bash
   npm run db:test
   ```
3. Once database authorization is confirmed, execute:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
4. Knex creates `knex_migrations` and applies all 18 schema tables and reference seeds atomically.

### Strategy B: Direct phpMyAdmin Execution (Restricted cPanel / UI Access)
1. Log into cPanel -> **phpMyAdmin**.
2. Select the target production database (`cityline_db` or prefixed equivalent).
3. Click the **Import** tab.
4. Select [`docs/database/schema.sql`](file:///d:/VAYUNEX/vayu-backup/CLC-Website/docs/database/schema.sql) and click **Import**.
5. All 18 tables and idempotent reference seeds are created with `utf8mb4_unicode_ci` and `InnoDB`.

---

## 5. Transaction & Recovery Behavior

1. **Transaction Behavior**: Knex attempts to wrap migrations in transactions. However, under MySQL/MariaDB, Data Definition Language (`CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`) statements trigger an **implicit commit**. Therefore, DDL cannot be rolled back mid-flight if a syntax error occurs.
2. **Deterministic Rollback**: Every migration file implements a clean `down()` method that drops created tables in strict reverse-dependency order.
3. **Migration Lock Recovery**: If a migration process terminates abruptly, `knex_migrations_lock` may remain set to `is_locked = 1`. To clear it safely:
   ```sql
   UPDATE knex_migrations_lock SET is_locked = 0 WHERE index = 1;
   ```

---

## 6. Live Execution Status Disclosure

- **Current Production Status**:
  - Host TCP reachability: `SUCCESS` (`135.181.217.49:3306`).
  - Server Authentication: `SUCCESS` (`cityline_admin`).
  - Database Authorization: `RESTRICTED (ER_DBACCESS_DENIED_ERROR)`.
  - Schema Execution Against Live DB: **BLOCKED — DATABASE PRIVILEGE REQUIRED**.
- **Resolution**: Assign user `cityline_admin` to database `cityline_db` in cPanel as outlined in Section 2.
