/**
 * Sync Worker — BullMQ
 *
 * Processes sync jobs from the sync-queue.
 * Runs as a separate process from the API server (src/worker.ts).
 *
 * Job lifecycle:
 *   1. Update SyncJob status → PROCESSING
 *   2. Resolve connector from registry
 *   3. Authenticate (if needed)
 *   4. For each supported resource type (polymorphic loop):
 *      a. Fetch data from external API
 *      b. Transform each record
 *      c. Upsert into database (User or Event, based on returned type)
 *      d. Maintain ExternalEntity mappings
 *   5. Write IntegrationLog
 *   6. Update SyncJob status → COMPLETED | FAILED
 */

import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { prisma } from '../config/database';
import { resolveConnector } from '../connectors/registry';
import { logger } from '../utils/logger';
import { classifyError } from '../utils/retry';
import { SYNC_QUEUE_NAME } from '../queues/sync.queue';
import { SyncJobData, FlowSyncUser, FlowSyncEvent, isFlowSyncEvent } from '../types';

export function createSyncWorker(): Worker<SyncJobData> {
  const worker = new Worker<SyncJobData>(
    SYNC_QUEUE_NAME,
    async (job: Job<SyncJobData>) => {
      const { syncJobId, integrationId, integrationType } = job.data;
      const start = Date.now();

      logger.info(
        { syncJobId, integrationId, integrationType, jobId: job.id },
        'Sync job started',
      );

      // ── Step 1: Mark job as PROCESSING ──────────────────────────────────────
      await prisma.syncJob.update({
        where: { id: syncJobId },
        data: { status: 'PROCESSING', startedAt: new Date() },
      });

      let recordsProcessed = 0;
      let recordsFailed = 0;

      try {
        // ── Step 2: Resolve connector ────────────────────────────────────────
        const connector = resolveConnector(integrationType);

        // ── Step 3: Authenticate ─────────────────────────────────────────────
        await connector.authenticate();

        // ── Step 4: Resolve resources to sync ────────────────────────────────
        // If connector defines getSupportedResources(), iterate over them.
        // Otherwise, run a single default fetch.
        const resources = connector.getSupportedResources
          ? connector.getSupportedResources()
          : [undefined];

        for (const resource of resources) {
          logger.info(
            { syncJobId, integrationId, resourceType: resource ?? 'Default' },
            `Syncing resource type: ${resource ?? 'Default'}`
          );

          try {
            // Fetch resources
            const externalRecords = await connector.fetchData({
              resourceType: resource,
              results: 10,
              count: 10,
            });

            // Process each record
            for (const externalRecord of externalRecords) {
              try {
                const internal = connector.transformData(externalRecord);

                if (isFlowSyncEvent(internal)) {
                  // Save as Event
                  await upsertEvent(internal);
                } else {
                  // Save as User
                  await upsertUser(internal);
                }

                recordsProcessed++;
              } catch (recordError) {
                recordsFailed++;
                logger.error(
                  {
                    syncJobId,
                    integrationId,
                    resourceType: resource,
                    error: recordError instanceof Error ? recordError.message : 'Unknown',
                  },
                  'Failed to process individual record — skipping',
                );
              }
            }
          } catch (fetchError) {
            // Log resource-level fetch failure but continue to next resource if applicable
            logger.error(
              {
                syncJobId,
                integrationId,
                resourceType: resource,
                error: fetchError instanceof Error ? fetchError.message : 'Unknown',
              },
              `Failed to sync resource type ${resource ?? 'Default'}`,
            );
            // Re-throw if it's the only resource, so the whole job retry logic is triggered
            if (resources.length === 1) {
              throw fetchError;
            }
            recordsFailed++;
          }
        }

        // ── Step 5: Write integration log ────────────────────────────────────
        const latency = Date.now() - start;
        await prisma.integrationLog.create({
          data: {
            integrationId,
            operation: 'SYNC',
            status: recordsFailed > 0 && recordsProcessed === 0 ? 'FAILED' : 'SUCCESS',
            latency,
            retryCount: job.attemptsMade,
            metadata: {
              recordsProcessed,
              recordsFailed,
              resourcesSynced: resources.filter((r): r is string => typeof r === 'string'),
            },
          },
        });

        // ── Step 6: Mark job COMPLETED ───────────────────────────────────────
        await prisma.syncJob.update({
          where: { id: syncJobId },
          data: {
            status: recordsFailed > 0 && recordsProcessed === 0 ? 'FAILED' : 'COMPLETED',
            completedAt: new Date(),
            recordsProcessed,
            recordsFailed,
            retryCount: job.attemptsMade,
          },
        });

        logger.info(
          { syncJobId, integrationId, recordsProcessed, recordsFailed, latency },
          'Sync job completed',
        );
      } catch (error) {
        const { isRetryable, errorCode, message } = classifyError(error);
        const latency = Date.now() - start;

        logger.error(
          {
            syncJobId,
            integrationId,
            errorCode,
            isRetryable,
            latency,
            attempt: job.attemptsMade,
          },
          `Sync job failed: ${message}`,
        );

        // Write failure log
        await prisma.integrationLog.create({
          data: {
            integrationId,
            operation: 'SYNC',
            status: 'FAILED',
            latency,
            retryCount: job.attemptsMade,
            errorMessage: message,
          },
        });

        // Mark as FAILED if not retryable or on final attempt
        if (!isRetryable || job.attemptsMade >= 3) {
          await prisma.syncJob.update({
            where: { id: syncJobId },
            data: {
              status: 'FAILED',
              completedAt: new Date(),
              recordsProcessed,
              recordsFailed,
              retryCount: job.attemptsMade,
              errorMessage: message,
            },
          });
        }

        throw error; // Re-throw so BullMQ handles retries
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
      `Worker job permanently failed: ${err.message}`,
    );
  });

  worker.on('error', (err) => {
    logger.error({ error: err.message }, 'Sync worker error');
  });

  logger.info({ queue: SYNC_QUEUE_NAME }, 'Sync worker listening');
  return worker;
}

// ─── Database Helpers ─────────────────────────────────────────────────────────

/**
 * Upserts a FlowSync user using the external entity mapping as the deduplication key.
 */
async function upsertUser(internal: FlowSyncUser): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.externalEntity.findUnique({
      where: {
        sourceSystem_externalId_entityType: {
          sourceSystem: internal.sourceSystem,
          externalId: internal.externalId,
          entityType: 'user',
        },
      },
    });

    if (existing) {
      await tx.user.update({
        where: { id: existing.internalEntityId },
        data: {
          name: internal.name,
          email: internal.email,
          phone: internal.phone,
          gender: internal.gender,
          birthDate: internal.birthDate,
        },
      });
      await tx.externalEntity.update({
        where: { id: existing.id },
        data: { lastSyncedAt: new Date() },
      });
    } else {
      const user = await tx.user.create({
        data: {
          name: internal.name,
          email: internal.email,
          phone: internal.phone,
          gender: internal.gender,
          birthDate: internal.birthDate,
        },
      });
      await tx.externalEntity.create({
        data: {
          internalEntityId: user.id,
          externalId: internal.externalId,
          sourceSystem: internal.sourceSystem,
          entityType: 'user',
          lastSyncedAt: new Date(),
        },
      });
    }
  });
}

/**
 * Upserts a FlowSync event using the external entity mapping as the deduplication key.
 */
async function upsertEvent(internal: FlowSyncEvent): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.externalEntity.findUnique({
      where: {
        sourceSystem_externalId_entityType: {
          sourceSystem: internal.sourceSystem,
          externalId: internal.externalId,
          entityType: internal.entityType,
        },
      },
    });

    if (existing) {
      await tx.event.update({
        where: { id: existing.internalEntityId },
        data: {
          status: internal.status,
          startedAt: internal.startedAt,
          completedAt: internal.completedAt,
          description: internal.description,
          metadata: internal.metadata,
        },
      });
      await tx.externalEntity.update({
        where: { id: existing.id },
        data: { lastSyncedAt: new Date() },
      });
    } else {
      const event = await tx.event.create({
        data: {
          entityType: internal.entityType,
          status: internal.status,
          startedAt: internal.startedAt,
          completedAt: internal.completedAt,
          description: internal.description,
          metadata: internal.metadata,
        },
      });
      await tx.externalEntity.create({
        data: {
          internalEntityId: event.id,
          externalId: internal.externalId,
          sourceSystem: internal.sourceSystem,
          entityType: internal.entityType,
          lastSyncedAt: new Date(),
        },
      });
    }
  });
}
