import { Request, Response, NextFunction } from 'express';
import { webhookService } from '../services/webhook.service';
import { sendSuccess } from '../utils/response';

export const webhookController = {
  /**
   * POST /api/webhooks/:provider
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provider = req.params['provider'] as string;
      const signature =
        (req.headers['x-flowsync-signature'] as string) ??
        (req.headers['stripe-signature'] as string);

      // rawBody is attached by express.json() verify callback configured in app.ts
      const rawBody = (req as any).rawBody;

      const result = await webhookService.processWebhook(
        provider,
        req.body,
        rawBody,
        signature,
      );

      if (result.isDuplicate) {
        // Return 200 OK with duplicate status indicator
        sendSuccess(res, {
          status: 'DUPLICATE',
          message: 'Webhook event already processed or queued',
          webhookEventId: result.webhookEventId,
          eventType: result.eventType,
        }, 200);
      } else {
        // Return 202 Accepted for new successfully queued webhook event
        sendSuccess(res, {
          status: 'QUEUED',
          message: 'Webhook event accepted and queued for workflow execution',
          webhookEventId: result.webhookEventId,
          eventType: result.eventType,
        }, 202);
      }
    } catch (err) {
      next(err);
    }
  },
};
