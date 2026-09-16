"use strict";
/**
 * CITYLINE CONSULTANCY — Database Connection Management
 * Provides Knex database client access, connectivity probes, and graceful shutdown.
 *
 * GOVERNANCE:
 * - Single controlled Knex instance (no per-request connection leaks).
 * - Conservative cPanel connection pooling.
 * - Clean lifecycle hooks for startup, health probes, and graceful shutdown.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDbClient = getDbClient;
exports.initializeDatabase = initializeDatabase;
exports.checkDatabaseConnectivity = checkDatabaseConnectivity;
exports.executeRawQuery = executeRawQuery;
exports.closeDatabaseConnection = closeDatabaseConnection;
exports.setDbClient = setDbClient;
const knex_1 = __importDefault(require("knex"));
const knex_config_1 = __importDefault(require("../config/knex.config"));
const logger_1 = require("../utils/logger");
const database_error_1 = require("./database-error");
let dbInstance = null;
/**
 * Returns the active singleton Knex database client.
 * Initializes the client lazily on first access.
 */
function getDbClient() {
    if (!dbInstance) {
        dbInstance = (0, knex_1.default)(knex_config_1.default);
    }
    return dbInstance;
}
/**
 * Explicitly initializes the database client and runs a ping query.
 */
async function initializeDatabase() {
    const client = getDbClient();
    await client.raw('SELECT 1 as ping');
    return client;
}
/**
 * Checks database connectivity without throwing unhandled exceptions.
 */
async function checkDatabaseConnectivity() {
    try {
        const db = getDbClient();
        await db.raw('SELECT 1 as ping');
        return { ok: true };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown database error';
        return { ok: false, error: message };
    }
}
/**
 * Executes a raw query safely through the active connection.
 */
async function executeRawQuery(sql, bindings) {
    try {
        const db = getDbClient();
        const result = bindings ? await db.raw(sql, bindings) : await db.raw(sql);
        return result;
    }
    catch (error) {
        throw (0, database_error_1.normalizeDatabaseError)(error, 'Raw Query Execution');
    }
}
/**
 * Destroys the active connection pool during graceful shutdown.
 */
async function closeDatabaseConnection() {
    if (dbInstance) {
        try {
            await dbInstance.destroy();
            logger_1.logger.info('Database connection pool successfully destroyed');
        }
        catch (error) {
            logger_1.logger.error('Error destroying database connection pool', error instanceof Error ? error : undefined);
        }
        finally {
            dbInstance = null;
        }
    }
}
/**
 * Internal helper to inject a mock or custom Knex instance for unit testing.
 */
function setDbClient(client) {
    dbInstance = client;
}
