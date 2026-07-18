/**
 * Express application configuration.
 *
 * Sets up middleware, routes, and the health check endpoint.
 * Error handler is always last.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { sendSuccess } from './utils/response';
import { logger } from './utils/logger';

import integrationRoutes from './routes/integration.routes';
import syncRoutes from './routes/sync.routes';
import webhookRoutes from './routes/webhook.routes';
import monitoringRoutes from './routes/monitoring.routes';
import { Router } from 'express';
import { monitoringController } from './controllers/monitoring.controller';
import { authenticate } from './middleware/auth.middleware';

const app = express();

// ─── Security & Parsing Middleware ───────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? process.env['FRONTEND_URL'] ?? 'http://localhost:3000'
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({
  limit: '1mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging ──────────────────────────────────────────────────────────

app.use((req, _res, next) => {
  logger.debug({ method: req.method, path: req.path }, 'Incoming request');
  next();
});

// ─── Health Check (no auth required) ─────────────────────────────────────────

app.get('/health', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/integrations', integrationRoutes);
app.use('/api/sync-jobs', syncRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/metrics', monitoringRoutes);
app.use('/api/workflow-executions', Router().use(authenticate).get('/', monitoringController.getWorkflowExecutions));
app.use('/api/logs', Router().use(authenticate).get('/', monitoringController.getLogs));
app.use('/api/failures', Router().use(authenticate).get('/', monitoringController.getFailures));

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// ─── Error Handler (must be last) ────────────────────────────────────────────

app.use(errorHandler);

export default app;
