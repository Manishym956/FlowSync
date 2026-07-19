import request from 'supertest';
import app from '../../src/app';
import { createHmac } from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev-webhook-secret-change-in-production';

describe('Webhook Ingestion & Idempotency Pipeline', () => {
  const eventId = `test_evt_${Date.now()}`;
  const payload = {
    type: 'appointment.created',
    id: eventId,
    data: {
      appointmentId: 'apt-777',
      patientName: 'Sarah Connor',
    },
  };
  const payloadStr = JSON.stringify(payload);
  const signature = createHmac('sha256', WEBHOOK_SECRET).update(payloadStr).digest('hex');

  it('should accept valid webhook and return 202 Accepted', async () => {
    const res = await request(app)
      .post('/api/webhooks/mock')
      .set('x-flowsync-signature', signature)
      .set('Content-Type', 'application/json')
      .send(payloadStr);

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('QUEUED');
    expect(res.body.data).toHaveProperty('webhookEventId');
  });

  it('should handle duplicate webhook gracefully and deduplicate', async () => {
    const duplicateRes = await request(app)
      .post('/api/webhooks/mock')
      .set('x-flowsync-signature', signature)
      .set('Content-Type', 'application/json')
      .send(payloadStr);

    expect(duplicateRes.status).toBe(200);
    expect(duplicateRes.body.success).toBe(true);
    expect(duplicateRes.body.data.status).toBe('DUPLICATE');
  });

  it('should reject webhook with invalid signature', async () => {
    const invalidRes = await request(app)
      .post('/api/webhooks/mock')
      .set('x-flowsync-signature', 'invalid-signature-hash')
      .set('Content-Type', 'application/json')
      .send(payloadStr);

    expect(invalidRes.status).toBe(401);
    expect(invalidRes.body.success).toBe(false);
  });
});
