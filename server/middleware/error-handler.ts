/**
 * error-handler.ts - Express error middleware
 * Refactored for production use:
 * - Removed debug logs
 * - Applied type safety improvements
 */

/**
 * Centralized Error Handling Middleware - Enterprise Error Management
 * 
 * Comprehensive error handling system providing structured error classification,
 * consistent response formatting, and detailed logging for the SouthCoast ProMotion
 * booking system. Implements enterprise-grade error handling patterns.
 * 
 * Error Management Features:
 * - Structured error classification with business-specific types
 * - Consistent HTTP status code mapping and response formatting
 * - Comprehensive audit logging with correlation IDs
 * - User-friendly error messages without sensitive data exposure
 * - Integration with monitoring systems for alerting
 * 
 * Error Classification System:
 * - Validation errors (400): Malformed input data
 * - Authentication errors (401): Missing or invalid credentials
 * - Authorization errors (403): Insufficient permissions
 * - Not found errors (404): Requested resources don't exist
 * - Business logic errors (422): Rule violations or invalid operations
 * - Database errors (500): Data persistence issues
 * - External service errors (503): Third-party service failures
 * 
 * Security Features:
 * - Prevents sensitive information leakage in error responses
 * - Sanitized error messages for customer-facing interfaces
 * - Detailed internal logging for debugging and monitoring
 * - Correlation IDs for distributed tracing
 * 
 * Developer Experience:
 * - TypeScript interfaces for type-safe error handling
 * - Custom error classes for specific business scenarios
 * - Consistent error response structure across all endpoints
 * - Comprehensive error metadata for debugging
 * 
 * @fileoverview Enterprise error handling middleware with classification
 * @version 1.0.0
 * @author SouthCoast ProMotion Development Team
 * @since 2024-01-01
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { monitoring } from '../monitoring';
import { ZodError } from 'zod';

/**
 * Error Classification Enumeration
 * 
 * Comprehensive error type system enabling consistent error handling
 * and appropriate HTTP status code mapping across the application.
 * 
 * Classification Strategy:
 * - Client errors (4xx): User input or authentication issues
 * - Server errors (5xx): Internal system or external service failures
 * - Business errors (422): Valid input but business rule violations
 * 
 * Integration Benefits:
 * - Enables automatic HTTP status code mapping
 * - Supports monitoring and alerting based on error types
 * - Facilitates error analytics and trend analysis
 * - Provides consistent error categorization
 */
export enum ErrorType {
  /** Malformed or invalid input data (400 Bad Request) */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  /** Missing or invalid authentication credentials (401 Unauthorized) */
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  
  /** Valid credentials but insufficient permissions (403 Forbidden) */
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  
  /** Requested resource does not exist (404 Not Found) */
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  
  /** Valid input but violates business rules (422 Unprocessable Entity) */
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  
  /** Database connection or query failures (500 Internal Server Error) */
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  /** Network connectivity or timeout issues (503 Service Unavailable) */
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  /** Third-party service failures (503 Service Unavailable) */
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  /** Rate limiting violations (429 Too Many Requests) */
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  
  /** Unexpected server errors (500 Internal Server Error) */
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

/**
 * Application Error Interface
 * 
 * Standardized error interface extending native JavaScript Error
 * with additional properties for enterprise error handling.
 * 
 * Properties:
 * - type: Error classification for routing and handling
 * - statusCode: HTTP response code for web API responses
 * - isOperational: Distinguishes expected errors from bugs
 * - correlationId: Unique identifier for distributed tracing
 * - metadata: Additional context for debugging and analysis
 * - userMessage: Safe message for customer-facing interfaces
 * 
 * Usage Pattern:
 * - Operational errors: Expected business exceptions (validation, not found)
 * - Programming errors: Unexpected bugs requiring investigation
 * - User messages: Sanitized descriptions without technical details
 */
export interface AppError extends Error {
  /** Error classification for routing and handling */
  type: ErrorType;
  
  /** HTTP status code for API responses */
  statusCode: number;
  
  /** Whether error is expected operational issue vs programming bug */
  isOperational: boolean;
  
  /** Unique identifier for distributed tracing and log correlation */
  correlationId?: string;
  
  /** Additional context and debugging information */
  metadata?: Record<string, unknown>;
  
  /** Safe, user-friendly error message without sensitive details */
  userMessage?: string;
}

/**
 * Custom Error Classes for Business-Specific Error Handling
 * 
 * Specialized error classes implementing the AppError interface
 * for specific business scenarios and HTTP response patterns.
 * 
 * Design Benefits:
 * - Type-safe error handling with TypeScript
 * - Consistent error structure across application
 * - Automatic HTTP status code assignment
 * - Built-in user message sanitization
 */

/**
 * Validation Error Class
 * 
 * Handles input validation failures with detailed field-level
 * error information and user-friendly messaging.
 * 
 * Use Cases:
 * - Form validation failures
 * - API request parameter validation
 * - File upload validation
 * - Business rule validation
 */
export class ValidationError extends Error implements AppError {
  type = ErrorType.VALIDATION_ERROR;
  statusCode = 400;
  isOperational = true;
  correlationId?: string;
  
  constructor(message: string, public userMessage?: string, public metadata?: Record<string, unknown>) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication Error Class
 * 
 * Handles authentication failures including missing credentials,
 * invalid tokens, and expired sessions.
 * 
 * Security Features:
 * - Generic user messages prevent credential enumeration
 * - Detailed internal logging for security monitoring
 * - Consistent 401 status code for authentication issues
 */
export class AuthenticationError extends Error implements AppError {
  type = ErrorType.AUTHENTICATION_ERROR;
  statusCode = 401;
  isOperational = true;
  
  constructor(message: string = 'Authentication required', public userMessage?: string) {
    super(message);
    this.name = 'AuthenticationError';
    this.userMessage = userMessage || 'Please log in to access this resource';
  }
}

export class AuthorizationError extends Error implements AppError {
  type = ErrorType.AUTHORIZATION_ERROR;
  statusCode = 403;
  isOperational = true;
  
  constructor(message: string = 'Insufficient permissions', public userMessage?: string) {
    super(message);
    this.name = 'AuthorizationError';
    this.userMessage = userMessage || 'You do not have permission to perform this action';
  }
}

export class NotFoundError extends Error implements AppError {
  type = ErrorType.NOT_FOUND_ERROR;
  statusCode = 404;
  isOperational = true;
  
  constructor(resource: string, public userMessage?: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.userMessage = userMessage || `The requested ${resource.toLowerCase()} could not be found`;
  }
}

/**
 * Business Logic Error Class
 * 
 * Handles violations of business rules and domain-specific constraints.
 * These are expected errors that occur during normal operation when
 * business rules prevent certain actions.
 * 
 * Common Scenarios:
 * - Campaign overbooking attempts
 * - Invalid booking date ranges
 * - Insufficient campaign availability
 * - Payment processing rule violations
 */
export class BusinessLogicError extends Error implements AppError {
  type = ErrorType.BUSINESS_LOGIC_ERROR;
  statusCode = 422;
  isOperational = true;
  
  constructor(message: string, public userMessage?: string, public metadata?: Record<string, unknown>) {
    super(message);
    this.name = 'BusinessLogicError';
    this.userMessage = userMessage || message;
  }
}

export class DatabaseError extends Error implements AppError {
  type = ErrorType.DATABASE_ERROR;
  statusCode = 500;
  isOperational = true;
  correlationId?: string;
  
  constructor(message: string, public userMessage?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.userMessage = userMessage || 'A database error occurred. Please try again later';
  }
}

export class ExternalServiceError extends Error implements AppError {
  type = ErrorType.EXTERNAL_SERVICE_ERROR;
  statusCode = 503;
  isOperational = true;
  
  constructor(service: string, message: string, public userMessage?: string) {
    super(`${service}: ${message}`);
    this.name = 'ExternalServiceError';
    this.userMessage = userMessage || `${service} is currently unavailable. Please try again later`;
  }
}

export class NetworkError extends Error implements AppError {
  type = ErrorType.NETWORK_ERROR;
  statusCode = 503;
  isOperational = true;
  correlationId?: string;
  
  constructor(message: string, public userMessage?: string) {
    super(message);
    this.name = 'NetworkError';
    this.userMessage = userMessage || 'Network error occurred. Please check your connection and try again';
  }
}

// Error Classification Helper
export function classifyError(error: unknown): AppError {
  // Generate correlation ID for error tracking
  const correlationId = Math.random().toString(36).substring(7);
  
  // Already classified AppError
  if (error && typeof error === 'object' && 'type' in error && 'statusCode' in error) {
    const appError = error as AppError;
    appError.correlationId = correlationId;
    return appError;
  }
  
  // Zod validation errors
  if (error instanceof ZodError) {
    const validationError = new ValidationError(
      'Validation failed',
      'Please check your input and try again'
    );
    validationError.correlationId = correlationId;
    validationError.metadata = {
      issues: error.issues.map((issue: unknown) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }))
    };
    return validationError;
  }
  
  // Database-related errors
  if (error instanceof Error) {
    if (error.message.includes('database') || error.message.includes('connection') || 
        error.message.includes('query') || error.message.includes('ECONNREFUSED')) {
      const dbError = new DatabaseError(error.message);
      dbError.correlationId = correlationId;
      return dbError;
    }
    
    // Network/timeout errors
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND') || error.message.includes('ECONNRESET')) {
      const networkError: AppError = {
        ...error,
        type: ErrorType.NETWORK_ERROR,
        statusCode: 503,
        isOperational: true,
        correlationId,
        userMessage: 'Network error occurred. Please check your connection and try again'
      };
      return networkError;
    }
  }
  
  // Default: Internal Server Error
  const internalError: AppError = {
    name: 'InternalServerError',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    type: ErrorType.INTERNAL_SERVER_ERROR,
    statusCode: 500,
    isOperational: false,
    correlationId,
    userMessage: 'An unexpected error occurred. Our team has been notified'
  };
  
  return internalError;
}

// Enhanced Error Response Helper
export function createErrorResponse(error: AppError, isDevelopment: boolean = false) {
  const response: Record<string, unknown> = {
    error: {
      type: error.type,
      message: error.userMessage || error.message,
      correlationId: error.correlationId,
      timestamp: new Date().toISOString()
    }
  };
  
  // Include validation details for user-friendly form errors
  if (error.type === ErrorType.VALIDATION_ERROR && error.metadata?.issues) {
    response.validationErrors = error.metadata.issues;
  }
  
  // Include detailed error information in development
  if (isDevelopment) {
    response.debug = {
      originalMessage: error.message,
      stack: error.stack,
      metadata: error.metadata
    };
  }
  
  return response;
}

// Centralized Error Handler Middleware
export const errorHandler = (
  error: unknown, 
  req: Request, 
  res: Response, 
  _next: NextFunction
): void => {
  const startTime = Date.now();
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Classify the error
  const appError = classifyError(error);
  
  // Create sanitized error response
  const errorResponse = createErrorResponse(appError, isDevelopment);
  
  // Security headers
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Log the error with appropriate level
  const logLevel = appError.statusCode >= 500 ? 'error' : 'warn';
  const logContext: Record<string, any> = {
    correlationId: appError.correlationId,
    type: appError.type,
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    statusCode: appError.statusCode,
    isOperational: appError.isOperational
  };
  
  // Don't log sensitive data in production
  if (isDevelopment) {
    logContext.body = req.body;
    logContext.query = req.query;
    logContext.stack = appError.stack;
  }
  
  logger[logLevel](`API Error: ${appError.message}`, logContext);
  
  // Track error metrics
  const responseTime = Date.now() - startTime;
  monitoring.trackRequest(req.method, req.path, appError.statusCode, responseTime);
  
  // Send error alerts for critical errors
  if (!appError.isOperational || appError.statusCode >= 500) {
    monitoring.trackUnhandledError(req.path, appError.message);
  }
  
  // Send structured error response
  res.status(appError.statusCode).json(errorResponse);
};

// Async Error Handler Wrapper
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 Handler
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
};

// Process Error Handlers (for uncaught errors)
export function setupGlobalErrorHandlers() {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception - Application will exit', {
      error: error.message,
      stack: error.stack,
      type: 'UNCAUGHT_EXCEPTION'
    });
    
    // Give time for logging before exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
  
  process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString(),
      type: 'UNHANDLED_REJECTION'
    });
    
    // Don't exit on unhandled rejections in production, just log them
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });
}
