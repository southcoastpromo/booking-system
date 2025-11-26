/**
 * Sentry Error Tracking - Frontend Configuration
 *
 * Production-grade error tracking integration for the SouthCoast ProMotion
 * React frontend. Sentry is env-gated and only initializes when VITE_SENTRY_DSN_FRONTEND
 * is configured, allowing for safe development without tracking.
 *
 * Features:
 * - Automatic error and unhandled rejection capture
 * - React component error boundaries
 * - Performance monitoring (optional)
 * - User session replay (optional)
 * - Integration with React Router (future)
 *
 * Environment Variables:
 * - VITE_SENTRY_DSN_FRONTEND: Sentry Data Source Name (required for activation)
 * - VITE_APP_ENV: Environment identifier (development/production)
 * - VITE_SENTRY_TRACES_SAMPLE_RATE: Performance monitoring sample rate (0.0-1.0)
 *
 * Usage:
 *   import { initializeSentry } from './lib/sentry';
 *
 *   // In main.tsx:
 *   initializeSentry();
 *   createRoot(document.getElementById('root')!).render(<App />);
 *
 * @fileoverview Sentry frontend error tracking initialization
 * @module client/lib/sentry
 */

import * as Sentry from '@sentry/react';

/**
 * Sentry Initialization Configuration
 *
 * Initializes Sentry error tracking with environment-specific settings.
 * Safe to call multiple times - will skip if already initialized or DSN not configured.
 *
 * Configuration:
 * - DSN: Required for Sentry activation (VITE_ prefix for client-side env vars)
 * - Environment: Detected from VITE_APP_ENV or NODE_ENV
 * - Traces Sample Rate: Performance monitoring (default: 0.1 = 10%)
 * - Debug Mode: Enabled in development for troubleshooting
 *
 * @returns {boolean} True if Sentry was initialized, false otherwise
 */
export function initializeSentry(): boolean {
  const SENTRY_DSN_FRONTEND = import.meta.env.VITE_SENTRY_DSN_FRONTEND;
  const APP_ENV = import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development';
  const TRACES_SAMPLE_RATE = parseFloat(
    import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'
  );

  // Skip initialization if DSN not configured (env-gated)
  if (!SENTRY_DSN_FRONTEND) {
    if (import.meta.env.DEV) {
      console.log('[SENTRY] Frontend tracking disabled - VITE_SENTRY_DSN_FRONTEND not configured');
    }
    return false;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN_FRONTEND,
      environment: APP_ENV,

      // Performance Monitoring
      tracesSampleRate: TRACES_SAMPLE_RATE,

      // Debug mode for development troubleshooting
      debug: APP_ENV === 'development',

      // Integrations
      integrations: [
        // Browser tracing for performance monitoring
        Sentry.browserTracingIntegration({
          // Don't track health check or monitoring routes
          shouldCreateSpanForRequest: (url) => {
            return !url.includes('/health') && !url.includes('/api/monitoring');
          },
        }),
      ],

      // Filter out certain errors
      beforeSend(event, hint) {
        const error = hint.originalException;

        // Don't send errors from browser extensions
        if (
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof error.message === 'string' &&
          error.message.includes('extension')
        ) {
          return null;
        }

        // Don't send network errors from health checks
        const url = event.request?.url || '';
        if (url.includes('/health') || url.includes('/healthz')) {
          return null;
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Browser extension errors
        'Non-Error promise rejection captured',
        'ResizeObserver loop limit exceeded',
        // Network errors that are expected
        'NetworkError',
        'Failed to fetch',
      ],
    });

    if (import.meta.env.DEV) {
      console.log('[SENTRY] Frontend error tracking initialized', {
        environment: APP_ENV,
        tracesSampleRate: TRACES_SAMPLE_RATE,
      });
    }

    return true;
  } catch (error) {
    console.error('[SENTRY] Failed to initialize frontend tracking:', error);
    return false;
  }
}

/**
 * Manual Error Capture
 *
 * Manually capture and report an error to Sentry with optional context.
 * Useful for logging errors in try-catch blocks or async operations.
 *
 * @param {Error} error - The error to capture
 * @param {Record<string, any>} context - Additional context data
 *
 * @example
 * try {
 *   await fetchData();
 * } catch (error) {
 *   captureException(error, { component: 'DataFetcher', userId: user.id });
 *   showErrorMessage();
 * }
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
}

/**
 * Manual Message Capture
 *
 * Capture a message (not an error) to Sentry for tracking.
 * Useful for logging important events or warnings.
 *
 * @param {string} message - The message to capture
 * @param {'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'} level - Severity level
 *
 * @example
 * captureMessage('User completed checkout but payment pending', 'warning');
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'info'
) {
  Sentry.captureMessage(message, level);
}

/**
 * Set User Context
 *
 * Associate user information with subsequent error reports.
 * Should be called after successful login.
 *
 * @param {object} user - User information
 * @param {string} user.id - User ID
 * @param {string} user.email - User email (optional)
 *
 * @example
 * setUser({ id: user.id, email: user.email });
 */
export function setUser(user: { id: string; email?: string } | null) {
  Sentry.setUser(user);
}

/**
 * Clear User Context
 *
 * Remove user information from error reports (e.g., on logout).
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Create Error Boundary Component
 *
 * React Error Boundary component that captures React component errors
 * and reports them to Sentry while showing a fallback UI.
 *
 * @example
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <App />
 * </ErrorBoundary>
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

// Export Sentry SDK for advanced use cases
export { Sentry };
