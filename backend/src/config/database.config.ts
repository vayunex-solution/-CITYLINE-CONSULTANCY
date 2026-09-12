/**
 * CITYLINE CONSULTANCY — Database Configuration Architecture
 *
 * IMPORTANT HOSTING & ARCHITECTURAL STATUS:
 * - Production database engine and version are currently UNVERIFIED pending cPanel host inspection.
 * - Driver: pure JavaScript `mysql2` driver compatible with MySQL 5.7+, MySQL 8.x, and MariaDB 10.3+.
 * - Character Set & Collation Baseline: `utf8mb4` with `utf8mb4_unicode_ci`.
 * - Connection Pooling: Conservative pool limits (min: 0, max: 5) tailored for cPanel Passenger.
 */

import { env } from './env.config';

export interface DatabasePoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
  createTimeoutMillis: number;
}

export interface DatabaseConfig {
  client: 'mysql2';
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  charset: string;
  timezone: string;
  engineStatus: 'UNVERIFIED';
  pool: DatabasePoolConfig;
  ssl?: boolean | Record<string, unknown>;
}

export const databaseConfig: DatabaseConfig = {
  client: 'mysql2',
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  charset: 'utf8mb4',
  timezone: 'Z', // Persist all timestamps in UTC
  engineStatus: 'UNVERIFIED',
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
  pool: {
    min: 0, // Allow pool to scale to 0 when idle to conserve cPanel resources
    max: 5, // Conservative limit per process for cPanel environments
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    createTimeoutMillis: 10000,
  },
};
