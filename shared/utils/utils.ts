/**
 * Main Utilities Entry Point
 * 
 * Centralized utility module providing a single import point for all application utilities
 * while maintaining clean module separation and tree-shaking compatibility.
 * 
 * Architecture Benefits:
 * - Single import point for all utilities (import { cn, formatDate } from '@/shared/utils')
 * - Module separation for better maintainability and tree-shaking
 * - Backward compatibility with existing imports
 * - Clear organization by utility category
 * 
 * Module Organization:
 * - core-utils: Basic utility functions (cn, debounce, throttle)
 * - date-utils: Date formatting and parsing for UK locale
 * - pricing-utils: Financial calculations and currency formatting
 * - campaign-utils: Campaign filtering and display logic
 * 
 * Performance Considerations:
 * - Tree-shaking friendly exports
 * - Lazy loading for non-critical utilities
 * - Optimal bundle splitting for production
 * 
 * @fileoverview Main utilities entry point with re-exports and convenience imports
 * @version 1.0.0
 * @author SouthCoast ProMotion Development Team
 */

// Core utilities
export * from "./core-utils";

// Date utilities
export * from "./date-utils";

// Pricing utilities  
export * from "./pricing-utils";

// Campaign utilities
export * from "./campaign-utils";

// Shared utilities from shared modules (avoiding naming conflicts)
export * from "@shared/constants/business";
export * from "@shared/config/constants";

/**
 * Frequently Used Utility Exports
 * 
 * These are the most commonly used utilities across the application,
 * exported directly for convenience and developer experience.
 * 
 * Usage Example:
 * ```typescript
 * import { cn, formatDate, formatPrice } from '@/shared/utils';
 * 
 * // Tailwind class merging
 * const className = cn('base-class', conditionalClass && 'active');
 * 
 * // Date formatting for UK locale
 * const displayDate = formatDate('2024-01-15');
 * 
 * // Currency formatting
 * const price = formatPrice(199.99);
 * ```
 */

/** Tailwind CSS class merging utility (most frequently used) */
export { cn } from "./core-utils";

/** Date formatting utilities for UK locale and business requirements */
export { formatDate, parseDate, formatTime } from "./date-utils";

/** Financial utilities for pricing and currency display */
export { formatPrice, formatCurrency, calculatePricing } from "./pricing-utils";

/** Campaign business logic utilities */
export { filterCampaigns, extractUniqueLocations, getAvailabilityText, getAvailabilityColor } from "./campaign-utils";

// Remove duplicate export - already exported above

// Re-export shared date utilities with aliases to avoid conflicts
export {
  formatUKDate,
  parseUKDate,
  isValidUKDate,
  ukDateToISO,
  isoDateToUK,
  UK_DATE_CONFIG,
  DATE_PATTERNS,
  DATE_CONSTRAINTS
} from "@shared/utils/date";

/**
 * TypeScript Type Exports
 * 
 * Essential types used across the application for type safety
 * and consistent data structures.
 * 
 * These types ensure consistent interfaces between components
 * and enable proper TypeScript intellisense support.
 */

/** Shopping cart item structure for pricing calculations */
export type { CartItem, PricingBreakdown } from "./pricing-utils";

// Remove duplicate type export - already exported above
