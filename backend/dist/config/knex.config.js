"use strict";
/**
 * CITYLINE CONSULTANCY — Knexfile Configuration
 * Provides Knex connection, migration, and seed parameters.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const database_config_1 = require("./database.config");
const knexConfig = {
    client: database_config_1.databaseConfig.client,
    connection: {
        host: database_config_1.databaseConfig.host,
        port: database_config_1.databaseConfig.port,
        database: database_config_1.databaseConfig.database,
        user: database_config_1.databaseConfig.user,
        password: database_config_1.databaseConfig.password,
        charset: database_config_1.databaseConfig.charset,
        timezone: database_config_1.databaseConfig.timezone,
        ssl: database_config_1.databaseConfig.ssl,
    },
    pool: {
        min: database_config_1.databaseConfig.pool.min,
        max: database_config_1.databaseConfig.pool.max,
        acquireTimeoutMillis: database_config_1.databaseConfig.pool.acquireTimeoutMillis,
        idleTimeoutMillis: database_config_1.databaseConfig.pool.idleTimeoutMillis,
        createTimeoutMillis: database_config_1.databaseConfig.pool.createTimeoutMillis,
    },
    migrations: {
        tableName: 'knex_migrations',
        directory: path_1.default.resolve(__dirname, '../database/migrations'),
        extension: 'ts',
        loadExtensions: ['.ts', '.js'],
    },
    seeds: {
        directory: path_1.default.resolve(__dirname, '../database/seeds'),
        extension: 'ts',
        loadExtensions: ['.ts', '.js'],
    },
};
exports.default = knexConfig;
