/**
 * PERFORMANCE OPTIMIZATION UTILITIES
 * Separated from utils.ts to resolve dynamic/static import conflicts
 * These utilities are dynamically imported in main.tsx for performance reasons
 */

// Resource preloading (fixed based on architect feedback)
export const addCriticalResourceHints = () => {
  if (typeof document === 'undefined') return;

  const head = document.head;

  // Ensure font connections are established (already in index.html but adding programmatically as backup)
  const connections = [
    { href: 'https://fonts.googleapis.com', rel: 'preconnect' },
    { href: 'https://fonts.gstatic.com', rel: 'preconnect', crossOrigin: 'anonymous' }
  ];

  connections.forEach(conn => {
    const link = document.createElement('link');
    link.rel = conn.rel;
    link.href = conn.href;
    if (conn.crossOrigin) {
      link.crossOrigin = conn.crossOrigin;
    }
    head.appendChild(link);
  });

  // Add viewport meta if missing (LCP optimization)
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0';
    head.appendChild(viewport);
  }
};

// Early API fetch for campaigns with React Query integration
export const startEarlyFetch = () => {
  if (typeof window === 'undefined') return;

  // Start fetching critical API data early and cache in global store
  fetch('/api/campaigns')
    .then(response => response.json())
    .then(data => {
      // Store in global cache for TanStack Query hydration
      (window as any).__CAMPAIGN_CACHE__ = {
        timestamp: Date.now(),
        data: data
      };

      // Wire to React Query cache if available
      if ((window as any).queryClient) {
        (window as any).queryClient.setQueryData(['/api/campaigns'], data);
      }
    })
    .catch(() => {
      // Silent fail - TanStack Query will handle the actual fetch
    });
};

// Critical CSS inlining - Enhanced for LCP/FCP optimization
export const inlineCriticalCSS = () => {
  const criticalCSS = `
    /* Critical above-the-fold styles for LCP optimization */
    body { 
      margin: 0; 
      padding: 0; 
      font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #ffffff;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeSpeed;
    }
    #root { min-height: 100vh; }
    .hero, .campaign-list { display: block; }
    .campaign-card { 
      display: flex; 
      background: rgb(30, 41, 59); 
      border: 1px solid rgb(71, 85, 105);
      border-radius: 8px;
      padding: 16px;
      margin: 8px 0;
      contain: layout style paint; /* Performance containment */
    }
    .loading-skeleton { 
      background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%); 
      animation: shimmer 1.5s infinite;
      background-size: 200px 100%;
      contain: layout style paint;
    }
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: calc(200px + 100%) 0; }
    }
    /* Immediate layout stability for CLS optimization */
    .container { max-width: 1200px; margin: 0 auto; padding: 16px; }
    .grid { display: grid; gap: 16px; }
    .button { 
      padding: 12px 24px; 
      border-radius: 6px; 
      border: none; 
      cursor: pointer;
      min-height: 44px;
      font-size: 16px;
      transition: none; /* Remove transitions for faster rendering */
      contain: layout style;
    }
    /* Mobile performance optimization */
    @media (pointer: coarse) {
      button, a, input, select { 
        min-height: 44px; 
        min-width: 44px; 
        touch-action: manipulation;
      }
      .campaign-card { padding: 20px; margin: 12px 0; }
    }
    /* LCP element prioritization */
    .lcp-optimized {
      contain: layout style paint;
      content-visibility: auto;
    }
    /* Prevent layout shifts */
    img { height: auto; max-width: 100%; }
    .aspect-ratio-16-9 { aspect-ratio: 16/9; }
  `;

  // Check if critical CSS is already inlined to prevent duplicates (SSR or client)
  if (document.getElementById('critical-css-performance') || document.getElementById('critical-css')) return;

  const style = document.createElement('style');
  style.id = 'critical-css-performance';
  style.textContent = criticalCSS;
  document.head.insertBefore(style, document.head.firstChild);
};

// Non-critical resource loading (fixed for production)
export const loadNonCriticalResources = () => {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      // Import non-critical CSS modules (Vite will resolve correctly)
      import('../styles/components.css').catch(() => {});

      // Preload likely-to-be-used components
      import('../pages/customer-dashboard').catch(() => {});
      import('../components/payment-form').catch(() => {});
    }, { timeout: 5000 });
  } else {
    setTimeout(() => {
      import('../styles/components.css').catch(() => {});
      import('../pages/customer-dashboard').catch(() => {});
      import('../components/payment-form').catch(() => {});
    }, 100);
  }
};

// Mobile performance utilities from mobile-performance.ts
export const getConnectionSpeed = (): 'slow' | 'fast' => {
  if ('connection' in navigator) {
    const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    if (conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')) {
      return 'slow';
    }
  }
  return 'fast';
};

export const optimizeForMobile = (): void => {
  document.documentElement.style.setProperty('-webkit-overflow-scrolling', 'touch');
};

/**
 * PERFORMANCE MONITORING UTILITIES
 * Consolidated performance optimization combining critical loading, CSS optimization, and bundle splitting
 */
export const initializePerformanceOptimizations = () => {
  // Initialize all performance optimizations in the correct order
  inlineCriticalCSS();
  addCriticalResourceHints();
  optimizeForMobile();
  loadNonCriticalResources();
};
