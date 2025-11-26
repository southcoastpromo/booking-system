/**
 * Pricing and Currency Utilities
 * Handles all pricing calculations and currency formatting
 */

/**
 * Cart item interface for pricing calculations
 */
export interface CartItem {
  campaignId: number;
  campaignName: string;
  date: string;
  time: string;
  slotsRequired: number;
  pricePerSlot: number;
  totalPrice: number;
  advertsPerSlot: number;
  iconUrl?: string | null;
}

/**
 * Pricing breakdown interface
 */
export interface PricingBreakdown {
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  discountedSubtotal: number;
  vat: number;
  total: number;
  totalSlots: number;
  totalAdverts: number;
}

/**
 * Format price to UK currency format
 */
export function formatPrice(
  price: number | string,
  options?: {
    currency?: string;
    notation?: Intl.NumberFormatOptions["notation"];
  }
) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: options?.currency ?? "GBP",
    notation: options?.notation ?? "standard",
  }).format(Number(price));
}

/**
 * Format currency amount to UK pounds
 * Alias for formatPrice for backward compatibility
 */
export function formatCurrency(amount: number | string): string {
  return formatPrice(amount);
}

/**
 * Calculate comprehensive pricing breakdown for cart items
 */
export function calculatePricing(items: CartItem[]): PricingBreakdown {
  // Handle empty cart gracefully
  if (!items || items.length === 0) {
    return {
      subtotal: 0,
      discountPercentage: 0,
      discountAmount: 0,
      discountedSubtotal: 0,
      vat: 0,
      total: 0,
      totalSlots: 0,
      totalAdverts: 0
    };
  }

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalSlots = items.reduce((sum, item) => sum + item.slotsRequired, 0);
  const totalAdverts = items.reduce((sum, item) => sum + (item.slotsRequired * item.advertsPerSlot), 0);

  // Apply bulk discount based on slot count (matches DISCOUNT_RATES from config)
  let discountPercentage = 0;
  if (totalSlots >= 6) {
    discountPercentage = 0.20; // 20% discount for 6+ slots
  } else if (totalSlots >= 4) {
    discountPercentage = 0.15; // 15% discount for 4+ slots
  } else if (totalSlots >= 2) {
    discountPercentage = 0.10; // 10% discount for 2+ slots
  }
  const discountAmount = subtotal * discountPercentage;
  const discountedSubtotal = subtotal - discountAmount;

  // Calculate VAT (20% UK standard rate)
  const vat = discountedSubtotal * 0.20;
  const total = discountedSubtotal + vat;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountPercentage,
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountedSubtotal: Math.round(discountedSubtotal * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    total: Math.round(total * 100) / 100,
    totalSlots,
    totalAdverts
  };
}
