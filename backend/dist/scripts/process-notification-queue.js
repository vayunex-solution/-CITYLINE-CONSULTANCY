"use strict";
/**
 * CITYLINE CONSULTANCY — Outbox Notification Worker CLI Runner
 * Single-run batch processor suitable for cPanel/CloudLinux cron jobs.
 *
 * USAGE (cPanel cron / CLI):
 *   npm run queue:process
 *   OR: node -r tsx/register src/scripts/process-notification-queue.ts
 *
 * GOVERNANCE:
 * - Claims a bounded batch of queued/failed items atomically.
 * - Concurrency-safe: Overlapping cron executions will NOT process the same records.
 * - Does not run as a tight CPU-intensive infinite loop.
 * - Closes all database connections and SMTP sockets cleanly before exiting.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runQueueWorker = runQueueWorker;
const env_config_1 = require("../config/env.config");
const connection_1 = require("../database/connection");
const notification_service_1 = require("../services/notification.service");
const logger_1 = require("../utils/logger");
async function runQueueWorker() {
    const startTime = Date.now();
    logger_1.logger.info('Notification outbox worker execution started');
    try {
        // 1. Initialize database connection
        await (0, connection_1.initializeDatabase)();
        // 2. Process bounded batch
        const batchResult = await notification_service_1.notificationService.processBatch({
            batchSize: env_config_1.env.NOTIFICATION_BATCH_SIZE,
            staleTimeoutMs: env_config_1.env.NOTIFICATION_STALE_TIMEOUT_MS,
        });
        // 3. Optional periodic cleanup of aged records
        const cleanupResult = await notification_service_1.notificationService.cleanupOldNotifications();
        const durationMs = Date.now() - startTime;
        logger_1.logger.info('Notification outbox worker completed batch pass', {
            processed: batchResult.processed,
            sent: batchResult.sent,
            failed: batchResult.failed,
            exhausted: batchResult.exhausted,
            deletedOldSent: cleanupResult.deletedSent,
            deletedOldExhausted: cleanupResult.deletedExhausted,
            durationMs,
        });
        console.log(`[Notification Worker] Finished: ${batchResult.processed} processed, ` +
            `${batchResult.sent} sent, ${batchResult.failed} failed, ${batchResult.exhausted} exhausted in ${durationMs}ms`);
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger_1.logger.error('Fatal error during notification worker batch execution', err instanceof Error ? err : undefined, {
            error: errorMsg,
        });
        console.error(`[Notification Worker CRITICAL] Execution failed: ${errorMsg}`);
        process.exitCode = 1;
    }
    finally {
        // Graceful shutdown of network resources
        notification_service_1.notificationService.shutdown();
        await (0, connection_1.closeDatabaseConnection)();
    }
}
// Execute if run directly from CLI
if (require.main === module) {
    void runQueueWorker();
}
