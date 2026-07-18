import { Router } from 'express';
import { integrationController } from '../controllers/integration.controller';
import { monitoringController } from '../controllers/monitoring.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All integration routes require authentication
router.use(authenticate);

/**
 * GET /api/integrations
 * Returns all configured integrations with enhanced metrics.
 */
router.get('/', monitoringController.getIntegrations);

/**
 * GET /api/integrations/:id
 * Returns a single integration by ID with metrics detail.
 */
router.get('/:id', monitoringController.getIntegrationById);

/**
 * POST /api/integrations/:id/sync
 * Triggers an async synchronization job for the integration.
 * Returns 202 Accepted with jobId immediately.
 */
router.post('/:id/sync', integrationController.triggerSync);

/**
 * GET /api/integrations/:id/health
 * Performs a live health check against the external API.
 */
router.get('/:id/health', integrationController.getHealth);

export default router;
