/**
 * SECURITY HARDENING MIDDLEWARE - Enterprise Grade Protection
 * 
 * This module implements comprehensive security hardening for the SouthCoast 
 * ProMotion booking system, providing multiple layers of protection against
 * common web application vulnerabilities.
 * 
 * SECURITY ARCHITECTURE:
 * 1. helmet() - HTTP security headers (CSP, HSTS, XSS, etc.)
 * 2. Strict CORS - Environment-based allowlist with explicit rejection
 * 3. Rate Limiting - Per-route protection for state-changing operations
 * 4. Input Validation - Request size and type validation
 * 
 * THREAT MITIGATION:
 * - XSS: Content Security Policy, X-XSS-Protection
 * - CSRF: Strict origin validation (complemented by csrf.ts)
 * - Clickjacking: X-Frame-Options, frame-ancestors CSP
 * - MIME Sniffing: X-Content-Type-Options
 * - Information Disclosure: Server header removal
 * - DoS: Rate limiting and request size limits
 * 
 * @fileoverview Global security hardening middleware
 * @version 1.0.0
 * @author SouthCoast ProMotion Security Team
 */

import type { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env, isDevelopment, isProduction } from '../../lib/environment';
import { logger } from '../logger';

/**
 * Security Configuration Constants
 * 
 * Centralized security configuration following defense-in-depth principles.
 * Values are environment-aware and follow security best practices.
 */
const SECURITY_CONFIG = {
  // Content Security Policy - Prevents XSS and code injection
  CSP: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    scriptSrc: ["'self'", ...(isDevelopment() ? ["'unsafe-eval'", "'unsafe-inline'", "https://replit.com"] : [])],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "ws:", "wss:", ...(isDevelopment() ? ["http:", "https:"] : [])],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"]
  },
  
  // HSTS Configuration - Forces HTTPS in production
  HSTS: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Rate Limiting Configuration - Prevents DoS attacks
  RATE_LIMITS: {
    GENERAL: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isProduction() ? 100 : 500, // Stricter in production
      message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false
    },
    
    MUTATIONS: {
      windowMs: 15 * 60 * 1000, // 15 minutes  
      max: isProduction() ? 50 : 200, // Stricter for state-changing operations
      message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded for data modifications. Please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => {
        // Use IP + User-Agent for better identification
        return `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
      }
    },
    
    AUTH: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isProduction() ? 10 : 50, // Very strict for auth attempts
      message: {
        error: 'Too many authentication attempts',
        message: 'Too many failed authentication attempts. Please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true // Don't count successful auth attempts
    }
  }
};

/**
 * CORS Origin Validation - Strict Allowlist Implementation
 * 
 * Implements explicit origin allowlisting with environment-based configuration.
 * Rejects unauthorized origins with 403 Forbidden status.
 * 
 * Security Features:
 * - Environment variable based allowlist (CORS_ALLOWED_ORIGINS)
 * - Wildcard pattern support for development
 * - Comprehensive logging of blocked origins
 * - Development mode flexibility with security warnings
 * 
 * @param {string | undefined} origin - Request origin header
 * @param {Function} callback - CORS callback function
 */
const corsOriginValidator = (origin: string | undefined, callback: (error: Error | null, allowed?: boolean) => void) => {
  // Allow requests with no origin (mobile apps, Postman, etc.)
  if (!origin) {
    return callback(null, true);
  }

  // Environment-based allowlist
  const allowedOrigins = env.CORS_ORIGIN 
    ? env.CORS_ORIGIN.split(',').map(o => o.trim())
    : [];
  
  // Development mode allowlist - includes localhost variations
  const developmentOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    `http://localhost:${env.PORT}`,
    `http://127.0.0.1:${env.PORT}`
  ];

  // Production mode allowlist - strict environment-based origins
  const productionOrigins = [
    env.FRONTEND_URL,
    'https://*.replit.app',
    'https://*.replit.dev',
    ...allowedOrigins
  ].filter(Boolean);

  const finalAllowedOrigins = isDevelopment() 
    ? [...developmentOrigins, ...productionOrigins]
    : productionOrigins;

  // Secure pattern matching for wildcard domains (*.replit.app)
  const isOriginAllowed = finalAllowedOrigins.some(allowedOrigin => {
    if (allowedOrigin.includes('*')) {
      // Safe wildcard matching: only allow subdomain patterns like *.replit.app
      if (allowedOrigin.startsWith('https://*.')) {
        const domain = allowedOrigin.slice(9); // Remove 'https://*.' 
        const originUrl = new URL(origin);
        return originUrl.protocol === 'https:' && 
               (originUrl.hostname === domain || originUrl.hostname.endsWith('.' + domain));
      }
      return false; // Reject other wildcard patterns
    }
    return allowedOrigin === origin;
  });

  if (isOriginAllowed) {
    return callback(null, true);
  }

  // Security Incident: Unauthorized origin blocked
  logger.warn('[SECURITY] CORS blocked unauthorized origin', {
    origin,
    allowedOrigins: isDevelopment() ? finalAllowedOrigins.length : 'production-restricted',
    timestamp: new Date().toISOString(),
    ip: undefined // Will be added by request context if available
  });

  // Explicit rejection with security error
  const corsError = new Error(`CORS policy violation: Origin '${origin}' not allowed`);
  (corsError as any).status = 403;
  return callback(corsError, false);
};

/**
 * Helmet Security Headers Configuration
 * 
 * Comprehensive HTTP security headers using helmet middleware.
 * Configuration is environment-aware for development vs production.
 * 
 * Headers Applied:
 * - Content-Security-Policy: Prevents XSS and code injection
 * - Strict-Transport-Security: Forces HTTPS in production
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - X-XSS-Protection: Legacy XSS protection
 * - Referrer-Policy: Controls referrer information
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      ...SECURITY_CONFIG.CSP,
      upgradeInsecureRequests: isProduction() ? [] : null,
    },
    reportOnly: isDevelopment() // Report-only in development, enforce in production
  },
  
  // HSTS - Force HTTPS in production with preload
  hsts: isProduction() ? {
    ...SECURITY_CONFIG.HSTS,
    preload: true
  } : false,
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  
  // Control referrer information
  referrerPolicy: { 
    policy: isProduction() ? "strict-origin-when-cross-origin" : "no-referrer-when-downgrade" 
  },
  
  // Remove X-Powered-By header
  hidePoweredBy: true,
  
  // Prevent MIME type confusion
  crossOriginEmbedderPolicy: false,
  
  // DNS prefetch control
  dnsPrefetchControl: { allow: isDevelopment() },
  
  // Permissions policy
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  
  // Additional security headers
  crossOriginResourcePolicy: { policy: 'same-site' },
  crossOriginOpenerPolicy: { policy: 'same-origin' }
});

/**
 * Strict CORS Configuration
 * 
 * Environment-aware CORS configuration with strict origin validation.
 * Implements explicit allowlisting and comprehensive security logging.
 */
export const corsConfig = cors({
  origin: corsOriginValidator,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Admin-Key',
    'X-CSRF-Token'
  ],
  credentials: true,
  maxAge: 86400, // 24 hours preflight cache
  optionsSuccessStatus: 200 // For legacy browser support
});

/**
 * Rate Limiting Middleware Factory
 * 
 * Creates environment-aware rate limiting middleware for different
 * route types and security requirements.
 */
export const createRateLimit = (type: 'GENERAL' | 'MUTATIONS' | 'AUTH' = 'GENERAL') => {
  const config = SECURITY_CONFIG.RATE_LIMITS[type];
  
  return rateLimit({
    ...config,
    handler: (req: Request, res: Response) => {
      logger.warn('[SECURITY] Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method,
        type,
        timestamp: new Date().toISOString()
      });

      res.status(429).json(config.message);
    }
  });
};

/**
 * Global Security Middleware Application
 * 
 * Applies all security hardening middleware to the Express application
 * in the correct order for maximum effectiveness.
 * 
 * Middleware Order (Critical for Security):
 * 1. Helmet - HTTP security headers
 * 2. CORS - Origin validation
 * 3. Rate limiting - DoS protection
 * 
 * @param {Express} app - Express application instance
 */
export function applyGlobalSecurity(app: Express): void {
  logger.info('[SECURITY] Applying global security hardening');

  // 1. HTTP Security Headers - Applied first to all responses
  app.use(helmetConfig);
  
  // 2. Strict CORS - Origin validation and header control
  app.use(corsConfig);
  
  // 3. Global rate limiting - Basic DoS protection
  app.use(createRateLimit('GENERAL'));
  
  // 4. Enhanced rate limiting for mutations
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return createRateLimit('MUTATIONS')(req, res, next);
    }
    next();
  });
  
  // 5. Strict rate limiting for authentication endpoints
  app.use('/api/auth', createRateLimit('AUTH'));
  app.use('/admin', createRateLimit('AUTH'));
  
  // 6. Request size validation
  app.use((req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('content-length');
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      logger.warn('[SECURITY] Request too large', {
        size: contentLength,
        maxSize,
        ip: req.ip,
        endpoint: req.path
      });
      
      return res.status(413).json({
        error: 'Payload too large',
        message: 'Request exceeds maximum allowed size',
        maxSize: '10MB'
      });
    }
    
    next();
  });

  logger.info('[SECURITY] Global security hardening applied successfully', {
    environment: env.NODE_ENV,
    features: {
      helmet: true,
      cors: true,
      rateLimiting: true,
      requestSizeValidation: true
    }
  });
}

/**
 * Development Security Warnings
 * 
 * Logs security warnings for development environment to remind
 * developers about production security considerations.
 */
if (isDevelopment()) {
  logger.warn('[SECURITY] Development mode detected', {
    warnings: [
      'CSP is in report-only mode for debugging',
      'HSTS is disabled for local development',
      'Rate limits are relaxed for development',
      'CORS allows localhost origins',
      'Ensure production environment variables are properly configured'
    ]
  });
}

/**
 * HTTPS Redirect Middleware
 * 
 * Redirects HTTP requests to HTTPS in production environment.
 * Checks the x-forwarded-proto header for proxy-aware redirection.
 */
export const httpsRedirect = (req: Request, res: Response, next: NextFunction) => {
  if (req.header('x-forwarded-proto') !== 'https' && isProduction()) {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }
  next();
};

// Export rate limiters for specific use
export const generalRateLimit = createRateLimit('GENERAL');
export const mutationRateLimit = createRateLimit('MUTATIONS');
export const authRateLimit = createRateLimit('AUTH');
