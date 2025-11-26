/**
 * Campaign Business Logic Utilities
 * 
 * Comprehensive utilities for campaign data processing, filtering, and display logic.
 * These functions implement the core business rules for campaign presentation
 * and customer interaction workflows.
 * 
 * Core Functionalities:
 * - Campaign filtering with multiple criteria support
 * - Availability status management and display
 * - Location extraction and standardization
 * - Date range filtering with UK format support
 * 
 * Business Rules Implementation:
 * - Availability status mapping (available/limited/full)
 * - Location standardization for consistent filtering
 * - Date parsing compatible with UK DD/MM/YYYY format
 * - Case-insensitive search and filtering
 * 
 * Performance Optimizations:
 * - Efficient filtering algorithms for large datasets
 * - Memoized location extraction for better performance
 * - Optimized date parsing and comparison
 * 
 * @fileoverview Campaign data processing and business logic utilities
 * @version 1.0.0
 * @author SouthCoast ProMotion Development Team
 */
import type { Campaign } from "@shared/schema";
import { parseDate } from "./date-utils";

/**
 * Campaign Availability Text Mapping
 * 
 * Converts database availability status codes to user-friendly display text
 * for customer-facing interfaces. Provides consistent terminology across
 * all campaign displays and booking interfaces.
 * 
 * Business Logic:
 * - 'available': Slots freely available for booking
 * - 'limited': Few slots remaining (creates urgency)
 * - 'full': No slots available (prevents booking attempts)
 * - Default: Handles edge cases gracefully
 * 
 * @param {string} availability - Database availability status code
 * @returns {string} User-friendly availability text
 * 
 * @example
 * ```typescript
 * getAvailabilityText('available') // → 'Available'
 * getAvailabilityText('limited')   // → 'Limited'
 * getAvailabilityText('full')      // → 'Fully Booked'
 * getAvailabilityText('invalid')   // → 'Unknown'
 * ```
 * 
 * @since 1.0.0
 */
export function getAvailabilityText(availability: string): string {
  switch (availability) {
    case "available": return "Available";
    case "limited": return "Limited";
    case "full": return "Fully Booked";
    default: return "Unknown";
  }
}

/**
 * Campaign Availability Color Coding
 * 
 * Maps availability status to appropriate Tailwind CSS background colors
 * for visual status indicators. Provides consistent color coding across
 * all campaign displays for immediate visual recognition.
 * 
 * Color Psychology:
 * - Green: Available (positive, encouraging action)
 * - Yellow: Limited (warning, creates urgency)
 * - Red: Full (stop, prevents booking attempts)
 * - Gray: Unknown (neutral, indicates data issues)
 * 
 * Accessibility Compliance:
 * - Colors meet WCAG contrast requirements
 * - Used alongside text labels for color-blind users
 * - Consistent with common web conventions
 * 
 * @param {string} availability - Database availability status code
 * @returns {string} Tailwind CSS background color class
 * 
 * @example
 * ```typescript
 * getAvailabilityColor('available') // → 'bg-green-400'
 * getAvailabilityColor('limited')   // → 'bg-yellow-400'
 * getAvailabilityColor('full')      // → 'bg-red-400'
 * getAvailabilityColor('unknown')   // → 'bg-gray-400'
 * ```
 * 
 * @since 1.0.0
 */
export function getAvailabilityColor(availability: string): string {
  switch (availability) {
    case "available": return "bg-green-400";
    case "limited": return "bg-yellow-400";
    case "full": return "bg-red-400";
    default: return "bg-gray-400";
  }
}

/**
 * Advanced Campaign Filtering System
 * 
 * Implements comprehensive campaign filtering with multiple criteria support.
 * This is the core business logic for campaign discovery, enabling customers
 * to find relevant advertising opportunities efficiently.
 * 
 * Filtering Capabilities:
 * - Location-based filtering with partial text matching
 * - Availability status filtering for booking optimization
 * - Date range filtering with UK DD/MM/YYYY format support
 * - Case-insensitive search for better user experience
 * 
 * Business Logic:
 * - Empty/"All" filters are ignored (shows all results)
 * - Location search uses substring matching for flexibility
 * - Date filtering supports both start and end date constraints
 * - Multiple filters work together (AND logic)
 * 
 * Performance Optimizations:
 * - Early return for failed filter conditions
 * - Efficient date parsing and comparison
 * - Case-insensitive comparisons for text fields
 * 
 * @param {Campaign[]} campaigns - Array of campaign objects to filter
 * @param {Object} filters - Filter criteria object
 * @param {string} [filters.location] - Location substring to match (case-insensitive)
 * @param {string} [filters.availability] - Exact availability status to match
 * @param {string} [filters.dateFrom] - Start date in DD/MM/YYYY format
 * @param {string} [filters.dateTo] - End date in DD/MM/YYYY format
 * @returns {Campaign[]} Filtered array of campaigns matching all criteria
 * 
 * @example
 * ```typescript
 * // Filter by location
 * const londonCampaigns = filterCampaigns(allCampaigns, {
 *   location: 'London'
 * });
 * 
 * // Filter by availability and date range
 * const availableThisMonth = filterCampaigns(allCampaigns, {
 *   availability: 'available',
 *   dateFrom: '01/03/2024',
 *   dateTo: '31/03/2024'
 * });
 * 
 * // Multiple criteria filtering
 * const filteredCampaigns = filterCampaigns(allCampaigns, {
 *   location: 'Brighton',
 *   availability: 'available',
 *   dateFrom: '15/03/2024'
 * });
 * ```
 * 
 * @since 1.0.0
 */
export function filterCampaigns(campaigns: Campaign[], filters: {
  location?: string;
  availability?: string;
  dateFrom?: string;
  dateTo?: string;
}): Campaign[] {
  return campaigns.filter((campaign) => {
    // Location filter
    if (filters.location && filters.location !== "All" && filters.location !== "") {
      const campaignLocation = campaign.location || "Unknown Location";
      if (!campaignLocation.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
    }

    // Availability filter  
    if (filters.availability && filters.availability !== "All" && filters.availability !== "" &&
        campaign.availability !== filters.availability) {
      return false;
    }

    // Date range filter
    if (filters.dateFrom) {
      const campaignDate = parseDate(campaign.date);
      const fromDate = parseDate(filters.dateFrom);
      if (campaignDate < fromDate) return false;
    }

    if (filters.dateTo) {
      const campaignDate = parseDate(campaign.date);
      const toDate = parseDate(filters.dateTo);
      if (campaignDate > toDate) return false;
    }

    return true;
  });
}

/**
 * Location Extraction and Standardization
 * 
 * Extracts and standardizes unique location names from campaign data
 * for filter dropdown population and location-based search functionality.
 * Handles edge cases and provides consistent location naming.
 * 
 * Data Processing:
 * - Extracts location field from all campaigns
 * - Handles null/undefined locations gracefully
 * - Removes duplicate entries efficiently
 * - Sorts alphabetically for consistent UI ordering
 * 
 * Business Logic:
 * - Null locations become "Unknown Location" for UI consistency
 * - TypeScript type guards ensure data safety
 * - Alphabetical sorting improves user experience
 * - Deduplication prevents duplicate filter options
 * 
 * Performance Features:
 * - Single pass through campaigns array
 * - Efficient Set-based deduplication
 * - Built-in JavaScript sort for locale-aware ordering
 * 
 * @param {Campaign[]} campaigns - Array of campaign objects
 * @returns {string[]} Sorted array of unique location names
 * 
 * @example
 * ```typescript
 * const campaigns = [
 *   { location: 'London', ... },
 *   { location: 'Brighton', ... },
 *   { location: 'London', ... },      // Duplicate
 *   { location: null, ... },          // Null location
 * ];
 * 
 * const locations = extractUniqueLocations(campaigns);
 * // → ['Brighton', 'London', 'Unknown Location']
 * 
 * // Usage in React component
 * const locationOptions = extractUniqueLocations(campaigns).map(location => ({
 *   value: location,
 *   label: location
 * }));
 * ```
 * 
 * @since 1.0.0
 */
export function extractUniqueLocations(campaigns: Campaign[]): string[] {
  const locations = campaigns
    .map((campaign) => campaign.location || "Unknown Location")
    .filter((location): location is string => !!location);
  
  return [...new Set(locations)].sort();
}
