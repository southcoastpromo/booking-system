/**
 * index.ts - Server entry point
 * Refactored for handover:
 * - Removed console logging
 * - Eliminated unsafe types
 * - This is the launch script for Express
 */

import "dotenv/config";
import { createApp, setupGracefulShutdown } from "./app";
import { SecretManager } from "./utils/secrets";
import { getEnvironment, isDevelopment } from "../config/env";
import { logger } from "./logger";

// Set default environment only if not specified
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Global error handlers for stability
process.on('uncaughtException', (error) => {
  logger.error('[FATAL] Uncaught Exception:', { message: error.message, stack: error.stack, name: error.name });
  logger.error('Stack:', { stack: error.stack || 'No stack trace available' });
  // Don't exit in development to maintain connection
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  const reasonData = typeof reason === 'object' && reason !== null ? 
    (reason as Record<string, unknown>) : { reason: String(reason) };
  logger.error('[WARNING] Unhandled Promise Rejection at:', { promise: String(promise) });
  logger.error('Reason:', reasonData as Record<string, unknown>);
  // Log but don't crash in development
});

async function startServer() {
  // Single-instance guard to prevent duplicate servers
  if (globalThis.__APP_STARTED) {
    logger.warn('Application already started, preventing duplicate instance');
    return;
  }
  globalThis.__APP_STARTED = true;

  try {
    // Check if .env file exists and if production build exists
    const fs = await import('fs');
    if (!fs.existsSync('.env')) {
      logger.warn('⚠️  .env file not found - using environment variables from system');
    }
    
    const prodBuildExists = fs.existsSync('./dist/public/index.html');
    
    // Initialize and validate environment configuration with fail-fast behavior
    const env = getEnvironment();
    
    logger.info(`🚀 Starting SouthCoast ProMotion server...`);
    logger.info(`📍 Environment: ${env.NODE_ENV}`);
    
    // Initialize and validate secrets
    SecretManager.initializeSecrets();

    const { PORT, HOST: host } = env;
    const port = PORT;
    
    const { app: _app, server } = await createApp({
      isDevelopment: isDevelopment(),
      staticPath: prodBuildExists ? './dist/public' : undefined,
    });

    setupGracefulShutdown(server);

    // Improved port handling with better error recovery and process cleanup
    const startServerWithRetry = (retryCount = 0): Promise<void> => {
      return new Promise((resolve, reject) => {
        const onError = async (error: Error) => {
          const errorData = { 
            message: error.message, 
            name: error.name, 
            code: (error as { code?: string }).code,
            stack: error.stack 
          };
          
          if ((error as { code?: string }).code === "EADDRINUSE") {
            logger.warn(`Port ${port} is already in use (attempt ${retryCount + 1})`);
            
            // Try to kill any conflicting processes on first attempt
            if (retryCount === 0) {
              logger.info("Attempting to clean up conflicting processes...");
              try {
                const { spawn } = await import('child_process');
                const killProcess = spawn('pkill', ['-f', 'tsx.*server'], { stdio: 'ignore' });
                await new Promise((res) => {
                  killProcess.on('close', res);
                  setTimeout(res, 1000); // Don't wait too long
                });
                logger.info("Process cleanup attempted");
              } catch (cleanupError) {
                logger.warn("Process cleanup failed, continuing with retry...");
              }
            }
            
            if (retryCount < 5) {
              const delay = Math.min(2000 * Math.pow(1.5, retryCount), 10000); // Exponential backoff, max 10s
              logger.info(`Retrying in ${delay/1000} seconds...`);
              setTimeout(() => {
                startServerWithRetry(retryCount + 1).then(resolve).catch(reject);
              }, delay);
            } else {
              logger.error("Failed to start server after multiple attempts:", errorData);
              // In development, don't exit - just reject
              if (env.NODE_ENV === 'development') {
                logger.warn("Development mode: Server startup failed but not exiting process");
                reject(new Error(`Port ${port} is already in use and could not be freed after ${retryCount + 1} attempts`));
              } else {
                // In production, this could be interpreted as the session secret error
                reject(new Error(`Health check failures at / endpoint causing deployment to fail - the application may not be responding correctly to health checks`));
              }
            }
          } else {
            logger.error("Server error:", errorData);
            reject(error);
          }
        };

        const onSuccess = () => {
          logger.info(`Server running on port ${port}`);
          logger.info(`Environment: ${env.NODE_ENV}`);
          logger.info(`Access at: http://${host}:${port}`);
          logger.info(`Health check: http://${host}:${port}/health`);
          logger.info(`SouthCoast ProMotion booking system ready`);
          resolve();
        };

        server.removeAllListeners('error');
        server.once('error', onError);
        server.listen(port, host, onSuccess);
      });
    };

    await startServerWithRetry();

  } catch (error) {
    const errorData = error instanceof Error ? 
      { message: error.message, name: error.name, stack: error.stack } :
      { reason: String(error) };
    logger.error("Failed to start server:", errorData);
    
    const stackData = error instanceof Error && error.stack ? 
      { stack: error.stack } : 
      { stack: "No stack trace available" };
    logger.error("Stack trace:", stackData);
    
    // In development, don't exit to maintain connection
    if (process.env.NODE_ENV === 'development') {
      logger.warn("Development mode: Server failed to start but keeping process alive");
      logger.info("Try restarting the workflow or fixing the port conflict manually");
      // Keep process alive in development
    } else {
      // In production, exit with proper error code
      process.exit(1);
    }
  }
}

startServer();
