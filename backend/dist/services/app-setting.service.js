"use strict";
/**
 * CITYLINE CONSULTANCY — Application Settings Service
 * Manages runtime operational settings, notification recipients, and deliverability toggles.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.appSettingService = exports.AppSettingService = void 0;
const zod_1 = require("zod");
const env_config_1 = require("../config/env.config");
const logger_1 = require("../utils/logger");
const app_error_1 = require("../utils/app-error");
const app_setting_repository_1 = require("../repositories/app-setting.repository");
class AppSettingService {
    repo;
    cache = new Map();
    CACHE_TTL_MS = 60 * 1000; // 1 minute cache
    constructor(repo = app_setting_repository_1.appSettingRepository) {
        this.repo = repo;
    }
    /**
     * Retrieves the dynamic admin notification recipient email address.
     * Checks database `app_settings` first, falling back to `env.NOTIFICATION_ADMIN_EMAIL` or default.
     */
    async getAdminNotificationEmail() {
        const cached = this.getCached('admin_notification_email');
        if (cached)
            return cached;
        try {
            const dbValue = await this.repo.getByKey('admin_notification_email');
            if (dbValue && zod_1.z.string().email().safeParse(dbValue.trim()).success) {
                const email = dbValue.trim();
                this.setCache('admin_notification_email', email);
                return email;
            }
        }
        catch (err) {
            logger_1.logger.warn('Failed to read admin_notification_email from DB; falling back to environment config', { err });
        }
        const fallback = env_config_1.env.NOTIFICATION_ADMIN_EMAIL || 'yashkr4748@gmail.com';
        return fallback;
    }
    /**
     * Sets or updates the dynamic admin notification recipient email address.
     */
    async setAdminNotificationEmail(email) {
        const trimmed = email.trim();
        const parse = zod_1.z.string().email().safeParse(trimmed);
        if (!parse.success) {
            throw new app_error_1.AppError('Invalid recipient email address format.', 400, 'INVALID_EMAIL');
        }
        if (trimmed.toLowerCase() === 'no-reply@citylineconsultancy.com') {
            throw new app_error_1.AppError('Cannot use unmonitored no-reply sender address as notification recipient.', 400, 'INVALID_RECIPIENT');
        }
        await this.repo.setKey('admin_notification_email', trimmed, 'Primary recipient email for all website enquiries, visa leads, job applications, and manpower requisitions');
        this.setCache('admin_notification_email', trimmed);
        logger_1.logger.info(`Admin notification recipient updated to: ${trimmed}`);
    }
    /**
     * Retrieves all app settings as key-value pairs.
     */
    async getAllSettings() {
        const rows = await this.repo.getAll();
        const result = {};
        for (const row of rows) {
            result[row.setting_key] = row.setting_value;
        }
        // Ensure admin_notification_email is always present
        if (!result.admin_notification_email) {
            result.admin_notification_email = await this.getAdminNotificationEmail();
        }
        return result;
    }
    getCached(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }
    setCache(key, value) {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + this.CACHE_TTL_MS,
        });
    }
    clearCache() {
        this.cache.clear();
    }
}
exports.AppSettingService = AppSettingService;
exports.appSettingService = new AppSettingService();
