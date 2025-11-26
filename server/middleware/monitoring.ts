/**
 * Real-Time Monitoring and Alerting System
 * Comprehensive production monitoring with error tracking and alerts
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { MONITORING_CONFIG } from '../../lib/config';

// Use centralized monitoring configuration from production-config

// Monitoring State
class MonitoringState {
  private errorCounts: Map<string, number> = new Map();
  private lastAlerts: Map<string, number> = new Map();
  private slowRequests: Array<{path: string, duration: number, timestamp: number}> = [];

  addError(path: string): void {
    const count = this.errorCounts.get(path) || 0;
    this.errorCounts.set(path, count + 1);
  }

  addSlowRequest(path: string, duration: number): void {
    this.slowRequests.push({
      path,
      duration,
      timestamp: Date.now()
    });

    // Keep only last 100 slow requests
    if (this.slowRequests.length > 100) {
      this.slowRequests = this.slowRequests.slice(-100);
    }
  }

  shouldAlert(alertType: string): boolean {
    const lastAlert = this.lastAlerts.get(alertType) || 0;
    const now = Date.now();

    if (now - lastAlert > MONITORING_CONFIG.ALERT_COOLDOWN) {
      this.lastAlerts.set(alertType, now);
      return true;
    }
    return false;
  }

  getMetrics() {
    return {
      errorCounts: Object.fromEntries(this.errorCounts),
      recentSlowRequests: this.slowRequests.slice(-10),
      totalSlowRequests: this.slowRequests.length
    };
  }
}

const monitoringState = new MonitoringState();

// Alert System
interface Alert {
  type: 'ERROR_SPIKE' | 'SLOW_RESPONSE' | 'HIGH_MEMORY' | 'HIGH_CPU' | 'SYSTEM_ERROR';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  metadata: Record<string, any>;
  timestamp: number;
}

class AlertManager {
  private alerts: Alert[] = [];

  async sendAlert(alert: Alert): Promise<void> {
    this.alerts.push(alert);

    // Log the alert
    logger.error(`[ALERT] ${alert.type}: ${alert.message}`, {
      severity: alert.severity,
      metadata: alert.metadata,
      timestamp: alert.timestamp
    });

    // In production, integrate with external services
    await this.notifyExternal(alert);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  private async notifyExternal(alert: Alert): Promise<void> {
    try {
      // Webhook notification (if configured)
      if (process.env.ALERT_WEBHOOK_URL) {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 ${alert.type}: ${alert.message}`,
            severity: alert.severity,
            timestamp: new Date(alert.timestamp).toISOString(),
            metadata: alert.metadata
          })
        });
      }

      // Email notification (if configured)
      if (process.env.ALERT_EMAIL && alert.severity === 'CRITICAL') {
        // Email integration would go here
        logger.info('Critical alert email would be sent', { alert });
      }

    } catch (error) {
      logger.error('Failed to send external alert', { error, alert });
    }
  }

  getRecentAlerts(limit: number = 50): Alert[] {
    return this.alerts.slice(-limit);
  }
}

const alertManager = new AlertManager();

// Performance Monitoring Middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): typeof res {
    const duration = Date.now() - startTime;
    const path = req.path;

    // Log slow requests
    if (duration > MONITORING_CONFIG.RESPONSE_TIME_THRESHOLD) {
      monitoringState.addSlowRequest(path, duration);

      if (monitoringState.shouldAlert('SLOW_RESPONSE')) {
        alertManager.sendAlert({
          type: 'SLOW_RESPONSE',
          severity: duration > 10000 ? 'CRITICAL' : 'HIGH',
          message: `Slow response detected: ${path} took ${duration}ms`,
          metadata: { path, duration, method: req.method },
          timestamp: Date.now()
        });
      }
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding);
    return res;
  };

  next();
};

// Error Monitoring Middleware
export const errorMonitor = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const path = req.path;
  monitoringState.addError(path);

  // Check for error spikes
  const errorCount = monitoringState.getMetrics().errorCounts[path] || 0;

  if (errorCount > MONITORING_CONFIG.ERROR_THRESHOLD && monitoringState.shouldAlert('ERROR_SPIKE')) {
    alertManager.sendAlert({
      type: 'ERROR_SPIKE',
      severity: 'HIGH',
      message: `Error spike detected: ${errorCount} errors on ${path}`,
      metadata: { path, errorCount, error: error.message },
      timestamp: Date.now()
    });
  }

  // Log the error
  logger.error(`Request error on ${req.method} ${path}`, {
    error: error.message,
    stack: error.stack,
    method: req.method,
    path,
    userAgent: req.get('User-Agent')
  });

  next(error);
};

// System Health Monitoring
export const systemHealthMonitor = (): void => {
  setInterval(async () => {
    try {
      const memoryUsage = process.memoryUsage();
      const _cpuUsage = process.cpuUsage();

      // Memory monitoring
      if (memoryUsage.heapUsed > MONITORING_CONFIG.MEMORY_THRESHOLD) {
        if (monitoringState.shouldAlert('HIGH_MEMORY')) {
          await alertManager.sendAlert({
            type: 'HIGH_MEMORY',
            severity: 'MEDIUM',
            message: `High memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            metadata: { memoryUsage },
            timestamp: Date.now()
          });
        }
      }

      // Log system metrics
      logger.info('System health check', {
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        uptime: process.uptime()
      });

    } catch (error) {
      logger.error('System health monitoring error', { error });
    }
  }, 60000); // Check every minute
};

// Monitoring Dashboard Endpoint Data
export const getMonitoringDashboard = async () => {
  const metrics = monitoringState.getMetrics();
  const recentAlerts = alertManager.getRecentAlerts(20);
  const memoryUsage = process.memoryUsage();
  
  // Get database metrics
  let databaseMetrics;
  try {
    const { getDatabaseMetrics, getDatabaseHealth } = await import('./database-monitoring');
    databaseMetrics = {
      metrics: getDatabaseMetrics(),
      health: getDatabaseHealth()
    };
  } catch (_error) {
    databaseMetrics = {
      error: 'Database monitoring not available',
      health: { status: 'unknown' }
    };
  }

  return {
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      nodeVersion: process.version,
      platform: process.platform
    },
    performance: {
      errorCounts: metrics.errorCounts,
      slowRequests: metrics.recentSlowRequests,
      totalSlowRequests: metrics.totalSlowRequests
    },
    database: databaseMetrics,
    alerts: {
      recent: recentAlerts,
      total: recentAlerts.length
    }
  };
};

// Health Check with Monitoring
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const dashboard = await getMonitoringDashboard();
    const isHealthy = dashboard.system.memory.heapUsed < 400; // Under 400MB

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      ...dashboard
    });

  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
};

// Initialize monitoring
export const initializeMonitoring = (): void => {
  logger.info('Initializing real-time monitoring system');

  // Start system health monitoring
  systemHealthMonitor();

  // Log configuration
  logger.info('Monitoring configuration', MONITORING_CONFIG);

  logger.info('Real-time monitoring system initialized');
};

export { monitoringState, alertManager };
