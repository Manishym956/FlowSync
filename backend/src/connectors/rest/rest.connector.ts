/**
 * REST Connector — RandomUser API
 *
 * Implements the Connector interface for the RandomUser API.
 * This connector is generic: the RandomUser API is replaceable with
 * any REST endpoint by changing the baseUrl and transformer.
 *
 * API docs: https://randomuser.me/documentation
 */

import axios, { AxiosInstance } from 'axios';
import { Connector } from '../base.connector';
import { FlowSyncUser, HealthCheckResult } from '../../types';
import { UserTransformer } from '../../transformers/user.transformer';
import { logger } from '../../utils/logger';
import { classifyError } from '../../utils/retry';

// ─── External API Types ───────────────────────────────────────────────────────

export interface RandomUserName {
  title: string;
  first: string;
  last: string;
}

export interface RandomUserLocation {
  street: { number: number; name: string };
  city: string;
  state: string;
  country: string;
  postcode: string | number;
}

export interface RandomUserLogin {
  uuid: string;
  username: string;
}

export interface RandomUserResult {
  gender: string;
  name: RandomUserName;
  location: RandomUserLocation;
  email: string;
  login: RandomUserLogin;
  phone: string;
  cell: string;
  nat: string;
}

export interface RandomUserResponse {
  results: RandomUserResult[];
  info: {
    seed: string;
    results: number;
    page: number;
    version: string;
  };
}

// ─── REST Connector ───────────────────────────────────────────────────────────

export class RestConnector implements Connector<RandomUserResult, FlowSyncUser> {
  private readonly client: AxiosInstance;
  private readonly transformer: UserTransformer;

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10_000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FlowSync/1.0',
      },
    });
    this.transformer = new UserTransformer();
  }

  /**
   * RandomUser API does not require authentication.
   * This method is a no-op but satisfies the Connector interface.
   */
  async authenticate(): Promise<void> {
    // No-op: RandomUser API is public
  }

  /**
   * Fetches paginated users from the RandomUser API.
   * Handles rate limits and network errors.
   *
   * @param params - Optional params: { results: number, page: number, seed: string }
   */
  async fetchData(
    params: Record<string, unknown> = {},
  ): Promise<RandomUserResult[]> {
    const results = (params['results'] as number) ?? 10;
    const page = (params['page'] as number) ?? 1;

    logger.info(
      { integration: 'rest', operation: 'fetchData', results, page },
      'Fetching users from RandomUser API',
    );

    const start = Date.now();
    try {
      const response = await this.client.get<RandomUserResponse>('', {
        params: { results, page, seed: params['seed'] ?? 'flowsync' },
      });

      const latency = Date.now() - start;
      logger.info(
        {
          integration: 'rest',
          operation: 'fetchData',
          status: 'success',
          count: response.data.results.length,
          latency,
        },
        'RandomUser API fetch complete',
      );

      return response.data.results;
    } catch (error) {
      const { isRetryable, errorCode, message } = classifyError(error);
      const latency = Date.now() - start;

      logger.error(
        {
          integration: 'rest',
          operation: 'fetchData',
          status: 'failed',
          errorCode,
          isRetryable,
          latency,
        },
        message,
      );

      throw error; // Re-throw for BullMQ retry handling
    }
  }

  /**
   * Transforms a raw RandomUser API result into a FlowSync User.
   * Delegates to the UserTransformer (pure function, no side effects).
   */
  transformData(data: RandomUserResult): FlowSyncUser {
    return this.transformer.transform(data);
  }

  /**
   * Verifies that the RandomUser API is reachable.
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      await this.client.get('', { params: { results: 1 } });
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
