/**
 * Authentication Routes
 * Extracted from bloated routes.ts for better organization
 */

import type { Request, Response } from 'express';
import { Router } from 'express';

// Session types imported automatically from server/types/session.d.ts
import { AuthService } from '../../services/authService';
import { logger } from '../logger';
import { monitoring } from '../monitoring';
// Note: Input validation is handled by the unified security middleware in security.ts"

const router = Router();

import { sendErrorResponse } from '../utils/response-helpers';

/**
 * User Authentication - Login
 */
router.post("/login", async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      monitoring.trackRequest(req.method, req.path, 400, Date.now() - startTime);
      return sendErrorResponse(res, 400, 'Username and password are required');
    }

    const userResult = await AuthService.authenticateUser(username, password);

    if (!userResult.success) {
      monitoring.trackRequest(req.method, req.path, 401, Date.now() - startTime);
      return sendErrorResponse(res, 401, 'Invalid credentials');
    }

    const user = userResult.data;

    // Create session
    if (req.session) {
      req.session.userId = user.id;
      req.session.email = user.email;
      req.session.role = user.role || undefined;
      (req.session as any).isAuthenticated = true;
    }

    const responseTime = Date.now() - startTime;
    monitoring.trackRequest(req.method, req.path, 200, responseTime);

    await logger.info('User login successful', {
      userId: user.id,
      username: user.email,
      responseTime
    });

    // Provide CSRF token for subsequent requests
    const csrfToken = req.session?.csrfToken;

    res.json({
      success: true,
      user,
      csrfToken
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    await logger.error('Login error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });

    monitoring.trackRequest(req.method, req.path, 500, responseTime);

    return sendErrorResponse(res, 500, 'Authentication service error');
  }
});

/**
 * User Authentication - Logout
 */
router.post("/logout", async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    if (req.session) {
      (req.session as any).destroy((err?: Error) => {
        if (err) {
          logger.error('Session destruction error', { error: err.message });
        }
      });
    }

    const responseTime = Date.now() - startTime;
    monitoring.trackRequest(req.method, req.path, 200, responseTime);

    await logger.info('User logout successful', { responseTime });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    await logger.error('Logout error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });

    monitoring.trackRequest(req.method, req.path, 500, responseTime);

    return sendErrorResponse(res, 500, 'Logout failed');
  }
});

export default router;
