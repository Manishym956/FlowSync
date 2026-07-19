import { classifyError, ErrorCode } from '../../src/utils/retry';

describe('Retry Classification Utility', () => {
  it('should classify 429 Rate Limit as retryable', () => {
    const error = {
      isAxiosError: true,
      response: { status: 429 },
      message: 'Too Many Requests',
    };

    const classified = classifyError(error);

    expect(classified.isRetryable).toBe(true);
    expect(classified.errorCode).toBe(ErrorCode.RATE_LIMIT_ERROR);
  });

  it('should classify 500, 502, 503, 504 server errors as retryable', () => {
    [500, 502, 503, 504].forEach((status) => {
      const error = {
        isAxiosError: true,
        response: { status },
        message: 'Server error',
      };

      const classified = classifyError(error);

      expect(classified.isRetryable).toBe(true);
      expect(classified.errorCode).toBe(ErrorCode.INTEGRATION_ERROR);
    });
  });

  it('should classify network connection timeouts and resets as retryable', () => {
    const error = {
      isAxiosError: true,
      code: 'ETIMEDOUT',
      message: 'Connection timed out',
    };

    const classified = classifyError(error);

    expect(classified.isRetryable).toBe(true);
    expect(classified.errorCode).toBe(ErrorCode.TIMEOUT_ERROR);
  });

  it('should classify 400, 401, 403, 422 client errors as non-retryable', () => {
    [400, 401, 403, 422].forEach((status) => {
      const error = {
        isAxiosError: true,
        response: { status },
        message: 'Client error',
      };

      const classified = classifyError(error);

      expect(classified.isRetryable).toBe(false);
      if (status === 401 || status === 403) {
        expect(classified.errorCode).toBe(ErrorCode.AUTHENTICATION_ERROR);
      } else {
        expect(classified.errorCode).toBe(ErrorCode.INTEGRATION_ERROR);
      }
    });
  });

  it('should classify generic unhandled errors as non-retryable', () => {
    const error = new Error('Generic JavaScript runtime crash');

    const classified = classifyError(error);

    expect(classified.isRetryable).toBe(false);
    expect(classified.errorCode).toBe(ErrorCode.INTERNAL_ERROR);
  });
});
