/**
 * Workflow Worker — BullMQ
 *
 * Processes workflow jobs from the workflow-queue.
 * Runs in the background as a separate worker loop.
 *
 * Job lifecycle:
 *   1. Retrieve WebhookEvent from PostgreSQL
 *   2. Create WorkflowExecution record (RUNNING)
 *   3. Resolve workflow handler from registry
 *   4. Execute handler
 *   5. If success:
 *      - Mark WorkflowExecution as COMPLETED
 *      - Set WebhookEvent processed = true
 *      - Write IntegrationLog (SUCCESS)
 *   6. If failure:
 *      - Mark WorkflowExecution as FAILED
 *      - Write IntegrationLog (FAILED)
 *      - Re-throw for BullMQ retry
 */

import { Worker, Job, UnrecoverableError } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { prisma } from '../config/database';
import { resolveWorkflow } from '../workflows/registry';
import { logger } from '../utils/logger';
import { WORKFLOW_QUEUE_NAME, WorkflowJobData } from '../queues/workflow.queue';

export function createWorkflowWorker(): Worker<WorkflowJobData> {
  const worker = new Worker<WorkflowJobData>(
    WORKFLOW_QUEUE_NAME,
    async (job: Job<WorkflowJobData>) => {
      const { webhookEventId, provider, eventType } = job.data;
      const start = Date.now();

      logger.info(
        { webhookEventId, provider, eventType, jobId: job.id, attempt: job.attemptsMade },
        'Workflow execution started',
      );

      // ── Step 1: Retrieve WebhookEvent ──────────────────────────────────────
      const event = await prisma.webhookEvent.findUnique({
        where: { id: webhookEventId },
      });

      if (!event) {
        throw new Error(`WebhookEvent ${webhookEventId} not found in database`);
      }

      if (event.processed) {
        logger.info(
          { webhookEventId, eventType },
          'WebhookEvent already marked as processed — skipping',
        );
        return;
      }

      // ── Step 2: Create WorkflowExecution ───────────────────────────────────
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowName: eventType,
          triggerEvent: eventType,
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });

      // ── Step 3: Resolve workflow handler ───────────────────────────────────
      const handler = resolveWorkflow(eventType);

      if (!handler) {
        // No handler registered: treat as success/no-op and complete
        logger.warn(
          { eventType, webhookEventId },
          `No workflow handler registered for event type "${eventType}" — executing no-op`,
        );

        // Update WorkflowExecution
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        // Update WebhookEvent
        await prisma.webhookEvent.update({
          where: { id: webhookEventId },
          data: {
            processed: true,
            processedAt: new Date(),
          },
        });

        return;
      }

      // ── Step 4: Execute handler ────────────────────────────────────────────
      try {
        await handler(event.payload, {
          webhookEventId,
          executionId: execution.id,
        });

        const latency = Date.now() - start;

        // ── Step 5: Successful Execution ─────────────────────────────────────
        // Update WorkflowExecution
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        // Update WebhookEvent
        await prisma.webhookEvent.update({
          where: { id: webhookEventId },
          data: {
            processed: true,
            processedAt: new Date(),
          },
        });

        // Find associated Integration for audit logs
        const integration = await prisma.integration.findFirst({
          where: { type: provider },
        });

        if (integration) {
          await prisma.integrationLog.create({
            data: {
              integrationId: integration.id,
              operation: 'WEBHOOK',
              status: 'SUCCESS',
              latency,
              retryCount: job.attemptsMade,
              metadata: {
                webhookEventId,
                eventType,
                workflowExecutionId: execution.id,
              },
            },
          });
        }

        logger.info(
          { webhookEventId, workflowExecutionId: execution.id, latency },
          'Workflow execution finished successfully',
        );
      } catch (err: any) {
        const latency = Date.now() - start;
        const errorMessage = err instanceof Error ? err.message : 'Unknown workflow execution error';

        logger.error(
          { webhookEventId, workflowExecutionId: execution.id, error: errorMessage },
          'Workflow execution failed',
        );

        // ── Step 6: Failed Execution ─────────────────────────────────────────
        // Update WorkflowExecution
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            errorMessage,
          },
        });

        // Find associated Integration for audit logs
        const integration = await prisma.integration.findFirst({
          where: { type: provider },
        });

        if (integration) {
          await prisma.integrationLog.create({
            data: {
              integrationId: integration.id,
              operation: 'WEBHOOK',
              status: 'FAILED',
              latency,
              retryCount: job.attemptsMade,
              errorMessage,
              metadata: {
                webhookEventId,
                eventType,
                workflowExecutionId: execution.id,
              },
            },
          });
        }

        // Re-throw so BullMQ handles retries, or throw UnrecoverableError for permanent failures
        const isPermanent = err.statusCode && err.statusCode < 500 && err.statusCode !== 429;
        if (isPermanent) {
          throw new UnrecoverableError(errorMessage);
        }
        throw err;
      }
    },
    {
      connection: getRedisClient(),
      concurrency: 5,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, attempt: job?.attemptsMade },
      `Workflow worker job permanently failed: ${err.message}`,
    );
  });

  worker.on('error', (err) => {
    logger.error({ error: err.message }, 'Workflow worker error');
  });

  logger.info({ queue: WORKFLOW_QUEUE_NAME }, 'Workflow worker listening');
  return worker;
}
