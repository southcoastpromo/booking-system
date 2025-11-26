/**
 * Centralized Environment Variable Management
 * Provides type-safe, validated access to all environment variables
 */

interface EnvironmentConfig {
  // Core application settings
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;
  
  // Database configuration
  DATABASE_URL: string;
  FALLBACK_DATABASE_URL: string;
  
  // Security configuration
  SESSION_SECRET: string;
  CSRF_SECRET: string;
  ADMIN_KEY: string;
  API_KEY: string;
  
  // External service integrations
  SENDGRID_API_KEY?: string;
  DOCUSIGN_INTEGRATION_KEY?: string;
  DOCUSIGN_USER_ID?: string;
  DOCUSIGN_PRIVATE_KEY?: string;
  
  // Performance and monitoring
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX: number;
  REQUEST_TIMEOUT_MS: number;
  HEALTH_CHECK_PORT: number;
  
  // Feature flags
  ENABLE_SECURITY_HEADERS: boolean;
  ENABLE_RATE_LIMITING: boolean;
  ENABLE_DETAILED_LOGGING: boolean;
  ENABLE_AUTH_BYPASS: boolean;
  ENABLE_CSV_CACHE: boolean;
  
  // Network and CORS
  CORS_ORIGIN: string;
  FRONTEND_URL: string;
  
  // Business configuration
  MIN_BOOKING_REVENUE: number;
  BOOKING_VALUE_RANGE_MIN: number;
  BOOKING_VALUE_RANGE_MAX: number;
  DEFAULT_CAMPAIGN_REVENUE: number;
  DEFAULT_CAMPAIGN_BOOKINGS: number;
  
  // Cache configuration
  CSV_CACHE_TTL: number;
  
  // Demo data
  DEMO_PHONE_NUMBER: string;
  
  // Deployment specific
  REPL_DOMAINS?: string;
  REPL_SLUG?: string;
  REPLIT_DB_URL?: string;
}

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;
  private isValidated = false;

  private constructor() {
    this.config = this.loadEnvironmentConfig();
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private loadEnvironmentConfig(): EnvironmentConfig {
    return {
      // Core application settings
      NODE_ENV: this.getEnumValue('NODE_ENV', ['development', 'production', 'test'], 'production'),
      PORT: this.getNumberValue('PORT', 5000),
      HOST: this.getStringValue('HOST', '0.0.0.0'),
      
      // Database configuration
      DATABASE_URL: typeof process !== 'undefined' ? this.getRequiredString('DATABASE_URL') : 'postgresql://localhost:5432/fallback',
      FALLBACK_DATABASE_URL: this.getStringValue(
        'FALLBACK_DATABASE_URL',
        'postgresql://fallback:password@localhost:5432/fallback'
      ),
      
      // Security configuration (will be validated by SecretManager)
      SESSION_SECRET: this.getStringValue('SESSION_SECRET', ''),
      CSRF_SECRET: this.getStringValue('CSRF_SECRET', ''),
      ADMIN_KEY: this.getStringValue('ADMIN_KEY', ''),
      API_KEY: this.getStringValue('API_KEY', ''),
      
      // External service integrations
      SENDGRID_API_KEY: this.getOptionalString('SENDGRID_API_KEY'),
      DOCUSIGN_INTEGRATION_KEY: this.getOptionalString('DOCUSIGN_INTEGRATION_KEY'),
      DOCUSIGN_USER_ID: this.getOptionalString('DOCUSIGN_USER_ID'),
      DOCUSIGN_PRIVATE_KEY: this.getOptionalString('DOCUSIGN_PRIVATE_KEY'),
      
      // Performance and monitoring
      LOG_LEVEL: this.getEnumValue('LOG_LEVEL', ['error', 'warn', 'info', 'debug'], 'warn'),
      RATE_LIMIT_WINDOW: this.getNumberValue('RATE_LIMIT_WINDOW', 900000), // 15 minutes
      RATE_LIMIT_MAX: this.getNumberValue('RATE_LIMIT_MAX', 100),
      REQUEST_TIMEOUT_MS: this.getNumberValue('REQUEST_TIMEOUT_MS', 30000),
      HEALTH_CHECK_PORT: this.getNumberValue('HEALTH_CHECK_PORT', 5000),
      
      // Feature flags
      ENABLE_SECURITY_HEADERS: this.getBooleanValue('ENABLE_SECURITY_HEADERS', true),
      ENABLE_RATE_LIMITING: this.getBooleanValue('ENABLE_RATE_LIMITING', this.isProduction()),
      ENABLE_DETAILED_LOGGING: this.getBooleanValue('ENABLE_DETAILED_LOGGING', this.isDevelopment()),
      ENABLE_AUTH_BYPASS: this.getBooleanValue('ENABLE_AUTH_BYPASS', this.isTest()),
      ENABLE_CSV_CACHE: this.getBooleanValue('ENABLE_CSV_CACHE', this.isDevelopment()),
      
      // Network and CORS
      CORS_ORIGIN: this.getStringValue('CORS_ORIGIN', this.isDevelopment() ? 'http://localhost:3000' : '*'),
      FRONTEND_URL: this.getStringValue('FRONTEND_URL', 'http://localhost:3000'),
      
      // Business configuration
      MIN_BOOKING_REVENUE: this.getNumberValue('MIN_BOOKING_REVENUE', 200),
      BOOKING_VALUE_RANGE_MIN: this.getNumberValue('BOOKING_VALUE_RANGE_MIN', 80),
      BOOKING_VALUE_RANGE_MAX: this.getNumberValue('BOOKING_VALUE_RANGE_MAX', 140),
      DEFAULT_CAMPAIGN_REVENUE: this.getNumberValue('DEFAULT_CAMPAIGN_REVENUE', 2800),
      DEFAULT_CAMPAIGN_BOOKINGS: this.getNumberValue('DEFAULT_CAMPAIGN_BOOKINGS', 28),
      
      // Cache configuration
      CSV_CACHE_TTL: this.getNumberValue('CSV_CACHE_TTL', 300000), // 5 minutes
      
      // Demo data
      DEMO_PHONE_NUMBER: this.getStringValue('DEMO_PHONE_NUMBER', '+44 7700 900123'),
      
      // Deployment specific
      REPL_DOMAINS: this.getOptionalString('REPL_DOMAINS'),
      REPL_SLUG: this.getOptionalString('REPL_SLUG'),
      REPLIT_DB_URL: this.getOptionalString('REPLIT_DB_URL'),
    };
  }

  private getRequiredString(key: string): string {
    if (typeof process === 'undefined') {
      throw new Error(`ENVIRONMENT ERROR: Required environment variable ${key} is not available in browser context`);
    }
    const value = process.env[key];
    if (!value || value.trim() === '') {
      throw new Error(`ENVIRONMENT ERROR: Required environment variable ${key} is not set`);
    }
    return value.trim();
  }

  private getStringValue(key: string, defaultValue: string): string {
    if (typeof process === 'undefined') return defaultValue;
    const value = process.env[key];
    return value ? value.trim() : defaultValue;
  }

  private getOptionalString(key: string): string | undefined {
    if (typeof process === 'undefined') return undefined;
    const value = process.env[key];
    return value ? value.trim() : undefined;
  }

  private getNumberValue(key: string, defaultValue: number): number {
    if (typeof process === 'undefined') return defaultValue;
    const value = process.env[key];
    if (!value) return defaultValue;
    
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      // Use structured warning for environment issues
      const warning = `Invalid number value for ${key}: ${value}, using default: ${defaultValue}`;
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`[ENV-WARN] ${warning}\n`);
      }
      return defaultValue;
    }
    return parsed;
  }

  private getBooleanValue(key: string, defaultValue: boolean): boolean {
    if (typeof process === 'undefined') return defaultValue;
    const value = process.env[key];
    if (!value) return defaultValue;
    
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes') return true;
    if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no') return false;
    
    const warning = `Invalid boolean value for ${key}: ${value}, using default: ${defaultValue}`;
    if (typeof process !== 'undefined' && process.stderr) {
      process.stderr.write(`[ENV-WARN] ${warning}\n`);
    }
    return defaultValue;
  }

  private getEnumValue<T extends string>(
    key: string, 
    allowedValues: T[], 
    defaultValue: T
  ): T {
    if (typeof process === 'undefined') return defaultValue;
    const value = process.env[key];
    if (!value) return defaultValue;
    
    const trimmedValue = value.trim() as T;
    if (allowedValues.includes(trimmedValue)) {
      return trimmedValue;
    }
    
    const warning = `Invalid value for ${key}: ${value}, allowed: ${allowedValues.join(', ')}, using default: ${defaultValue}`;
    if (typeof process !== 'undefined' && process.stderr) {
      process.stderr.write(`[ENV-WARN] ${warning}\n`);
    }
    return defaultValue;
  }

  private isDevelopment(): boolean {
    return typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  }

  private isProduction(): boolean {
    return typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
  }

  private isTest(): boolean {
    return typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
  }

  public getConfig(): EnvironmentConfig {
    if (!this.isValidated) {
      this.validateConfig();
      this.isValidated = true;
    }
    return this.config;
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Skip security validation - SecretManager handles this with proper defaults
    // This allows the environment system to work with or without secrets initially

    // Validate port ranges
    if (this.config.PORT < 1 || this.config.PORT > 65535) {
      errors.push('PORT must be between 1 and 65535');
    }

    // Validate database URL format
    if (!this.config.DATABASE_URL.startsWith('postgresql://') && !this.config.DATABASE_URL.startsWith('postgres://')) {
      errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
    }

    // Validate business configuration
    if (this.config.BOOKING_VALUE_RANGE_MIN >= this.config.BOOKING_VALUE_RANGE_MAX) {
      errors.push('BOOKING_VALUE_RANGE_MIN must be less than BOOKING_VALUE_RANGE_MAX');
    }

    if (errors.length > 0) {
      throw new Error(`Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }

    // Use structured logging for environment validation
    const logMessage = `Environment configuration validated successfully. Running in ${this.config.NODE_ENV} mode on port ${this.config.PORT}`;
    if (typeof process !== 'undefined' && process.stdout) {
      process.stdout.write(`[ENV] ${logMessage}\n`);
    }
  }

  public isReplit(): boolean {
    return !!(this.config.REPL_DOMAINS || this.config.REPL_SLUG);
  }

  public getFeatureFlag(flag: keyof Pick<EnvironmentConfig, 'ENABLE_SECURITY_HEADERS' | 'ENABLE_RATE_LIMITING' | 'ENABLE_DETAILED_LOGGING' | 'ENABLE_AUTH_BYPASS' | 'ENABLE_CSV_CACHE'>): boolean {
    return this.getConfig()[flag];
  }

  public logConfiguration(): void {
    const config = this.getConfig();
    const configSummary = {
      NODE_ENV: config.NODE_ENV,
      PORT: config.PORT,
      HOST: config.HOST,
      LOG_LEVEL: config.LOG_LEVEL,
      CORS_ORIGIN: config.CORS_ORIGIN,
      DATABASE_CONFIGURED: !!config.DATABASE_URL,
      SECURITY_HEADERS_ENABLED: config.ENABLE_SECURITY_HEADERS,
      RATE_LIMITING_ENABLED: config.ENABLE_RATE_LIMITING,
      IS_REPLIT: this.isReplit(),
      EXTERNAL_SERVICES: {
        SENDGRID: !!config.SENDGRID_API_KEY,
        DOCUSIGN: !!(config.DOCUSIGN_INTEGRATION_KEY && config.DOCUSIGN_USER_ID),
      }
    };
    
    // Structured configuration logging
    if (typeof process !== 'undefined' && process.stdout) {
      process.stdout.write(`[ENV] Configuration Summary: ${JSON.stringify(configSummary, null, 2)}\n`);
    }
  }
}

// Export singleton instance
export const env = EnvironmentManager.getInstance().getConfig();
export const envManager = EnvironmentManager.getInstance();

// Export helper functions
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}

export function isReplit(): boolean {
  return !!(env.REPL_DOMAINS || env.REPL_SLUG);
}

export function getFeatureFlag(flag: keyof Pick<EnvironmentConfig, 'ENABLE_SECURITY_HEADERS' | 'ENABLE_RATE_LIMITING' | 'ENABLE_DETAILED_LOGGING' | 'ENABLE_AUTH_BYPASS' | 'ENABLE_CSV_CACHE'>): boolean {
  return env[flag];
}

export type { EnvironmentConfig };
