/**
 * Typed API client for the FlowSync backend.
 *
 * All requests include the Authorization header with the static API key.
 * All responses are parsed into ApiResponse<T> or throw on network errors.
 */

import { ApiResponse, Integration, SyncJob, SyncJobList, IntegrationLog, Metrics, HealthCheckResult } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
const API_KEY  = process.env.NEXT_PUBLIC_API_KEY ?? "dev-api-key-change-in-production";

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...options.headers,
    },
  });

  const body: ApiResponse<T> = await res.json();

  if (!body.success) {
    throw new Error(body.error?.message ?? "API error");
  }

  return body.data;
}

// ─── Integrations ─────────────────────────────────────────────────────────────

export const api = {
  integrations: {
    list: (): Promise<Integration[]> =>
      apiFetch<Integration[]>("/api/integrations"),

    get: (id: string): Promise<Integration> =>
      apiFetch<Integration>(`/api/integrations/${id}`),

    triggerSync: (id: string, resourceType?: string): Promise<{ jobId: string; status: string }> =>
      apiFetch(`/api/integrations/${id}/sync`, {
        method: "POST",
        body: JSON.stringify({ resourceType }),
      }),

    health: (id: string): Promise<HealthCheckResult> =>
      apiFetch<HealthCheckResult>(`/api/integrations/${id}/health`),
  },

  // ─── Sync Jobs ──────────────────────────────────────────────────────────────

  syncJobs: {
    list: (params?: {
      integrationId?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }): Promise<SyncJobList> => {
      const qs = params
        ? "?" + new URLSearchParams(
            Object.fromEntries(
              Object.entries(params)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => [k, String(v)])
            )
          ).toString()
        : "";
      return apiFetch<SyncJobList>(`/api/sync-jobs${qs}`);
    },

    get: (id: string): Promise<SyncJob> =>
      apiFetch<SyncJob>(`/api/sync-jobs/${id}`),
  },

  // ─── Monitoring ─────────────────────────────────────────────────────────────

  monitoring: {
    metrics: (): Promise<Metrics> =>
      apiFetch<Metrics>("/api/metrics"),

    logs: (params?: {
      integrationId?: string;
      status?: string;
      limit?: number;
    }): Promise<{ logs: IntegrationLog[]; total: number }> => {
      const qs = params
        ? "?" + new URLSearchParams(
            Object.fromEntries(
              Object.entries(params)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => [k, String(v)])
            )
          ).toString()
        : "";
      return apiFetch(`/api/logs${qs}`);
    },

    failures: (): Promise<IntegrationLog[]> =>
      apiFetch<IntegrationLog[]>("/api/failures"),
  },
};
