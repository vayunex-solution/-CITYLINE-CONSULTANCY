/**
 * CITYLINE CONSULTANCY — Knexfile Configuration
 * Provides Knex connection, migration, and seed parameters.
 */

import { Knex } from 'knex';
import path from 'path';
import { databaseConfig } from './database.config';

const knexConfig: Knex.Config = {
  client: databaseConfig.client,
  connection: {
    host: databaseConfig.host,
    port: databaseConfig.port,
    database: databaseConfig.database,
    user: databaseConfig.user,
    password: databaseConfig.password,
    charset: databaseConfig.charset,
    timezone: databaseConfig.timezone,
    ssl: databaseConfig.ssl,
  },
  pool: {
    min: databaseConfig.pool.min,
    max: databaseConfig.pool.max,
    acquireTimeoutMillis: databaseConfig.pool.acquireTimeoutMillis,
    idleTimeoutMillis: databaseConfig.pool.idleTimeoutMillis,
    createTimeoutMillis: databaseConfig.pool.createTimeoutMillis,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: path.resolve(__dirname, '../database/migrations'),
    extension: __filename.endsWith('.js') ? 'js' : 'ts',
    loadExtensions: __filename.endsWith('.js') ? ['.js', '.ts'] : ['.ts', '.js'],
  },
  seeds: {
    directory: path.resolve(__dirname, '../database/seeds'),
    extension: __filename.endsWith('.js') ? 'js' : 'ts',
    loadExtensions: __filename.endsWith('.js') ? ['.js', '.ts'] : ['.ts', '.js'],
  },
};

export default knexConfig;
