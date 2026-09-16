"use strict";
/**
 * CITYLINE CONSULTANCY — Backend Environment Configuration
 * Validates and exposes strictly typed environment variables at runtime using Zod.
 *
 * GOVERNANCE:
 * - Fails fast when required production configuration is missing.
 * - Never prints or leaks secret values (passwords, tokens, keys) in error messages.
 * - Enforces physical storage isolation outside webroots.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.envSchema = void 0;
exports.validateEnvConfig = validateEnvConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const zod_1 = require("zod");
// Load environment variables from .env file relative to config file and cwd
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../.env') });
function resolveStorageRoot(raw) {
    if (!raw || raw.trim().length === 0) {
        return path_1.default.join(os_1.default.homedir(), 'clc_storage');
    }
    if (raw.startsWith('~')) {
        return path_1.default.join(os_1.default.homedir(), raw.slice(1));
    }
    return path_1.default.resolve(raw);
}
function booleanCoerce(defaultValue) {
    return zod_1.z.preprocess((val) => {
        if (typeof val === 'boolean')
            return val;
        if (typeof val === 'string') {
            const lower = val.trim().toLowerCase();
            if (lower === 'true' || lower === '1')
                return true;
            if (lower === 'false' || lower === '0')
                return false;
        }
        return val;
    }, zod_1.z.boolean().default(defaultValue));
}
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(5000),
    HOST: zod_1.z.string().default('0.0.0.0'),
    API_PREFIX: zod_1.z.string().default('/api/v1'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    // Private storage directory — defaults to ~/clc_storage/ (strictly outside webroot)
    STORAGE_ROOT: zod_1.z
        .string()
        .default(() => resolveStorageRoot(process.env.STORAGE_ROOT))
        .transform((val) => resolveStorageRoot(val)),
    // Database Connection Configuration (Phase 2 & Phase 3 Runtime)
    DB_HOST: zod_1.z.string().min(1, 'DB_HOST must not be empty').default('127.0.0.1'),
    DB_PORT: zod_1.z.coerce.number().int().default(3306),
    DB_NAME: zod_1.z.string().min(1, 'DB_NAME must not be empty').default('clc_db'),
    DB_USER: zod_1.z.string().min(1, 'DB_USER must not be empty').default('clc_user'),
    DB_PASSWORD: zod_1.z.string().default(''),
    DB_SSL: booleanCoerce(false),
    DB_POOL_MIN: zod_1.z.coerce.number().int().min(0).default(0),
    DB_POOL_MAX: zod_1.z.coerce.number().int().positive().default(5),
    DB_TIMEOUT_MS: zod_1.z.coerce.number().int().positive().default(10000),
    // Logging
    LOG_LEVEL: zod_1.z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    // --- Admin Authentication & Security Subsystem (Phase 4) ---
    AUTH_TOKEN_SECRET: zod_1.z.string().default('development_insecure_auth_token_secret_must_be_at_least_32_characters_long_for_security'),
    AUTH_TOKEN_TTL: zod_1.z.string().default('30m'),
    AUTH_COOKIE_NAME: zod_1.z.string().default('clc_admin_token'),
    AUTH_CSRF_COOKIE_NAME: zod_1.z.string().default('clc_csrf_token'),
    AUTH_RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().int().positive().default(900000),
    AUTH_RATE_LIMIT_MAX_ATTEMPTS: zod_1.z.coerce.number().int().positive().default(5),
    AUTH_LOCKOUT_DURATION_MS: zod_1.z.coerce.number().int().positive().default(900000),
    // --- Visa Enquiry & Document Upload Subsystem (Phase 6) ---
    UPLOAD_MAX_FILE_SIZE_BYTES: zod_1.z.coerce.number().int().positive().default(10 * 1024 * 1024), // 10MB
    UPLOAD_MAX_TOTAL_SIZE_BYTES: zod_1.z.coerce.number().int().positive().default(25 * 1024 * 1024), // 25MB
    UPLOAD_MAX_FILES_PER_ENQUIRY: zod_1.z.coerce.number().int().positive().default(5),
    MALWARE_SCANNER_ENABLED: booleanCoerce(false),
    MALWARE_SCANNER_COMMAND: zod_1.z.string().default('clamscan --no-summary'),
    VISA_ENQUIRY_RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().int().positive().default(900000), // 15m
    VISA_ENQUIRY_RATE_LIMIT_MAX_ATTEMPTS: zod_1.z.coerce.number().int().positive().default(10),
    // --- Phase 7: SMTP & Transactional Notification Subsystem ---
    SMTP_HOST: zod_1.z.string().default('mail.citylineconsultancy.com'),
    SMTP_PORT: zod_1.z.coerce.number().int().positive().default(465),
    SMTP_USER: zod_1.z.string().default('no-reply@citylineconsultancy.com'),
    SMTP_PASSWORD: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(), // backward compatibility alias
    SMTP_FROM: zod_1.z.string().default('Cityline Consultancy <no-reply@citylineconsultancy.com>'),
    SMTP_SECURE: booleanCoerce(true),
    SMTP_POOL: booleanCoerce(true),
    SMTP_MAX_CONNECTIONS: zod_1.z.coerce.number().int().positive().default(3),
    SMTP_MAX_MESSAGES: zod_1.z.coerce.number().int().positive().default(100),
    SMTP_CONNECTION_TIMEOUT_MS: zod_1.z.coerce.number().int().positive().default(10000),
    SMTP_GREETING_TIMEOUT_MS: zod_1.z.coerce.number().int().positive().default(5000),
    SMTP_SOCKET_TIMEOUT_MS: zod_1.z.coerce.number().int().positive().default(15000),
    NOTIFICATION_ENABLED: booleanCoerce(true),
    NOTIFICATION_MOCK_TRANSPORT: booleanCoerce(false),
    // Explicitly configurable admin alert recipient; isolated dev fallback only in non-production
    NOTIFICATION_ADMIN_EMAIL: zod_1.z
        .string()
        .trim()
        .refine((val) => val === '' || zod_1.z.string().email().safeParse(val).success, {
        message: 'NOTIFICATION_ADMIN_EMAIL must be a valid email address',
    })
        .default(() => (process.env.NODE_ENV === 'production' ? '' : 'dev-admin@example.test')),
    NOTIFICATION_MAX_ATTEMPTS: zod_1.z.coerce.number().int().positive().default(5),
    NOTIFICATION_RETRY_BASE_DELAY_MS: zod_1.z.coerce.number().int().positive().default(30000),
    NOTIFICATION_RETRY_MAX_DELAY_MS: zod_1.z.coerce.number().int().positive().default(3600000),
    NOTIFICATION_BATCH_SIZE: zod_1.z.coerce.number().int().positive().default(20),
    NOTIFICATION_STALE_TIMEOUT_MS: zod_1.z.coerce.number().int().positive().default(600000), // 10 minutes
    NOTIFICATION_SENT_RETENTION_DAYS: zod_1.z.coerce.number().int().positive().default(30),
    NOTIFICATION_EXHAUSTED_RETENTION_DAYS: zod_1.z.coerce.number().int().positive().default(90),
    // --- Phase 12: Analytics Subsystem ---
    ANALYTICS_RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().int().positive().default(60000), // 1 minute
    ANALYTICS_RATE_LIMIT_MAX_ATTEMPTS: zod_1.z.coerce.number().int().positive().default(60), // 60 page views / min
    // Placeholders for future phases (optional)
    SESSION_SECRET: zod_1.z.string().optional(),
});
/**
 * Validates a raw environment object against Phase 3 security constraints.
 * Safe for unit testing without calling process.exit.
 */
function validateEnvConfig(rawEnv = process.env) {
    const result = exports.envSchema.safeParse(rawEnv);
    if (!result.success) {
        const errors = result.error.issues.map((issue) => {
            // Security rule: Never include field values in error messages
            return `  - ${issue.path.join('.')}: ${issue.message}`;
        });
        return { success: false, errors };
    }
    const data = result.data;
    const extraErrors = [];
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
        // Phase 4: Administrative Token Secret Hardening
        if (!rawEnv.AUTH_TOKEN_SECRET || data.AUTH_TOKEN_SECRET.length < 32) {
            extraErrors.push('  - AUTH_TOKEN_SECRET: Required in production and must be at least 32 characters long');
        }
        if (data.AUTH_TOKEN_SECRET.includes('development') ||
            data.AUTH_TOKEN_SECRET.includes('change-me') ||
            data.AUTH_TOKEN_SECRET.includes('secret123')) {
            extraErrors.push('  - AUTH_TOKEN_SECRET: Insecure default or placeholder secret detected in production');
        }
        // Phase 7: SMTP Production Validation
        // Enforced in production runtime (process.env) and any environment where SMTP is configured/tested.
        if (data.NOTIFICATION_ENABLED && !data.NOTIFICATION_MOCK_TRANSPORT) {
            const isFullEnvOrSmtpTest = rawEnv === process.env ||
                'SMTP_HOST' in rawEnv ||
                'SMTP_PASSWORD' in rawEnv ||
                'SMTP_USER' in rawEnv ||
                'SMTP_PASS' in rawEnv ||
                'SMTP_REQUIRE_PRODUCTION' in rawEnv;
            if (isFullEnvOrSmtpTest) {
                if (!data.SMTP_HOST || data.SMTP_HOST.trim().length === 0) {
                    extraErrors.push('  - SMTP_HOST: Required in production mode when notifications are enabled');
                }
                if (!data.SMTP_USER || data.SMTP_USER.trim().length === 0) {
                    extraErrors.push('  - SMTP_USER: Required in production mode when notifications are enabled');
                }
                const smtpPassword = data.SMTP_PASSWORD || data.SMTP_PASS;
                if (!smtpPassword || smtpPassword.trim().length === 0) {
                    extraErrors.push('  - SMTP_PASSWORD: Required in production mode when notifications are enabled');
                }
                if (!data.SMTP_FROM || data.SMTP_FROM.trim().length === 0) {
                    extraErrors.push('  - SMTP_FROM: Required in production mode when notifications are enabled');
                }
                if (!data.NOTIFICATION_ADMIN_EMAIL || data.NOTIFICATION_ADMIN_EMAIL.trim().length === 0) {
                    extraErrors.push('  - NOTIFICATION_ADMIN_EMAIL: Required in production mode (must be explicitly configured to an administrative mailbox)');
                }
                else if (!zod_1.z.string().email().safeParse(data.NOTIFICATION_ADMIN_EMAIL).success) {
                    extraErrors.push('  - NOTIFICATION_ADMIN_EMAIL: Must be a valid email address format');
                }
                else if (data.NOTIFICATION_ADMIN_EMAIL.trim().toLowerCase() === 'no-reply@citylineconsultancy.com') {
                    extraErrors.push('  - NOTIFICATION_ADMIN_EMAIL: Cannot use unmonitored sender (no-reply@citylineconsultancy.com) as production admin recipient');
                }
            }
        }
    }
    // Security Gate: Ensure private storage is NOT inside forbidden public directories
    const cwd = process.cwd();
    const repoRoot = path_1.default.resolve(cwd, cwd.endsWith('backend') ? '..' : '.');
    const forbiddenRoots = [
        path_1.default.join(repoRoot, 'frontend', 'public'),
        path_1.default.join(repoRoot, 'public_html'),
        path_1.default.join(repoRoot, 'backend', 'public'),
        path_1.default.join(repoRoot, 'storage'),
    ];
    for (const forbidden of forbiddenRoots) {
        if (data.STORAGE_ROOT.toLowerCase().startsWith(forbidden.toLowerCase())) {
            extraErrors.push(`  - STORAGE_ROOT: Path (${data.STORAGE_ROOT}) resolves inside forbidden webroot/repository location (${forbidden})`);
        }
    }
    if (extraErrors.length > 0) {
        return { success: false, errors: extraErrors };
    }
    return { success: true, data };
}
function parseEnv() {
    const validation = validateEnvConfig(process.env);
    if (!validation.success || !validation.data) {
        console.error('CRITICAL: Environment variable validation failed:\n' + (validation.errors || []).join('\n'));
        process.exit(1);
    }
    return validation.data;
}
exports.env = parseEnv();
