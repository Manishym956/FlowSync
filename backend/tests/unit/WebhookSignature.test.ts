import { createHmac } from 'crypto';
import { verifySignature } from '../../src/utils/signature';

describe('Webhook Signature Verification', () => {
  const secret = 'my-super-secret-key-123';
  const payload = JSON.stringify({ event: 'appointment.created', id: 'evt_1001' });

  it('should return true for a valid HMAC signature', () => {
    const validSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const result = verifySignature(validSignature, payload, secret);

    expect(result).toBe(true);
  });

  it('should return false if signature does not match payload', () => {
    const invalidSignature = 'a'.repeat(64);

    const result = verifySignature(invalidSignature, payload, secret);

    expect(result).toBe(false);
  });

  it('should return false if payload has been modified', () => {
    const validSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const modifiedPayload = JSON.stringify({ event: 'appointment.created', id: 'evt_MODIFIED' });

    const result = verifySignature(validSignature, modifiedPayload, secret);

    expect(result).toBe(false);
  });

  it('should return false if secret is incorrect', () => {
    const validSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const result = verifySignature(validSignature, payload, 'wrong-secret');

    expect(result).toBe(false);
  });
});
