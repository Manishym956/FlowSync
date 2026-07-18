/**
 * BullMQ Worker process entry point.
 *
 * Runs independently from the API server (separate process / container).
 * Starts the sync worker which consumes jobs from the sync-queue.
 */

import { createSyncWorker } from './workers/sync.worker';
import { createWorkflowWorker } from './workers/workflow.worker';
import { prisma } from './config/database';
import { logger } from './utils/logger';

async function startWorker(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info({ service: 'worker' }, 'Database connected');
  } catch (error) {
    logger.fatal({ error }, 'Worker failed to connect to database. Exiting.');
    process.exit(1);
  }

  const syncWorker = createSyncWorker();
  const workflowWorker = createWorkflowWorker();
  logger.info({ service: 'worker' }, 'FlowSync sync and workflow workers started');

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Worker shutdown signal received');
    await Promise.all([
      syncWorker.close(),
      workflowWorker.close(),
    ]);
    await prisma.$disconnect();
    logger.info('Workers shut down gracefully');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startWorker();
