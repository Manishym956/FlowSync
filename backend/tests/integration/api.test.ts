import request from 'supertest';
import app from '../../src/app';

const API_KEY = process.env.API_KEY || 'dev-api-key-change-in-production';

describe('Backend Integration API Endpoints', () => {
  describe('GET /health', () => {
    it('should return 200 OK with system status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
    });
  });

  describe('Authentication Enforcement', () => {
    it('should reject API requests without Authorization header', async () => {
      const res = await request(app).get('/api/metrics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject API requests with an invalid Bearer token', async () => {
      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', 'Bearer invalid-token-xyz');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should accept API requests with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${API_KEY}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('activeIntegrations');
    });
  });

  describe('GET /api/integrations & /api/integrations/:id/sync', () => {
    it('should return list of integrations', async () => {
      const res = await request(app)
        .get('/api/integrations')
        .set('Authorization', `Bearer ${API_KEY}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should trigger sync for REST integration', async () => {
      const syncRes = await request(app)
        .post('/api/integrations/00000000-0000-0000-0000-000000000001/sync')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ resourceType: 'User' });

      expect(syncRes.status).toBe(202);
      expect(syncRes.body.success).toBe(true);
      expect(syncRes.body.data).toHaveProperty('jobId');
    });

    it('should return 404 for unknown integration sync trigger', async () => {
      const syncRes = await request(app)
        .post('/api/integrations/00000000-9999-9999-9999-000000000999/sync')
        .set('Authorization', `Bearer ${API_KEY}`);

      expect(syncRes.status).toBe(404);
      expect(syncRes.body.success).toBe(false);
    });
  });

  describe('Monitoring & Observability APIs', () => {
    it('should return paginated sync jobs list', async () => {
      const res = await request(app)
        .get('/api/sync-jobs?page=1&limit=5')
        .set('Authorization', `Bearer ${API_KEY}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('pagination');
    });

    it('should return paginated failures list', async () => {
      const res = await request(app)
        .get('/api/failures?page=1&limit=5')
        .set('Authorization', `Bearer ${API_KEY}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
    });
  });
});
