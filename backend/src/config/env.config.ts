/**
 * CITYLINE CONSULTANCY — Backend Environment Configuration
 * Validates and exposes strictly typed environment variables at runtime using Zod.
 */

import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import { z } from 'zod';

// Load environment variables from .env file relative to config file and cwd
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

function resolveStorageRoot(raw?: string): string {
  if (!raw || raw.trim().length === 0) {
    return path.join(os.homedir(), 'clc_storage');
  }
  if (raw.startsWith('~')) {
    return path.join(os.homedir(), raw.slice(1));
  }
  return path.resolve(raw);
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Private storage directory — defaults to ~/clc_storage/ (strictly outside webroot)
  STORAGE_ROOT: z
    .string()
    .default(() => resolveStorageRoot(process.env.STORAGE_ROOT))
    .transform((val) => resolveStorageRoot(val)),

  // Database Connection Configuration (Phase 2 Ownership — Engine UNVERIFIED)
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_NAME: z.string().default('clc_db'),
  DB_USER: z.string().default('clc_user'),
  DB_PASSWORD: z.string().default(''),
  DB_SSL: z.coerce.boolean().default(false),

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

  const data = result.data;

  // Security Gate: Ensure private storage is NOT placed inside public webroot or repo-local storage
  const cwd = process.cwd();
  const repoRoot = path.resolve(cwd, cwd.endsWith('backend') ? '..' : '.');
  const forbiddenRoots = [
    path.join(repoRoot, 'frontend', 'public'),
    path.join(repoRoot, 'public_html'),
    path.join(repoRoot, 'backend', 'public'),
    path.join(repoRoot, 'storage'),
  ];

  for (const forbidden of forbiddenRoots) {
    if (data.STORAGE_ROOT.toLowerCase().startsWith(forbidden.toLowerCase())) {
      console.error(
        `CRITICAL SECURITY VIOLATION: STORAGE_ROOT (${data.STORAGE_ROOT}) resolves inside forbidden location (${forbidden}). Storage must reside outside webroot.`
      );
      process.exit(1);
    }
  }

  return data;
}

export const env = parseEnv();
