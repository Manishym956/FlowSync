/**
 * Workflow Queue — BullMQ
 *
 * Manages asynchronous execution of triggered workflows.
 * Inbound webhooks add minimal job metadata here.
 * The workflow worker picks up jobs, fetches full event payloads
 * from PostgreSQL, and processes them.
 */

import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis';

export const WORKFLOW_QUEUE_NAME = 'workflow-queue';

export interface WorkflowJobData {
  webhookEventId: string;
  provider: string;
  eventType: string;
}

let workflowQueue: Queue<WorkflowJobData> | null = null;

export function getWorkflowQueue(): Queue<WorkflowJobData> {
  if (!workflowQueue) {
    workflowQueue = new Queue<WorkflowJobData>(WORKFLOW_QUEUE_NAME, {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // retry after 5s, 10s, 20s
        },
        removeOnComplete: {
          count: 100,
          age: 86400,
        },
        removeOnFail: {
          count: 200,
        },
      },
    });
  }
  return workflowQueue;
}

/**
 * Enqueues a workflow job.
 */
export async function enqueueWorkflowJob(data: WorkflowJobData): Promise<string> {
  const queue = getWorkflowQueue();
  const job = await queue.add(data.eventType, data);
  return job.id ?? '';
}
