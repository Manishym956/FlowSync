/**
 * Error classification and retry logic.
 *
 * Classifies HTTP errors as retryable or non-retryable per TRD §11.
 * Only transient failures should be retried (guidelines.md §Error Handling).
 */

// ─── Error Codes ──────────────────────────────────────────────────────────────

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  INTEGRATION_ERROR: 'INTEGRATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ─── Retry Classification ─────────────────────────────────────────────────────

/**
 * HTTP status codes that indicate a transient error safe to retry.
 * Per TRD §11: 429, 500, 502, 503, 504 + network errors.
 */
const RETRYABLE_HTTP_CODES = new Set([429, 500, 502, 503, 504]);

/**
 * HTTP status codes that indicate a permanent error. Do NOT retry.
 * Per TRD §11: 400, 401, 403 + validation/schema failures.
 */
const NON_RETRYABLE_HTTP_CODES = new Set([400, 401, 403, 404, 422]);

export interface ClassifiedError {
  isRetryable: boolean;
  errorCode: ErrorCode;
  message: string;
}

/**
 * Classifies an error as retryable or non-retryable.
 * Accepts Axios errors, native fetch errors, or generic errors.
 */
export function classifyError(error: unknown): ClassifiedError {
  // Axios-style errors (have a response.status property)
  if (isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 429) {
      return {
        isRetryable: true,
        errorCode: ErrorCode.RATE_LIMIT_ERROR,
        message: `Rate limit exceeded (HTTP ${status})`,
      };
    }

    if (status && RETRYABLE_HTTP_CODES.has(status)) {
      return {
        isRetryable: true,
        errorCode: ErrorCode.INTEGRATION_ERROR,
        message: `Transient API error (HTTP ${status})`,
      };
    }

    if (status === 401 || status === 403) {
      return {
        isRetryable: false,
        errorCode: ErrorCode.AUTHENTICATION_ERROR,
        message: `Authentication failed (HTTP ${status})`,
      };
    }

    if (status && NON_RETRYABLE_HTTP_CODES.has(status)) {
      return {
        isRetryable: false,
        errorCode: ErrorCode.INTEGRATION_ERROR,
        message: `Client error (HTTP ${status})`,
      };
    }

    // Network-level errors (no response)
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return {
        isRetryable: true,
        errorCode: ErrorCode.TIMEOUT_ERROR,
        message: `Network error: ${error.code}`,
      };
    }
  }

  // Fallback: treat unknown errors as non-retryable internal errors
  const message = error instanceof Error ? error.message : 'Unknown error';
  return {
    isRetryable: false,
    errorCode: ErrorCode.INTERNAL_ERROR,
    message,
  };
}

// ─── Exponential Backoff ──────────────────────────────────────────────────────

/**
 * Returns the delay in milliseconds for a given retry attempt.
 * Matches the strategy defined in TRD §11:
 *   Attempt 1 → immediate (0ms)
 *   Attempt 2 → 30s
 *   Attempt 3 → 2m
 *   Attempt 4 → 10m
 */
export function getRetryDelay(attempt: number): number {
  const delays = [0, 30_000, 120_000, 600_000];
  return delays[Math.min(attempt - 1, delays.length - 1)] ?? 600_000;
}

// ─── Type Guards ──────────────────────────────────────────────────────────────

interface AxiosErrorShape {
  isAxiosError?: boolean;
  response?: { status: number };
  code?: string;
  message: string;
}

function isAxiosError(error: unknown): error is AxiosErrorShape {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('isAxiosError' in error || ('response' in error && 'code' in error))
  );
}
