/**
 * Core Utility Functions
 * 
 * Fundamental utility functions used throughout the application for common
 * operations like class merging, performance optimization, and event handling.
 * 
 * Core Functionalities:
 * - CSS class merging with Tailwind CSS precedence handling
 * - Performance optimization utilities (debounce, throttle)
 * - Type-safe implementations with full TypeScript support
 * 
 * Performance Benefits:
 * - Efficient class merging prevents CSS conflicts
 * - Debounce/throttle reduce unnecessary function calls
 * - Tree-shakable exports for optimal bundle size
 * 
 * @fileoverview Essential utility functions for UI and performance
 * @version 1.0.0
 * @author SouthCoast ProMotion Development Team
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS Class Name Merging Utility
 * 
 * Intelligently merges CSS class names with proper Tailwind CSS precedence handling.
 * This is the most critical utility in the application, used by every UI component
 * to handle conditional styling and avoid CSS conflicts.
 * 
 * Technical Implementation:
 * - Uses clsx for conditional class handling
 * - Uses tailwind-merge for Tailwind-specific precedence rules
 * - Resolves conflicts (e.g., 'bg-red-500' overrides 'bg-blue-500')
 * - Handles complex conditional styling patterns
 * 
 * Benefits:
 * - Prevents CSS class conflicts in Tailwind
 * - Enables clean conditional styling patterns
 * - Optimizes final CSS output by removing redundant classes
 * - Provides consistent class merging across all components
 * 
 * @param {...ClassValue} inputs - Variable number of class values (strings, objects, arrays)
 * @returns {string} Merged and optimized class string
 * 
 * @example
 * ```typescript
 * // Basic class merging
 * cn('base-class', 'additional-class') // → 'base-class additional-class'
 * 
 * // Conditional classes
 * cn('btn', isActive && 'btn-active', disabled && 'btn-disabled')
 * 
 * // Tailwind conflict resolution
 * cn('bg-red-500', 'bg-blue-500') // → 'bg-blue-500' (blue overrides red)
 * 
 * // Complex conditional styling
 * cn(
 *   'btn btn-primary',
 *   {
 *     'btn-loading': isLoading,
 *     'btn-disabled': disabled,
 *     'btn-sm': size === 'small'
 *   },
 *   className // Additional classes from props
 * )
 * ```
 * 
 * @since 1.0.0
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Function Debouncing Utility
 * 
 * Creates a debounced version of a function that delays execution until after
 * a specified wait time has elapsed since the last invocation. Essential for
 * performance optimization in search inputs, resize handlers, and API calls.
 * 
 * Technical Implementation:
 * - Uses closure to maintain timeout state
 * - Clears previous timeout on each call
 * - Fully type-safe with generic type preservation
 * - Handles variable argument lists correctly
 * 
 * Performance Benefits:
 * - Prevents excessive API calls during rapid user input
 * - Reduces CPU usage in scroll/resize event handlers
 * - Improves user experience by avoiding UI lag
 * - Optimizes search functionality with delayed queries
 * 
 * Common Use Cases:
 * - Search input with live filtering
 * - Form validation on user input
 * - Window resize event handling
 * - Auto-save functionality
 * 
 * @template T - Function type to be debounced
 * @param {T} func - Function to debounce
 * @param {number} delay - Delay in milliseconds before execution
 * @returns {Function} Debounced version of the input function
 * 
 * @example
 * ```typescript
 * // Search input debouncing
 * const debouncedSearch = debounce((query: string) => {
 *   searchAPI(query);
 * }, 300);
 * 
 * // Usage in React component
 * const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
 *   debouncedSearch(e.target.value);
 * };
 * 
 * // Window resize handler
 * const debouncedResize = debounce(() => {
 *   updateLayout();
 * }, 150);
 * 
 * window.addEventListener('resize', debouncedResize);
 * ```
 * 
 * @since 1.0.0
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Function Throttling Utility
 * 
 * Creates a throttled version of a function that executes at most once per
 * specified time interval. Unlike debouncing, throttling ensures regular
 * execution during continuous events, making it ideal for scroll handlers
 * and animation frame callbacks.
 * 
 * Technical Implementation:
 * - Uses boolean flag to track throttle state
 * - Executes immediately on first call
 * - Blocks subsequent calls until cooldown period expires
 * - Fully type-safe with generic type preservation
 * 
 * Performance Benefits:
 * - Limits execution frequency for expensive operations
 * - Maintains responsive UI during high-frequency events
 * - Prevents performance degradation in scroll/touch handlers
 * - Ensures consistent frame rates in animations
 * 
 * Throttle vs Debounce:
 * - Throttle: Executes at regular intervals during continuous events
 * - Debounce: Executes only after events stop for specified duration
 * 
 * Common Use Cases:
 * - Scroll event handlers for lazy loading
 * - Mouse move tracking for interactive elements
 * - API rate limiting for real-time features
 * - Animation frame callbacks
 * 
 * @template T - Function type to be throttled
 * @param {T} func - Function to throttle
 * @param {number} limit - Minimum time interval between executions (ms)
 * @returns {Function} Throttled version of the input function
 * 
 * @example
 * ```typescript
 * // Scroll event throttling
 * const throttledScroll = throttle(() => {
 *   updateScrollPosition();
 *   checkVisibleElements();
 * }, 16); // ~60fps
 * 
 * window.addEventListener('scroll', throttledScroll);
 * 
 * // Mouse move tracking
 * const throttledMouseMove = throttle((e: MouseEvent) => {
 *   updateCursorPosition(e.clientX, e.clientY);
 * }, 50);
 * 
 * // API rate limiting
 * const throttledAPICall = throttle((data: unknown) => {
 *   sendAnalytics(data);
 * }, 1000); // Max 1 call per second
 * ```
 * 
 * @since 1.0.0
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
