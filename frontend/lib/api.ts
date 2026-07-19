/**
 * Typed API client for the FlowSync backend.
 *
 * All requests include the Authorization header with the static API key.
 * All responses are parsed into ApiResponse<T> or throw on network errors.
 */

import {
  ApiResponse,
  Integration,
  SyncJob,
  SyncJobList,
  IntegrationLog,
  HealthCheckResult,
  OverviewMetrics,
  TimeSeriesMetrics,
  NormalizedActivity,
  EnhancedIntegrationItem,
  EnhancedIntegrationDetail,
  WorkflowExecutionItem,
  NormalizedFailure,
  PaginatedResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
    list: (): Promise<EnhancedIntegrationItem[]> =>
      apiFetch<EnhancedIntegrationItem[]>("/api/integrations"),

    get: (id: string): Promise<EnhancedIntegrationDetail> =>
      apiFetch<EnhancedIntegrationDetail>(`/api/integrations/${id}`),

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
      page?: number;
      limit?: number;
      sort?: "asc" | "desc";
    }): Promise<PaginatedResponse<SyncJob>> => {
      const qs = params
        ? "?" + new URLSearchParams(
            Object.fromEntries(
              Object.entries(params)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => [k, String(v)])
            )
          ).toString()
        : "";
      return apiFetch<PaginatedResponse<SyncJob>>(`/api/sync-jobs${qs}`);
    },

    get: (id: string): Promise<SyncJob> =>
      apiFetch<SyncJob>(`/api/sync-jobs/${id}`),
  },

  monitoring: {
    metrics: (): Promise<OverviewMetrics> =>
      apiFetch<OverviewMetrics>("/api/metrics"),

    timeSeries: (range: "24h" | "7d" | "30d" = "24h"): Promise<TimeSeriesMetrics> =>
      apiFetch<TimeSeriesMetrics>(`/api/metrics/time-series?range=${range}`),

    recentActivity: (): Promise<NormalizedActivity[]> =>
      apiFetch<NormalizedActivity[]>("/api/metrics/recent-activity"),

    logs: (params?: {
      integrationId?: string;
      status?: string;
      operation?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<PaginatedResponse<IntegrationLog>> => {
      const qs = params
        ? "?" + new URLSearchParams(
            Object.fromEntries(
              Object.entries(params)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => [k, String(v)])
            )
          ).toString()
        : "";
      return apiFetch<PaginatedResponse<IntegrationLog>>(`/api/logs${qs}`);
    },

    failures: (params?: {
      page?: number;
      limit?: number;
      sourceType?: string;
      integration?: string;
    }): Promise<PaginatedResponse<NormalizedFailure>> => {
      const qs = params
        ? "?" + new URLSearchParams(
            Object.fromEntries(
              Object.entries(params)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => [k, String(v)])
            )
          ).toString()
        : "";
      return apiFetch<PaginatedResponse<NormalizedFailure>>(`/api/failures${qs}`);
    },

    workflows: (params?: {
      page?: number;
      limit?: number;
      status?: string;
      eventType?: string;
    }): Promise<PaginatedResponse<WorkflowExecutionItem>> => {
      const qs = params
        ? "?" + new URLSearchParams(
            Object.fromEntries(
              Object.entries(params)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => [k, String(v)])
            )
          ).toString()
        : "";
      return apiFetch<PaginatedResponse<WorkflowExecutionItem>>(`/api/workflow-executions${qs}`);
    },
  },
};
