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

import { app } from './app';
import { env } from './config/env.config';
import { initializeStorageFoundation } from './config/storage.config';
import { closeDatabaseConnection } from './database/connection';
import { logger } from './utils/logger';

// 1. Initialize private storage directory foundation (~/clc_storage/)
initializeStorageFoundation();

// 2. Start HTTP server listener
export const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`CITYLINE CONSULTANCY API Server started successfully`, {
    host: env.HOST,
    port: env.PORT,
    environment: env.NODE_ENV,
    apiPrefix: env.API_PREFIX,
    nodeVersion: process.version,
  });
});

// 3. Graceful shutdown management
let isShuttingDown = false;

export async function handleShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn(`Shutdown already in progress, ignoring subsequent signal: ${signal}`);
    return;
  }
  isShuttingDown = true;

  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Safety timer: force exit if graceful teardown takes more than 10 seconds
  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded (10s). Forcing immediate termination.');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  try {
    // Step 1: Stop accepting new HTTP connections
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          logger.error('Error closing HTTP server listener', err);
          return reject(err);
        }
        logger.info('HTTP server listener closed. In-flight requests drained.');
        resolve();
      });
    });

    // Step 2: Gracefully close database connection pool
    await closeDatabaseConnection();

    logger.info('Graceful shutdown completed successfully. Process exiting.');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown sequence', error instanceof Error ? error : undefined);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  void handleShutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void handleShutdown('SIGINT');
});
