/**
 * Shared TypeScript types for the FlowSync frontend.
 * Mirror the API response shapes from the backend.
 */

// ─── API Response Wrapper ─────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  error: null;
}

export interface ApiError {
  success: false;
  data: null;
  error: { code: string; message: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Integration ──────────────────────────────────────────────────────────────

export type IntegrationStatus = "active" | "inactive" | "error";
export type IntegrationType = "rest" | "fhir" | "messaging";

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  status: IntegrationStatus;
  baseUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Sync Job ─────────────────────────────────────────────────────────────────

export type SyncJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface SyncJob {
  id: string;
  integrationId: string;
  status: SyncJobStatus;
  resourceType?: string | null;
  recordsProcessed: number;
  recordsFailed: number;
  retryCount: number;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  integration?: {
    id: string;
    name: string;
    type: IntegrationType;
  };
}

export interface SyncJobList {
  jobs: SyncJob[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Integration Log ──────────────────────────────────────────────────────────

export type LogStatus = "SUCCESS" | "FAILED" | "RETRYING";

export interface IntegrationLog {
  id: string;
  integrationId: string;
  operation: string;
  status: LogStatus;
  latency?: number | null;
  retryCount: number;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  integration?: { name: string; type: IntegrationType };
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export interface Metrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  activeIntegrations: number;
  failedIntegrations: number;
  syncSuccessRate: number;
  recentFailures: IntegrationLog[];
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export interface HealthCheckResult {
  integrationId: string;
  health: {
    status: "healthy" | "degraded" | "unavailable";
    latency?: number;
    error?: string;
  };
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

export type StatusVariant = "healthy" | "degraded" | "failed" | "syncing" | "pending";
