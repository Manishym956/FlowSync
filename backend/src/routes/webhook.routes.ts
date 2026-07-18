import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';

const router = Router();

/**
 * POST /api/webhooks/:provider
 * Receive inbound webhook events from external systems.
 * Signature verification is handled per provider inside the service.
 */
router.post('/:provider', webhookController.handleWebhook);

export default router;
