/**
 * CITYLINE CONSULTANCY — App Setting Repository
 * Manages key-value persistence for dynamic administrative settings in MariaDB.
 */

import { Knex } from 'knex';
import { getDbClient } from '../database/connection';
import { normalizeDatabaseError } from '../database/database-error';

export interface AppSettingRecord {
  setting_key: string;
  setting_value: string;
  description?: string | null;
  updated_at: Date;
}

export class AppSettingRepository {
  private readonly tableName = 'app_settings';

  private getQuery(trx?: Knex.Transaction): Knex.QueryBuilder {
    const client = trx || getDbClient();
    return client(this.tableName);
  }

  public async getByKey(key: string, trx?: Knex.Transaction): Promise<string | null> {
    try {
      const row = await this.getQuery(trx).where({ setting_key: key }).first();
      return row ? (row.setting_value as string) : null;
    } catch (err) {
      throw normalizeDatabaseError(err, 'AppSettingRepository.getByKey');
    }
  }

  public async getAll(trx?: Knex.Transaction): Promise<AppSettingRecord[]> {
    try {
      return await this.getQuery(trx).select('*').orderBy('setting_key', 'asc');
    } catch (err) {
      throw normalizeDatabaseError(err, 'AppSettingRepository.getAll');
    }
  }

  public async setKey(
    key: string,
    value: string,
    description?: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    try {
      const db = trx || getDbClient();
      const existing = await this.getQuery(trx).where({ setting_key: key }).first();

      if (existing) {
        await this.getQuery(trx)
          .where({ setting_key: key })
          .update({
            setting_value: value,
            ...(description ? { description } : {}),
            updated_at: db.fn.now(),
          });
      } else {
        await this.getQuery(trx).insert({
          setting_key: key,
          setting_value: value,
          description: description || null,
          updated_at: db.fn.now(),
        });
      }
    } catch (err) {
      throw normalizeDatabaseError(err, 'AppSettingRepository.setKey');
    }
  }
}

export const appSettingRepository = new AppSettingRepository();
