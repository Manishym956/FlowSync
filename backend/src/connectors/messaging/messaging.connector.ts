import axios from 'axios';
import { Connector } from '../base.connector';
import { HealthCheckResult } from '../../types';
import { AppError } from '../../middleware/error.middleware';
import { logger } from '../../utils/logger';

export interface MessagePayload {
  to: string;
  subject: string;
  body: string;
  idempotencyKey?: string;
}

export class MessagingConnector implements Connector<any, MessagePayload> {
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async authenticate(): Promise<void> {
    if (!this.apiKey) {
      throw new AppError('AUTHENTICATION_ERROR', 'Resend API key is missing', 401);
    }
  }

  async fetchData(): Promise<any[]> {
    throw new AppError('VALIDATION_ERROR', 'MessagingConnector does not support fetching inbound data', 400);
  }

  transformData(data: MessagePayload): MessagePayload {
    return data;
  }

  /**
   * Sends an outbound email using Resend.
   */
  async pushData(data: MessagePayload): Promise<{ id: string }> {
    await this.authenticate();

    // Handle Mock execution mode
    if (this.apiKey === 're_mock_api_key_12345') {
      logger.info({ messagePayload: { to: data.to, subject: data.subject } }, 'MOCK EMAIL SEND IN PROGRESS');

      // Simulate controlled errors for verification tests
      if (data.to === 'invalid-recipient@flowsync.dev') {
        throw new AppError('VALIDATION_ERROR', 'Invalid recipient (Simulated Resend 400)', 400);
      }
      if (data.to === 'unauthorized@flowsync.dev') {
        throw new AppError('AUTHENTICATION_ERROR', 'Invalid API key (Simulated Resend 401)', 401);
      }
      if (data.to === 'transient-error@flowsync.dev') {
        throw new AppError('EXTERNAL_API_ERROR', 'Service unavailable (Simulated Resend 503)', 503);
      }

      // Generate a mock message ID
      const mockId = `re_mock_msg_${Math.floor(Math.random() * 1000000000)}`;
      logger.info({ mockId }, 'MOCK EMAIL SEND COMPLETED');
      return { id: mockId };
    }

    // Real API implementation
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };

      if (data.idempotencyKey) {
        headers['Idempotency-Key'] = data.idempotencyKey;
      }

      const response = await axios.post(
        'https://api.resend.com/emails',
        {
          from: this.fromEmail,
          to: data.to,
          subject: data.subject,
          html: data.body,
        },
        { headers, timeout: 5000 },
      );

      return { id: response.data.id };
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status;
        const errorData = err.response.data;
        const msg = errorData?.message ?? 'Resend API error';

        logger.error({ status, errorData }, 'Resend API send failed');

        // Classify errors:
        // 429 (Too Many Requests), 5xx are transient (should retry)
        // 400, 401, 403, 422 are permanent (should not retry)
        if (status === 429 || status >= 500) {
          throw new AppError('EXTERNAL_API_ERROR', `Resend transient failure: ${msg}`, status);
        } else {
          throw new AppError('VALIDATION_ERROR', `Resend permanent failure: ${msg}`, status);
        }
      }

      // Network / Timeout errors are transient
      throw new AppError('EXTERNAL_API_ERROR', `Resend connection failed: ${err.message}`, 503);
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();

    // Mock API key is always healthy
    if (this.apiKey === 're_mock_api_key_12345') {
      return { status: 'healthy', latency: Date.now() - start };
    }

    // Config verification
    if (!this.apiKey || !this.apiKey.startsWith('re_')) {
      return {
        status: 'unavailable',
        latency: Date.now() - start,
        error: 'Invalid Resend API key syntax configuration',
      };
    }

    return { status: 'healthy', latency: Date.now() - start };
  }
}
