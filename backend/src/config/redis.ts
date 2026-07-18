/**
 * Redis client singleton using ioredis.
 *
 * Used by BullMQ for queue backend. The same connection instance is
 * reused across the application to avoid creating unnecessary connections.
 */

import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,    // Required by BullMQ
    });

    redisClient.on('connect', () => {
      logger.info({ service: 'redis' }, 'Redis connected');
    });

    redisClient.on('error', (err: Error) => {
      logger.error({ service: 'redis', error: err.message }, 'Redis connection error');
    });
  }

  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
