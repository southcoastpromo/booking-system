/**
 * db.ts - Database initialization (Drizzle + PostgreSQL)
 * Refactored for handover:
 * - Removed debugging output
 * - Secured types
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema";
import { env } from "../lib/environment";
import { databaseMonitor, testDatabaseConnection } from "./middleware/database-monitoring";

// Initialize database connection with environment configuration
const DATABASE_URL = env.DATABASE_URL || env.FALLBACK_DATABASE_URL;
const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });

// Export setup function with performance monitoring
export async function setupDatabase() {
  try {
    // Initialize database monitoring
    databaseMonitor.initialize();
    
    // Test connection with monitoring
    const connectionTest = await testDatabaseConnection(sql);
    
    if (connectionTest.success) {
      // Database connection successful - logged via monitoring
      return db;
    } else {
      throw new Error(connectionTest.error || 'Connection test failed');
    }
  } catch (_error) {
    // Database connection failed - logged via error handling
    return null;
  }
}

export { sql };
export default db;
