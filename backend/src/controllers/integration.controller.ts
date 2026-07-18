/**
 * Integration Controller
 *
 * Handles HTTP concerns only. Business logic lives in integrationService.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { integrationService } from '../services/integration.service';
import { syncService } from '../services/sync.service';
import { sendSuccess } from '../utils/response';

// ─── Request Schemas ──────────────────────────────────────────────────────────

const SyncRequestSchema = z.object({
  resourceType: z.string().optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export const integrationController = {
  /**
   * GET /api/integrations
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const integrations = await integrationService.getAll();
      sendSuccess(res, integrations);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/integrations/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const integration = await integrationService.getById(req.params['id'] as string);
      sendSuccess(res, integration);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/integrations/:id/sync
   * Creates a sync job and returns 202 Accepted.
   */
  async triggerSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = SyncRequestSchema.parse(req.body);
      const syncJob = await syncService.triggerSync(
        req.params['id'] as string,
        body.resourceType,
      );
      sendSuccess(res, { jobId: syncJob.id, status: syncJob.status }, 202);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/integrations/:id/health
   */
  async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await integrationService.checkHealth(req.params['id'] as string);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
