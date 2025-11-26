/**
 * Shared Configuration Constants
 * Single source of truth for HTTP status codes, API endpoints, and network configuration
 */

// HTTP Status Codes - Single source of truth
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// API Endpoint Paths - Single source of truth (without base URL)
export const API_PATHS = {
  CAMPAIGNS: '/api/campaigns',
  BOOKINGS: '/api/bookings',
  CSRF_TOKEN: '/api/csrf-token',
  HEALTH: '/health',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_SESSION: '/api/auth/session',
  CUSTOMER_BOOKINGS: '/api/customer/bookings',
  NOTIFICATIONS: '/api/notifications',
  ADMIN: '/api/admin',
  MONITORING: '/api/monitoring',
  EXPORT: '/api/export',
} as const;

// Network Configuration - Shared defaults
export const NETWORK_CONFIG = {
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS_QUERIES: 3,
  RETRY_ATTEMPTS_MUTATIONS: 2,
  RETRY_DELAY_BASE: 1000, // 1 second
  RETRY_DELAY_MAX: 30000, // 30 seconds
  RETRY_BACKOFF_MULTIPLIER: 2,
  WEBSOCKET_PATH: '/ws',
  WEBSOCKET_RECONNECT_DELAY: 5000,
} as const;

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  MESSAGE: 'Too many requests from this IP, please try again later.',
  HEADERS: true,
  STANDARDheaders: true,
  LEGACY_HEADERS: false,
} as const;

// File System Configuration
export const FILE_CONFIG = {
  CAMPAIGNS_CSV: 'campaigns.csv',
  ASSETS_DIR: 'attached_assets',
  STATIC_DIR: 'public',
  LOGS_DIR: 'logs',
  UPLOADS_DIR: 'uploads',
  TEMP_DIR: 'temp',
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  BCRYPT_ROUNDS: 12,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  CSRF_TOKEN_LENGTH: 32,
  API_KEY_LENGTH: 64,
  MAX_REQUEST_SIZE: '10mb',
  MAX_PARAMETER_COUNT: 100,
} as const;

// Monitoring Configuration
export const MONITORING_CONFIG = {
  ERROR_THRESHOLD: 10,
  RESPONSE_TIME_THRESHOLD: 5000,
  MEMORY_THRESHOLD: 500 * 1024 * 1024, // 500MB
  CPU_THRESHOLD: 80,
  ALERT_COOLDOWN: 5 * 60 * 1000, // 5 minutes
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
} as const;

// Environment Types
export type Environment = 'development' | 'production' | 'test';
// LogLevel type moved to shared/types/logging.ts to avoid conflicts

// Browser API Detection
export const isBrowser = typeof window !== 'undefined';
export const isSSR = typeof window === 'undefined';

/**
 * Create full API endpoints with base URL (for client-side use)
 */
export function createAPIEndpoints(baseUrl: string = '') {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  return Object.fromEntries(
    Object.entries(API_PATHS).map(([key, path]) => [
      key,
      `${normalizedBaseUrl}${path}`
    ])
  ) as Record<keyof typeof API_PATHS, string>;
}

/**
 * Get environment-specific network configuration
 */
export function getNetworkConfig(overrides: Partial<typeof NETWORK_CONFIG> = {}) {
  return { ...NETWORK_CONFIG, ...overrides };
}
