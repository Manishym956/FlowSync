/**
 * Webhook Service.
 *
 * Handles signature verification, payload validation, idempotency checks,
 * persistence, and enqueuing workflow jobs for inbound webhooks.
 */

import { prisma } from '../config/database';
import { env } from '../config/env';
import { verifySignature } from '../utils/signature';
import { enqueueWorkflowJob } from '../queues/workflow.queue';
import { AppError, ValidationError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export interface ProcessWebhookResult {
  isDuplicate: boolean;
  webhookEventId: string;
  eventType: string;
  status: string;
}

export const webhookService = {
  /**
   * Main webhook processing flow.
   * Performs signature checks, deduplication, saves to DB, and enqueues workflow.
   */
  async processWebhook(
    provider: string,
    payload: any,
    rawBody: string | undefined,
    signature: string | undefined,
  ): Promise<ProcessWebhookResult> {
    // ── Step 1: Validate provider ────────────────────────────────────────────
    const supportedProviders = new Set(['stripe', 'generic', 'mock']);
    if (!supportedProviders.has(provider)) {
      throw new AppError('VALIDATION_ERROR', `Unsupported webhook provider: "${provider}"`, 400);
    }

    // ── Step 2: Signature verification (for stripe or mock) ──────────────────
    if (provider === 'stripe' || provider === 'mock') {
      if (!signature) {
        throw new AppError('AUTHENTICATION_ERROR', 'Missing signature header', 401);
      }
      if (!rawBody) {
        throw new AppError('VALIDATION_ERROR', 'Missing raw request body', 400);
      }

      const isValid = verifySignature(signature, rawBody, env.WEBHOOK_SECRET);
      if (!isValid) {
        logger.warn({ provider, signature }, 'Webhook signature verification failed');
        throw new AppError('AUTHENTICATION_ERROR', 'Invalid signature', 401);
      }
    }

    // ── Step 3: Payload extraction ───────────────────────────────────────────
    if (!payload || typeof payload !== 'object') {
      throw new ValidationError('Invalid webhook payload structure');
    }

    const externalEventId = payload.id;
    const eventType = payload.type;

    if (!externalEventId || typeof externalEventId !== 'string') {
      throw new ValidationError('Webhook payload is missing string "id" field');
    }
    if (!eventType || typeof eventType !== 'string') {
      throw new ValidationError('Webhook payload is missing string "type" field');
    }

    // ── Step 4: Idempotency deduplication check ──────────────────────────────
    // Pre-check for efficiency
    const existing = await prisma.webhookEvent.findUnique({
      where: {
        source_externalEventId: {
          source: provider,
          externalEventId,
        },
      },
    });

    if (existing) {
      logger.info(
        { provider, externalEventId, eventType, webhookEventId: existing.id },
        'Duplicate webhook event received — skipping processing',
      );
      return {
        isDuplicate: true,
        webhookEventId: existing.id,
        eventType: existing.eventType,
        status: existing.processed ? 'PROCESSED' : 'PENDING',
      };
    }

    // ── Step 5: Persist WebhookEvent in DB ───────────────────────────────────
    let event;
    try {
      event = await prisma.webhookEvent.create({
        data: {
          source: provider,
          externalEventId,
          eventType,
          payload: payload as any,
          processed: false,
        },
      });
    } catch (dbError: any) {
      // Handle race condition: uniqueness constraint violation (P2002)
      if (dbError.code === 'P2002') {
        const raceExisting = await prisma.webhookEvent.findUnique({
          where: {
            source_externalEventId: {
              source: provider,
              externalEventId,
            },
          },
        });
        if (raceExisting) {
          logger.info(
            { provider, externalEventId, eventType, webhookEventId: raceExisting.id },
            'Duplicate webhook event detected during concurrency check',
          );
          return {
            isDuplicate: true,
            webhookEventId: raceExisting.id,
            eventType: raceExisting.eventType,
            status: raceExisting.processed ? 'PROCESSED' : 'PENDING',
          };
        }
      }
      throw dbError;
    }

    // ── Step 6: Queue workflow execution ─────────────────────────────────────
    logger.info(
      { provider, externalEventId, eventType, webhookEventId: event.id },
      'Webhook event persisted successfully — queueing workflow',
    );

    await enqueueWorkflowJob({
      webhookEventId: event.id,
      provider,
      eventType,
    });

    return {
      isDuplicate: false,
      webhookEventId: event.id,
      eventType: event.eventType,
      status: 'QUEUED',
    };
  },
};
