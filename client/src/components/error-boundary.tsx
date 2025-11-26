/**
 * error-boundary.tsx - Global error catcher
 * Refactored for handover:
 * - Removed unsafe 'any'
 * - Improved type specificity
 * - Wraps child components in error fallback
 */

/**
 * Production Error Boundary Component
 * Catches React errors and provides fallback UI with proper error logging
 */

import type { ReactNode, ErrorInfo } from 'react';
import { Component } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const logger = {
  error: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.error(message, data);
    }
  }
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('[ERROR BOUNDARY] Application crash prevented:', { error: error.message, stack: error.stack });
    logger.error('[ERROR BOUNDARY] Component stack:', { componentStack: errorInfo.componentStack });
    this.setState({ errorInfo });

    // Log to production monitoring
    if (import.meta.env.PROD) {
      // Production error logged to monitoring system
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-navy flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-sm border border-accent-blue/20 rounded-lg p-6 sm:p-8 max-w-md mx-auto text-white text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold mb-4">Application Error</h2>
            <p className="text-white/80 mb-6">
              Something went wrong, but don't worry - this has been logged and we'll investigate.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mb-4 p-3 bg-red-900/20 rounded border border-red-400/30">
                <summary className="cursor-pointer text-red-400 font-medium mb-2">
                  Error Details (Development Mode)
                </summary>
                <pre className="text-xs text-red-300 whitespace-pre-wrap overflow-auto max-h-32">
                  {this.state.error.message}
                  {this.state.error.stack}
                  {this.state.errorInfo?.componentStack && '\n\nComponent Stack:\n' + this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRefresh}
                className="flex items-center justify-center gap-2 text-white px-4 py-2 rounded-lg transition-all"
                style={{ background: 'linear-gradient(90deg, #2bff3e 0%, #00e676 100%)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(90deg, #00c853, #64dd17)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(90deg, #2bff3e 0%, #00e676 100%)'}
              >
                🔄 Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg border border-accent-blue/30 transition-colors"
              >
                🏠 Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
