/**
 * Base Connector interface.
 *
 * Every external integration must implement this interface (TRD §6).
 * Connector-specific logic must remain isolated from the sync engine.
 *
 * TExternal = the external API's raw response type
 * TInternal  = FlowSync's unified internal model type
 */

import { HealthCheckResult } from '../types';

export interface Connector<TExternal, TInternal> {
  /**
   * Authenticate with the external service.
   * Called before fetchData if auth is required.
   */
  authenticate(): Promise<void>;

  /**
   * Fetch raw data from the external API.
   * Handles pagination, rate limits, and timeouts internally.
   */
  fetchData(params?: Record<string, unknown>): Promise<TExternal[]>;

  /**
   * Transform a single external record into a FlowSync internal model.
   * Must be a pure function — no side effects.
   */
  transformData(data: TExternal): TInternal;

  /**
   * Pushes data to the external service (outbound integration).
   */
  pushData?(data: TInternal): Promise<any>;

  /**
   * Check if the external service is reachable and responding.
   */
  healthCheck(): Promise<HealthCheckResult>;

  /**
   * Returns the list of resource types this connector supports.
   * If not defined, the sync engine assumes a single default resource.
   */
  getSupportedResources?(): string[];
}
