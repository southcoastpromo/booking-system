/**
 * Database Availability Check Utility
 * Provides safe database connectivity testing without throwing errors
 */

import { logger } from '../logger';

export interface DatabaseAvailability {
  isAvailable: boolean;
  reason?: string;
  connectionString?: string;
}

/**
 * Safely check if database is available without throwing errors
 */
export async function checkDatabaseAvailability(): Promise<DatabaseAvailability> {
  try {
    // Check if DATABASE_URL is configured
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl || databaseUrl.trim() === '') {
      return {
        isAvailable: false,
        reason: 'DATABASE_URL environment variable not configured'
      };
    }

    // Validate database URL format
    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      return {
        isAvailable: false,
        reason: 'DATABASE_URL is not a valid PostgreSQL connection string'
      };
    }

    // Try to create a connection and test it quickly
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(databaseUrl);
    
    // Quick connection test with timeout
    const testQuery = sql`SELECT 1 as test`;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    );
    
    await Promise.race([testQuery, timeoutPromise]);
    
    logger.info('[DB-CHECK] Database is available', { 
      connectionConfigured: true,
      testPassed: true 
    });
    
    return {
      isAvailable: true,
      connectionString: databaseUrl.replace(/\/\/[^@]+@/, '//***:***@') // Mask credentials
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('[DB-CHECK] Database not available', { 
      error: errorMessage,
      fallbackMode: 'in-memory storage will be used'
    });
    
    return {
      isAvailable: false,
      reason: `Database connection failed: ${errorMessage}`
    };
  }
}

/**
 * Check if required secrets are available for database operations
 */
export function checkDatabaseSecrets(): boolean {
  const requiredSecrets = ['SESSION_SECRET'];
  const missingSecrets = requiredSecrets.filter(secret => 
    !process.env[secret] || process.env[secret]?.trim() === ''
  );
  
  if (missingSecrets.length > 0) {
    logger.warn('[DB-CHECK] Missing required secrets for database sessions', { 
      missing: missingSecrets,
      fallbackMode: 'memory sessions will be used'
    });
    return false;
  }
  
  return true;
}
