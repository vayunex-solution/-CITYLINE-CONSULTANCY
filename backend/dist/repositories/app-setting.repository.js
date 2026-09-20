"use strict";
/**
 * CITYLINE CONSULTANCY — App Setting Repository
 * Manages key-value persistence for dynamic administrative settings in MariaDB.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.appSettingRepository = exports.AppSettingRepository = void 0;
const connection_1 = require("../database/connection");
const database_error_1 = require("../database/database-error");
class AppSettingRepository {
    tableName = 'app_settings';
    getQuery(trx) {
        const client = trx || (0, connection_1.getDbClient)();
        return client(this.tableName);
    }
    async getByKey(key, trx) {
        try {
            const row = await this.getQuery(trx).where({ setting_key: key }).first();
            return row ? row.setting_value : null;
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AppSettingRepository.getByKey');
        }
    }
    async getAll(trx) {
        try {
            return await this.getQuery(trx).select('*').orderBy('setting_key', 'asc');
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AppSettingRepository.getAll');
        }
    }
    async setKey(key, value, description, trx) {
        try {
            const db = trx || (0, connection_1.getDbClient)();
            const existing = await this.getQuery(trx).where({ setting_key: key }).first();
            if (existing) {
                await this.getQuery(trx)
                    .where({ setting_key: key })
                    .update({
                    setting_value: value,
                    ...(description ? { description } : {}),
                    updated_at: db.fn.now(),
                });
            }
            else {
                await this.getQuery(trx).insert({
                    setting_key: key,
                    setting_value: value,
                    description: description || null,
                    updated_at: db.fn.now(),
                });
            }
        }
        catch (err) {
            throw (0, database_error_1.normalizeDatabaseError)(err, 'AppSettingRepository.setKey');
        }
    }
}
exports.AppSettingRepository = AppSettingRepository;
exports.appSettingRepository = new AppSettingRepository();
