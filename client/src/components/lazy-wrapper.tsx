/**
 * Unified Lazy Loading Wrapper Component
 * Provides safe code splitting with multiple fallback loading states
 */

import type { ComponentType, ReactNode } from 'react';
import { Suspense, lazy } from 'react';

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
  variant?: 'fullscreen' | 'skeleton' | 'custom';
}

const FullScreenFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-navy via-navy/80 to-navy/60 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto mb-4"></div>
      <p className="text-white">Loading...</p>
    </div>
  </div>
);

const SkeletonFallback = ({ name }: { name?: string }) => (
  <div className="animate-pulse p-4 bg-slate-800 rounded-lg">
    <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-slate-600 rounded w-1/2"></div>
    {name && (
      <div className="text-xs text-gray-400 mt-2">Loading {name}...</div>
    )}
  </div>
);

export const LazyWrapper = ({ 
  children, 
  fallback, 
  name,
  variant = 'fullscreen'
}: LazyWrapperProps) => {
  const getFallback = () => {
    if (fallback) return fallback;
    if (variant === 'skeleton') return <SkeletonFallback name={name} />;
    return <FullScreenFallback />;
  };

  return (
    <Suspense fallback={getFallback()}>
      {children}
    </Suspense>
  );
};

// Utility for creating lazy-loaded components with proper typing
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFn);
  
  return (props: React.ComponentProps<T>) => (
    <LazyWrapper fallback={fallback}>
      <LazyComponent {...props} />
    </LazyWrapper>
  );
};
