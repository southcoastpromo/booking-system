/**
 * Conditional Session Management
 * Uses PostgreSQL store when available, falls back to MemoryStore for development/startup
 */

import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import type { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { env, isProduction } from '../../lib/environment';
import { logger } from '../logger';
import { checkDatabaseAvailability, checkDatabaseSecrets } from '../utils/database-check';

// Initialize session stores
const PostgreSQLStore = connectPgSimple(session);

/**
 * Create session middleware based on database availability
 */
export async function createSessionMiddleware() {
  try {
    // Check if database and secrets are available
    const dbAvailability = await checkDatabaseAvailability();
    const secretsAvailable = checkDatabaseSecrets();
    
    const canUseDatabaseSessions = dbAvailability.isAvailable && secretsAvailable;
    
    if (canUseDatabaseSessions) {
      logger.info('[SESSION] Using PostgreSQL session store', {
        database: 'available',
        secrets: 'configured'
      });
      
      return session({
        store: new PostgreSQLStore({
          conString: env.DATABASE_URL,
          tableName: 'session',
          createTableIfMissing: true,
        }),
        secret: env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: isProduction(),
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: 'strict',
        },
        name: 'southcoast.sid'
      });
    } else {
      // Fall back to memory store with warning
      logger.warn('[SESSION] Using MemoryStore fallback', {
        reason: dbAvailability.reason || 'secrets not configured',
        warning: 'Sessions will not persist across server restarts'
      });
      
      // Generate a fallback secret if needed
      const sessionSecret = env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
      
      return session({
        // Note: MemoryStore is the default when no store is specified
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: false, // Can't use secure cookies without proper secrets
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: 'lax', // More permissive for development
        },
        name: 'southcoast.dev.sid'
      });
    }
  } catch (error) {
    logger.error('[SESSION] Failed to create session middleware, using memory fallback', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Ultimate fallback
    return session({
      secret: crypto.randomBytes(32).toString('hex'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 60 * 60 * 1000, // 1 hour for fallback mode
        sameSite: 'lax',
      },
      name: 'southcoast.fallback.sid'
    });
  }
}

// Backwards compatibility - will be replaced by conditional initialization
export let sessionMiddleware: any;

// Middleware to ensure session is initialized
export const ensureSession = (req: Request, res: Response, next: NextFunction) => {
  // Ensure session exists
  if (!req.session) {
    logger.warn(`[SESSION] No session found, initializing new session for ${req.ip}`);
  }

  // Generate CSRF token if needed
  if (req.session && !req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    logger.info('[SESSION] Generated CSRF token for session');
  }

  next();
};

// CSRF token endpoint
export const provideCsrfToken = (req: Request, res: Response) => {
  const token = req.session?.csrfToken || 'development-token';

  res.json({
    csrfToken: token,
    timestamp: new Date().toISOString()
  });
};
