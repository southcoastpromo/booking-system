/**
 * Shared Error Types and Classification
 * Single source of truth for error handling across client and server
 */

// Error Categories - Shared classification
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION', 
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL_SERVER = 'INTERNAL_SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Base error interface
export interface BaseError {
  category: ErrorCategory;
  message: string;
  userMessage: string;
  code?: string;
  statusCode?: number;
  severity: ErrorSeverity;
  isRetryable: boolean;
  shouldReload: boolean;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

// Validation error details
export interface ValidationError extends BaseError {
  category: ErrorCategory.VALIDATION;
  field?: string;
  value?: unknown;
  constraint?: string;
  validationErrors?: ValidationFieldError[];
}

export interface ValidationFieldError {
  field: string;
  message: string;
  value?: unknown;
  constraint?: string;
}

// Authentication/Authorization error details
export interface AuthError extends BaseError {
  category: ErrorCategory.AUTHENTICATION | ErrorCategory.AUTHORIZATION;
  userId?: string;
  permission?: string;
  resource?: string;
}

// Business logic error details
export interface BusinessLogicError extends BaseError {
  category: ErrorCategory.BUSINESS_LOGIC;
  businessRule: string;
  context?: Record<string, unknown>;
}

// Network error details  
export interface NetworkError extends BaseError {
  category: ErrorCategory.NETWORK;
  url?: string;
  method?: string;
  timeout?: boolean;
  connectionIssue?: boolean;
}

// Database error details
export interface DatabaseError extends BaseError {
  category: ErrorCategory.DATABASE;
  query?: string;
  table?: string;
  operation?: 'select' | 'insert' | 'update' | 'delete';
  constraint?: string;
}

// External service error details
export interface ExternalServiceError extends BaseError {
  category: ErrorCategory.EXTERNAL_SERVICE;
  service: string;
  endpoint?: string;
  serviceStatusCode?: number;
  serviceMessage?: string;
}

// Union of all error types
export type ClassifiedError = 
  | ValidationError
  | AuthError  
  | BusinessLogicError
  | NetworkError
  | DatabaseError
  | ExternalServiceError
  | BaseError;

// Error classification configuration
export interface ErrorClassificationConfig {
  defaultSeverity: ErrorSeverity;
  retryableCategories: ErrorCategory[];
  reloadCategories: ErrorCategory[];
  sensitiveFields: string[];
}

// Error reporting interface
export interface ErrorReporter {
  reportError(error: ClassifiedError): void | Promise<void>;
  reportBatch(errors: ClassifiedError[]): void | Promise<void>;
}

// Error transformation utilities
export interface ErrorTransformer {
  transformForUser(error: ClassifiedError): { message: string; code?: string };
  transformForLogging(error: ClassifiedError): Record<string, unknown>;
  transformForMonitoring(error: ClassifiedError): Record<string, unknown>;
}

// Default error classification configuration
export const DEFAULT_ERROR_CONFIG: ErrorClassificationConfig = {
  defaultSeverity: ErrorSeverity.MEDIUM,
  retryableCategories: [
    ErrorCategory.NETWORK,
    ErrorCategory.EXTERNAL_SERVICE,
    ErrorCategory.RATE_LIMIT,
    ErrorCategory.INTERNAL_SERVER
  ],
  reloadCategories: [
    ErrorCategory.AUTHENTICATION,
    ErrorCategory.INTERNAL_SERVER
  ],
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'key',
    'credential',
    'authorization'
  ]
};

// HTTP status code to error category mapping
export const HTTP_STATUS_TO_CATEGORY = {
  400: ErrorCategory.VALIDATION,
  401: ErrorCategory.AUTHENTICATION,
  403: ErrorCategory.AUTHORIZATION,
  404: ErrorCategory.NOT_FOUND,
  409: ErrorCategory.BUSINESS_LOGIC,
  422: ErrorCategory.BUSINESS_LOGIC,
  429: ErrorCategory.RATE_LIMIT,
  500: ErrorCategory.INTERNAL_SERVER,
  502: ErrorCategory.EXTERNAL_SERVICE,
  503: ErrorCategory.EXTERNAL_SERVICE,
  504: ErrorCategory.NETWORK,
} as const;

// Error message templates
export const ERROR_MESSAGES = {
  [ErrorCategory.VALIDATION]: 'Please check your input and correct any errors.',
  [ErrorCategory.AUTHENTICATION]: 'Please log in to continue.',
  [ErrorCategory.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
  [ErrorCategory.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCategory.BUSINESS_LOGIC]: 'This action cannot be completed due to business rules.',
  [ErrorCategory.DATABASE]: 'A data storage error occurred. Please try again.',
  [ErrorCategory.NETWORK]: 'Connection problem. Please check your internet connection and try again.',
  [ErrorCategory.EXTERNAL_SERVICE]: 'An external service is temporarily unavailable. Please try again later.',
  [ErrorCategory.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
  [ErrorCategory.INTERNAL_SERVER]: 'Something went wrong on our end. Please try again later.',
  [ErrorCategory.CLIENT]: 'There was a problem with your request. Please try again.',
  [ErrorCategory.UNKNOWN]: 'An unexpected error occurred. Please try again.',
} as const;

// Specific error scenarios
export const SPECIFIC_ERROR_MESSAGES = {
  FORM_SUBMISSION_FAILED: 'Unable to submit form. Please check your input and try again.',
  DATA_LOAD_FAILED: 'Unable to load data. Please refresh the page.',
  FILE_UPLOAD_FAILED: 'File upload failed. Please check the file and try again.',
  PAYMENT_FAILED: 'Payment could not be processed. Please check your payment details.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  CONNECTION_TIMEOUT: 'Request timed out. Please check your connection and try again.',
  SERVER_UNAVAILABLE: 'Service is temporarily unavailable. Please try again in a few minutes.',
  CSRF_TOKEN_FAILED: 'Failed to obtain security token.',
  CSRF_TOKEN_EXPIRED: 'Security token expired. Please try again.',
  INVALID_JSON: 'Invalid data format.',
  MALFORMED_JSON: 'Request contains malformed data.',
  API_ENDPOINT_NOT_FOUND: 'API endpoint not found.',
} as const;
