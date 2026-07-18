import { Router } from 'express';
import { monitoringController } from '../controllers/monitoring.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All monitoring routes require static API key authentication
router.use(authenticate);

/**
 * GET /api/metrics
 * Returns overview metrics for the dashboard widgets.
 */
router.get('/', monitoringController.getOverviewMetrics);

/**
 * GET /api/metrics/time-series
 * Returns hourly/daily aggregated counts for charts.
 */
router.get('/time-series', monitoringController.getTimeSeriesMetrics);

/**
 * GET /api/metrics/recent-activity
 * Returns combined activity log feed.
 */
router.get('/recent-activity', monitoringController.getRecentActivity);

export default router;
