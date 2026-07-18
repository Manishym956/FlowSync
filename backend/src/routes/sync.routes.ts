import { Router } from 'express';
import { monitoringController } from '../controllers/monitoring.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * GET /api/sync-jobs
 * Returns sync jobs with paginated filters.
 */
router.get('/', monitoringController.getSyncJobs);

/**
 * GET /api/sync-jobs/:id
 * Returns a single sync job by ID with details.
 */
router.get('/:id', monitoringController.getSyncJobById);

export default router;
