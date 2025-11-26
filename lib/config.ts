/**
 * Configuration Layer - Centralized business rules and constants
 * Eliminates magic numbers throughout the application
 */

import { env, envManager, isDevelopment, isProduction, isTest, getFeatureFlag } from './environment.js';
import {
  AVAILABILITY_THRESHOLDS,
  BOOKING_LIMITS,
  DISCOUNT_RATES,
  VALIDATION_PATTERNS,
  DATE_LIMITS,
  TIME_LIMITS
} from '../shared/constants/business';

// Re-export business constants from shared module
export * from '../shared/constants/business.js';

// Application Configuration
export const APP_CONFIG = {
  CSV_CACHE_TTL: env.CSV_CACHE_TTL,
  MAX_REQUEST_SIZE: '10mb',
  MAX_PARAMETER_COUNT: 100,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  BCRYPT_ROUNDS: 12,
} as const;

// Client Configuration (Browser-safe)
export const CLIENT_CONFIG = {
  NODE_ENV: typeof window !== 'undefined' ? window.ENV?.MODE || 'production' : 'development',
  DEV: typeof window !== 'undefined' ? window.ENV?.MODE === 'development' : false,
  PROD: typeof window !== 'undefined' ? window.ENV?.MODE === 'production' : true,
  BASE_URL: typeof window !== 'undefined' ? window.location.origin : '',
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_ERROR_REPORTING: true,
  LOG_LEVEL: 'info' as 'error' | 'warn' | 'info' | 'debug',
} as const;

// Monitoring Configuration
export const MONITORING_CONFIG = {
  ERROR_THRESHOLD: 10,
  RESPONSE_TIME_THRESHOLD: 5000,
  MEMORY_THRESHOLD: 500 * 1024 * 1024, // 500MB
  CPU_THRESHOLD: 80,
  ALERT_COOLDOWN: 5 * 60 * 1000, // 5 minutes
} as const;

// DocuSign Configuration
export const DOCUSIGN_CONFIG = {
  INTEGRATION_KEY: env.DOCUSIGN_INTEGRATION_KEY || '',
  USER_ID: env.DOCUSIGN_USER_ID || '',
  ACCOUNT_ID: env.DOCUSIGN_USER_ID || '', // Using USER_ID as fallback for ACCOUNT_ID
  PRIVATE_KEY: env.DOCUSIGN_PRIVATE_KEY || '',
  BASE_PATH: 'https://demo.docusign.net/restapi',
  OAUTH_BASE_PATH: 'account-d.docusign.com',
} as const;

// Re-export shared configuration constants
export { NETWORK_CONFIG, API_PATHS as API_ENDPOINTS, HTTP_STATUS, FILE_CONFIG } from '../shared/config/constants.js';

// UI configuration removed - use shared/utils/config.ts or shared/constants/ui.ts directly

// Business constants
export const BUSINESS_CONFIG = {
  COMPANY_NAME: 'SouthCoast ProMotion',
  CURRENCY_SYMBOL: 'GBP',
  CURRENCY_PREFIX: 'GBP£',
  DEFAULT_ADMIN_NAME: 'Admin User',
  EMAIL_DOMAIN: 'southcoastpromotion.com',
  SUPPORT_EMAIL: 'support@southcoastpromotion.com',
  DEADLINE_HOURS_BEFORE_CAMPAIGN: 48,
  MAX_BOOKING_SLOTS: 12,
  MIN_BOOKING_VALUE: 50,
  MAX_BOOKING_VALUE: 10000
} as const;

// File system paths
export const FILE_PATHS = {
  PRODUCTION_DELIVERABLE: process.env.PRODUCTION_DELIVERABLE_PATH || './dist/production-ready.tar.gz',
  LOGS_DIR: process.env.LOGS_DIR || 'logs',
  UPLOADS_DIR: process.env.UPLOADS_DIR || 'uploads',
  STATIC_DIR: process.env.STATIC_DIR || 'dist'
} as const;

// Development/Testing constants
export const DEV_CONFIG = {
  TEST_EMAIL: 'test@example.com',
  TEST_USER_NAME: 'Test User',
  TEST_COMPANY: 'Test Company Ltd',
  PERF_TEST_EMAIL: 'performance@example.com',
  CORS_ORIGINS: {
    DEVELOPMENT: ['http://localhost:5173', 'http://0.0.0.0:5173', 'http://localhost:3000'],
    PRODUCTION: [] // Will be populated from environment
  }
} as const;

// Re-export error messages from shared module
export { ERROR_MESSAGES, SPECIFIC_ERROR_MESSAGES } from '../shared/types/errors';

// Re-export date configuration from shared module
export { UK_DATE_CONFIG, DATE_PATTERNS, DATE_CONSTRAINTS } from '../shared/utils/date';

// Re-export environment for compatibility
export { env };

// Re-export environment configuration for backward compatibility
export const ENV_CONFIG = env;
export const FEATURE_FLAGS = {
  ENABLE_CSV_CACHE: getFeatureFlag('ENABLE_CSV_CACHE'),
  ENABLE_AUTH_BYPASS: getFeatureFlag('ENABLE_AUTH_BYPASS'),
  ENABLE_DETAILED_LOGGING: getFeatureFlag('ENABLE_DETAILED_LOGGING'),
  ENABLE_RATE_LIMITING: getFeatureFlag('ENABLE_RATE_LIMITING'),
} as const;

// Export environment helper functions
export { isDevelopment, isProduction, isTest, envManager };

// Business Rules
export const BUSINESS_RULES = {
  /**
   * Determine campaign availability based on slot count
   */
  getCampaignAvailability: (slotsAvailable: number): 'available' | 'limited' | 'full' => {
    if (slotsAvailable <= AVAILABILITY_THRESHOLDS.FULL) return 'full';
    if (slotsAvailable <= AVAILABILITY_THRESHOLDS.LIMITED) return 'limited';
    return 'available';
  },

  /**
   * Calculate discount rate based on item count
   */
  getDiscountRate: (itemCount: number): number => {
    if (itemCount >= 6) return DISCOUNT_RATES.BULK_6_PLUS;
    if (itemCount >= 4) return DISCOUNT_RATES.BULK_4_PLUS;
    if (itemCount >= 2) return DISCOUNT_RATES.BULK_2_PLUS;
    return 0;
  },


} as const;

// Export type definitions for TypeScript
export type AvailabilityStatus = 'available' | 'limited' | 'full';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type AssetStatus = 'pending' | 'approved' | 'rejected';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
