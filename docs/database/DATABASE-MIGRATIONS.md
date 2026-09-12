# CITYLINE CONSULTANCY — Database Migration & Runbook Guide

**Document Version:** 1.0.0  
**Phase Status:** Phase 2 Implementation  
**Public Brand Name:** `CITYLINE CONSULTANCY`

---

## 1. Migration Tooling & Architecture

Database schema lifecycle is orchestrated using **Knex.js** with the pure JavaScript **`mysql2`** driver.

- **Migration Directory**: `backend/src/database/migrations/`
- **Seeds Directory**: `backend/src/database/seeds/`
- **Standalone DDL Export**: `docs/database/schema.sql` (for direct cPanel phpMyAdmin import)
- **Tracking Tables**:
  - `knex_migrations`: Records executed migration batch numbers and timestamps.
  - `knex_migrations_lock`: Advisory lock table preventing concurrent migration runs.

---

## 2. Naming Conventions

Migration files follow timestamped ISO prefixes:
```
<YYYYMMDDHHMMSS>_<descriptive_name>.ts
```
Example: `20260913000000_create_core_schema.ts`

---

## 3. Migration Commands

All database commands are executable from the repository root:

| Command | Description |
| :--- | :--- |
| `npm run db:migrate` | Runs all pending database migrations against the configured database. |
| `npm run db:rollback` | Reverts the most recent migration batch using the `down()` methods. |
| `npm run db:seed` | Executes deterministic reference data seeding (Roles, Job Categories, Visa Services). |
| `npm run db:validate` | Runs offline deterministic syntax, constraint, and relationship validation suite without requiring an active database server. |

---

## 4. Production Execution Strategies (cPanel)

Depending on host access permissions, deployment follows one of two verified runbooks:

### Strategy A: Automated Node.js Migration (SSH / Terminal Access)
1. Ensure `.env` is populated with production database credentials (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
2. Run:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
3. Knex creates `knex_migrations` and applies all schema tables atomically.

### Strategy B: Direct phpMyAdmin Execution (Restricted cPanel)
1. Log into cPanel -> **phpMyAdmin**.
2. Select the target production database.
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
