import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verifies a signature using constant-time comparison.
 *
 * @param signature - The signature to verify (hex encoded)
 * @param payload - The raw request body string
 * @param secret - The shared webhook secret
 */
export function verifySignature(
  signature: string,
  payload: string,
  secret: string,
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    const computed = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature, 'hex');
    const computedBuffer = Buffer.from(computed, 'hex');

    if (signatureBuffer.length !== computedBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, computedBuffer);
  } catch (err) {
    return false;
  }
}
