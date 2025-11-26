/**
 * routes.ts - Main API router config
 * Refactored for handover:
 * - Debug logs removed
 * - Unsafe types replaced with 'unknown'
 */

/**
 * SLIM ROUTES ORCHESTRATOR
 * Refactored from 1,233-line monolith to clean architecture
 * All route logic extracted to dedicated modules
 */

import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { CampaignService } from "../services/campaignService";
import { storage } from "./storage";
import { logger } from "./logger";
import { monitoring } from "./monitoring";
import { httpsRedirect } from "./middleware/security";
import healthRoutes from "./routes/health";
import authRoutes from "./routes/auth";
import bookingRoutes from "./routes/bookings";
import monitoringRoutes from "./routes/monitoring";
import adminRoutes from './routes/admin';
import uploadsRoutes from './routes/uploads';
import { NETWORK_CONFIG } from "../shared/config/constants";
import { ENV_CONFIG } from "../lib/config";
import { requireAdminAuth } from "./middleware/auth";
import rateLimit from "express-rate-limit";

// Create a general rate limiter
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// WebSocket clients for real-time updates
const wsClients = new Set<WebSocket>();

// Broadcast campaign updates to all connected clients
export const broadcastCampaignUpdate = (
  type: "booking" | "availability",
  data: { campaignId: number; bookingId?: number; slotsBooked?: number; availability?: string; }
) => {
  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString(),
  });
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

export async function registerRoutes(app: Express, server: Server): Promise<Server> {
  // Use existing server instead of creating duplicate

  // CRITICAL: API route protection
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-API-Route', 'protected');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.locals.isApiRoute = true;
    next();
  });

  // Security middleware
  app.use(httpsRedirect);
  // Note: Security headers applied via applyGlobalSecurity in security.ts

  // Initialize storage system
  try {
    await storage.initialize();
    await logger.info('Routes: Storage system initialized');
  } catch (error) {
    await logger.error('Routes: Failed to initialize storage', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error('Critical: Storage initialization failed');
  }

  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server, path: NETWORK_CONFIG.WEBSOCKET_PATH });

  wss.on("connection", (ws: WebSocket) => {
    wsClients.add(ws);

    ws.on("close", () => {
      wsClients.delete(ws);
    });

    ws.on("error", (error) => {
      if (ENV_CONFIG.NODE_ENV === "development") {
        logger.error('WebSocket error', { error });
      }
      wsClients.delete(ws);
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: "connection",
      data: { status: "connected" },
      timestamp: new Date().toISOString(),
    }));
  });

  // MOUNT ROUTE MODULES WITH RATE LIMITING
  app.use('/', healthRoutes);                                           // Health checks: /health, /healthz (no rate limit)
  app.use('/api/auth', apiRateLimiter, authRoutes);                     // Auth routes with rate limiting
  app.use('/api/bookings', apiRateLimiter, bookingRoutes);              // Bookings with rate limiting
  app.use('/api/admin', apiRateLimiter, adminRoutes);                   // Admin routes with rate limiting
  app.use('/api/uploads', apiRateLimiter, uploadsRoutes);               // File uploads with rate limiting
  app.use('/api', monitoringRoutes);                                    // Monitoring routes (no rate limit)


  // CAMPAIGNS API - Enhanced with input validation
  app.get("/api/campaigns", apiRateLimiter, async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      // Input validation for query parameters
      const querySchema = z.object({
        location: z.string().optional(),
        availability: z.enum(['available', 'limited', 'full']).optional(),
        limit: z.coerce.number().int().min(1).max(1000).optional(),
        offset: z.coerce.number().int().min(0).optional()
      });

      const queryResult = querySchema.safeParse(req.query);
      if (!queryResult.success) {
        await logger.warn('Invalid campaign query parameters', {
          errors: queryResult.error.issues,
          query: req.query
        });
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: queryResult.error.issues,
          timestamp: new Date().toISOString(),
        });
      }

      await logger.debug('Fetching campaigns', { query: req.query });
      const campaignsResult = await CampaignService.getCampaigns();
      const responseTime = Date.now() - startTime;

      if (!campaignsResult.success) {
        await logger.error('Campaign service error', {
          error: campaignsResult.error,
          responseTime
        });
        monitoring.trackRequest(req.method, req.path, 500, responseTime);
        return res.status(500).json({
          error: 'Failed to retrieve campaigns',
          message: campaignsResult.error,
          timestamp: new Date().toISOString(),
        });
      }

      const campaigns = campaignsResult.data;
      monitoring.trackRequest(req.method, req.path, 200, responseTime);
      await logger.info('Campaigns retrieved successfully', {
        count: campaigns.length,
        responseTime,
        hasFilters: Object.keys(req.query).length > 0
      });

      res.json({
        campaigns,
        count: campaigns.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      await logger.error('Unexpected error in campaigns endpoint', {
        error: errorMessage,
        stack: errorStack,
        responseTime
      });

      monitoring.trackRequest(req.method, req.path, 500, responseTime);

      return res.status(500).json({
        error: 'Failed to retrieve campaigns',
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substring(7),
      });
    }
  });

  // Simple feedback endpoint
  app.post("/api/feedback", apiRateLimiter, async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      const { message, rating, category } = req.body;

      if (!message || !rating) {
        monitoring.trackRequest(req.method, req.path, 400, Date.now() - startTime);
        return res.status(400).json({
          error: 'Message and rating are required',
          timestamp: new Date().toISOString(),
        });
      }

      // Log feedback for now - could be enhanced with database storage
      await logger.info('User feedback received', {
        message,
        rating,
        category: category || 'general',
        timestamp: new Date().toISOString(),
        ip: req.ip
      });

      const responseTime = Date.now() - startTime;
      monitoring.trackRequest(req.method, req.path, 200, responseTime);

      res.json({
        success: true,
        message: 'Feedback received successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      await logger.error('Failed to process feedback', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      monitoring.trackRequest(req.method, req.path, 500, responseTime);

      return res.status(500).json({
        error: 'Failed to process feedback',
        timestamp: new Date().toISOString(),
      });
    }
  });

  await logger.info('All route modules registered successfully');

  return server;
}
