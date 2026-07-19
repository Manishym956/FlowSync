import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../lib/api';

describe('Frontend API Client & Query Parameter Formatting', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch overview metrics correctly', async () => {
    const mockMetrics = {
      activeIntegrations: 4,
      healthyIntegrations: 3,
      degradedIntegrations: 1,
      failedIntegrations: 0,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockMetrics }),
    });

    const data = await api.monitoring.metrics();
    expect(data).toEqual(mockMetrics);
    expect(global.fetch).toHaveBeenCalledWith('/api/metrics', expect.anything());
  });

  it('should format syncJobs query params correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { items: [], pagination: {} } }),
    });

    await api.syncJobs.list({ page: 2, limit: 10, status: 'FAILED', sort: 'desc' });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sync-jobs?page=2&limit=10&status=FAILED&sort=desc',
      expect.anything(),
    );
  });

  it('should format logs query params correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { items: [], pagination: {} } }),
    });

    await api.monitoring.logs({ page: 1, status: 'FAILED', operation: 'SYNC' });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/logs?page=1&status=FAILED&operation=SYNC',
      expect.anything(),
    );
  });

  it('should format failures query params correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { items: [], pagination: {} } }),
    });

    await api.monitoring.failures({ page: 1, sourceType: 'WORKFLOW' });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/failures?page=1&sourceType=WORKFLOW',
      expect.anything(),
    );
  });
});
