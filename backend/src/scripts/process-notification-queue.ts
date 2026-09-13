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

import { env } from '../config/env.config';
import { initializeDatabase, closeDatabaseConnection } from '../database/connection';
import { notificationService } from '../services/notification.service';
import { logger } from '../utils/logger';

async function runQueueWorker(): Promise<void> {
  const startTime = Date.now();
  logger.info('Notification outbox worker execution started');

  try {
    // 1. Initialize database connection
    await initializeDatabase();

    // 2. Process bounded batch
    const batchResult = await notificationService.processBatch({
      batchSize: env.NOTIFICATION_BATCH_SIZE,
      staleTimeoutMs: env.NOTIFICATION_STALE_TIMEOUT_MS,
    });

    // 3. Optional periodic cleanup of aged records
    const cleanupResult = await notificationService.cleanupOldNotifications();

    const durationMs = Date.now() - startTime;
    logger.info('Notification outbox worker completed batch pass', {
      processed: batchResult.processed,
      sent: batchResult.sent,
      failed: batchResult.failed,
      exhausted: batchResult.exhausted,
      deletedOldSent: cleanupResult.deletedSent,
      deletedOldExhausted: cleanupResult.deletedExhausted,
      durationMs,
    });

    console.log(
      `[Notification Worker] Finished: ${batchResult.processed} processed, ` +
        `${batchResult.sent} sent, ${batchResult.failed} failed, ${batchResult.exhausted} exhausted in ${durationMs}ms`
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error('Fatal error during notification worker batch execution', err instanceof Error ? err : undefined, {
      error: errorMsg,
    });
    console.error(`[Notification Worker CRITICAL] Execution failed: ${errorMsg}`);
    process.exitCode = 1;
  } finally {
    // Graceful shutdown of network resources
    notificationService.shutdown();
    await closeDatabaseConnection();
  }
}

// Execute if run directly from CLI
if (require.main === module) {
  void runQueueWorker();
}

export { runQueueWorker };
