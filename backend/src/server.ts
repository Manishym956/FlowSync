/**
 * API Server entry point.
 *
 * Starts the Express HTTP server on the configured port.
 * The BullMQ worker runs as a separate process (src/worker.ts).
 */

import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { logger } from './utils/logger';

const PORT = env.PORT;

async function start(): Promise<void> {
  // Verify database connectivity before accepting traffic
  try {
    await prisma.$connect();
    logger.info({ service: 'api' }, 'Database connected');
  } catch (error) {
    logger.fatal({ error }, 'Failed to connect to database. Exiting.');
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    logger.info({ service: 'api', port: PORT }, `FlowSync API running on port ${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received');
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Server shut down gracefully');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
