/**
 * CITYLINE CONSULTANCY — Backend Environment Configuration
 * Validates and exposes strictly typed environment variables at runtime using Zod.
 */

import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// Also fallback to root .env if running from workspace package
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Private storage directory (strictly outside public web root)
  STORAGE_ROOT: z.string().default(path.resolve(process.cwd(), '../storage')),

  // Database Connection Configuration (Phase 2 Ownership — Engine UNVERIFIED)
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_NAME: z.string().default('clc_db'),
  DB_USER: z.string().default('clc_user'),
  DB_PASSWORD: z.string().default(''),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Placeholders for future phases (optional in Phase 1)
  SESSION_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

function parseEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error('CRITICAL: Environment variable validation failed:\n' + errorDetails);
    process.exit(1);
  }

  return result.data;
}

export const env = parseEnv();
