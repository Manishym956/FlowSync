/**
 * Static API key authentication middleware.
 *
 * MVP authentication strategy (AD-6): a static API key passed as
 * Authorization: Bearer <key>
 *
 * The key is read from the API_KEY environment variable.
 * No login UI or JWT generation for MVP.
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { sendError } from '../utils/response';

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'AUTHENTICATION_ERROR', 'Missing or invalid Authorization header', 401);
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  if (token !== env.API_KEY) {
    sendError(res, 'AUTHENTICATION_ERROR', 'Invalid API key', 401);
    return;
  }

  next();
}
