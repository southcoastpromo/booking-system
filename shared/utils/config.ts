/**
 * Client-side Configuration
 * Contains only the config values needed by the frontend
 */

// Environment-aware configuration for client-side
const getEnvValue = (key: string, defaultValue: string) => {
  return import.meta.env[`VITE_${key}`] || defaultValue;
};

const getNumberEnvValue = (key: string, defaultValue: number) => {
  const value = import.meta.env[`VITE_${key}`];
  return value ? parseInt(value, 10) : defaultValue;
};

// Network Configuration with environment variable support
import { getNetworkConfig } from '@shared/config/constants';
export const NETWORK_CONFIG = getNetworkConfig({
  REQUEST_TIMEOUT: getNumberEnvValue('REQUEST_TIMEOUT_MS', 30000) as 30000,
  RETRY_ATTEMPTS_QUERIES: getNumberEnvValue('RETRY_ATTEMPTS_QUERIES', 3) as 3,
  RETRY_ATTEMPTS_MUTATIONS: getNumberEnvValue('RETRY_ATTEMPTS_MUTATIONS', 2) as 2,
  RETRY_DELAY_BASE: getNumberEnvValue('RETRY_DELAY_BASE', 1000) as 1000,
  RETRY_DELAY_MAX: getNumberEnvValue('RETRY_DELAY_MAX', 30000) as 30000,
});

// Client-side environment configuration
export const CLIENT_ENV = {
  NODE_ENV: import.meta.env.MODE || 'development',
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  API_BASE_URL: getEnvValue('API_BASE_URL', ''),
  ENABLE_PERFORMANCE_MONITORING: getEnvValue('ENABLE_PERFORMANCE_MONITORING', 'true') === 'true',
  ENABLE_ERROR_REPORTING: getEnvValue('ENABLE_ERROR_REPORTING', 'true') === 'true',
  LOG_LEVEL: getEnvValue('LOG_LEVEL', 'info') as 'error' | 'warn' | 'info' | 'debug',
} as const;

// Base URL Detection for Deployment with environment variable support
const getBaseUrl = () => {
  // Check for explicit API base URL from environment
  const envBaseUrl = CLIENT_ENV.API_BASE_URL;
  if (envBaseUrl) {
    return envBaseUrl;
  }

  // In development, use relative paths
  if (CLIENT_ENV.DEV) {
    return '';
  }

  // In production/deployment, use the current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Fallback for SSR
  return '';
};

const BASE_URL = getBaseUrl();

// API Endpoints with base URL
import { createAPIEndpoints } from '@shared/config/constants';
export const API_ENDPOINTS = createAPIEndpoints(BASE_URL);

// Re-export HTTP status codes from shared module
export { HTTP_STATUS } from '@shared/config/constants';

// Re-export UI configuration from shared module
export { UI_COLORS, UI_SPACING, UI_TYPOGRAPHY, UI_TRANSITIONS, UI_FONTS } from '@shared/constants/ui';

// Re-export error messages from shared module
export { ERROR_MESSAGES, SPECIFIC_ERROR_MESSAGES } from '@shared/types/errors';

// Re-export date configuration from shared module
export { UK_DATE_CONFIG, DATE_PATTERNS, DATE_CONSTRAINTS } from '@shared/utils/date';
