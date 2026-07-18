/**
 * Standardized API response helpers.
 *
 * All FlowSync API endpoints return:
 *   Success: { success: true,  data: T,    error: null }
 *   Failure: { success: false, data: null, error: { code, message } }
 */

import { Response } from 'express';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  error: null;
}

export interface ApiError {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Send a successful response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
): Response<ApiSuccess<T>> {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
  });
}

/**
 * Send an error response.
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 500,
): Response<ApiError> {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: { code, message },
  });
}
