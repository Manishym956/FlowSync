/**
 * Sync Service
 *
 * Creates sync job records in the database and enqueues them
 * for async processing by the BullMQ worker.
 *
 * API handlers must return quickly — no long-running operations here.
 */

import { prisma } from '../config/database';
import { enqueueSyncJob } from '../queues/sync.queue';
import { logger } from '../utils/logger';
import { SyncJobData, IntegrationType } from '../types';
import { NotFoundError } from '../middleware/error.middleware';

export const syncService = {
  /**
   * Creates a SyncJob record (PENDING) and enqueues a BullMQ job.
   * Returns the SyncJob immediately — the actual sync runs asynchronously.
   */
  async triggerSync(integrationId: string, resourceType?: string) {
    // Verify integration exists
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundError(`Integration ${integrationId}`);
    }

    // Create SyncJob record
    const syncJob = await prisma.syncJob.create({
      data: {
        integrationId,
        status: 'PENDING',
        resourceType,
      },
    });

    // Build job data
    const jobData: SyncJobData = {
      syncJobId: syncJob.id,
      integrationId,
      integrationType: integration.type as IntegrationType,
      resourceType,
    };

    // Enqueue the job
    await enqueueSyncJob(jobData);

    logger.info(
      {
        syncJobId: syncJob.id,
        integrationId,
        integrationType: integration.type,
        resourceType,
      },
      'Sync job enqueued',
    );

    return syncJob;
  },

  /**
   * Returns a list of sync jobs, optionally filtered.
   */
  async getAll(filters: {
    integrationId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { integrationId, status, limit = 50, offset = 0 } = filters;

    const [jobs, total] = await Promise.all([
      prisma.syncJob.findMany({
        where: {
          ...(integrationId ? { integrationId } : {}),
          ...(status ? { status } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          integration: {
            select: { id: true, name: true, type: true },
          },
        },
      }),
      prisma.syncJob.count({
        where: {
          ...(integrationId ? { integrationId } : {}),
          ...(status ? { status } : {}),
        },
      }),
    ]);

    return { jobs, total, limit, offset };
  },

  /**
   * Returns a single sync job by ID.
   */
  async getById(id: string) {
    const job = await prisma.syncJob.findUnique({
      where: { id },
      include: {
        integration: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundError(`SyncJob ${id}`);
    }

    return job;
  },
};
