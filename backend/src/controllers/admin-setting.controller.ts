/**
 * CITYLINE CONSULTANCY — Admin Settings Controller
 * Handles configuration of administrative recipient emails, notification triggers,
 * and live deliverability testing.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { appSettingService, AppSettingService } from '../services/app-setting.service';
import { smtpTransportManager, SmtpTransportManager } from '../notifications/smtp-transport';
import { auditLogRepository, AuditLogRepository } from '../repositories/audit-log.repository';
import { env } from '../config/env.config';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

const updateSettingsSchema = z.object({
  admin_notification_email: z.string().email('Must be a valid email address').optional(),
  notification_alerts_enabled: z.enum(['true', 'false']).optional(),
});

export class AdminSettingController {
  constructor(
    private settingsService: AppSettingService = appSettingService,
    private transport: SmtpTransportManager = smtpTransportManager,
    private auditRepo: AuditLogRepository = auditLogRepository
  ) {}

  public async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allSettings = await this.settingsService.getAllSettings();
      const adminEmail = await this.settingsService.getAdminNotificationEmail();

      res.status(200).json({
        success: true,
        data: {
          settings: {
            ...allSettings,
            admin_notification_email: adminEmail,
          },
          smtp: {
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_SECURE,
            from: env.SMTP_FROM,
            isMockMode: env.NOTIFICATION_MOCK_TRANSPORT,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message || 'Invalid settings payload', 400, 'VALIDATION_ERROR');
      }

      const { admin_notification_email, notification_alerts_enabled } = parsed.data;

      if (admin_notification_email) {
        await this.settingsService.setAdminNotificationEmail(admin_notification_email);
      }

      if (notification_alerts_enabled !== undefined) {
        await this.settingsService['repo'].setKey('notification_alerts_enabled', notification_alerts_enabled);
      }

      const adminUser = (req as any).admin;
      void this.auditRepo.logEvent({
        action: 'system_settings_updated',
        resource_type: 'settings',
        resource_id: 'global',
        admin_id: adminUser?.id || null,
        client_ip: req.ip || req.socket.remoteAddress,
        details_json: JSON.stringify({
          updatedBy: adminUser?.username || 'admin',
          admin_notification_email,
          notification_alerts_enabled,
        }),
      });

      const updated = await this.settingsService.getAllSettings();

      res.status(200).json({
        success: true,
        message: 'Administrative settings updated successfully.',
        data: {
          settings: updated,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async sendTestEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentEmail = await this.settingsService.getAdminNotificationEmail();
      const targetEmail = (req.body?.email && typeof req.body.email === 'string' && req.body.email.trim())
        ? req.body.email.trim()
        : currentEmail;

      if (!z.string().email().safeParse(targetEmail).success) {
        throw new AppError('Invalid recipient email address format.', 400, 'INVALID_EMAIL');
      }

      const timestamp = new Date().toUTCString();
      const subject = `[Test Ping] Cityline Consultancy Notification Dispatch Test`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 8px;">
          <h2 style="color: #0B192C; margin-top: 0;">✓ SMTP Notification Test Successful</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            This email verifies that your <strong>Cityline Consultancy</strong> administrative notification pipeline is operational.
          </p>
          <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748B;"><strong>Configuration Diagnostics:</strong></p>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #1E293B; line-height: 1.6;">
              <li>Recipient Mailbox: <code>${targetEmail}</code></li>
              <li>Outbound Server: <code>${env.SMTP_HOST}:${env.SMTP_PORT} (SSL)</code></li>
              <li>Authenticated Sender: <code>${env.SMTP_FROM}</code></li>
              <li>Timestamp: <code>${timestamp}</code></li>
            </ul>
          </div>
          <p style="color: #10B981; font-size: 13px; font-weight: 600; margin-bottom: 0;">
            All website contact enquiries, visa leads, job applications, and manpower requisitions will arrive at this address.
          </p>
        </div>
      `;
      const text = `
CITYLINE CONSULTANCY — SMTP NOTIFICATION TEST
========================================================
Verification status: DELIVERED
Target Mailbox:      ${targetEmail}
SMTP Host:           ${env.SMTP_HOST}:${env.SMTP_PORT}
Timestamp:           ${timestamp}

All website enquiries and applications are configured to dispatch alerts here.
      `.trim();

      const result = await this.transport.sendMail({
        to: targetEmail,
        subject,
        html,
        text,
      });

      logger.info(`Test notification email sent to ${targetEmail}`, { messageId: result.messageId });

      res.status(200).json({
        success: true,
        message: `Live test email successfully dispatched to ${targetEmail}`,
        data: {
          recipient: targetEmail,
          messageId: result.messageId,
          sentAt: new Date().toISOString(),
        },
      });
    } catch (err: unknown) {
      logger.error('Failed to send live test email', err instanceof Error ? err : undefined);
      next(err);
    }
  }
}

export const adminSettingController = new AdminSettingController();
