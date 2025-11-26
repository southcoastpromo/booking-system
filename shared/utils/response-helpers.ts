/**
 * Shared Response Utilities
 * Consolidates error response handling across all route files
 * DEPRECATED: Use new error handler middleware for better error management
 */

import type { Response } from 'express';
// Only importing what's needed for the remaining function

/**
 * Standardized error response helper
 * @deprecated Use the new error handler middleware instead
 */
export const sendErrorResponse = (res: Response, status: number, message: string) => {
  const sanitizedMessage = message.replace(/[<>"'&]/g, "");
  const response = {
    error: sanitizedMessage,
    timestamp: new Date().toISOString(),
    requestId: Math.random().toString(36).substring(7),
  };

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  return res.status(status).json(response);
};

// Removed unused exports: createValidationError, createBusinessLogicError, 
// createNotFoundError, sendSuccessResponse, sendValidationError
// These functions were not used anywhere in the codebase
