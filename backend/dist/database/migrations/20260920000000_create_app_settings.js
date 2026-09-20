"use strict";
/**
 * CITYLINE CONSULTANCY — Application Settings Migration
 * Creates key-value persistence table for runtime administrative settings,
 * including dynamic notification recipient emails and operational toggles.
 *
 * GOVERNANCE:
 * - Compatible with MariaDB 10.3+ / MySQL 8.0+.
 * - UTF-8 mb4 collation, UTC timestamps.
 * - Idempotent reference data seeding included.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    const hasTable = await knex.schema.hasTable('app_settings');
    if (!hasTable) {
        await knex.schema.createTable('app_settings', (table) => {
            table.string('setting_key', 100).primary();
            table.text('setting_value').notNullable();
            table.string('description', 255).nullable();
            table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
        });
        // Seed default administrative notification email
        const initialSettings = [
            {
                setting_key: 'admin_notification_email',
                setting_value: 'yashkr4748@gmail.com',
                description: 'Primary recipient email for all website enquiries, visa leads, job applications, and manpower requisitions',
            },
            {
                setting_key: 'notification_alerts_enabled',
                setting_value: 'true',
                description: 'Global master switch for dispatching outgoing admin notification emails',
            },
        ];
        for (const setting of initialSettings) {
            await knex('app_settings').insert(setting);
        }
    }
}
async function down(knex) {
    await knex.schema.dropTableIfExists('app_settings');
}
