/**
 * FHIR Connector — HAPI FHIR Sandbox
 *
 * Implements the Connector interface for a FHIR R4 server.
 * Connects to FHIR_BASE_URL and fetches Patient and Appointment resources.
 *
 * API docs: http://hl7.org/fhir/R4/
 */

import axios, { AxiosInstance } from 'axios';
import { Connector } from '../base.connector';
import { FlowSyncUser, FlowSyncEvent, HealthCheckResult } from '../../types';
import { transformFhirPatient, transformFhirAppointment } from '../../transformers/fhir.transformer';
import { logger } from '../../utils/logger';
import { classifyError } from '../../utils/retry';

export class FhirConnector implements Connector<any, FlowSyncUser | FlowSyncEvent> {
  private readonly client: AxiosInstance;

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 15_000,
      headers: {
        'Accept': 'application/fhir+json',
        'User-Agent': 'FlowSync/1.0',
      },
    });
  }

  /**
   * FHIR Sandbox does not require authentication.
   * This is a no-op but satisfies the Connector interface.
   */
  async authenticate(): Promise<void> {
    // No-op: Sandbox is public
  }

  /**
   * Returns the list of supported resources for synchronization.
   */
  getSupportedResources(): string[] {
    return ['Patient', 'Appointment'];
  }

  /**
   * Fetches raw resources from the FHIR server.
   *
   * @param params - Params: { resourceType: string, count?: number }
   */
  async fetchData(params: Record<string, unknown> = {}): Promise<any[]> {
    const resourceType = params['resourceType'] as string;
    if (!resourceType) {
      throw new Error('fetchData requires "resourceType" parameter (e.g. Patient or Appointment)');
    }

    const count = (params['count'] as number) ?? 10;

    logger.info(
      { integration: 'fhir', operation: 'fetchData', resourceType, count },
      `Fetching ${resourceType} resources from FHIR server`,
    );

    const start = Date.now();
    try {
      // HAPI FHIR supports sorting and count parameters
      // e.g. /Patient?_count=10&_sort=-_lastUpdated
      const response = await this.client.get(`/${resourceType}`, {
        params: {
          _count: count,
          _sort: '-_lastUpdated',
        },
      });

      const latency = Date.now() - start;

      // FHIR response is a Bundle
      const bundle = response.data;
      if (!bundle || bundle.resourceType !== 'Bundle') {
        throw new Error(`Expected FHIR Bundle, received: ${bundle?.resourceType ?? typeof bundle}`);
      }

      const entries = bundle.entry ?? [];
      const resources = entries
        .map((entry: any) => entry.resource)
        .filter((resource: any) => resource !== undefined);

      logger.info(
        {
          integration: 'fhir',
          operation: 'fetchData',
          resourceType,
          status: 'success',
          count: resources.length,
          latency,
        },
        `FHIR ${resourceType} fetch complete`,
      );

      return resources;
    } catch (error) {
      const { isRetryable, errorCode, message } = classifyError(error);
      const latency = Date.now() - start;

      logger.error(
        {
          integration: 'fhir',
          operation: 'fetchData',
          resourceType,
          status: 'failed',
          errorCode,
          isRetryable,
          latency,
        },
        `FHIR ${resourceType} fetch failed: ${message}`,
      );

      throw error; // Re-throw for BullMQ retry
    }
  }

  /**
   * Transforms a FHIR resource (Patient or Appointment) into its normalized internal type.
   */
  transformData(data: any): FlowSyncUser | FlowSyncEvent {
    const resourceType = data?.resourceType;

    if (resourceType === 'Patient') {
      return transformFhirPatient(data, 'fhir');
    }

    if (resourceType === 'Appointment') {
      return transformFhirAppointment(data, 'fhir');
    }

    throw new Error(`Unsupported FHIR resource type: "${resourceType}"`);
  }

  /**
   * Verifies the conformance statement / metadata of the FHIR server.
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      // Conformance endpoint in FHIR
      await this.client.get('/metadata');
      return {
        status: 'healthy',
        latency: Date.now() - start,
      };
    } catch (error) {
      const { message } = classifyError(error);
      return {
        status: 'unavailable',
        latency: Date.now() - start,
        error: message,
      };
    }
  }
}
