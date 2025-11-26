import { appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
  requestId?: string;
  userId?: string;
}

class Logger {
  private logDir = 'logs';
  private isDevelopment = process.env.NODE_ENV === 'development';

  constructor() {
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory() {
    if (!existsSync(this.logDir)) {
      try {
        await mkdir(this.logDir, { recursive: true });
      } catch (error) {
        console.error('Failed to create logs directory:', error);
      }
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, stack, requestId, userId } = entry;

    let logLine = `[${timestamp}] ${level}: ${message}`;

    if (requestId) logLine += ` [req:${requestId}]`;
    if (userId) logLine += ` [user:${userId}]`;
    if (context) logLine += ` ${JSON.stringify(context)}`;
    if (stack) logLine += `\n${stack}`;

    return logLine + '\n';
  }

  private async writeToFile(filename: string, content: string) {
    try {
      const filePath = path.join(this.logDir, filename);
      await appendFile(filePath, content);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private getLogFilename(level: LogLevel): string {
    const date = new Date().toISOString().split('T')[0];
    return `${level.toLowerCase()}-${date}.log`;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack: error?.stack,
      requestId: context?.requestId as string,
      userId: context?.userId as string
    };
  }

  async log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ) {
    const entry = this.createLogEntry(level, message, context, error);
    const formattedEntry = this.formatLogEntry(entry);

    // Always log to console in development with proper emoji indicators
    if (this.isDevelopment) {
      if (level === LogLevel.ERROR) {
        console.error(`🔴 ${formattedEntry.trim()}`);
      } else if (level === LogLevel.WARN) {
        console.warn(`🟡 ${formattedEntry.trim()}`);  
      } else if (level === LogLevel.INFO) {
        console.info(`🔵 ${formattedEntry.trim()}`);
      } else {
        console.debug(`⚫ ${formattedEntry.trim()}`);
      }
    }

    // Write to file in production
    if (!this.isDevelopment) {
      await this.writeToFile(this.getLogFilename(level), formattedEntry);

      // Also write errors to a combined log
      if (level === LogLevel.ERROR) {
        await this.writeToFile('combined.log', formattedEntry);
      }
    }
  }

  async error(message: string, context?: Record<string, unknown>, error?: Error) {
    await this.log(LogLevel.ERROR, message, context, error);
  }

  async warn(message: string, context?: Record<string, unknown>) {
    await this.log(LogLevel.WARN, message, context);
  }

  async info(message: string, context?: Record<string, unknown>) {
    await this.log(LogLevel.INFO, message, context);
  }

  async debug(message: string, context?: Record<string, unknown>) {
    if (this.isDevelopment) {
      await this.log(LogLevel.DEBUG, message, context);
    }
  }

  // Structured logging for specific events
  async logBookingEvent(
    event: 'created' | 'payment_updated' | 'contract_signed' | 'failed',
    bookingId: number,
    context?: Record<string, unknown>
  ) {
    await this.info(`Booking ${event}`, {
      bookingId,
      event,
      ...context
    });
  }

  async logApiRequest(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    context?: Record<string, unknown>
  ) {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    await this.log(level, `${method} ${path} - ${statusCode} (${responseTime}ms)`, {
      method,
      path,
      statusCode,
      responseTime,
      ...context
    });
  }

  async logDatabaseError(operation: string, error: Error, context?: Record<string, unknown>) {
    await this.error(`Database ${operation} failed`, {
      operation,
      ...context
    }, error);
  }
}

export const logger = new Logger();
