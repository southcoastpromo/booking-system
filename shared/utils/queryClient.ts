// Memory management utilities available if needed

import type { QueryFunction, QueryOptions } from "@tanstack/react-query";

/**
 * ENTERPRISE QUERY CACHE STRATEGIES
 * 
 * Optimized cache configurations for different data types to achieve
 * enterprise-grade performance and reduce unnecessary network requests
 * 
 * PERFORMANCE TARGETS:
 * - 80%+ cache hit rate for static data
 * - <150ms average API response time
 * - Reduced network requests by 40%
 * - Data freshness balanced with performance
 */

// Static campaign data - changes infrequently, cache longer
export const CAMPAIGN_CACHE_CONFIG = {
  staleTime: 15 * 60 * 1000, // 15 minutes - campaigns are relatively static
  gcTime: 30 * 60 * 1000,   // 30 minutes - keep in memory longer
  refetchOnMount: false,     // Don't refetch if data is fresh
  refetchOnWindowFocus: false,
  refetchInterval: false,
} as const;

// Dynamic booking data - changes frequently, shorter cache
export const BOOKING_CACHE_CONFIG = {
  staleTime: 2 * 60 * 1000,  // 2 minutes - bookings change frequently
  gcTime: 10 * 60 * 1000,   // 10 minutes - moderate memory retention
  refetchOnMount: true,      // Always refetch latest booking status
  refetchOnWindowFocus: true,
  refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
} as const;

// Analytics data - medium volatility
export const ANALYTICS_CACHE_CONFIG = {
  staleTime: 10 * 60 * 1000, // 10 minutes - analytics update periodically
  gcTime: 20 * 60 * 1000,   // 20 minutes - analytics can be cached longer
  refetchOnMount: false,     // Analytics don't need immediate refresh
  refetchOnWindowFocus: false,
  refetchInterval: false,
} as const;

// Customer-specific data - moderate freshness requirements
export const CUSTOMER_CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000,  // 5 minutes - customer data moderate freshness
  gcTime: 15 * 60 * 1000,   // 15 minutes - reasonable memory retention
  refetchOnMount: false,
  refetchOnWindowFocus: true, // Refetch when user returns to tab
  refetchInterval: false,
} as const;

// Admin data - requires fresh data for management decisions
export const ADMIN_CACHE_CONFIG = {
  staleTime: 1 * 60 * 1000,  // 1 minute - admin data needs to be fresh
  gcTime: 5 * 60 * 1000,    // 5 minutes - shorter retention for admin data
  refetchOnMount: true,      // Always get latest admin data
  refetchOnWindowFocus: true,
  refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
} as const;

// Real-time system monitoring data
export const MONITORING_CACHE_CONFIG = {
  staleTime: 30 * 1000,      // 30 seconds - very fresh monitoring data
  gcTime: 2 * 60 * 1000,    // 2 minutes - short retention
  refetchOnMount: true,      // Always get latest system status
  refetchOnWindowFocus: true,
  refetchInterval: 60 * 1000, // Auto-refresh every minute
} as const;
import { QueryClient } from "@tanstack/react-query";
import {
  NETWORK_CONFIG,
  API_ENDPOINTS,
  HTTP_STATUS,
  ERROR_MESSAGES
} from "./config";
import { LocalStorage, SessionStorage } from "./safe-storage";

// CSRF token cache
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Get CSRF token from server
async function getCSRFToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  if (csrfTokenPromise) return csrfTokenPromise;

  csrfTokenPromise = (async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CSRF_TOKEN, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();
      csrfToken = data.csrfToken;
      return csrfToken!;
    } catch (err) {
      console.error("Fetch failed:", err);
      csrfTokenPromise = null;
      throw new Error("Failed to obtain CSRF token. Please refresh the page.");
    }
  })();

  return csrfTokenPromise;
}

// Refresh CSRF token on 403 errors
function refreshCSRFToken() {
  csrfToken = null;
  csrfTokenPromise = null;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NETWORK_CONFIG.REQUEST_TIMEOUT);

  try {
    // Get CSRF token for non-GET requests
    let token = "";
    if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
      token = await getCSRFToken();
    }

    const headers: Record<string, string> = {
      "X-Requested-With": "XMLHttpRequest",
    };

    if (data) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["X-CSRF-Token"] = token;
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle CSRF token errors
      if (res.status === HTTP_STATUS.FORBIDDEN) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.code === "CSRF_TOKEN_INVALID") {
          refreshCSRFToken();
          throw new Error("CSRF token expired. Please try again.");
        }
      }

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      return res;
    } catch (err) {
      console.error("Fetch failed:", err);
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }
      throw err;
    }
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;

    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === HTTP_STATUS.UNAUTHORIZED) {
        return null;
      }

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Fetch failed:", err);
      return null;
    }
  };

/**
 * ENTERPRISE QUERY CLIENT - Performance Optimized
 * 
 * Implements intelligent caching strategies based on data type volatility:
 * - Static data (campaigns): 15min cache for reduced requests
 * - Dynamic data (bookings): 2min cache for freshness
 * - Analytics: 10min cache for balanced performance/freshness
 * - Admin data: 1min cache for management accuracy
 * - Monitoring: 30s cache for real-time visibility
 * 
 * Performance targets:
 * - 80%+ cache hit rate for static data
 * - <150ms average API response time
 * - Reduced network requests by 40%
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      // Conservative defaults - override with specific configs above
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes default
      gcTime: 10 * 60 * 1000,  // 10 minutes default
      refetchInterval: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: (failureCount, error: Error) => {
        // Enhanced error handling for better performance
        if (error?.message?.includes('Server routing error') ||
            error?.message?.includes('received HTML instead of JSON')) {
          if (failureCount < 3) {  // Limited retries for routing errors
            return true;
          }
          return false;
        }

        // Fail fast for client errors (4xx)
        if (error?.message?.includes('40')) {
          return false;
        }

        // Standard retry for server errors (5xx)
        return failureCount < 2;
      },
      retryDelay: (attemptIndex, error: Error) => {
        // Adaptive retry delays based on error type
        if (error?.message?.includes('Server routing error') ||
            error?.message?.includes('received HTML instead of JSON')) {
          return Math.min(2000 * (attemptIndex + 1), 10000);  // Progressive delay
        }
        // Exponential backoff with jitter to prevent thundering herd
        const baseDelay = 1000 * 2 ** attemptIndex;
        const jitter = Math.random() * 500; // Add randomness
        return Math.min(baseDelay + jitter, 30000);
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        if (failureCount >= NETWORK_CONFIG.RETRY_ATTEMPTS_MUTATIONS) return false;
        // Fail fast for client errors
        if (error instanceof Error && error.message.includes("4")) return false;
        return true;
      },
      retryDelay: NETWORK_CONFIG.RETRY_DELAY_BASE,
    },
  },
});

/**
 * SMART QUERY FACTORY FUNCTIONS
 * Creates optimized queries with data-specific cache configurations
 */
export const createCampaignQuery = (queryKey: unknown[], options?: Partial<QueryOptions>) => ({
  queryKey,
  ...CAMPAIGN_CACHE_CONFIG,
  ...options,
});

export const createBookingQuery = (queryKey: unknown[], options?: Partial<QueryOptions>) => ({
  queryKey,
  ...BOOKING_CACHE_CONFIG,
  ...options,
});

export const createAnalyticsQuery = (queryKey: unknown[], options?: Partial<QueryOptions>) => ({
  queryKey,
  ...ANALYTICS_CACHE_CONFIG,
  ...options,
});

export const createCustomerQuery = (queryKey: unknown[], options?: Partial<QueryOptions>) => ({
  queryKey,
  ...CUSTOMER_CACHE_CONFIG,
  ...options,
});

export const createAdminQuery = (queryKey: unknown[], options?: Partial<QueryOptions>) => ({
  queryKey,
  ...ADMIN_CACHE_CONFIG,
  ...options,
});

export const createMonitoringQuery = (queryKey: unknown[], options?: Partial<QueryOptions>) => ({
  queryKey,
  ...MONITORING_CACHE_CONFIG,
  ...options,
});

// Cache clearing utilities
export async function clearAllCaches() {
  // Clear React Query cache
  queryClient.clear();

  // Clear browser caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }

  // Clear local storage safely
  const localResult = LocalStorage.clear();
  if (!localResult.success) {
    console.warn('[CACHE] Failed to clear localStorage:', localResult.error);
  }
  
  const sessionResult = SessionStorage.clear();
  if (!sessionResult.success) {
    console.warn('[CACHE] Failed to clear sessionStorage:', sessionResult.error);
  }

  // Clear server-side caches
  try {
    const response = await fetch('/api/cache/clear-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      console.log('[CACHE] Server caches cleared successfully');
    } else {
      console.warn('[CACHE] Failed to clear server caches:', response.statusText);
    }
  } catch (error) {
    console.warn('[CACHE] Error clearing server caches:', error);
  }

  // Refresh CSRF token
  refreshCSRFToken();

  console.log('[CACHE] All caches cleared');
}

export function clearQueryCache() {
  queryClient.clear();
}

export function invalidateQueries(queryKey?: string[]) {
  if (queryKey) {
    queryClient.invalidateQueries({ queryKey });
  } else {
    queryClient.invalidateQueries();
  }
}
