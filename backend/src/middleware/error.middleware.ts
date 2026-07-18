/**
 * Centralized Express error handling middleware.
 *
 * Converts internal errors into standardized API responses.
 * Internal stack traces are never exposed in production (TRD §20).
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';
import { env } from '../config/env';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
  }
}

export class IntegrationError extends AppError {
  constructor(message: string) {
    super('INTEGRATION_ERROR', message, 502);
  }
}

// ─── Error Handler Middleware ─────────────────────────────────────────────────

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    logger.warn({ err: message, path: req.path }, 'Validation error');
    sendError(res, 'VALIDATION_ERROR', message, 400);
    return;
  }

  // Known application errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(
        { code: err.code, path: req.path, statusCode: err.statusCode },
        err.message,
      );
    } else {
      logger.warn(
        { code: err.code, path: req.path, statusCode: err.statusCode },
        err.message,
      );
    }
    sendError(res, err.code, err.message, err.statusCode);
    return;
  }

  // Unknown errors
  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  logger.error(
    {
      path: req.path,
      // Only include stack trace in development — never in production
      ...(env.NODE_ENV !== 'production' && err instanceof Error
        ? { stack: err.stack }
        : {}),
    },
    message,
  );

  sendError(res, 'INTERNAL_ERROR', 'An internal server error occurred', 500);
}
