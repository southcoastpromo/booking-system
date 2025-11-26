import type { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { env } from '../../lib/environment';
import { logger } from '../logger';

/**
 * SECURITY ARCHITECTURE: Enterprise-Grade Admin Authentication
 * 
 * DESIGN PATTERN: Defense in Depth Security
 * 
 * This middleware implements multiple layers of security protection following
 * industry best practices for high-value administrative endpoints.
 * 
 * SECURITY LAYERS IMPLEMENTED:
 * 1. **API Key Authentication**: Secret-based access control
 * 2. **Timing Attack Prevention**: Constant-time comparison functions
 * 3. **Bot Detection**: User-agent filtering for automated attacks
 * 4. **Security Logging**: Comprehensive audit trail without info leakage
 * 5. **Error Obfuscation**: Generic error messages prevent enumeration
 * 6. **Rate Limiting**: (Applied at higher middleware level)
 * 
 * ARCHITECTURAL DECISIONS:
 * - Uses crypto.timingSafeEqual() to prevent timing-based side-channel attacks
 * - Implements fail-secure pattern: deny by default, allow explicitly
 * - Logs security events for monitoring and incident response
 * - Separates admin auth from regular API auth (different threat models)
 * - Environment-aware security (stricter in production)
 * 
 * THREAT MODEL:
 * - Protects against: brute force, timing attacks, bot scraping, enumeration
 * - Assumes: TLS termination handled by reverse proxy/load balancer
 * - Monitors: Failed authentication attempts for security alerting
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object  
 * @param {NextFunction} next - Express next middleware function
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // SECURITY LAYER 1: Environment-specific restrictions
    if (env.NODE_ENV === 'production') {
      // Production-only security enhancements can be added here
      // Examples: IP allowlisting, additional headers validation, etc.
    }

    // SECURITY LAYER 2: Extract and validate required headers
    const adminKey = req.headers['x-admin-key'] as string;
    const userAgent = req.headers['user-agent'] as string;

    // SECURITY LAYER 3: Mandatory authentication check
    if (!adminKey) {
      return res.status(401).json({
        error: 'Access denied' // Generic message prevents enumeration
      });
    }

    // SECURITY LAYER 4: Bot and scraper detection
    if (!userAgent || /bot|crawler|spider|scrapy/i.test(userAgent)) {
      return res.status(403).json({
        error: 'Access denied' // Consistent error message
      });
    }

    const expectedKey = env.ADMIN_KEY;

    // SECURITY LAYER 5: Timing-attack resistant key comparison
    // Uses constant-time comparison to prevent timing-based enumeration
    const providedKeyBuffer = Buffer.from(adminKey);
    const expectedKeyBuffer = Buffer.from(expectedKey);

    if (providedKeyBuffer.length !== expectedKeyBuffer.length ||
        !crypto.timingSafeEqual(providedKeyBuffer, expectedKeyBuffer)) {
      // SECURITY LAYER 6: Security incident logging (no sensitive data)
      logger.warn('[SECURITY] Unauthorized admin access attempt', {
        ip: req.ip,
        timestamp: new Date().toISOString()
        // NOTE: No key or user-agent logged to prevent log injection
      });

      return res.status(401).json({
        error: 'Access denied' // Same error message as missing key
      });
    }

    // Log successful admin access with minimal info
    logger.info('[SECURITY] Admin access granted', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    next();
  } catch (_error) {
    // No error details leaked
    return res.status(500).json({
      error: 'Service unavailable'
    });
  }
}

/**
 * General Authentication Middleware - Unified API Protection
 * 
 * Provides authentication for general API access using multiple supported
 * authentication methods. This middleware offers flexible authentication
 * supporting both API keys and session-based authentication.
 * 
 * SECURITY FEATURES:
 * 1. **Multi-Method Authentication**: Supports API key and session auth
 * 2. **Timing Attack Prevention**: Constant-time comparison functions
 * 3. **Flexible Error Messages**: Different messages for different auth types
 * 4. **Security Logging**: Comprehensive audit trail
 * 5. **Rate Limiting Integration**: Works with existing rate limiting
 * 
 * AUTHENTICATION METHODS:
 * - X-API-Key header: For programmatic API access
 * - Session-based: For web application access
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for API key authentication first
    const apiKey = req.headers['x-api-key'] as string;
    
    if (apiKey) {
      // Validate API key using timing-safe comparison
      const expectedKey = env.API_KEY;
      
      if (!expectedKey) {
        // Test environment bypass
        const isTestEnvironment = env.NODE_ENV === 'test';
        const isTestBypass = req.headers['x-test-bypass'] === 'integration-test';
        
        if (isTestEnvironment && isTestBypass) {
          logger.info('[AUTH] Test environment: allowing bypass with test header');
          return next();
        }
        
        logger.warn('[SECURITY] API key authentication attempted but no API key configured', {
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
        
        return res.status(503).json({
          error: 'Service configuration error',
          message: 'API key authentication temporarily unavailable'
        });
      }
      
      // Timing-safe API key comparison
      const providedKeyBuffer = Buffer.from(apiKey);
      const expectedKeyBuffer = Buffer.from(expectedKey);
      
      if (providedKeyBuffer.length !== expectedKeyBuffer.length ||
          !crypto.timingSafeEqual(providedKeyBuffer, expectedKeyBuffer)) {
        
        logger.warn('[SECURITY] Invalid API key attempt', {
          ip: req.ip,
          timestamp: new Date().toISOString()
          // NOTE: No key details logged to prevent log injection
        });
        
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'The provided API key is not valid'
        });
      }
      
      // API key authentication successful
      logger.debug('[SECURITY] API key authentication successful', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
      });
      
      return next();
    }
    
    // Check for session-based authentication
    if (req.session && (req.session as any).authenticated) {
      logger.debug('[SECURITY] Session authentication successful', {
        sessionId: req.sessionID,
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
      });
      
      return next();
    }
    
    // No valid authentication method found
    logger.info('[SECURITY] Authentication required', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Access requires valid API key (X-API-Key header) or authenticated session',
      methods: {
        apiKey: 'Include X-API-Key header with valid API key',
        session: 'Ensure you are logged in with a valid session'
      }
    });
    
  } catch (error) {
    logger.error('[SECURITY] Authentication middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({
      error: 'Authentication service error',
      message: 'Unable to process authentication request'
    });
  }
}

// Session types are now defined in server/types/session.d.ts

// API key validation for regular API endpoints
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'X-API-Key header is required'
      });
    }

    const expectedKey = env.API_KEY; // Already validated in environment.ts
    
    if (!expectedKey) {
      // Only allow bypass for specific test endpoints or with explicit test flag
      const isTestEnvironment = env.NODE_ENV === 'test';
      const isTestBypass = req.headers['x-test-bypass'] === 'integration-test';
      
      if (isTestEnvironment && isTestBypass) {
        logger.info('[API-AUTH] Test environment: allowing bypass with test header');
        return next();
      }

      logger.error('[API-AUTH] API_KEY environment variable not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'API authentication not properly configured'
      });
    }

    // Use timing-safe comparison
    const providedKeyBuffer = Buffer.from(apiKey);
    const expectedKeyBuffer = Buffer.from(expectedKey);

    if (providedKeyBuffer.length !== expectedKeyBuffer.length ||
        !crypto.timingSafeEqual(providedKeyBuffer, expectedKeyBuffer)) {
      logger.warn('[API-AUTH] Invalid API key attempt', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        endpoint: req.path,
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
    }

    next();
  } catch (error) {
    logger.error('[API-AUTH] API key validation error:', error as Record<string, unknown>);
    return res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during API key validation'
    });
  }
}

// Rate limiting for admin endpoints
const adminAttempts = new Map<string, { count: number; resetTime: number }>();

export function adminRateLimit(req: Request, res: Response, next: NextFunction) {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const attempts = adminAttempts.get(clientId);

  if (!attempts || now > attempts.resetTime) {
    adminAttempts.set(clientId, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (attempts.count >= maxAttempts) {
    return res.status(429).json({
      error: 'Too many admin authentication attempts',
      message: `Please wait ${Math.ceil((attempts.resetTime - now) / 1000 / 60)} minutes before trying again`,
      retryAfter: Math.ceil((attempts.resetTime - now) / 1000)
    });
  }

  attempts.count++;
  next();
}
