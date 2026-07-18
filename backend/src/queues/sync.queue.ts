/**
 * Sync Queue — BullMQ
 *
 * Manages asynchronous synchronization jobs.
 * The API creates jobs here; workers process them independently (TRD §10).
 *
 * Retry strategy per TRD §11:
 *   Attempt 1 → Immediate
 *   Attempt 2 → 30 seconds
 *   Attempt 3 → 2 minutes
 *   Attempt 4 → 10 minutes
 */

import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { SyncJobData } from '../types';

export const SYNC_QUEUE_NAME = 'sync-queue';

let syncQueue: Queue<SyncJobData> | null = null;

export function getSyncQueue(): Queue<SyncJobData> {
  if (!syncQueue) {
    syncQueue = new Queue<SyncJobData>(SYNC_QUEUE_NAME, {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: 4,
        backoff: {
          type: 'custom', // We use the delay values from retry.ts
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
          age: 86400, // ... or jobs from the last 24 hours
        },
        removeOnFail: {
          count: 200, // Keep last 200 failed jobs for inspection
        },
      },
    });
  }
  return syncQueue;
}

/**
 * Adds a sync job to the queue and returns the BullMQ job ID.
 */
export async function enqueueSyncJob(data: SyncJobData): Promise<string> {
  const queue = getSyncQueue();
  const job = await queue.add('sync', data, {
    jobId: data.syncJobId, // Use our DB job ID as the BullMQ job ID
  });
  return job.id ?? data.syncJobId;
}
