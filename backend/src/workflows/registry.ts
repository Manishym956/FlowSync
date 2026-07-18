/**
 * Workflow Registry.
 *
 * Maps eventType strings to executable workflow handler functions.
 * Keeps workflow resolution modular and decouples handlers from the worker.
 */

export type WorkflowHandler = (
  payload: any,
  context: { webhookEventId: string; executionId: string },
) => Promise<void>;

const registry = new Map<string, WorkflowHandler>();

/**
 * Register a workflow handler for the given event type.
 */
export function registerWorkflow(eventType: string, handler: WorkflowHandler): void {
  registry.set(eventType, handler);
}

/**
 * Resolves a workflow handler for the given event type.
 */
export function resolveWorkflow(eventType: string): WorkflowHandler | undefined {
  return registry.get(eventType);
}

/**
 * Checks if a workflow handler is registered for the given event type.
 */
export function hasWorkflow(eventType: string): boolean {
  return registry.has(eventType);
}

// ─── Default Handlers ─────────────────────────────────────────────────────────

// Initialize default workflows
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { resolveConnector } from '../connectors/registry';

// 1. user.created workflow
registerWorkflow('user.created', async (payload, ctx) => {
  logger.info({ payload, ctx }, 'Executing user.created workflow step');
  if (!payload.name) {
    throw new Error('Validation failed: user.created payload missing "name" field');
  }
  logger.info('user.created workflow finished successfully');
});

// 2. appointment.created workflow
registerWorkflow('appointment.created', async (payload, ctx) => {
  logger.info({ payload, ctx }, 'Executing appointment.created workflow step');

  // ── Step 1: Validate required payload fields ──────────────────────────────
  if (!payload.startedAt) {
    throw new Error('Validation failed: appointment.created payload missing "startedAt" field');
  }

  const recipient = (payload.recipient as string) || 'patient@flowsync.dev';

  // ── Step 2: Outbound Idempotency Check (Duplicate send prevention) ────────
  const existingNotification = await prisma.notification.findUnique({
    where: {
      webhookEventId_recipient: {
        webhookEventId: ctx.webhookEventId,
        recipient,
      },
    },
  });

  if (existingNotification && existingNotification.status === 'SENT') {
    logger.info(
      { webhookEventId: ctx.webhookEventId, recipient, notificationId: existingNotification.id },
      'Notification already sent successfully for this webhook event — skipping duplicate send',
    );
    return;
  }

  // ── Step 3: Insert PENDING notification record to acquire lock ────────────
  let notification = existingNotification;
  if (!notification) {
    try {
      notification = await prisma.notification.create({
        data: {
          webhookEventId: ctx.webhookEventId,
          workflowExecutionId: ctx.executionId,
          provider: 'messaging',
          recipient,
          status: 'PENDING',
        },
      });
    } catch (dbErr: any) {
      if (dbErr.code === 'P2002') {
        const raceNotif = await prisma.notification.findUnique({
          where: {
            webhookEventId_recipient: {
              webhookEventId: ctx.webhookEventId,
              recipient,
            },
          },
        });
        if (raceNotif && raceNotif.status === 'SENT') {
          logger.info('Notification already sent in concurrent race — skipping send');
          return;
        }
        notification = raceNotif;
      } else {
        throw dbErr;
      }
    }
  }

  if (!notification) {
    throw new Error('Failed to resolve or create Notification tracking record');
  }

  // ── Step 4: Resolve MessagingConnector and push data ──────────────────────
  const messagingConnector = resolveConnector('messaging');
  const subject = 'FlowSync: Appointment Received';
  const body = `An appointment event (ID: ${payload.id || 'unknown'}) scheduled for ${payload.startedAt} has been successfully received and processed by FlowSync.`;

  try {
    const result = await messagingConnector.pushData!({
      to: recipient,
      subject,
      body,
      idempotencyKey: notification.id,
    });

    // Update notification record on successful send
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: 'SENT',
        externalId: result.id,
      },
    });

    logger.info(
      { notificationId: notification.id, externalId: result.id },
      'Notification sent successfully and updated in database',
    );
  } catch (err: any) {
    // Classify errors:
    // If it is a permanent error (e.g. 400 Bad Request, 401 Unauthorized), we mark the notification FAILED and throw.
    // If it is a transient error (e.g. 503, 429), we delete the notification so a future BullMQ attempt can retry.
    const isPermanent = err.statusCode && err.statusCode < 500 && err.statusCode !== 429;

    if (isPermanent) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'FAILED' },
      }).catch(() => {});
    } else {
      await prisma.notification.delete({
        where: { id: notification.id },
      }).catch(() => {});
    }

    throw err;
  }
});
