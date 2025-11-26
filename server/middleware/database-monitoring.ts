/**
 * Database Performance Monitoring
 * Comprehensive monitoring for database queries, connections, and performance metrics
 */

import { logger } from '../logger';
import { alertManager } from './monitoring';
import { env } from '../../lib/environment';

// Database monitoring configuration
const DB_MONITORING_CONFIG = {
  SLOW_QUERY_THRESHOLD: 1000, // 1 second
  VERY_SLOW_QUERY_THRESHOLD: 5000, // 5 seconds
  CONNECTION_TIMEOUT_THRESHOLD: 10000, // 10 seconds
  QUERY_ERROR_THRESHOLD: 5, // errors per minute
  ALERT_COOLDOWN: 300000, // 5 minutes between alerts
  METRICS_RETENTION_HOURS: 24,
  MAX_SLOW_QUERIES_STORED: 100,
} as const;

// Query performance metrics
interface QueryMetrics {
  query: string;
  params?: unknown;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
  stackTrace?: string;
}

interface DatabaseStats {
  totalQueries: number;
  slowQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  connectionTime: number;
  lastConnectionTest: number;
  uptime: number;
}

class DatabaseMonitor {
  private queryMetrics: QueryMetrics[] = [];
  private connectionStats: DatabaseStats = {
    totalQueries: 0,
    slowQueries: 0,
    failedQueries: 0,
    averageQueryTime: 0,
    connectionTime: 0,
    lastConnectionTest: 0,
    uptime: Date.now(),
  };
  private lastAlerts: Map<string, number> = new Map();
  private recentErrors: Array<{ timestamp: number; error: string }> = [];

  /**
   * Monitor a database query execution
   */
  async monitorQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    params?: unknown
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;
    let stackTrace: string | undefined;
    let result: T;

    try {
      result = await queryFn();
      this.connectionStats.totalQueries++;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown database error';
      stackTrace = err instanceof Error ? err.stack : undefined;
      this.connectionStats.failedQueries++;
      
      // Track recent errors
      this.recentErrors.push({
        timestamp: Date.now(),
        error
      });

      // Keep only last 50 errors
      if (this.recentErrors.length > 50) {
        this.recentErrors = this.recentErrors.slice(-50);
      }

      throw err;
    }

    const duration = Date.now() - startTime;

    // Update average query time
    const totalTime = (this.connectionStats.averageQueryTime * (this.connectionStats.totalQueries - 1)) + duration;
    this.connectionStats.averageQueryTime = totalTime / this.connectionStats.totalQueries;

    // Record query metrics
    const metrics: QueryMetrics = {
      query: queryName,
      params: this.sanitizeParams(params),
      duration,
      timestamp: Date.now(),
      success,
      error,
      stackTrace
    };

    this.queryMetrics.push(metrics);

    // Track slow queries
    if (duration > DB_MONITORING_CONFIG.SLOW_QUERY_THRESHOLD) {
      this.connectionStats.slowQueries++;
      
      logger.warn(`[DB-PERF] Slow query detected: ${queryName}`, {
        duration: `${duration}ms`,
        query: queryName,
        params: this.sanitizeParams(params),
        threshold: `${DB_MONITORING_CONFIG.SLOW_QUERY_THRESHOLD}ms`
      });

      // Alert for very slow queries
      if (duration > DB_MONITORING_CONFIG.VERY_SLOW_QUERY_THRESHOLD && this.shouldAlert('VERY_SLOW_QUERY')) {
        await alertManager.sendAlert({
          type: 'SLOW_RESPONSE',
          severity: 'HIGH',
          message: `Very slow database query: ${queryName} took ${duration}ms`,
          metadata: {
            query: queryName,
            duration,
            threshold: DB_MONITORING_CONFIG.VERY_SLOW_QUERY_THRESHOLD,
            params: this.sanitizeParams(params)
          },
          timestamp: Date.now()
        });
      }
    }

    // Alert for query error spikes
    if (!success) {
      const recentErrorCount = this.recentErrors.filter(
        e => Date.now() - e.timestamp < 60000 // Last minute
      ).length;

      if (recentErrorCount > DB_MONITORING_CONFIG.QUERY_ERROR_THRESHOLD && this.shouldAlert('DB_ERROR_SPIKE')) {
        await alertManager.sendAlert({
          type: 'ERROR_SPIKE',
          severity: 'CRITICAL',
          message: `Database error spike: ${recentErrorCount} errors in the last minute`,
          metadata: {
            errorCount: recentErrorCount,
            recentError: error,
            query: queryName
          },
          timestamp: Date.now()
        });
      }
    }

    // Cleanup old metrics (keep last 24 hours)
    const cutoffTime = Date.now() - (DB_MONITORING_CONFIG.METRICS_RETENTION_HOURS * 60 * 60 * 1000);
    this.queryMetrics = this.queryMetrics.filter(m => m.timestamp > cutoffTime);

    return result;
  }

  /**
   * Test database connection performance
   */
  async testConnection(sql: any): Promise<{ success: boolean; duration: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await sql`SELECT 1 as connection_test`;
      const duration = Date.now() - startTime;
      
      this.connectionStats.connectionTime = duration;
      this.connectionStats.lastConnectionTest = Date.now();

      // Alert for slow connections
      if (duration > DB_MONITORING_CONFIG.CONNECTION_TIMEOUT_THRESHOLD && this.shouldAlert('SLOW_CONNECTION')) {
        await alertManager.sendAlert({
          type: 'SLOW_RESPONSE',
          severity: 'MEDIUM',
          message: `Slow database connection: ${duration}ms`,
          metadata: {
            connectionTime: duration,
            threshold: DB_MONITORING_CONFIG.CONNECTION_TIMEOUT_THRESHOLD
          },
          timestamp: Date.now()
        });
      }

      return { success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      
      logger.error('[DB-MONITOR] Connection test failed', {
        error: errorMessage,
        duration,
        databaseUrl: env.DATABASE_URL ? 'configured' : 'missing'
      });

      // Alert for connection failures
      if (this.shouldAlert('DB_CONNECTION_FAILURE')) {
        await alertManager.sendAlert({
          type: 'SYSTEM_ERROR',
          severity: 'CRITICAL',
          message: `Database connection failed: ${errorMessage}`,
          metadata: {
            error: errorMessage,
            duration,
            databaseConfigured: !!env.DATABASE_URL
          },
          timestamp: Date.now()
        });
      }

      return { success: false, duration, error: errorMessage };
    }
  }

  /**
   * Get comprehensive database metrics
   */
  getMetrics() {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    const recentMetrics = this.queryMetrics.filter(m => m.timestamp > hourAgo);
    const slowQueries = recentMetrics
      .filter(m => m.duration > DB_MONITORING_CONFIG.SLOW_QUERY_THRESHOLD)
      .slice(-DB_MONITORING_CONFIG.MAX_SLOW_QUERIES_STORED);

    const recentErrors = this.recentErrors.filter(e => e.timestamp > hourAgo);

    return {
      connection: {
        uptime: now - this.connectionStats.uptime,
        lastConnectionTest: this.connectionStats.lastConnectionTest,
        lastConnectionTime: this.connectionStats.connectionTime,
        isHealthy: this.connectionStats.lastConnectionTest > 0 && 
                  (now - this.connectionStats.lastConnectionTest) < 300000 // 5 minutes
      },
      queries: {
        total: this.connectionStats.totalQueries,
        totalRecent: recentMetrics.length,
        slowQueries: this.connectionStats.slowQueries,
        slowQueriesRecent: slowQueries.length,
        failedQueries: this.connectionStats.failedQueries,
        failedQueriesRecent: recentErrors.length,
        averageQueryTime: Math.round(this.connectionStats.averageQueryTime),
        averageRecentQueryTime: recentMetrics.length > 0 
          ? Math.round(recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length)
          : 0
      },
      slowQueries: slowQueries.map(q => ({
        query: q.query,
        duration: q.duration,
        timestamp: q.timestamp,
        success: q.success,
        error: q.error
      })),
      recentErrors,
      performance: {
        slowQueryThreshold: DB_MONITORING_CONFIG.SLOW_QUERY_THRESHOLD,
        verySlowQueryThreshold: DB_MONITORING_CONFIG.VERY_SLOW_QUERY_THRESHOLD,
        connectionTimeoutThreshold: DB_MONITORING_CONFIG.CONNECTION_TIMEOUT_THRESHOLD
      }
    };
  }

  /**
   * Get database health status
   */
  getHealthStatus() {
    const metrics = this.getMetrics();
    const now = Date.now();
    const minuteAgo = now - 60000;

    const recentFailures = this.recentErrors.filter(e => e.timestamp > minuteAgo).length;
    const recentSlowQueries = this.queryMetrics.filter(
      m => m.timestamp > minuteAgo && m.duration > DB_MONITORING_CONFIG.SLOW_QUERY_THRESHOLD
    ).length;

    const isHealthy = 
      metrics.connection.isHealthy &&
      recentFailures < DB_MONITORING_CONFIG.QUERY_ERROR_THRESHOLD &&
      recentSlowQueries < 5; // Max 5 slow queries per minute

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      connection: metrics.connection.isHealthy,
      recentFailures,
      recentSlowQueries,
      lastConnectionTest: new Date(metrics.connection.lastConnectionTest).toISOString(),
      averageQueryTime: `${metrics.queries.averageQueryTime}ms`
    };
  }

  private shouldAlert(alertType: string): boolean {
    const lastAlert = this.lastAlerts.get(alertType) || 0;
    const now = Date.now();

    if (now - lastAlert > DB_MONITORING_CONFIG.ALERT_COOLDOWN) {
      this.lastAlerts.set(alertType, now);
      return true;
    }
    return false;
  }

  private sanitizeParams(params: unknown): unknown {
    if (!params) return undefined;
    
    try {
      const serialized = JSON.stringify(params);
      // Truncate very long parameter strings
      return serialized.length > 500 ? serialized.substring(0, 500) + '...' : JSON.parse(serialized);
    } catch {
      return '[unable to serialize parameters]';
    }
  }

  /**
   * Initialize database monitoring
   */
  initialize() {
    logger.info('[DB-MONITOR] Initializing database performance monitoring', {
      config: DB_MONITORING_CONFIG
    });

    // Start periodic connection health checks
    setInterval(async () => {
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(env.DATABASE_URL || env.FALLBACK_DATABASE_URL);
        await this.testConnection(sql);
      } catch (error) {
        logger.error('[DB-MONITOR] Periodic connection test failed', { error });
      }
    }, 60000); // Test every minute

    logger.info('[DB-MONITOR] Database monitoring initialized');
  }
}

// Export singleton instance
export const databaseMonitor = new DatabaseMonitor();

/**
 * Wrapper function to monitor database queries
 */
export const monitorQuery = async <T>(
  queryName: string,
  queryFn: () => Promise<T>,
  params?: any
): Promise<T> => {
  return databaseMonitor.monitorQuery(queryName, queryFn, params);
};

/**
 * Get database monitoring metrics
 */
export const getDatabaseMetrics = () => databaseMonitor.getMetrics();

/**
 * Get database health status
 */
export const getDatabaseHealth = () => databaseMonitor.getHealthStatus();

/**
 * Test database connection
 */
export const testDatabaseConnection = async (sql: any) => databaseMonitor.testConnection(sql);

export default databaseMonitor;
