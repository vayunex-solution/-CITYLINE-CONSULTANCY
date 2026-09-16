"use strict";
/**
 * CITYLINE CONSULTANCY — Structured Application Logger
 * Outputs structured JSON logs with correlation ID tracking and sensitive field redaction.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const env_config_1 = require("../config/env.config");
const LEVEL_PRIORITY = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
// Sensitive property names to automatically redact from log context/payloads
const REDACTED_KEYS = new Set([
    'password',
    'passwd',
    'token',
    'accesstoken',
    'refreshtoken',
    'csrftoken',
    'authorization',
    'cookie',
    'secret',
    'sessionsecret',
    'jwt',
    'jwtsecret',
    'apikey',
    'smtppassword',
    'dbpassword',
    'privatekey',
    'credentials',
    'passport',
    'passportnumber',
    'cv',
    'resume',
    'documentcontent',
    'buffer',
    'filebuffer',
]);
function redactSensitive(value, depth = 0) {
    if (depth > 5 || value === null || value === undefined) {
        return value;
    }
    if (typeof value === 'string') {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map((item) => redactSensitive(item, depth + 1));
    }
    if (typeof value === 'object') {
        const sanitized = {};
        for (const [k, v] of Object.entries(value)) {
            const lowerKey = k.toLowerCase().replace(/[-_]/g, '');
            if (REDACTED_KEYS.has(lowerKey)) {
                sanitized[k] = '[REDACTED]';
            }
            else {
                sanitized[k] = redactSensitive(v, depth + 1);
            }
        }
        return sanitized;
    }
    return value;
}
class Logger {
    currentLevel;
    constructor() {
        this.currentLevel = env_config_1.env.LOG_LEVEL;
    }
    shouldLog(level) {
        return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.currentLevel];
    }
    write(level, message, context, error, requestId) {
        if (!this.shouldLog(level))
            return;
        const entry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            environment: env_config_1.env.NODE_ENV,
            ...(requestId ? { requestId } : {}),
            ...(context ? { context: redactSensitive(context) } : {}),
            ...(error
                ? {
                    error: {
                        name: error.name,
                        message: error.message,
                        ...(env_config_1.env.NODE_ENV !== 'production' ? { stack: error.stack } : {}),
                    },
                }
                : {}),
        };
        const serialized = JSON.stringify(entry);
        if (level === 'error') {
            console.error(serialized);
        }
        else if (level === 'warn') {
            console.warn(serialized);
        }
        else {
            console.log(serialized);
        }
    }
    debug(message, context, requestId) {
        this.write('debug', message, context, undefined, requestId);
    }
    info(message, context, requestId) {
        this.write('info', message, context, undefined, requestId);
    }
    warn(message, context, requestId) {
        this.write('warn', message, context, undefined, requestId);
    }
    error(message, error, context, requestId) {
        this.write('error', message, context, error, requestId);
    }
}
exports.logger = new Logger();
