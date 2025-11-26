/**
 * app.ts - Main Express app config
 * Refactored for developer handover:
 * - Removed console.log usage
 * - Replaced unsafe 'any' with 'unknown'
 * - Valid for production deployment scaffolding
 */

import express from "express";
import { createServer } from "http";
import type { Server } from "http";
import path from "path";
import { existsSync } from "fs";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { env } from "../lib/environment";
import { HTTP_STATUS } from "../shared/config/constants";
import {
  APP_CONFIG,
  ERROR_MESSAGES,
  BUSINESS_CONFIG,
  FILE_PATHS,
  DEV_CONFIG
} from "../lib/config";
import { logger } from "./logger";
import { CampaignService } from "../services/campaignService";

// Universal server configuration
interface ServerConfig {
  isDevelopment: boolean;
  staticPath?: string;
}

export async function createApp(
  config: ServerConfig = {
    isDevelopment: process.env.NODE_ENV === "development",
  },
) {

  const app = express();
  const server = createServer(app);

  // Configure trust proxy for rate limiting
  app.set('trust proxy', 1);

  // Enable GZIP/Brotli compression for better performance
  app.use(compression({
    filter: (req: express.Request, res: express.Response) => {
      // Don't compress if compression is disabled for this request
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Use compression filter function
      return compression.filter(req, res);
    },
    level: 6, // Compression level 1-9 (6 = good balance of speed vs compression)
    threshold: 1024, // Only compress if response is > 1KB
  }));

  // Conditional session middleware - falls back to MemoryStore if database unavailable
  const { createSessionMiddleware, ensureSession } = await import('./middleware/session-setup');
  const sessionMiddleware = await createSessionMiddleware();
  app.use(sessionMiddleware);
  app.use(ensureSession);

  // UNIFIED SECURITY HARDENING - Single source of truth for all security middleware
  const { applyGlobalSecurity } = await import('./middleware/security');
  applyGlobalSecurity(app);

  // Monitoring system initialized

  // Real-time monitoring middleware
  const { performanceMonitor, errorMonitor, initializeMonitoring } = await import('./middleware/monitoring');
  app.use(performanceMonitor);
  app.use(errorMonitor);
  initializeMonitoring();

  // Note: Security headers (Helmet) applied via applyGlobalSecurity above

  // Note: CORS configuration applied via applyGlobalSecurity above

  // Note: Rate limiting applied via applyGlobalSecurity above

  // Body parsing with strict limits
  app.use(
    express.json({
      limit: APP_CONFIG.MAX_REQUEST_SIZE,
      strict: true,
      type: "application/json",
    }),
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: APP_CONFIG.MAX_REQUEST_SIZE,
      parameterLimit: APP_CONFIG.MAX_PARAMETER_COUNT,
    }),
  );

  // JSON parsing error handler
  app.use(
    (
      error: unknown,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (
        error instanceof SyntaxError &&
        "body" in error &&
        error.message.includes("JSON")
      ) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Invalid JSON format",
          message: "Request contains malformed JSON data",
        });
      }
      next(error);
    },
  );

  // Health check endpoints
  app.get("/health", (req, res) => {
    const memory = process.memoryUsage();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      metrics: { status: "ok" },
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    });
  });

  // Root endpoint - optimized for deployment health checks
  app.get("/", (req, res, next) => {
    // Fast response for health checks (JSON requests or deployment platforms)
    if (req.headers.accept?.includes("application/json") ||
        req.headers['user-agent']?.includes('GoogleHC') ||
        req.headers['user-agent']?.includes('CloudRun') ||
        req.headers['user-agent']?.includes('kube-probe') ||
        req.query.health === 'check') {
      return res.json({
        status: "healthy",
        app: BUSINESS_CONFIG.COMPANY_NAME,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
      });
    } else {
      // Always let static middleware handle HTML/browser requests
      next();
    }
  });

  // CONDITIONAL: Setup database and routes - graceful degradation when database unavailable
  let databaseAvailable = false;
  let storageMode = 'memory';

  try {
    // Check database availability before attempting connection
    const { checkDatabaseAvailability } = await import('./utils/database-check');
    const dbCheck = await checkDatabaseAvailability();

    if (dbCheck.isAvailable) {
      // Database is available - use full database setup
      const { setupDatabase } = await import("./db");
      await setupDatabase();
      databaseAvailable = true;
      storageMode = 'database';

      logger.info('[STARTUP] Using database storage', {
        mode: 'database',
        connection: 'postgresql'
      });
    } else {
      // Database not available - use memory storage
      logger.warn('[STARTUP] Database not available, using in-memory storage', {
        reason: dbCheck.reason,
        mode: 'memory',
        warning: 'Data will not persist between restarts'
      });
    }

    // Always register routes regardless of database availability
    const { registerRoutes } = await import("./routes");
    const _server = await registerRoutes(app, server);

    logger.info('[STARTUP] API routes registered successfully', {
      storageMode,
      databaseAvailable
    });

    // Monitoring routes already registered in registerRoutes

    // BACKUP DOWNLOAD ENDPOINT - Secure file serving
    app.get('/backup-download/:filename', async (req, res) => {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const filename = req.params.filename;

        // Security checks - prevent path traversal
        if (!filename.endsWith('.zip') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
          return res.status(400).json({ error: 'Invalid filename - only ZIP files without path separators allowed' });
        }

        // Use relative path from public directory
        const downloadsDir = path.resolve(publicPath, 'downloads');
        const filePath = path.resolve(downloadsDir, filename);

        // Ensure resolved path is within downloads directory
        if (!filePath.startsWith(downloadsDir)) {
          return res.status(400).json({ error: 'Invalid file path' });
        }

        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'Backup file not found' });
        }

        const stat = fs.statSync(filePath);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', stat.size);

        logger.info('Serving backup file', { filename, sizeMB: (stat.size/1024/1024).toFixed(2) });

        fs.createReadStream(filePath).pipe(res);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error serving backup', { error: errorMessage });
        res.status(500).json({ error: 'Download failed: ' + errorMessage });
      }
    });

    // SIMPLE DOWNLOAD ENDPOINT - Direct file serving
    app.get('/download/production-ready', async (req, res) => {
      try {
        const fs = await import('fs');
        const path = await import('path');

        const filePath = FILE_PATHS.PRODUCTION_DELIVERABLE;

        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'Production deliverable not found' });
        }

        const stat = fs.statSync(filePath);
        const fileName = path.basename(filePath);

        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', stat.size);

        logger.info('Serving production file', { fileName, sizeMB: (stat.size/1024/1024).toFixed(2) });

        fs.createReadStream(filePath).pipe(res);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error serving production file', { error: errorMessage });
        res.status(500).json({ error: 'Download failed: ' + errorMessage });
      }
    });

    logger.info('Direct download endpoint registered');

    // Setup Sentry error handling (must be after all routes, before other error handlers)
    // Error handling configured

    // Clear all caches before initializing
    const { cacheService } = await import('./services/cacheService.js');
    cacheService.invalidateAll();
    logger.info('All caches cleared on server startup');

    // ALWAYS re-initialize campaign data from CSV (force fresh data)
    await CampaignService.initializeCampaigns();


  } catch (error) {
    logger.error("[STARTUP] Critical failure during initialization", {
      error: error instanceof Error ? error.message : String(error),
      fallback: 'minimal API mode'
    });

    // Fallback to minimal API with in-memory storage
    try {
      const { registerRoutes } = await import("./routes");
      await registerRoutes(app, server);
      storageMode = 'memory-fallback';

      logger.warn('[STARTUP] Fallback routes registered', {
        mode: 'memory-fallback',
        warning: 'Limited functionality available'
      });
    } catch (routeError) {
      logger.error('[STARTUP] Route registration failed, using minimal endpoints', {
        error: routeError instanceof Error ? routeError.message : String(routeError)
      });

      // Minimal fallback endpoints
      app.get("/api/health", (req, res) => {
        res.json({
          status: "degraded",
          timestamp: new Date().toISOString(),
          mode: "minimal-fallback",
          database: "unavailable"
        });
      });

      app.get("/api/campaigns", (req, res) => {
        res.json({
          success: false,
          error: "Service temporarily unavailable - database connection failed",
          mode: "fallback"
        });
      });

      app.post("/api/bookings", (req, res) => {
        res.json({
          success: false,
          error: "Booking service temporarily unavailable - database connection failed",
          mode: "fallback"
        });
      });
    }
  }

  // PRODUCTION STATIC SERVING - robust path detection
  const cwd = process.cwd();
  
  // In development without staticPath, serve from client/index.html via Vite
  // If staticPath is provided OR not in development, serve from dist/public
  let publicPath: string;
  let indexHtmlPath: string;
  const useVite = config.isDevelopment && !config.staticPath;
  
  if (useVite) {
    // Development mode WITHOUT static build - use Vite to serve client files
    publicPath = path.resolve(cwd, 'client/public');
    indexHtmlPath = path.resolve(cwd, 'client/index.html');
  } else {
    // Production mode OR staticPath provided - serve built files
    const buildPath = config.staticPath || path.resolve(cwd, 'dist/public');
    publicPath = path.resolve(cwd, buildPath);
    indexHtmlPath = path.resolve(publicPath, 'index.html');
    
    if (!existsSync(publicPath)) {
      logger.error(`Build directory not found. Path: ${buildPath}`);
      throw new Error(`Build directory not found at ${buildPath}`);
    }
  }

  logger.info("Static files configuration", {
    workingDirectory: cwd,
    staticFilesDirectory: publicPath,
    indexHtmlPath,
    isDevelopment: config.isDevelopment,
    useVite,
    staticPath: config.staticPath
  });

  // Serve attached assets (campaign images, etc.) at /assets path
  const attachedAssetsPath = path.resolve(cwd, 'attached_assets');
  app.use('/assets', express.static(attachedAssetsPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      }
    }
  }));
  logger.info('Attached assets serving configured', { path: '/assets', directory: attachedAssetsPath });

  // DEVELOPMENT WITHOUT STATIC BUILD: Use Vite middleware
  if (useVite) {
    const { setupVite } = await import('./vite');
    await setupVite(app, server);
    logger.info('Vite development server initialized');
  } else {
    // PRODUCTION: Serve static files
    app.use(express.static(publicPath, {
    setHeaders: (res, filePath) => {
      // Ensure proper MIME types for JavaScript modules and CSS
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
    }
  }));

    // Handle React Router - serve index.html for all non-API, non-asset routes (production only)
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api/") && !req.path.startsWith("/assets/")) {
        res.sendFile(indexHtmlPath, (err) => {
          if (err) {
            logger.error("Error serving index.html", {
              error: err.message,
              publicPath,
              indexHtmlPath,
              cwd: process.cwd()
            });
            res.status(500).send(`Error serving file: ${err.message}`);
          }
        });
      } else {
        res.status(404).json({ error: "API endpoint not found" });
      }
    });
  }
  
  // TIER 2: Unified Error Handler (must be LAST middleware)
  const { unifiedErrorHandler } = await import('./middleware/unified-error-strategy');
  app.use(unifiedErrorHandler);

  return { app, server };
}

// Graceful shutdown handler
export function setupGracefulShutdown(server: Server) {
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    server.close(() => {
      logger.info("Server closed gracefully");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    logger.info("SIGINT received, shutting down gracefully");
    server.close(() => {
      logger.info("Server closed gracefully");
      process.exit(0);
    });
  });

  // Handle server errors with fast-fail on port conflicts
  server.on("error", (error: NodeJS.ErrnoException) => {
    logger.error("Server error", {
      error: error.message,
      code: error.code
    });

    if (error.code === "EADDRINUSE") {
      logger.error("FATAL: Port is already in use - exiting to prevent duplicate servers");
      // Clear startup guard and exit immediately
      globalThis.__APP_STARTED = false;
      process.exit(1);
    } else if (process.env.NODE_ENV === "production") {
      // In production, try to keep the server alive for non-critical errors
      logger.warn("Non-critical server error in production, continuing operation");
    } else {
      process.exit(1);
    }
  });
}
