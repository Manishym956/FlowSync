/**
 * Idempotency utilities.
 *
 * FlowSync prevents duplicate processing of webhook events using a
 * UNIQUE(source, external_event_id) constraint (TRD §13).
 *
 * For sync operations, deduplication is done via UNIQUE(source_system,
 * external_id, entity_type) on the ExternalEntity table using Prisma upserts.
 */

import { createHash } from 'crypto';

/**
 * Generates a deterministic idempotency key for a webhook event.
 * Format: "<source>:<externalEventId>"
 */
export function buildWebhookIdempotencyKey(
  source: string,
  externalEventId: string,
): string {
  return `${source}:${externalEventId}`;
}

/**
 * Generates a SHA-256 hash of a payload for deduplication purposes.
 * Useful when an external event ID is not available.
 * Do not log the payload itself — only the hash.
 */
export function hashPayload(payload: unknown): string {
  const json = JSON.stringify(payload);
  return createHash('sha256').update(json).digest('hex');
}
