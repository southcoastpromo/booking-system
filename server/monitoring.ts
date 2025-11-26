import { logger } from './logger';

interface MonitoringMetrics {
  requests: {
    total: number;
    failed: number;
    by_endpoint: Record<string, { total: number; failed: number; avg_response_time: number }>;
  };
  bookings: {
    total: number;
    failed: number;
    payment_failures: number;
    contract_failures: number;
  };
  database: {
    connection_errors: number;
    query_failures: number;
    last_health_check: string;
  };
  system: {
    uptime_start: string;
    memory_usage: NodeJS.MemoryUsage;
    cpu_usage?: number;
  };
}

class MonitoringService {
  private metrics: MonitoringMetrics;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        failed: 0,
        by_endpoint: {}
      },
      bookings: {
        total: 0,
        failed: 0,
        payment_failures: 0,
        contract_failures: 0
      },
      database: {
        connection_errors: 0,
        query_failures: 0,
        last_health_check: new Date().toISOString()
      },
      system: {
        uptime_start: new Date().toISOString(),
        memory_usage: process.memoryUsage()
      }
    };

    this.startHealthChecks();
  }

  private startHealthChecks() {
    // Run health checks every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 5 * 60 * 1000);
  }

  private async performHealthCheck() {
    try {
      this.metrics.system.memory_usage = process.memoryUsage();
      this.metrics.database.last_health_check = new Date().toISOString();

      // Log critical metrics
      const memUsageMB = Math.round(this.metrics.system.memory_usage.heapUsed / 1024 / 1024);
      await logger.info('Health check completed', {
        memory_usage_mb: memUsageMB,
        uptime_minutes: Math.round(process.uptime() / 60),
        total_requests: this.metrics.requests.total,
        failed_requests: this.metrics.requests.failed,
        total_bookings: this.metrics.bookings.total,
        failed_bookings: this.metrics.bookings.failed
      });

      // Alert on high failure rates
      if (this.metrics.requests.total > 100) {
        const failureRate = (this.metrics.requests.failed / this.metrics.requests.total) * 100;
        if (failureRate > 10) {
          await logger.warn('High request failure rate detected', {
            failure_rate_percent: Math.round(failureRate * 100) / 100,
            total_requests: this.metrics.requests.total,
            failed_requests: this.metrics.requests.failed
          });
        }
      }

      // Alert on high memory usage (>500MB)
      if (memUsageMB > 500) {
        await logger.warn('High memory usage detected', {
          memory_usage_mb: memUsageMB,
          heap_total_mb: Math.round(this.metrics.system.memory_usage.heapTotal / 1024 / 1024)
        });
      }

    } catch (error) {
      await logger.error('Health check failed', {}, error as Error);
    }
  }

  // Request monitoring methods
  trackRequest(method: string, path: string, statusCode: number, responseTime: number) {
    this.metrics.requests.total++;

    if (statusCode >= 400) {
      this.metrics.requests.failed++;
    }

    const endpoint = `${method} ${path}`;
    if (!this.metrics.requests.by_endpoint[endpoint]) {
      this.metrics.requests.by_endpoint[endpoint] = {
        total: 0,
        failed: 0,
        avg_response_time: 0
      };
    }

    const endpointMetrics = this.metrics.requests.by_endpoint[endpoint];
    endpointMetrics.total++;

    if (statusCode >= 400) {
      endpointMetrics.failed++;
    }

    // Update average response time
    endpointMetrics.avg_response_time =
      (endpointMetrics.avg_response_time * (endpointMetrics.total - 1) + responseTime) / endpointMetrics.total;

    // Log slow requests (>2 seconds)
    if (responseTime > 2000) {
      logger.warn('Slow request detected', {
        endpoint,
        response_time_ms: responseTime,
        status_code: statusCode
      });
    }

    // Log failed requests
    if (statusCode >= 400) {
      logger.error('Request failed', {
        endpoint,
        status_code: statusCode,
        response_time_ms: responseTime
      });
    }
  }

  // Booking monitoring methods
  trackBookingCreated(bookingId: number, campaignId: number) {
    this.metrics.bookings.total++;
    logger.logBookingEvent('created', bookingId, { campaignId });
  }

  trackBookingFailure(reason: string, context?: Record<string, unknown>) {
    this.metrics.bookings.failed++;
    logger.error('Booking creation failed', {
      reason,
      ...context
    });
  }

  trackPaymentFailure(bookingId: number, reason: string, context?: Record<string, unknown>) {
    this.metrics.bookings.payment_failures++;
    logger.error('Payment processing failed', {
      booking_id: bookingId,
      reason,
      ...context
    });
  }

  trackContractFailure(bookingId: number, reason: string, context?: Record<string, unknown>) {
    this.metrics.bookings.contract_failures++;
    logger.error('Contract signing failed', {
      booking_id: bookingId,
      reason,
      ...context
    });
  }

  // Database monitoring methods
  trackDatabaseError(operation: string, error: Error, context?: Record<string, unknown>) {
    this.metrics.database.query_failures++;
    logger.logDatabaseError(operation, error, context);
  }

  trackConnectionError(error: Error) {
    this.metrics.database.connection_errors++;
    logger.error('Database connection failed', {}, error);
  }

  // Get current metrics
  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  // Track unhandled errors
  trackUnhandledError(path: string, errorMessage: string) {
    logger.error('Unhandled error occurred', {
      path,
      error_message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }

  // Get health status
  getHealthStatus() {
    const uptime = Math.round(process.uptime());
    const memUsage = process.memoryUsage();
    const requestFailureRate = this.metrics.requests.total > 0 ?
      (this.metrics.requests.failed / this.metrics.requests.total) * 100 : 0;

    return {
      status: 'healthy',
      uptime_seconds: uptime,
      memory: {
        heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
        external_mb: Math.round(memUsage.external / 1024 / 1024)
      },
      requests: {
        total: this.metrics.requests.total,
        failed: this.metrics.requests.failed,
        failure_rate_percent: Math.round(requestFailureRate * 100) / 100
      },
      bookings: {
        total: this.metrics.bookings.total,
        failed: this.metrics.bookings.failed,
        payment_failures: this.metrics.bookings.payment_failures,
        contract_failures: this.metrics.bookings.contract_failures
      },
      database: {
        connection_errors: this.metrics.database.connection_errors,
        query_failures: this.metrics.database.query_failures,
        last_health_check: this.metrics.database.last_health_check
      }
    };
  }

  // Cleanup method
  shutdown() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    logger.info('Monitoring service shut down');
  }
}

export const monitoring = new MonitoringService();
