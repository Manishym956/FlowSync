import {
  buildWebhookIdempotencyKey,
  hashPayload,
} from '../../src/utils/idempotency';

describe('Idempotency Utilities', () => {
  it('should generate a deterministic webhook idempotency key', () => {
    const key1 = buildWebhookIdempotencyKey('acme-corp', 'evt-999');
    const key2 = buildWebhookIdempotencyKey('acme-corp', 'evt-999');

    expect(key1).toBe('acme-corp:evt-999');
    expect(key1).toBe(key2);
  });

  it('should hash payloads deterministically with SHA-256', () => {
    const payload = { action: 'user_registered', timestamp: 1700000000 };

    const hash1 = hashPayload(payload);
    const hash2 = hashPayload(payload);

    expect(hash1).toHaveLength(64); // SHA-256 hex string length
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different payloads', () => {
    const payload1 = { id: 1 };
    const payload2 = { id: 2 };

    expect(hashPayload(payload1)).not.toBe(hashPayload(payload2));
  });
});
