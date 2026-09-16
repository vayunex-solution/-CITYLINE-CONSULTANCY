"use strict";
/**
 * CITYLINE CONSULTANCY — Database Configuration Architecture
 *
 * IMPORTANT HOSTING & ARCHITECTURAL STATUS:
 * - Production database engine and version are currently UNVERIFIED pending cPanel host inspection.
 * - Driver: pure JavaScript `mysql2` driver compatible with MySQL 5.7+, MySQL 8.x, and MariaDB 10.3+.
 * - Character Set & Collation Baseline: `utf8mb4` with `utf8mb4_unicode_ci`.
 * - Connection Pooling: Conservative pool limits (min: 0, max: 5) tailored for cPanel Passenger.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const env_config_1 = require("./env.config");
exports.databaseConfig = {
    client: 'mysql2',
    host: env_config_1.env.DB_HOST,
    port: env_config_1.env.DB_PORT,
    database: env_config_1.env.DB_NAME,
    user: env_config_1.env.DB_USER,
    password: env_config_1.env.DB_PASSWORD,
    charset: 'utf8mb4',
    timezone: 'Z', // Persist all timestamps in UTC
    engineStatus: 'UNVERIFIED',
    ssl: env_config_1.env.DB_SSL ? { rejectUnauthorized: false } : undefined,
    pool: {
        min: env_config_1.env.DB_POOL_MIN, // Configurable via DB_POOL_MIN (default: 0 for cPanel)
        max: env_config_1.env.DB_POOL_MAX, // Configurable via DB_POOL_MAX (default: 5 for cPanel)
        acquireTimeoutMillis: env_config_1.env.DB_TIMEOUT_MS, // Configurable via DB_TIMEOUT_MS (default: 10000)
        idleTimeoutMillis: 30000,
        createTimeoutMillis: 10000,
    },
};
