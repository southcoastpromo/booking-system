/**
 * Monitoring API Routes
 * Real-time monitoring dashboard and alert management
 */

import { Router } from 'express';
import { getMonitoringDashboard, healthCheck, monitoringState, alertManager } from '../middleware/monitoring';
import { logger } from '../logger';
import { sendErrorResponse } from '../utils/response-helpers';
import { readFileSync, existsSync, statSync, readdirSync, createReadStream } from 'fs';
import { join, basename } from 'path';

const router = Router();

// Health check endpoint with monitoring data
router.get('/health', healthCheck);

// Monitoring dashboard data
router.get('/monitoring/dashboard', async (req, res) => {
  try {
    const dashboard = await getMonitoringDashboard();
    res.json(dashboard);
  } catch (error) {
    logger.error('Failed to get monitoring dashboard', { error });
    sendErrorResponse(res, 500, 'Failed to get monitoring data');
  }
});

// Recent alerts endpoint
router.get('/monitoring/alerts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const alerts = alertManager.getRecentAlerts(limit);

    res.json({
      alerts,
      total: alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get alerts', { error });
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Production deliverable download endpoint
router.get('/download/production-ready', (req, res) => {
  try {
    // Find the latest production ready file using fs.readdirSync
    const workspaceDir = '/home/runner/workspace';
    const files = readdirSync(workspaceDir)
      .filter((file: string) => file.startsWith('SouthCoast-Production-Ready-') && file.endsWith('.tar.gz'))
      .map((file: string) => join(workspaceDir, file));

    if (files.length === 0) {
      return res.status(404).json({ error: 'Production deliverable not found' });
    }

    const latestFile = files.sort().pop();
    
    if (!latestFile) {
      return res.status(404).json({ error: 'Production deliverable not found' });
    }
    
    const fileName = basename(latestFile);

    // Check if file exists and is readable
    if (!existsSync(latestFile)) {
      return res.status(404).json({ error: 'Production deliverable file not found' });
    }

    const stat = statSync(latestFile);

    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('X-Download-Type', 'production-deliverable');
    res.setHeader('X-File-Size', stat.size);

    const fileStream = createReadStream(latestFile);

    fileStream.on('error', (streamError: Error) => {
      logger.error('File stream error during download', { error: streamError });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download stream failed' });
      }
    });

    fileStream.pipe(res);

    logger.info('Production deliverable download started', {
      fileName,
      size: stat.size,
      sizeFormatted: (stat.size / 1024 / 1024).toFixed(2) + 'MB'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to serve production deliverable', { error: errorMessage });
    res.status(500).json({ error: 'Download failed: ' + errorMessage });
  }
});

// System metrics endpoint
router.get('/monitoring/metrics', (req, res) => {
  try {
    const metrics = monitoringState.getMetrics();
    const memoryUsage = process.memoryUsage();

    res.json({
      performance: metrics,
      system: {
        uptime: process.uptime(),
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Error rate endpoint
router.get('/monitoring/error-rate', (req, res) => {
  try {
    const metrics = monitoringState.getMetrics();
    const errorCounts = metrics.errorCounts;

    // Calculate error rates (errors per endpoint)
    const errorRates = Object.entries(errorCounts).map(([path, count]) => ({
      path,
      errorCount: count,
      timestamp: new Date().toISOString()
    }));

    res.json({
      errorRates,
      totalErrors: Object.values(errorCounts).reduce((sum, count) => sum + count, 0),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get error rates', { error });
    res.status(500).json({ error: 'Failed to get error rates' });
  }
});

// Performance metrics endpoint
router.get('/monitoring/performance', (req, res) => {
  try {
    const metrics = monitoringState.getMetrics();

    // Calculate average response times
    const slowRequests = metrics.recentSlowRequests;
    const avgResponseTime = slowRequests.length > 0
      ? slowRequests.reduce((sum, req) => sum + req.duration, 0) / slowRequests.length
      : 0;

    res.json({
      slowRequests,
      averageResponseTime: Math.round(avgResponseTime),
      totalSlowRequests: metrics.totalSlowRequests,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get performance metrics', { error });
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

export default router;
