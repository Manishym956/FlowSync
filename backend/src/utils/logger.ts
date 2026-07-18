/**
 * Pino structured JSON logger.
 *
 * All integration operations should log: integration, operation, status,
 * latency, retry count, and timestamp (per guidelines.md §Logging).
 *
 * Never log credentials, auth headers, or sensitive payload data.
 */

import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  base: {
    service: 'flowsync',
    env: env.NODE_ENV,
  },
});
