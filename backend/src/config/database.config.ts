/**
 * CITYLINE CONSULTANCY — Database Configuration Abstraction
 *
 * IMPORTANT ARCHITECTURAL STATUS:
 * - Production database engine and version are currently UNVERIFIED pending cPanel host inspection.
 * - This module defines configuration contracts only.
 * - Connection pooling, query builders, migrations, and ORM models are strictly deferred to Phase 2.
 * - Global baseline character set: utf8mb4.
 */

import { env } from './env.config';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  charset: string;
  engineStatus: 'UNVERIFIED';
}

export const databaseConfig: DatabaseConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  charset: 'utf8mb4',
  engineStatus: 'UNVERIFIED',
};
