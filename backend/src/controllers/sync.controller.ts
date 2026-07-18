/**
 * Sync Controller
 *
 * Handles HTTP concerns for sync job endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { syncService } from '../services/sync.service';
import { sendSuccess } from '../utils/response';

export const syncController = {
  /**
   * GET /api/sync-jobs
   * Supports filtering by ?integrationId=&status=&limit=&offset=
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { integrationId, status, limit, offset } = req.query as Record<string, string>;
      const result = await syncService.getAll({
        integrationId,
        status,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/sync-jobs/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await syncService.getById(req.params['id'] as string);
      sendSuccess(res, job);
    } catch (err) {
      next(err);
    }
  },
};
