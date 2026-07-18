/**
 * Observability, Metrics, Logs, and Failure API type definitions.
 * Mirror-able for frontend use.
 */

export interface OverviewMetrics {
  activeIntegrations: number;
  healthyIntegrations: number;
  degradedIntegrations: number;
  failedIntegrations: number;

  totalSyncJobs: number;
  successfulSyncJobs: number;
  failedSyncJobs: number;
  syncSuccessRate: number; // percentage (0 to 100)

  averageApiLatency: number; // milliseconds

  totalWorkflowExecutions: number;
  successfulWorkflowExecutions: number;
  failedWorkflowExecutions: number;

  totalNotifications: number;
  sentNotifications: number;
  failedNotifications: number;
}

export interface TimeSeriesItem {
  timestamp: string; // e.g., Date string (YYYY-MM-DD or YYYY-MM-DDTHH:00:00)
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
  successRate: number; // percentage (0 to 100)
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
  duration: number | null; // milliseconds
  errorMessage: string | null;
}

export interface NormalizedFailure {
  id: string;
  sourceType: 'SYNC_JOB' | 'WORKFLOW' | 'NOTIFICATION';
  integration: string; // e.g. "rest", "fhir", "messaging", "mock"
  operation: string; // e.g. "SYNC", "WEBHOOK", "NOTIFICATION"
  errorCategory: string; // e.g. "VALIDATION_ERROR", "EXTERNAL_API_ERROR", "AUTHENTICATION_ERROR", "UNKNOWN"
  errorSummary: string;
  timestamp: string;
  retryCount: number;
  relatedResourceId: string | null; // e.g. WebhookEvent ID, SyncJob ID
}

export interface NormalizedActivity {
  id: string;
  type:
    | 'SYNC_COMPLETED'
    | 'SYNC_FAILED'
    | 'WORKFLOW_COMPLETED'
    | 'WORKFLOW_FAILED'
    | 'NOTIFICATION_SENT'
    | 'NOTIFICATION_FAILED';
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
