"use strict";
/**
 * CITYLINE CONSULTANCY — Backend Server Entry Point
 * Initializes storage, starts HTTP listener, and orchestrates graceful termination.
 *
 * GOVERNANCE:
 * - Stops accepting new connections on shutdown signal.
 * - Destroys Knex database connection pool cleanly.
 * - Protects against hanging connections via a 10s safety timeout.
 * - Ignores duplicate shutdown signals.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
exports.handleShutdown = handleShutdown;
const app_1 = require("./app");
const env_config_1 = require("./config/env.config");
const storage_config_1 = require("./config/storage.config");
const connection_1 = require("./database/connection");
const logger_1 = require("./utils/logger");
// 1. Initialize private storage directory foundation (~/clc_storage/)
(0, storage_config_1.initializeStorageFoundation)();
// 2. Start HTTP server listener
exports.server = app_1.app.listen(env_config_1.env.PORT, env_config_1.env.HOST, () => {
    logger_1.logger.info(`CITYLINE CONSULTANCY API Server started successfully`, {
        host: env_config_1.env.HOST,
        port: env_config_1.env.PORT,
        environment: env_config_1.env.NODE_ENV,
        apiPrefix: env_config_1.env.API_PREFIX,
        nodeVersion: process.version,
    });
});
// 3. Graceful shutdown management
let isShuttingDown = false;
async function handleShutdown(signal) {
    if (isShuttingDown) {
        logger_1.logger.warn(`Shutdown already in progress, ignoring subsequent signal: ${signal}`);
        return;
    }
    isShuttingDown = true;
    logger_1.logger.info(`Received ${signal}. Initiating graceful shutdown...`);
    // Safety timer: force exit if graceful teardown takes more than 10 seconds
    const forceExitTimer = setTimeout(() => {
        logger_1.logger.error('Graceful shutdown timeout exceeded (10s). Forcing immediate termination.');
        process.exit(1);
    }, 10000);
    forceExitTimer.unref();
    try {
        // Step 1: Stop accepting new HTTP connections
        await new Promise((resolve, reject) => {
            exports.server.close((err) => {
                if (err) {
                    logger_1.logger.error('Error closing HTTP server listener', err);
                    return reject(err);
                }
                logger_1.logger.info('HTTP server listener closed. In-flight requests drained.');
                resolve();
            });
        });
        // Step 2: Gracefully close database connection pool
        await (0, connection_1.closeDatabaseConnection)();
        logger_1.logger.info('Graceful shutdown completed successfully. Process exiting.');
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('Error during graceful shutdown sequence', error instanceof Error ? error : undefined);
        process.exit(1);
    }
}
process.on('SIGTERM', () => {
    void handleShutdown('SIGTERM');
});
process.on('SIGINT', () => {
    void handleShutdown('SIGINT');
});
