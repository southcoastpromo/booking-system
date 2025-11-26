/**
 * Explicit Error Enums for Type-Safe Error Handling
 * 
 * Comprehensive error definitions for all service layer operations.
 * Provides explicit, typed errors that enable compile-time safety
 * and predictable error handling patterns.
 * 
 * Error Categories:
 * - AuthError: Authentication and authorization failures
 * - CampaignError: Campaign management and data issues
 * - BookingError: Booking workflow and validation failures
 * - SystemError: Infrastructure and external service issues
 * - ValidationError: Data validation and format issues
 * 
 * Design Principles:
 * - Every error case has explicit enum value
 * - Error messages are user-friendly and actionable
 * - Errors include sufficient context for debugging
 * - Error types enable different handling strategies
 * - Errors are recoverable where business logic allows
 * 
 * @fileoverview Explicit error enums for enterprise error handling
 * @version 1.0.0
 * @author SouthCoast ProMotion Development Team
 * @since 2024-01-01
 */

/**
 * Authentication Service Errors
 * 
 * Covers all authentication and authorization failure modes
 * including user management, session handling, and security validation.
 */
export enum AuthError {
  // Credential Management
  InvalidCredentials = "AUTH_INVALID_CREDENTIALS",
  WeakPassword = "AUTH_WEAK_PASSWORD", 
  PasswordHashingFailed = "AUTH_PASSWORD_HASHING_FAILED",
  PasswordComparisonFailed = "AUTH_PASSWORD_COMPARISON_FAILED",
  
  // User Management
  UserNotFound = "AUTH_USER_NOT_FOUND",
  UserAlreadyExists = "AUTH_USER_ALREADY_EXISTS",
  UserCreationFailed = "AUTH_USER_CREATION_FAILED",
  UserUpdateFailed = "AUTH_USER_UPDATE_FAILED",
  
  // Session Management
  SessionExpired = "AUTH_SESSION_EXPIRED",
  SessionInvalid = "AUTH_SESSION_INVALID",
  SessionCreationFailed = "AUTH_SESSION_CREATION_FAILED",
  SessionDestroyFailed = "AUTH_SESSION_DESTROY_FAILED",
  
  // Security Validation
  CsrfTokenInvalid = "AUTH_CSRF_TOKEN_INVALID",
  CsrfTokenMissing = "AUTH_CSRF_TOKEN_MISSING",
  TokenGenerationFailed = "AUTH_TOKEN_GENERATION_FAILED",
  
  // Authorization
  InsufficientPermissions = "AUTH_INSUFFICIENT_PERMISSIONS",
  RoleValidationFailed = "AUTH_ROLE_VALIDATION_FAILED",
  AdminAccessRequired = "AUTH_ADMIN_ACCESS_REQUIRED",
  CustomerAccessRequired = "AUTH_CUSTOMER_ACCESS_REQUIRED",
  
  // Rate Limiting (supplementary to middleware)
  RateLimitExceeded = "AUTH_RATE_LIMIT_EXCEEDED",
  LoginAttemptsExceeded = "AUTH_LOGIN_ATTEMPTS_EXCEEDED"
}

/**
 * Campaign Service Errors
 * 
 * Covers all campaign management operations including data ingestion,
 * availability management, filtering, and campaign lifecycle operations.
 */
export enum CampaignError {
  // Campaign Retrieval
  CampaignNotFound = "CAMPAIGN_NOT_FOUND",
  InvalidCampaignId = "CAMPAIGN_INVALID_ID",
  CampaignQueryFailed = "CAMPAIGN_QUERY_FAILED",
  
  // Data Ingestion
  DataIngestionFailed = "CAMPAIGN_DATA_INGESTION_FAILED",
  CsvParsingFailed = "CAMPAIGN_CSV_PARSING_FAILED",
  CsvValidationFailed = "CAMPAIGN_CSV_VALIDATION_FAILED",
  CsvFileNotFound = "CAMPAIGN_CSV_FILE_NOT_FOUND",
  CsvFormatInvalid = "CAMPAIGN_CSV_FORMAT_INVALID",
  
  // Availability Management  
  AvailabilityUpdateFailed = "CAMPAIGN_AVAILABILITY_UPDATE_FAILED",
  AvailabilityCalculationFailed = "CAMPAIGN_AVAILABILITY_CALCULATION_FAILED",
  InsufficientSlots = "CAMPAIGN_INSUFFICIENT_SLOTS",
  SlotAllocationFailed = "CAMPAIGN_SLOT_ALLOCATION_FAILED",
  
  // Filtering and Search
  InvalidDateRange = "CAMPAIGN_INVALID_DATE_RANGE",
  InvalidLocationFilter = "CAMPAIGN_INVALID_LOCATION_FILTER",
  InvalidAvailabilityFilter = "CAMPAIGN_INVALID_AVAILABILITY_FILTER",
  FilterProcessingFailed = "CAMPAIGN_FILTER_PROCESSING_FAILED",
  
  // Campaign Management
  CampaignCreationFailed = "CAMPAIGN_CREATION_FAILED",
  CampaignUpdateFailed = "CAMPAIGN_UPDATE_FAILED",
  CampaignDeletionFailed = "CAMPAIGN_DELETION_FAILED",
  CampaignInitializationFailed = "CAMPAIGN_INITIALIZATION_FAILED",
  
  // Data Validation
  InvalidCampaignData = "CAMPAIGN_INVALID_DATA",
  InvalidPricing = "CAMPAIGN_INVALID_PRICING",
  InvalidDateFormat = "CAMPAIGN_INVALID_DATE_FORMAT",
  InvalidTimeFormat = "CAMPAIGN_INVALID_TIME_FORMAT",
  
  // Performance and Caching
  CacheUpdateFailed = "CAMPAIGN_CACHE_UPDATE_FAILED",
  QueryOptimizationFailed = "CAMPAIGN_QUERY_OPTIMIZATION_FAILED",
  MetricsCalculationFailed = "CAMPAIGN_METRICS_CALCULATION_FAILED"
}

/**
 * Booking Service Errors
 * 
 * Covers all booking workflow operations including validation,
 * pricing, payment processing, and contract management.
 */
export enum BookingError {
  // Input Validation
  ValidationFailed = "BOOKING_VALIDATION_FAILED",
  InvalidCustomerName = "BOOKING_INVALID_CUSTOMER_NAME",
  InvalidCustomerEmail = "BOOKING_INVALID_CUSTOMER_EMAIL", 
  InvalidCustomerPhone = "BOOKING_INVALID_CUSTOMER_PHONE",
  InvalidSlotsRequired = "BOOKING_INVALID_SLOTS_REQUIRED",
  InvalidCampaignReference = "BOOKING_INVALID_CAMPAIGN_REFERENCE",
  
  // Availability Checking
  InsufficientAvailability = "BOOKING_INSUFFICIENT_AVAILABILITY",
  CampaignNotAvailable = "BOOKING_CAMPAIGN_NOT_AVAILABLE",
  SlotsNotAvailable = "BOOKING_SLOTS_NOT_AVAILABLE",
  AvailabilityCheckFailed = "BOOKING_AVAILABILITY_CHECK_FAILED",
  
  // Booking Management
  BookingCreationFailed = "BOOKING_CREATION_FAILED",
  BookingUpdateFailed = "BOOKING_UPDATE_FAILED", 
  BookingNotFound = "BOOKING_NOT_FOUND",
  BookingRetrievalFailed = "BOOKING_RETRIEVAL_FAILED",
  DuplicateBookingDetected = "BOOKING_DUPLICATE_DETECTED",
  
  // Pricing and Financial
  PricingCalculationFailed = "BOOKING_PRICING_CALCULATION_FAILED",
  DiscountCalculationFailed = "BOOKING_DISCOUNT_CALCULATION_FAILED",
  VatCalculationFailed = "BOOKING_VAT_CALCULATION_FAILED",
  TotalCalculationFailed = "BOOKING_TOTAL_CALCULATION_FAILED",
  
  // Payment Processing
  PaymentProcessingFailed = "BOOKING_PAYMENT_PROCESSING_FAILED",
  PaymentValidationFailed = "BOOKING_PAYMENT_VALIDATION_FAILED",
  PaymentGatewayError = "BOOKING_PAYMENT_GATEWAY_ERROR",
  PaymentTimeout = "BOOKING_PAYMENT_TIMEOUT",
  RefundProcessingFailed = "BOOKING_REFUND_PROCESSING_FAILED",
  
  // Contract Management
  ContractCreationFailed = "BOOKING_CONTRACT_CREATION_FAILED",
  ContractSigningFailed = "BOOKING_CONTRACT_SIGNING_FAILED",
  DocusignIntegrationFailed = "BOOKING_DOCUSIGN_INTEGRATION_FAILED",
  ContractTemplateNotFound = "BOOKING_CONTRACT_TEMPLATE_NOT_FOUND",
  
  // Workflow Management
  StatusUpdateFailed = "BOOKING_STATUS_UPDATE_FAILED",
  WorkflowTransitionInvalid = "BOOKING_WORKFLOW_TRANSITION_INVALID",
  NotificationSendFailed = "BOOKING_NOTIFICATION_SEND_FAILED",
  
  // Data Sanitization
  DataSanitizationFailed = "BOOKING_DATA_SANITIZATION_FAILED",
  SecurityValidationFailed = "BOOKING_SECURITY_VALIDATION_FAILED",
  
  // Business Rules
  BusinessRuleViolation = "BOOKING_BUSINESS_RULE_VIOLATION",
  BookingLimitExceeded = "BOOKING_LIMIT_EXCEEDED",
  TimeWindowExpired = "BOOKING_TIME_WINDOW_EXPIRED"
}

/**
 * System Infrastructure Errors
 * 
 * Covers all infrastructure, external service, and system-level failures
 * that are outside normal business logic but need handling.
 */
export enum SystemError {
  // Database Operations
  DatabaseConnectionFailed = "SYSTEM_DATABASE_CONNECTION_FAILED",
  DatabaseQueryFailed = "SYSTEM_DATABASE_QUERY_FAILED",
  DatabaseTransactionFailed = "SYSTEM_DATABASE_TRANSACTION_FAILED",
  DatabaseMigrationFailed = "SYSTEM_DATABASE_MIGRATION_FAILED",
  DatabaseTimeoutError = "SYSTEM_DATABASE_TIMEOUT_ERROR",
  
  // Network and External Services
  NetworkTimeout = "SYSTEM_NETWORK_TIMEOUT",
  NetworkConnectionFailed = "SYSTEM_NETWORK_CONNECTION_FAILED",
  ExternalServiceUnavailable = "SYSTEM_EXTERNAL_SERVICE_UNAVAILABLE",
  ApiRateLimitExceeded = "SYSTEM_API_RATE_LIMIT_EXCEEDED",
  ExternalServiceError = "SYSTEM_EXTERNAL_SERVICE_ERROR",
  
  // Configuration and Environment
  ConfigurationMissing = "SYSTEM_CONFIGURATION_MISSING",
  ConfigurationInvalid = "SYSTEM_CONFIGURATION_INVALID",
  EnvironmentVariableMissing = "SYSTEM_ENVIRONMENT_VARIABLE_MISSING",
  SecretKeyMissing = "SYSTEM_SECRET_KEY_MISSING",
  
  // File System Operations
  FileNotFound = "SYSTEM_FILE_NOT_FOUND",
  FileReadError = "SYSTEM_FILE_READ_ERROR",
  FileWriteError = "SYSTEM_FILE_WRITE_ERROR",
  FilePermissionDenied = "SYSTEM_FILE_PERMISSION_DENIED",
  DirectoryCreationFailed = "SYSTEM_DIRECTORY_CREATION_FAILED",
  
  // Memory and Resources
  OutOfMemoryError = "SYSTEM_OUT_OF_MEMORY_ERROR",
  ResourceExhaustionError = "SYSTEM_RESOURCE_EXHAUSTION_ERROR",
  ProcessSpawnFailed = "SYSTEM_PROCESS_SPAWN_FAILED",
  
  // Caching System
  CacheConnectionFailed = "SYSTEM_CACHE_CONNECTION_FAILED",
  CacheOperationFailed = "SYSTEM_CACHE_OPERATION_FAILED",
  CacheInvalidationFailed = "SYSTEM_CACHE_INVALIDATION_FAILED",
  
  // Monitoring and Logging
  LoggingSystemFailed = "SYSTEM_LOGGING_SYSTEM_FAILED",
  MetricsCollectionFailed = "SYSTEM_METRICS_COLLECTION_FAILED",
  MonitoringServiceDown = "SYSTEM_MONITORING_SERVICE_DOWN",
  
  // Unknown and Unexpected
  UnexpectedError = "SYSTEM_UNEXPECTED_ERROR",
  InternalServerError = "SYSTEM_INTERNAL_SERVER_ERROR",
  ServiceUnavailable = "SYSTEM_SERVICE_UNAVAILABLE"
}

/**
 * Data Validation Errors
 * 
 * Specific validation errors for data format, structure, and business rules.
 * These can occur across multiple services and need consistent handling.
 */
export enum ValidationError {
  // Format Validation
  InvalidDateFormat = "VALIDATION_INVALID_DATE_FORMAT",
  InvalidTimeFormat = "VALIDATION_INVALID_TIME_FORMAT",
  InvalidEmailFormat = "VALIDATION_INVALID_EMAIL_FORMAT",
  InvalidPhoneFormat = "VALIDATION_INVALID_PHONE_FORMAT",
  InvalidUrlFormat = "VALIDATION_INVALID_URL_FORMAT",
  
  // Range Validation
  ValueTooSmall = "VALIDATION_VALUE_TOO_SMALL",
  ValueTooLarge = "VALIDATION_VALUE_TOO_LARGE",
  ValueOutOfRange = "VALIDATION_VALUE_OUT_OF_RANGE",
  InvalidLength = "VALIDATION_INVALID_LENGTH",
  
  // Required Field Validation
  RequiredFieldMissing = "VALIDATION_REQUIRED_FIELD_MISSING",
  EmptyValueNotAllowed = "VALIDATION_EMPTY_VALUE_NOT_ALLOWED",
  NullValueNotAllowed = "VALIDATION_NULL_VALUE_NOT_ALLOWED",
  
  // Type Validation
  InvalidDataType = "VALIDATION_INVALID_DATA_TYPE",
  InvalidEnumValue = "VALIDATION_INVALID_ENUM_VALUE",
  InvalidArrayFormat = "VALIDATION_INVALID_ARRAY_FORMAT",
  InvalidObjectStructure = "VALIDATION_INVALID_OBJECT_STRUCTURE",
  
  // Business Rule Validation
  BusinessLogicViolation = "VALIDATION_BUSINESS_LOGIC_VIOLATION",
  ConflictingValues = "VALIDATION_CONFLICTING_VALUES",
  DependencyNotMet = "VALIDATION_DEPENDENCY_NOT_MET",
  
  // Security Validation
  SecurityThreatDetected = "VALIDATION_SECURITY_THREAT_DETECTED",
  MaliciousContentDetected = "VALIDATION_MALICIOUS_CONTENT_DETECTED",
  InputSanitizationFailed = "VALIDATION_INPUT_SANITIZATION_FAILED"
}

/**
 * Error Message Mapping
 * 
 * Maps error enums to user-friendly messages and technical details.
 * Enables consistent error presentation across the application.
 */
export const ErrorMessages = {
  // Authentication Error Messages
  [AuthError.InvalidCredentials]: {
    userMessage: "Invalid email or password. Please try again.",
    technicalMessage: "Authentication failed - credentials do not match",
    httpStatus: 401,
    category: "authentication"
  },
  [AuthError.SessionExpired]: {
    userMessage: "Your session has expired. Please sign in again.",
    technicalMessage: "User session has expired and requires re-authentication", 
    httpStatus: 401,
    category: "authentication"
  },
  [AuthError.PasswordHashingFailed]: {
    userMessage: "Unable to process your request. Please try again later.",
    technicalMessage: "Password hashing operation failed",
    httpStatus: 500,
    category: "authentication"
  },
  [AuthError.AdminAccessRequired]: {
    userMessage: "You don't have permission to access this resource.",
    technicalMessage: "Admin access required but user has insufficient privileges",
    httpStatus: 403,
    category: "authorization"
  },

  // Campaign Error Messages  
  [CampaignError.CampaignNotFound]: {
    userMessage: "The requested campaign could not be found.",
    technicalMessage: "Campaign with specified ID does not exist in database",
    httpStatus: 404,
    category: "campaign"
  },
  [CampaignError.DataIngestionFailed]: {
    userMessage: "Unable to load campaign data. Please contact support.",
    technicalMessage: "Campaign data ingestion from CSV source failed",
    httpStatus: 500,
    category: "campaign"
  },
  [CampaignError.InvalidDateRange]: {
    userMessage: "Please select a valid date range for your search.",
    technicalMessage: "Date range filter contains invalid or conflicting dates",
    httpStatus: 400,
    category: "campaign"
  },

  // Booking Error Messages
  [BookingError.ValidationFailed]: {
    userMessage: "Please check your booking details and try again.",
    technicalMessage: "Booking request failed validation rules",
    httpStatus: 422,
    category: "booking"
  },
  [BookingError.InsufficientAvailability]: {
    userMessage: "Sorry, there aren't enough slots available for this campaign.",
    technicalMessage: "Requested slots exceed available campaign capacity",
    httpStatus: 409,
    category: "booking"
  },
  [BookingError.PaymentProcessingFailed]: {
    userMessage: "Payment could not be processed. Please try again or use a different payment method.",
    technicalMessage: "Payment gateway returned error during transaction processing",
    httpStatus: 402,
    category: "booking"
  },

  // System Error Messages
  [SystemError.DatabaseConnectionFailed]: {
    userMessage: "Service temporarily unavailable. Please try again shortly.",
    technicalMessage: "Database connection could not be established",
    httpStatus: 503,
    category: "system"
  },
  [SystemError.NetworkTimeout]: {
    userMessage: "Request timed out. Please try again.",
    technicalMessage: "Network operation exceeded configured timeout limit",
    httpStatus: 504,
    category: "system"
  },
  [SystemError.ConfigurationMissing]: {
    userMessage: "Service configuration error. Please contact support.",
    technicalMessage: "Required configuration parameter is missing or invalid",
    httpStatus: 500,
    category: "system"
  }
} as const;

/**
 * Error Type Guards
 * 
 * Type guards for checking specific error categories in match operations.
 * Enables type-safe error handling and appropriate response generation.
 */
export const ErrorTypeGuards = {
  isAuthError: (error: unknown): error is AuthError => {
    return Object.values(AuthError).includes(error as AuthError);
  },

  isCampaignError: (error: unknown): error is CampaignError => {
    return Object.values(CampaignError).includes(error as CampaignError);
  },

  isBookingError: (error: unknown): error is BookingError => {
    return Object.values(BookingError).includes(error as BookingError);
  },

  isSystemError: (error: unknown): error is SystemError => {
    return Object.values(SystemError).includes(error as SystemError);
  },

  isValidationError: (error: unknown): error is ValidationError => {
    return Object.values(ValidationError).includes(error as ValidationError);
  }
};

/**
 * Error Classification Utilities
 * 
 * Helper functions for categorizing and handling different error types.
 * Enables consistent error handling strategies across the application.
 */
export const ErrorClassification = {
  /**
   * Determine if error represents a client error (4xx)
   */
  isClientError: (error: AuthError | CampaignError | BookingError | SystemError | ValidationError): boolean => {
    const message = ErrorMessages[error as keyof typeof ErrorMessages];
    return message?.httpStatus >= 400 && message?.httpStatus < 500;
  },

  /**
   * Determine if error represents a server error (5xx)
   */
  isServerError: (error: AuthError | CampaignError | BookingError | SystemError | ValidationError): boolean => {
    const message = ErrorMessages[error as keyof typeof ErrorMessages];
    return message?.httpStatus >= 500;
  },

  /**
   * Determine if error should be retried
   */
  isRetryable: (error: AuthError | CampaignError | BookingError | SystemError | ValidationError): boolean => {
    const retryableErrors = [
      SystemError.NetworkTimeout,
      SystemError.DatabaseTimeoutError,
      SystemError.ExternalServiceUnavailable,
      SystemError.CacheConnectionFailed
    ];
    return retryableErrors.includes(error as SystemError);
  },

  /**
   * Get HTTP status code for error
   */
  getHttpStatus: (error: AuthError | CampaignError | BookingError | SystemError | ValidationError): number => {
    const message = ErrorMessages[error as keyof typeof ErrorMessages];
    return message?.httpStatus || 500;
  },

  /**
   * Get user-friendly message for error
   */
  getUserMessage: (error: AuthError | CampaignError | BookingError | SystemError | ValidationError): string => {
    const message = ErrorMessages[error as keyof typeof ErrorMessages];
    return message?.userMessage || "An unexpected error occurred. Please try again.";
  },

  /**
   * Get technical message for error (logging/debugging)
   */
  getTechnicalMessage: (error: AuthError | CampaignError | BookingError | SystemError | ValidationError): string => {
    const message = ErrorMessages[error as keyof typeof ErrorMessages];
    return message?.technicalMessage || `Unhandled error: ${error}`;
  }
};
