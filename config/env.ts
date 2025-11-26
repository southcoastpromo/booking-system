import { z } from 'zod';

/**
 * Comprehensive Environment Variable Validation using Zod
 * Provides fail-fast validation with clear error messages
 */

// Helper schemas for common validations
const portSchema = z.coerce.number().int().min(1).max(65535);
const booleanSchema = z.enum(['true', 'false', '1', '0', 'yes', 'no']).transform(val => 
  ['true', '1', 'yes'].includes(val.toLowerCase())
);
const urlSchema = z.string().url().or(z.string().regex(/^postgresql:\/\//));
const logLevelSchema = z.enum(['error', 'warn', 'info', 'debug']);
const nodeEnvSchema = z.enum(['development', 'production', 'test']);

// Base environment schema with required variables
const environmentSchema = z.object({
  // Core Application Settings (REQUIRED)
  NODE_ENV: nodeEnvSchema.default('production'),
  PORT: portSchema.default(5000),
  HOST: z.string().default('0.0.0.0'),

  // Database Configuration (REQUIRED)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').refine(
    (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
    'DATABASE_URL must be a valid PostgreSQL connection string'
  ),

  // Security Configuration (REQUIRED - NO DEFAULTS FOR PRODUCTION SECURITY)
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET must be at least 32 characters'),
  ADMIN_KEY: z.string().min(32, 'ADMIN_KEY must be at least 32 characters'),
  API_KEY: z.string().min(32, 'API_KEY must be at least 32 characters'),

  // Optional Database Configuration
  FALLBACK_DATABASE_URL: urlSchema.optional(),

  // External Service Integrations (OPTIONAL)
  SENDGRID_API_KEY: z.string().optional(),
  DOCUSIGN_INTEGRATION_KEY: z.string().optional(),
  DOCUSIGN_USER_ID: z.string().uuid().optional(),
  DOCUSIGN_PRIVATE_KEY: z.string().optional(),

  // Performance and Monitoring
  LOG_LEVEL: logLevelSchema.default('info'),
  RATE_LIMIT_WINDOW: z.coerce.number().int().positive().default(900000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  HEALTH_CHECK_PORT: portSchema.default(5000),

  // Feature Flags
  ENABLE_SECURITY_HEADERS: booleanSchema.default(true),
  ENABLE_RATE_LIMITING: booleanSchema.optional(),
  ENABLE_DETAILED_LOGGING: booleanSchema.optional(),
  ENABLE_AUTH_BYPASS: booleanSchema.default(false),
  ENABLE_CSV_CACHE: booleanSchema.default(true),

  // Network and CORS (SECURE DEFAULT - NO WILDCARD)
  CORS_ORIGIN: z.string().default('https://replit.app'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Business Configuration
  MIN_BOOKING_REVENUE: z.coerce.number().positive().default(200),
  BOOKING_VALUE_RANGE_MIN: z.coerce.number().positive().default(80),
  BOOKING_VALUE_RANGE_MAX: z.coerce.number().positive().default(140),
  DEFAULT_CAMPAIGN_REVENUE: z.coerce.number().positive().default(2800),
  DEFAULT_CAMPAIGN_BOOKINGS: z.coerce.number().positive().default(28),

  // Cache Configuration
  CSV_CACHE_TTL: z.coerce.number().positive().default(300000), // 5 minutes

  // Demo Data
  DEMO_PHONE_NUMBER: z.string().default('+44 7700 900123'),

  // Deployment Specific (OPTIONAL)
  REPL_DOMAINS: z.string().optional(),
  REPL_SLUG: z.string().optional(),
  REPLIT_DB_URL: z.string().optional(),

  // Client-side Variables (OPTIONAL)
  VITE_API_BASE_URL: z.string().optional(),
  VITE_ENABLE_PERFORMANCE_MONITORING: booleanSchema.default(true),
  VITE_LOG_LEVEL: logLevelSchema.default('info'),
});

// Type inference from schema
export type Environment = z.infer<typeof environmentSchema>;

/**
 * Validates and parses environment variables
 * Throws detailed error messages for validation failures
 */
export function validateEnvironment(): Environment {
  try {
    // Parse and validate environment variables
    const env = environmentSchema.parse(process.env);
    
    // Additional business logic validation
    if (env.BOOKING_VALUE_RANGE_MIN >= env.BOOKING_VALUE_RANGE_MAX) {
      throw new Error('BOOKING_VALUE_RANGE_MIN must be less than BOOKING_VALUE_RANGE_MAX');
    }

    // Production-specific validations
    if (env.NODE_ENV === 'production') {
      // Production secrets validation handled by schema - no defaults allowed
      // CORS must not be wildcard in production
      if (env.CORS_ORIGIN === '*') {
        throw new Error('Production CORS_ORIGIN cannot be wildcard (*) - specify exact domain');
      }

      // Enable rate limiting by default in production
      if (env.ENABLE_RATE_LIMITING === undefined) {
        env.ENABLE_RATE_LIMITING = true;
      }
    }

    // Development-specific defaults
    if (env.NODE_ENV === 'development') {
      if (env.ENABLE_DETAILED_LOGGING === undefined) {
        env.ENABLE_DETAILED_LOGGING = true;
      }
      
      if (env.ENABLE_RATE_LIMITING === undefined) {
        env.ENABLE_RATE_LIMITING = false;
      }
      
      if (env.CORS_ORIGIN === '*') {
        env.CORS_ORIGIN = 'http://localhost:3000';
      }
    }

    // Test environment defaults
    if (env.NODE_ENV === 'test') {
      env.ENABLE_AUTH_BYPASS = true;
      env.ENABLE_DETAILED_LOGGING = false;
    }

    return env;

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors in a user-friendly way
      const errorMessages = error.issues.map(issue => {
        const path = issue.path.join('.');
        return `❌ ${path}: ${issue.message}`;
      }).join('\n');

      throw new Error(`Environment validation failed:\n\n${errorMessages}\n\nPlease check your .env file and ensure all required variables are properly configured.`);
    }
    
    throw error;
  }
}

/**
 * Get validated environment configuration
 * Memoized to avoid re-parsing on subsequent calls
 */
let cachedEnv: Environment | null = null;

export function getEnvironment(): Environment {
  if (!cachedEnv) {
    cachedEnv = validateEnvironment();
    
    // Log configuration summary (excluding sensitive data)
    const logConfig = {
      NODE_ENV: cachedEnv.NODE_ENV,
      PORT: cachedEnv.PORT,
      HOST: cachedEnv.HOST,
      LOG_LEVEL: cachedEnv.LOG_LEVEL,
      DATABASE_CONFIGURED: !!cachedEnv.DATABASE_URL,
      SECURITY_HEADERS_ENABLED: cachedEnv.ENABLE_SECURITY_HEADERS,
      RATE_LIMITING_ENABLED: cachedEnv.ENABLE_RATE_LIMITING,
      EXTERNAL_SERVICES: {
        SENDGRID: !!cachedEnv.SENDGRID_API_KEY,
        DOCUSIGN: !!(cachedEnv.DOCUSIGN_INTEGRATION_KEY && cachedEnv.DOCUSIGN_USER_ID),
      },
      IS_REPLIT: !!(cachedEnv.REPL_DOMAINS || cachedEnv.REPL_SLUG),
    };

    console.log(`[ENV] ✅ Environment validation passed`);
    console.log(`[ENV] Configuration:`, JSON.stringify(logConfig, null, 2));
  }
  
  return cachedEnv;
}

/**
 * Reset cached environment (useful for testing)
 */
export function resetEnvironmentCache(): void {
  cachedEnv = null;
}

/**
 * Check if running in specific environments
 */
export function isDevelopment(): boolean {
  return getEnvironment().NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return getEnvironment().NODE_ENV === 'production';
}

export function isTest(): boolean {
  return getEnvironment().NODE_ENV === 'test';
}

export function isReplit(): boolean {
  const env = getEnvironment();
  return !!(env.REPL_DOMAINS || env.REPL_SLUG);
}

/**
 * Get feature flag values
 */
export function getFeatureFlag(flag: keyof Pick<Environment, 
  'ENABLE_SECURITY_HEADERS' | 'ENABLE_RATE_LIMITING' | 'ENABLE_DETAILED_LOGGING' | 
  'ENABLE_AUTH_BYPASS' | 'ENABLE_CSV_CACHE'
>): boolean {
  return getEnvironment()[flag] || false;
}

// Export default environment instance
export const env = getEnvironment();
