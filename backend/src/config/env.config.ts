/**
 * CITYLINE CONSULTANCY — Backend Environment Configuration
 * Validates and exposes strictly typed environment variables at runtime using Zod.
 *
 * GOVERNANCE:
 * - Fails fast when required production configuration is missing.
 * - Never prints or leaks secret values (passwords, tokens, keys) in error messages.
 * - Enforces physical storage isolation outside webroots.
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

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Private storage directory — defaults to ~/clc_storage/ (strictly outside webroot)
  STORAGE_ROOT: z
    .string()
    .default(() => resolveStorageRoot(process.env.STORAGE_ROOT))
    .transform((val) => resolveStorageRoot(val)),

  // Database Connection Configuration (Phase 2 & Phase 3 Runtime)
  DB_HOST: z.string().min(1, 'DB_HOST must not be empty').default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_NAME: z.string().min(1, 'DB_NAME must not be empty').default('clc_db'),
  DB_USER: z.string().min(1, 'DB_USER must not be empty').default('clc_user'),
  DB_PASSWORD: z.string().default(''),
  DB_SSL: z.coerce.boolean().default(false),
  DB_POOL_MIN: z.coerce.number().int().min(0).default(0),
  DB_POOL_MAX: z.coerce.number().int().positive().default(5),
  DB_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Placeholders for future phases (optional in Phase 3)
  SESSION_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export interface EnvValidationResult {
  success: boolean;
  data?: EnvConfig;
  errors?: string[];
}

/**
 * Validates a raw environment object against Phase 3 security constraints.
 * Safe for unit testing without calling process.exit.
 */
export function validateEnvConfig(rawEnv: Record<string, unknown> = process.env): EnvValidationResult {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      // Security rule: Never include field values in error messages
      return `  - ${issue.path.join('.')}: ${issue.message}`;
    });
    return { success: false, errors };
  }

  const data = result.data;
  const extraErrors: string[] = [];

  // Production-specific hardening
  if (data.NODE_ENV === 'production') {
    if (!rawEnv.DB_PASSWORD && data.DB_PASSWORD === '') {
      extraErrors.push('  - DB_PASSWORD: Required in production mode');
    }

    const origins = data.CORS_ORIGIN.split(',').map((o) => o.trim());
    for (const origin of origins) {
      if (origin === '*') {
        extraErrors.push('  - CORS_ORIGIN: Wildcard (*) is forbidden in production with credentials');
      }
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        extraErrors.push(`  - CORS_ORIGIN: Localhost origin (${origin}) is prohibited in production`);
      }
    }
  }

  // Security Gate: Ensure private storage is NOT inside forbidden public directories
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
      extraErrors.push(
        `  - STORAGE_ROOT: Path (${data.STORAGE_ROOT}) resolves inside forbidden webroot/repository location (${forbidden})`
      );
    }
  }

  if (extraErrors.length > 0) {
    return { success: false, errors: extraErrors };
  }

  return { success: true, data };
}

function parseEnv(): EnvConfig {
  const validation = validateEnvConfig(process.env);

  if (!validation.success || !validation.data) {
    console.error('CRITICAL: Environment variable validation failed:\n' + (validation.errors || []).join('\n'));
    process.exit(1);
  }

  return validation.data;
}

export const env = parseEnv();
