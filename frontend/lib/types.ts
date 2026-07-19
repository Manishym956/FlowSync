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

// ─── Phase 5 Observability Types ──────────────────────────────────────────────

export interface OverviewMetrics {
  activeIntegrations: number;
  healthyIntegrations: number;
  degradedIntegrations: number;
  failedIntegrations: number;

  totalSyncJobs: number;
  successfulSyncJobs: number;
  failedSyncJobs: number;
  syncSuccessRate: number;

  averageApiLatency: number;

  totalWorkflowExecutions: number;
  successfulWorkflowExecutions: number;
  failedWorkflowExecutions: number;

  totalNotifications: number;
  sentNotifications: number;
  failedNotifications: number;
}

export interface TimeSeriesItem {
  timestamp: string;
  successCount: number;
  failedCount: number;
  averageLatency: number;
}

export interface TimeSeriesMetrics {
  syncJobs: TimeSeriesItem[];
  workflowExecutions: TimeSeriesItem[];
}

export interface EnhancedIntegrationItem {
  id: string;
  name: string;
  type: string;
  status: string;
  lastSuccessfulSync: string | null;
  lastSyncStatus: string | null;
  averageLatency: number;
  successRate: number;
}

export interface EnhancedIntegrationDetail {
  id: string;
  name: string;
  type: string;
  status: string;
  baseUrl: string | null;
  lastSuccessfulSync: string | null;
  lastSyncStatus: string | null;
  averageLatency: number;
  successRate: number;
  recordsProcessed: number;
  recentErrors: string[];
  recentSyncJobs: any[];
}

export interface WorkflowExecutionItem {
  id: string;
  workflowName: string;
  triggerEvent: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  errorMessage: string | null;
}

export interface NormalizedFailure {
  id: string;
  sourceType: "SYNC_JOB" | "WORKFLOW" | "NOTIFICATION";
  integration: string;
  operation: string;
  errorCategory: string;
  errorSummary: string;
  timestamp: string;
  retryCount: number;
  relatedResourceId: string | null;
}

export interface NormalizedActivity {
  id: string;
  type:
    | "SYNC_COMPLETED"
    | "SYNC_FAILED"
    | "WORKFLOW_COMPLETED"
    | "WORKFLOW_FAILED"
    | "NOTIFICATION_SENT"
    | "NOTIFICATION_FAILED";
  summary: string;
  timestamp: string;
  integration: string;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMetadata;
}
