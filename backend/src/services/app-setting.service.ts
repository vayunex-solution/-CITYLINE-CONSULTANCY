/**
 * CITYLINE CONSULTANCY — Application Settings Service
 * Manages runtime operational settings, notification recipients, and deliverability toggles.
 */

import { z } from 'zod';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/app-error';
import { appSettingRepository, AppSettingRepository } from '../repositories/app-setting.repository';

export class AppSettingService {
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 60 * 1000; // 1 minute cache

  constructor(private readonly repo: AppSettingRepository = appSettingRepository) {}

  /**
   * Retrieves the dynamic admin notification recipient email address.
   * Checks database `app_settings` first, falling back to `env.NOTIFICATION_ADMIN_EMAIL` or default.
   */
  public async getAdminNotificationEmail(): Promise<string> {
    const cached = this.getCached('admin_notification_email');
    if (cached) return cached;

    try {
      const dbValue = await this.repo.getByKey('admin_notification_email');
      if (dbValue && z.string().email().safeParse(dbValue.trim()).success) {
        const email = dbValue.trim();
        this.setCache('admin_notification_email', email);
        return email;
      }
    } catch (err) {
      logger.warn('Failed to read admin_notification_email from DB; falling back to environment config', { err });
    }

    const fallback = env.NOTIFICATION_ADMIN_EMAIL || 'yashkr4748@gmail.com';
    return fallback;
  }

  /**
   * Sets or updates the dynamic admin notification recipient email address.
   */
  public async setAdminNotificationEmail(email: string): Promise<void> {
    const trimmed = email.trim();
    const parse = z.string().email().safeParse(trimmed);
    if (!parse.success) {
      throw new AppError('Invalid recipient email address format.', 400, 'INVALID_EMAIL');
    }

    if (trimmed.toLowerCase() === 'no-reply@citylineconsultancy.com') {
      throw new AppError('Cannot use unmonitored no-reply sender address as notification recipient.', 400, 'INVALID_RECIPIENT');
    }

    await this.repo.setKey(
      'admin_notification_email',
      trimmed,
      'Primary recipient email for all website enquiries, visa leads, job applications, and manpower requisitions'
    );

    this.setCache('admin_notification_email', trimmed);
    logger.info(`Admin notification recipient updated to: ${trimmed}`);
  }

  /**
   * Retrieves all app settings as key-value pairs.
   */
  public async getAllSettings(): Promise<Record<string, string>> {
    const rows = await this.repo.getAll();
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.setting_key] = row.setting_value;
    }
    // Ensure admin_notification_email is always present
    if (!result.admin_notification_email) {
      result.admin_notification_email = await this.getAdminNotificationEmail();
    }
    return result;
  }

  private getCached(key: string): string | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  private setCache(key: string, value: string): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const appSettingService = new AppSettingService();
