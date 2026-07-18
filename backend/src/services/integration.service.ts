/**
 * Integration Service
 *
 * Business logic for managing integrations and health checks.
 * Controllers call this service; database access goes through Prisma.
 */

import { prisma } from '../config/database';
import { resolveConnector, hasConnector } from '../connectors/registry';
import { logger } from '../utils/logger';
import { HealthCheckResult } from '../types';
import { NotFoundError } from '../middleware/error.middleware';

export const integrationService = {
  /**
   * Returns all integrations.
   */
  async getAll() {
    return prisma.integration.findMany({
      orderBy: { createdAt: 'asc' },
    });
  },

  /**
   * Returns a single integration by ID.
   * Throws NotFoundError if not found.
   */
  async getById(id: string) {
    const integration = await prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      throw new NotFoundError(`Integration ${id}`);
    }

    return integration;
  },

  /**
   * Performs a live health check against the external API.
   * Updates integration status in the database based on the result.
   */
  async checkHealth(id: string): Promise<{
    integrationId: string;
    health: HealthCheckResult;
  }> {
    const integration = await this.getById(id);

    if (!hasConnector(integration.type)) {
      return {
        integrationId: id,
        health: {
          status: 'unavailable',
          error: `No connector registered for type: ${integration.type}`,
        },
      };
    }

    const start = Date.now();
    const connector = resolveConnector(integration.type);
    const health = await connector.healthCheck();

    // Update integration status
    const newStatus = health.status === 'healthy' ? 'active' : 'error';
    await prisma.integration.update({
      where: { id },
      data: { status: newStatus },
    });

    logger.info(
      {
        integration: integration.name,
        type: integration.type,
        health: health.status,
        latency: Date.now() - start,
      },
      'Health check complete',
    );

    return { integrationId: id, health };
  },
};
