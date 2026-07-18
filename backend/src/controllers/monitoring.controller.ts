import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { sendSuccess } from '../utils/response';
import {
  OverviewMetrics,
  TimeSeriesItem,
  TimeSeriesMetrics,
  EnhancedIntegrationItem,
  EnhancedIntegrationDetail,
  WorkflowExecutionItem,
  NormalizedFailure,
  NormalizedActivity,
  PaginatedResponse,
} from '../types/monitoring';
import { AppError } from '../middleware/error.middleware';

export const monitoringController = {
  /**
   * GET /api/metrics
   * Returns dashboard-level summary metrics.
   */
  async getOverviewMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // ── Integrations Metrics ────────────────────────────────────────────────
      const integrations = await prisma.integration.findMany({
        include: {
          syncJobs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          integrationLogs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      let activeIntegrations = 0;
      let healthyIntegrations = 0;
      let degradedIntegrations = 0;
      let failedIntegrations = 0;

      for (const integration of integrations) {
        if (integration.status !== 'active') {
          continue;
        }
        activeIntegrations++;

        const lastJob = integration.syncJobs[0];
        const lastLog = integration.integrationLogs[0];

        const hasRecentJobFailure = lastJob && lastJob.status === 'FAILED';
        const hasRecentLogFailure = lastLog && lastLog.status === 'FAILED';

        if (hasRecentJobFailure || hasRecentLogFailure) {
          failedIntegrations++;
        } else {
          // If average latency in logs is high (e.g. > 3000ms), mark as degraded, else healthy
          const avgLatencyAggregate = await prisma.integrationLog.aggregate({
            where: { integrationId: integration.id, latency: { not: null } },
            _avg: { latency: true },
          });
          const avgLatency = avgLatencyAggregate._avg.latency ?? 0;

          if (avgLatency > 3000) {
            degradedIntegrations++;
          } else {
            healthyIntegrations++;
          }
        }
      }

      // ── Sync Jobs Metrics ───────────────────────────────────────────────────
      const syncJobsCount = await prisma.syncJob.groupBy({
        by: ['status'],
        _count: true,
      });

      let totalSyncJobs = 0;
      let successfulSyncJobs = 0;
      let failedSyncJobs = 0;

      for (const group of syncJobsCount) {
        const count = group._count;
        totalSyncJobs += count;
        if (group.status === 'COMPLETED') {
          successfulSyncJobs += count;
        } else if (group.status === 'FAILED') {
          failedSyncJobs += count;
        }
      }

      const syncSuccessRate = totalSyncJobs > 0
        ? Math.round((successfulSyncJobs / totalSyncJobs) * 100)
        : 100;

      // ── Average API Latency ─────────────────────────────────────────────────
      const latencyAggregate = await prisma.integrationLog.aggregate({
        where: { latency: { not: null } },
        _avg: { latency: true },
      });
      const averageApiLatency = Math.round(latencyAggregate._avg.latency ?? 0);

      // ── Workflow Executions Metrics ──────────────────────────────────────────
      const workflowCount = await prisma.workflowExecution.groupBy({
        by: ['status'],
        _count: true,
      });

      let totalWorkflowExecutions = 0;
      let successfulWorkflowExecutions = 0;
      let failedWorkflowExecutions = 0;

      for (const group of workflowCount) {
        const count = group._count;
        totalWorkflowExecutions += count;
        if (group.status === 'COMPLETED') {
          successfulWorkflowExecutions += count;
        } else if (group.status === 'FAILED') {
          failedWorkflowExecutions += count;
        }
      }

      // ── Notifications Metrics ───────────────────────────────────────────────
      const notificationCount = await prisma.notification.groupBy({
        by: ['status'],
        _count: true,
      });

      let totalNotifications = 0;
      let sentNotifications = 0;
      let failedNotifications = 0;

      for (const group of notificationCount) {
        const count = group._count;
        totalNotifications += count;
        if (group.status === 'SENT') {
          sentNotifications += count;
        } else if (group.status === 'FAILED') {
          failedNotifications += count;
        }
      }

      const data: OverviewMetrics = {
        activeIntegrations,
        healthyIntegrations,
        degradedIntegrations,
        failedIntegrations,
        totalSyncJobs,
        successfulSyncJobs,
        failedSyncJobs,
        syncSuccessRate,
        averageApiLatency,
        totalWorkflowExecutions,
        successfulWorkflowExecutions,
        failedWorkflowExecutions,
        totalNotifications,
        sentNotifications,
        failedNotifications,
      };

      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/metrics/time-series
   * Returns aggregated historical time-series data for dashboard charts.
   */
  async getTimeSeriesMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query['range'] as string) ?? '24h';
      const now = new Date();
      const startDate = new Date();
      let bucketHours = 1;

      if (range === '24h') {
        startDate.setHours(now.getHours() - 24);
        bucketHours = 1;
      } else if (range === '7d') {
        startDate.setDate(now.getDate() - 7);
        bucketHours = 24;
      } else if (range === '30d') {
        startDate.setDate(now.getDate() - 30);
        bucketHours = 24;
      } else {
        throw new AppError('VALIDATION_ERROR', 'Invalid time range parameter. Supported: 24h, 7d, 30d', 400);
      }

      // Fetch all sync logs and workflow executions in range
      const syncLogs = await prisma.integrationLog.findMany({
        where: { createdAt: { gte: startDate }, operation: 'SYNC' },
        orderBy: { createdAt: 'asc' },
      });

      const workflowExecs = await prisma.workflowExecution.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: 'asc' },
      });

      // Helper to group records by time interval
      const buildTimeSeriesBuckets = (
        records: Array<{ createdAt: Date; status: string; latency?: number | null }>,
        start: Date,
        end: Date,
        stepHours: number,
      ): TimeSeriesItem[] => {
        const buckets: TimeSeriesItem[] = [];
        const current = new Date(start);

        if (stepHours === 1) {
          // Normalize start to the beginning of the hour
          current.setMinutes(0, 0, 0);
        } else {
          // Normalize start to the beginning of the day
          current.setHours(0, 0, 0, 0);
        }

        while (current <= end) {
          const bucketStart = new Date(current);
          current.setHours(current.getHours() + stepHours);
          const bucketEnd = new Date(current);

          const filtered = records.filter(
            (r) => r.createdAt >= bucketStart && r.createdAt < bucketEnd,
          );

          const successCount = filtered.filter((r) => r.status === 'SUCCESS' || r.status === 'COMPLETED').length;
          const failedCount = filtered.filter((r) => r.status === 'FAILED').length;

          // Latency average
          const latencyValues = filtered.map((r: any) => r.latency).filter((l: any): l is number => typeof l === 'number');
          const averageLatency = latencyValues.length > 0
            ? Math.round(latencyValues.reduce((sum: number, val: number) => sum + val, 0) / latencyValues.length)
            : 0;

          buckets.push({
            timestamp: bucketStart.toISOString(),
            successCount,
            failedCount,
            averageLatency,
          });
        }

        return buckets;
      };

      const syncJobsSeries = buildTimeSeriesBuckets(
        syncLogs.map((log: any) => ({
          createdAt: log.createdAt,
          status: log.status,
          latency: log.latency,
        })),
        startDate,
        now,
        bucketHours,
      );

      const workflowsSeries = buildTimeSeriesBuckets(
        workflowExecs.map((exec: any) => ({
          createdAt: exec.createdAt,
          status: exec.status,
          latency: exec.completedAt && exec.startedAt ? exec.completedAt.getTime() - exec.startedAt.getTime() : 0,
        })),
        startDate,
        now,
        bucketHours,
      );

      const data: TimeSeriesMetrics = {
        syncJobs: syncJobsSeries,
        workflowExecutions: workflowsSeries,
      };

      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/metrics/recent-activity
   * Returns unified feed of recent activities.
   */
  async getRecentActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = 15;

      const syncJobs = await prisma.syncJob.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { integration: true },
      });

      const workflowExecs = await prisma.workflowExecution.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      const notifications = await prisma.notification.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      // Normalize into common Activity model
      const activities: NormalizedActivity[] = [];

      syncJobs.forEach((job: any) => {
        activities.push({
          id: `sync-${job.id}`,
          type: job.status === 'COMPLETED' ? 'SYNC_COMPLETED' : 'SYNC_FAILED',
          summary: job.status === 'COMPLETED'
            ? `Sync completed successfully for ${job.integration.name} (${job.recordsProcessed} records)`
            : `Sync failed for ${job.integration.name}: ${job.errorMessage ?? 'Unknown error'}`,
          timestamp: (job.completedAt ?? job.createdAt).toISOString(),
          integration: job.integration.type,
        });
      });

      workflowExecs.forEach((exec: any) => {
        activities.push({
          id: `wf-${exec.id}`,
          type: exec.status === 'COMPLETED' ? 'WORKFLOW_COMPLETED' : 'WORKFLOW_FAILED',
          summary: exec.status === 'COMPLETED'
            ? `Workflow for event "${exec.triggerEvent}" completed successfully`
            : `Workflow for event "${exec.triggerEvent}" failed: ${exec.errorMessage ?? 'Unknown error'}`,
          timestamp: (exec.completedAt ?? exec.createdAt).toISOString(),
          integration: exec.workflowName.includes('.') ? exec.workflowName.split('.')[0]! : 'system',
        });
      });

      notifications.forEach((notif: any) => {
        activities.push({
          id: `notif-${notif.id}`,
          type: notif.status === 'SENT' ? 'NOTIFICATION_SENT' : 'NOTIFICATION_FAILED',
          summary: notif.status === 'SENT'
            ? `Outbound email successfully sent to ${notif.recipient.replace(/(.{3})(.*)(@.*)/, '$1***$3')}`
            : `Outbound email failed for ${notif.recipient.replace(/(.{3})(.*)(@.*)/, '$1***$3')}`,
          timestamp: notif.createdAt.toISOString(),
          integration: notif.provider,
        });
      });

      // Sort chronological DESC and take top 15
      const sorted = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      sendSuccess(res, sorted);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/integrations (Enhanced)
   */
  async getIntegrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const integrations = await prisma.integration.findMany({
        include: {
          syncJobs: { orderBy: { createdAt: 'desc' } },
          integrationLogs: { orderBy: { createdAt: 'desc' } },
        },
      });

      const enhancedList: EnhancedIntegrationItem[] = [];

      for (const integration of integrations) {
        // success rate calculation
        const logsList = integration.integrationLogs;
        const totalLogs = logsList.length;
        const successLogs = logsList.filter((l: any) => l.status === 'SUCCESS').length;
        const successRate = totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 100;

        // average latency
        const latencyLogs = logsList.map((l: any) => l.latency).filter((l: any): l is number => typeof l === 'number');
        const averageLatency = latencyLogs.length > 0
          ? Math.round(latencyLogs.reduce((sum: number, val: number) => sum + val, 0) / latencyLogs.length)
          : 0;

        const lastJob = integration.syncJobs[0];
        const lastSuccessfulSync = integration.syncJobs.find((j: any) => j.status === 'COMPLETED')?.completedAt?.toISOString() ?? null;
        const lastSyncStatus = lastJob ? lastJob.status : null;

        enhancedList.push({
          id: integration.id,
          name: integration.name,
          type: integration.type,
          status: integration.status,
          lastSuccessfulSync,
          lastSyncStatus,
          averageLatency,
          successRate,
        });
      }

      sendSuccess(res, enhancedList);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/integrations/:id (Enhanced)
   */
  async getIntegrationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const integration = await prisma.integration.findUnique({
        where: { id },
        include: {
          syncJobs: { orderBy: { createdAt: 'desc' }, take: 10 },
          integrationLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
        },
      });

      if (!integration) {
        throw new AppError('NOT_FOUND', 'Integration not found', 404);
      }

      const logsList = integration.integrationLogs;

      // success rate
      const totalLogs = logsList.length;
      const successLogs = logsList.filter((l: any) => l.status === 'SUCCESS').length;
      const successRate = totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 100;

      // average latency
      const latencyLogs = logsList.map((l: any) => l.latency).filter((l: any): l is number => typeof l === 'number');
      const averageLatency = latencyLogs.length > 0
        ? Math.round(latencyLogs.reduce((sum: number, val: number) => sum + val, 0) / latencyLogs.length)
        : 0;

      // records processed
      const recordsProcessed = integration.syncJobs.reduce((sum: number, job: any) => sum + job.recordsProcessed, 0);

      // recent errors
      const recentErrors = logsList
        .filter((l: any) => l.status === 'FAILED' && l.errorMessage)
        .map((l: any) => l.errorMessage!)
        .slice(0, 5);

      const lastSuccessfulSync = integration.syncJobs.find((j: any) => j.status === 'COMPLETED')?.completedAt?.toISOString() ?? null;
      const lastSyncStatus = integration.syncJobs[0]?.status ?? null;

      const data: EnhancedIntegrationDetail = {
        id: integration.id,
        name: integration.name,
        type: integration.type,
        status: integration.status,
        baseUrl: integration.baseUrl,
        lastSuccessfulSync,
        lastSyncStatus,
        averageLatency,
        successRate,
        recordsProcessed,
        recentErrors,
        recentSyncJobs: integration.syncJobs.map((j: any) => ({
          id: j.id,
          status: j.status,
          recordsProcessed: j.recordsProcessed,
          recordsFailed: j.recordsFailed,
          errorMessage: j.errorMessage,
          startedAt: j.startedAt,
          completedAt: j.completedAt,
        })),
      };

      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/sync-jobs (Enhanced with pagination, sorting, and filters)
   */
  async getSyncJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query['page'] as string || '1'));
      const limit = Math.max(1, Math.min(100, parseInt(req.query['limit'] as string || '20')));
      const status = req.query['status'] as string;
      const integrationId = req.query['integrationId'] as string;
      const sort = req.query['sort'] as string === 'asc' ? 'asc' : 'desc';

      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (integrationId) {
        where.integrationId = integrationId;
      }

      const total = await prisma.syncJob.count({ where });
      const totalPages = Math.ceil(total / limit);

      const items = await prisma.syncJob.findMany({
        where,
        orderBy: { createdAt: sort as any },
        skip: (page - 1) * limit,
        take: limit,
        include: { integration: { select: { name: true, type: true } } },
      });

      const response: PaginatedResponse<any> = {
        items: items.map((j: any) => ({
          id: j.id,
          integrationId: j.integrationId,
          integrationName: j.integration.name,
          integrationType: j.integration.type,
          status: j.status,
          resourceType: j.resourceType,
          recordsProcessed: j.recordsProcessed,
          recordsFailed: j.recordsFailed,
          retryCount: j.retryCount,
          errorMessage: j.errorMessage,
          startedAt: j.startedAt,
          completedAt: j.completedAt,
          createdAt: j.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      sendSuccess(res, response);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/sync-jobs/:id
   */
  async getSyncJobById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const job = await prisma.syncJob.findUnique({
        where: { id },
        include: { integration: { select: { name: true, type: true } } },
      });

      if (!job) {
        throw new AppError('NOT_FOUND', 'Sync job not found', 404);
      }

      sendSuccess(res, {
        id: job.id,
        integrationId: job.integrationId,
        integrationName: job.integration.name,
        integrationType: job.integration.type,
        status: job.status,
        resourceType: job.resourceType,
        recordsProcessed: job.recordsProcessed,
        recordsFailed: job.recordsFailed,
        retryCount: job.retryCount,
        errorMessage: job.errorMessage,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/workflow-executions
   */
  async getWorkflowExecutions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query['page'] as string || '1'));
      const limit = Math.max(1, Math.min(100, parseInt(req.query['limit'] as string || '20')));
      const status = req.query['status'] as string;
      const eventType = req.query['eventType'] as string;

      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (eventType) {
        where.triggerEvent = eventType;
      }

      const total = await prisma.workflowExecution.count({ where });
      const totalPages = Math.ceil(total / limit);

      const items = await prisma.workflowExecution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const response: PaginatedResponse<WorkflowExecutionItem> = {
        items: items.map((w: any) => {
          const duration = w.completedAt && w.startedAt
            ? w.completedAt.getTime() - w.startedAt.getTime()
            : null;

          return {
            id: w.id,
            workflowName: w.workflowName,
            triggerEvent: w.triggerEvent,
            status: w.status,
            startedAt: w.startedAt?.toISOString() ?? null,
            completedAt: w.completedAt?.toISOString() ?? null,
            duration,
            errorMessage: w.errorMessage,
          };
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      sendSuccess(res, response);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/logs
   * Structured audit log inspection.
   */
  async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query['page'] as string || '1'));
      const limit = Math.max(1, Math.min(100, parseInt(req.query['limit'] as string || '20')));
      const integrationId = req.query['integrationId'] as string;
      const status = req.query['status'] as string;
      const operation = req.query['operation'] as string;
      const search = req.query['search'] as string;

      const where: any = {};
      if (integrationId) {
        where.integrationId = integrationId;
      }
      if (status) {
        where.status = status;
      }
      if (operation) {
        where.operation = operation;
      }
      if (search) {
        where.OR = [
          { errorMessage: { contains: search, mode: 'insensitive' } },
          { operation: { contains: search, mode: 'insensitive' } },
        ];
      }

      const total = await prisma.integrationLog.count({ where });
      const totalPages = Math.ceil(total / limit);

      const items = await prisma.integrationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { integration: { select: { name: true, type: true } } },
      });

      const response: PaginatedResponse<any> = {
        items: items.map((l: any) => ({
          id: l.id,
          timestamp: l.createdAt.toISOString(),
          integrationId: l.integrationId,
          integrationName: l.integration.name,
          integrationType: l.integration.type,
          operation: l.operation,
          status: l.status,
          latency: l.latency,
          retryCount: l.retryCount,
          errorSummary: l.errorMessage,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      sendSuccess(res, response);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/failures
   * Unified failure endpoint across SyncJobs, Workflows, and Notifications.
   */
  async getFailures(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query['page'] as string || '1'));
      const limit = Math.max(1, Math.min(100, parseInt(req.query['limit'] as string || '20')));
      const sourceType = req.query['sourceType'] as string;
      const integrationFilter = req.query['integration'] as string;

      const dbLimit = page * limit;

      // Fetch failed SyncJobs
      let syncJobs: any[] = [];
      if (!sourceType || sourceType === 'SYNC_JOB') {
        const syncWhere: any = { status: 'FAILED' };
        if (integrationFilter) {
          syncWhere.integration = { type: integrationFilter };
        }
        syncJobs = await prisma.syncJob.findMany({
          where: syncWhere,
          orderBy: { createdAt: 'desc' },
          take: dbLimit,
          include: { integration: true },
        });
      }

      // Fetch failed WorkflowExecutions
      let workflowExecs: any[] = [];
      if (!sourceType || sourceType === 'WORKFLOW') {
        const wfWhere: any = { status: 'FAILED' };
        if (integrationFilter) {
          wfWhere.workflowName = { startsWith: integrationFilter };
        }
        workflowExecs = await prisma.workflowExecution.findMany({
          where: wfWhere,
          orderBy: { createdAt: 'desc' },
          take: dbLimit,
        });
      }

      // Fetch failed Notifications
      let notifications: any[] = [];
      if (!sourceType || sourceType === 'NOTIFICATION') {
        const notifWhere: any = { status: 'FAILED' };
        if (integrationFilter) {
          notifWhere.provider = integrationFilter;
        }
        notifications = await prisma.notification.findMany({
          where: notifWhere,
          orderBy: { createdAt: 'desc' },
          take: dbLimit,
        });
      }

      // Normalize into unified model
      const failures: NormalizedFailure[] = [];

      syncJobs.forEach((job: any) => {
        failures.push({
          id: job.id,
          sourceType: 'SYNC_JOB',
          integration: job.integration.type,
          operation: 'SYNC',
          errorCategory: job.errorMessage?.includes('validation') ? 'VALIDATION_ERROR' : 'EXTERNAL_API_ERROR',
          errorSummary: job.errorMessage ?? 'Sync job execution failed',
          timestamp: (job.completedAt ?? job.createdAt).toISOString(),
          retryCount: job.retryCount,
          relatedResourceId: job.id,
        });
      });

      workflowExecs.forEach((exec: any) => {
        failures.push({
          id: exec.id,
          sourceType: 'WORKFLOW',
          integration: exec.workflowName.includes('.') ? exec.workflowName.split('.')[0]! : 'system',
          operation: 'WEBHOOK',
          errorCategory: exec.errorMessage?.includes('validation') ? 'VALIDATION_ERROR' : 'EXTERNAL_API_ERROR',
          errorSummary: exec.errorMessage ?? 'Workflow execution failed',
          timestamp: (exec.completedAt ?? exec.createdAt).toISOString(),
          retryCount: 0,
          relatedResourceId: exec.id,
        });
      });

      notifications.forEach((notif: any) => {
        failures.push({
          id: notif.id,
          sourceType: 'NOTIFICATION',
          integration: notif.provider,
          operation: 'NOTIFICATION',
          errorCategory: 'EXTERNAL_API_ERROR',
          errorSummary: 'Outbound email delivery failed',
          timestamp: notif.createdAt.toISOString(),
          retryCount: 0,
          relatedResourceId: notif.webhookEventId,
        });
      });

      // Sort all chronologically descending
      const sortedFailures = failures.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Total counts in db
      const syncCount = !sourceType || sourceType === 'SYNC_JOB'
        ? await prisma.syncJob.count({
            where: {
              status: 'FAILED',
              ...(integrationFilter ? { integration: { type: integrationFilter } } : {}),
            },
          })
        : 0;

      const wfCount = !sourceType || sourceType === 'WORKFLOW'
        ? await prisma.workflowExecution.count({
            where: {
              status: 'FAILED',
              ...(integrationFilter ? { workflowName: { startsWith: integrationFilter } } : {}),
            },
          })
        : 0;

      const notifCount = !sourceType || sourceType === 'NOTIFICATION'
        ? await prisma.notification.count({
            where: {
              status: 'FAILED',
              ...(integrationFilter ? { provider: integrationFilter } : {}),
            },
          })
        : 0;

      const total = syncCount + wfCount + notifCount;
      const totalPages = Math.ceil(total / limit);

      // Slice page
      const paginatedFailures = sortedFailures.slice((page - 1) * limit, page * limit);

      const response: PaginatedResponse<NormalizedFailure> = {
        items: paginatedFailures,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      sendSuccess(res, response);
    } catch (err) {
      next(err);
    }
  },
};
