"use strict";
/**
 * CITYLINE CONSULTANCY — Admin Settings Controller
 * Handles configuration of administrative recipient emails, notification triggers,
 * and live deliverability testing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSettingController = exports.AdminSettingController = void 0;
const zod_1 = require("zod");
const app_setting_service_1 = require("../services/app-setting.service");
const smtp_transport_1 = require("../notifications/smtp-transport");
const audit_log_repository_1 = require("../repositories/audit-log.repository");
const env_config_1 = require("../config/env.config");
const app_error_1 = require("../utils/app-error");
const logger_1 = require("../utils/logger");
const updateSettingsSchema = zod_1.z.object({
    admin_notification_email: zod_1.z.string().email('Must be a valid email address').optional(),
    notification_alerts_enabled: zod_1.z.enum(['true', 'false']).optional(),
});
class AdminSettingController {
    settingsService;
    transport;
    auditRepo;
    constructor(settingsService = app_setting_service_1.appSettingService, transport = smtp_transport_1.smtpTransportManager, auditRepo = audit_log_repository_1.auditLogRepository) {
        this.settingsService = settingsService;
        this.transport = transport;
        this.auditRepo = auditRepo;
    }
    async getSettings(_req, res, next) {
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
                        host: env_config_1.env.SMTP_HOST,
                        port: env_config_1.env.SMTP_PORT,
                        secure: env_config_1.env.SMTP_SECURE,
                        from: env_config_1.env.SMTP_FROM,
                        isMockMode: env_config_1.env.NOTIFICATION_MOCK_TRANSPORT,
                    },
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    async updateSettings(req, res, next) {
        try {
            const parsed = updateSettingsSchema.safeParse(req.body);
            if (!parsed.success) {
                throw new app_error_1.AppError(parsed.error.issues[0]?.message || 'Invalid settings payload', 400, 'VALIDATION_ERROR');
            }
            const { admin_notification_email, notification_alerts_enabled } = parsed.data;
            if (admin_notification_email) {
                await this.settingsService.setAdminNotificationEmail(admin_notification_email);
            }
            if (notification_alerts_enabled !== undefined) {
                await this.settingsService['repo'].setKey('notification_alerts_enabled', notification_alerts_enabled);
            }
            const adminUser = req.admin;
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
        }
        catch (err) {
            next(err);
        }
    }
    async sendTestEmail(req, res, next) {
        try {
            const currentEmail = await this.settingsService.getAdminNotificationEmail();
            const targetEmail = (req.body?.email && typeof req.body.email === 'string' && req.body.email.trim())
                ? req.body.email.trim()
                : currentEmail;
            if (!zod_1.z.string().email().safeParse(targetEmail).success) {
                throw new app_error_1.AppError('Invalid recipient email address format.', 400, 'INVALID_EMAIL');
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
              <li>Outbound Server: <code>${env_config_1.env.SMTP_HOST}:${env_config_1.env.SMTP_PORT} (SSL)</code></li>
              <li>Authenticated Sender: <code>${env_config_1.env.SMTP_FROM}</code></li>
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
SMTP Host:           ${env_config_1.env.SMTP_HOST}:${env_config_1.env.SMTP_PORT}
Timestamp:           ${timestamp}

All website enquiries and applications are configured to dispatch alerts here.
      `.trim();
            const result = await this.transport.sendMail({
                to: targetEmail,
                subject,
                html,
                text,
            });
            logger_1.logger.info(`Test notification email sent to ${targetEmail}`, { messageId: result.messageId });
            res.status(200).json({
                success: true,
                message: `Live test email successfully dispatched to ${targetEmail}`,
                data: {
                    recipient: targetEmail,
                    messageId: result.messageId,
                    sentAt: new Date().toISOString(),
                },
            });
        }
        catch (err) {
            logger_1.logger.error('Failed to send live test email', err instanceof Error ? err : undefined);
            next(err);
        }
    }
}
exports.AdminSettingController = AdminSettingController;
exports.adminSettingController = new AdminSettingController();
