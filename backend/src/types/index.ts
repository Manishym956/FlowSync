/**
 * Shared TypeScript types for the FlowSync backend.
 */

// ─── Sync Job Status ──────────────────────────────────────────────────────────

export type SyncJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// ─── Integration Status ───────────────────────────────────────────────────────

export type IntegrationStatus = 'active' | 'inactive' | 'error';

// ─── Integration Type ─────────────────────────────────────────────────────────

export type IntegrationType = 'rest' | 'fhir' | 'messaging';

// ─── Log Status ───────────────────────────────────────────────────────────────

export type LogStatus = 'SUCCESS' | 'FAILED' | 'RETRYING';

// ─── Workflow Execution Status ────────────────────────────────────────────────

export type WorkflowStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

// ─── BullMQ Job Data ──────────────────────────────────────────────────────────

export interface SyncJobData {
  syncJobId: string;
  integrationId: string;
  integrationType: IntegrationType;
  resourceType?: string;
}

export interface WorkflowJobData {
  workflowExecutionId: string;
  workflowName: string;
  triggerEvent: string;
  payload: Record<string, unknown>;
}

// ─── Internal FlowSync Models ─────────────────────────────────────────────────

export interface FlowSyncUser {
  name: string;
  email?: string;
  phone?: string;
  gender?: string;
  birthDate?: Date;
  externalId: string;
  sourceSystem: string;
}

export interface FlowSyncEvent {
  externalId: string;
  sourceSystem: string;
  entityType: string; // e.g. "appointment"
  status: string;
  startedAt: Date;
  completedAt?: Date;
  description?: string;
  metadata?: Record<string, any>;
}

export function isFlowSyncEvent(record: any): record is FlowSyncEvent {
  return record && typeof record === 'object' && 'entityType' in record;
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unavailable';
  latency?: number;
  error?: string;
}
