/**
 * Optimized UI Components for Bundle Size Reduction
 * Tree-shaking friendly imports for commonly used UI components
 */

import type { ComponentProps, ReactNode } from "react";
import { lazy, Suspense, memo } from "react";

// Lazy load heavy UI components
const LazySelect = lazy(() => import("@/components/ui/select").then(module => ({
  default: module.Select
})));

const LazySelectContent = lazy(() => import("@/components/ui/select").then(module => ({
  default: module.SelectContent
})));

const LazySelectItem = lazy(() => import("@/components/ui/select").then(module => ({
  default: module.SelectItem
})));

const LazySelectTrigger = lazy(() => import("@/components/ui/select").then(module => ({
  default: module.SelectTrigger
})));

const LazySelectValue = lazy(() => import("@/components/ui/select").then(module => ({
  default: module.SelectValue
})));

// Loading fallbacks for UI components
const SelectFallback = ({ className, children }: { className?: string; children?: ReactNode }) => (
  <div className={`h-9 w-40 bg-white/10 border border-white/20 rounded-md animate-pulse ${className}`}>
    {children && <span className="opacity-0">{children}</span>}
  </div>
);

// Optimized Select Components with Suspense and memoization
export const OptimizedSelect = memo((props: ComponentProps<typeof LazySelect>) => (
  <Suspense fallback={<SelectFallback />}>
    <LazySelect {...props} />
  </Suspense>
));
OptimizedSelect.displayName = 'OptimizedSelect';

export const OptimizedSelectContent = memo((props: ComponentProps<typeof LazySelectContent>) => (
  <Suspense fallback={<div className="min-h-[100px] bg-white rounded-md shadow-lg animate-pulse" />}>
    <LazySelectContent {...props} />
  </Suspense>
));
OptimizedSelectContent.displayName = 'OptimizedSelectContent';

export const OptimizedSelectItem = memo((props: ComponentProps<typeof LazySelectItem>) => (
  <Suspense fallback={<div className="h-8 bg-gray-100 rounded animate-pulse" />}>
    <LazySelectItem {...props} />
  </Suspense>
));
OptimizedSelectItem.displayName = 'OptimizedSelectItem';

export const OptimizedSelectTrigger = memo((props: ComponentProps<typeof LazySelectTrigger>) => (
  <Suspense fallback={<SelectFallback className={props.className} />}>
    <LazySelectTrigger {...props} />
  </Suspense>
));
OptimizedSelectTrigger.displayName = 'OptimizedSelectTrigger';

export const OptimizedSelectValue = memo((props: ComponentProps<typeof LazySelectValue>) => (
  <Suspense fallback={<span className="text-transparent">Loading...</span>}>
    <LazySelectValue {...props} />
  </Suspense>
));
OptimizedSelectValue.displayName = 'OptimizedSelectValue';

// NOTE: Bundle size optimization utility removed as it was unused
