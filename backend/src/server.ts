/**
 * CITYLINE CONSULTANCY — Backend Server Entry Point
 * Initializes storage, starts HTTP listener, and manages graceful process termination.
 */

import { app } from './app';
import { env } from './config/env.config';
import { initializeStorageFoundation } from './config/storage.config';
import { logger } from './utils/logger';

// Ensure storage directories are ready on startup
initializeStorageFoundation();

const server = app.listen(env.PORT, () => {
  logger.info(`Server started successfully`, {
    port: env.PORT,
    environment: env.NODE_ENV,
    apiPrefix: env.API_PREFIX,
    nodeVersion: process.version,
  });
});

// Graceful shutdown management
function handleShutdown(signal: string): void {
  logger.info(`Received ${signal}, initiating graceful shutdown`);
  server.close(() => {
    logger.info('HTTP server closed, process terminating');
    process.exit(0);
  });

  // Force exit if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
