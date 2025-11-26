/**
 * Business Logic Constants
 * Single source of truth for business rules and validation constraints
 */

// Availability Thresholds
export const AVAILABILITY_THRESHOLDS = {
  FULL: 0,
  LIMITED: 4, 
  AVAILABLE: 5,
} as const;

// Booking Constraints
export const BOOKING_LIMITS = {
  MIN_SLOTS: 1,
  MAX_SLOTS: 20,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_PHONE_LENGTH: 10,
  MAX_PHONE_LENGTH: 20,
  MAX_EMAIL_LENGTH: 254,
  MAX_CAMPAIGN_NAME_LENGTH: 200,
  MAX_COMPANY_NAME_LENGTH: 100,
  MAX_ADDRESS_LENGTH: 500,
  MAX_NOTES_LENGTH: 1000,
} as const;

// Discount Rules
export const DISCOUNT_RATES = {
  BULK_2_PLUS: 0.10, // 10% discount for 2+ items
  BULK_4_PLUS: 0.15, // 15% discount for 4+ items  
  BULK_6_PLUS: 0.20, // 20% discount for 6+ items
  EARLY_BIRD: 0.05,  // 5% early booking discount
  RETURNING_CUSTOMER: 0.08, // 8% returning customer discount
} as const;

// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[\d\s\-()]+$/,
  NAME: /^[a-zA-Z0-9\s\-'.]+$/,
  CAMPAIGN_NAME: /^[a-zA-Z0-9\s()/-]+$/,
  COMPANY_NAME: /^[a-zA-Z0-9\s&()/.,-]+$/,
  DATE_FORMAT: /^(\d{2})\/(\d{2})\/(\d{4})$/,
  TIME_FORMAT: /^\d{1,2}:\d{2}(-\d{1,2}:\d{2})?$/,
  PRICE_FORMAT: /^GBP\d+\.\d{2}$/,
  POSTCODE_UK: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
} as const;

// Date and Time Constraints
export const DATE_LIMITS = {
  MIN_YEAR: 1900,
  MAX_YEAR: 2100,
  MIN_BOOKING_DAYS_AHEAD: 1,
  MAX_BOOKING_DAYS_AHEAD: 365,
} as const;

export const TIME_LIMITS = {
  MIN_HOUR: 0,
  MAX_HOUR: 23,
  MIN_MINUTE: 0,
  MAX_MINUTE: 59,
  BUSINESS_START_HOUR: 9,
  BUSINESS_END_HOUR: 17,
} as const;

// Payment and Pricing
export const PAYMENT_CONFIG = {
  MIN_PAYMENT_AMOUNT: 1.00,
  MAX_PAYMENT_AMOUNT: 50000.00,
  CURRENCY: 'GBP',
  CURRENCY_SYMBOL: '£',
  DECIMAL_PLACES: 2,
  BOOKING_DEPOSIT_PERCENTAGE: 0.20, // 20% deposit required
  LATE_PAYMENT_FEE: 25.00,
  CANCELLATION_FEE: 50.00,
} as const;

// Revenue and Analytics
export const REVENUE_CONFIG = {
  MIN_BOOKING_REVENUE: 50.00,
  BOOKING_VALUE_RANGE_MIN: 100.00,
  BOOKING_VALUE_RANGE_MAX: 5000.00,
  DEFAULT_CAMPAIGN_REVENUE: 1500.00,
  DEFAULT_CAMPAIGN_BOOKINGS: 3,
  HIGH_VALUE_THRESHOLD: 2000.00,
  VIP_CUSTOMER_THRESHOLD: 10000.00,
} as const;

// Geographic and Targeting
export const GEOGRAPHIC_CONFIG = {
  DEFAULT_COUNTRY: 'United Kingdom',
  DEFAULT_CURRENCY: 'GBP',
  DEFAULT_TIMEZONE: 'Europe/London',
  SUPPORTED_COUNTRIES: ['United Kingdom', 'Ireland'],
  SUPPORTED_CURRENCIES: ['GBP', 'EUR'],
} as const;

// Campaign Types and Categories
export const CAMPAIGN_TYPES = {
  RADIO: 'radio',
  DIGITAL: 'digital',
  OUTDOOR: 'outdoor',
  PRINT: 'print',
  TELEVISION: 'television',
  SOCIAL_MEDIA: 'social_media',
  EMAIL: 'email',
  DIRECT_MAIL: 'direct_mail',
} as const;

export const CAMPAIGN_CATEGORIES = {
  AWARENESS: 'awareness',
  CONVERSION: 'conversion', 
  RETENTION: 'retention',
  LAUNCH: 'launch',
  SEASONAL: 'seasonal',
  PROMOTIONAL: 'promotional',
} as const;

// Campaign Status Types
export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived',
} as const;

// Booking Status Types
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

// Contract and Legal
export const CONTRACT_CONFIG = {
  REQUIRED_SIGNATURE_FIELDS: ['customer_name', 'customer_email', 'date'],
  CONTRACT_VALIDITY_DAYS: 30,
  MIN_CONTRACT_VALUE: 100.00,
  TERMS_VERSION: '2024.1',
} as const;

// Demo and Testing Data
export const DEMO_CONFIG = {
  PHONE_NUMBER: '01234 567890',
  SAMPLE_CAMPAIGNS_COUNT: 114,
  TEST_EMAIL_DOMAIN: 'example.com',
  DEMO_USER_PREFIX: 'demo_',
} as const;

// Performance and Optimization
export const PERFORMANCE_CONFIG = {
  PAGINATION_DEFAULT_SIZE: 20,
  PAGINATION_MAX_SIZE: 100,
  SEARCH_MIN_QUERY_LENGTH: 2,
  SEARCH_DEBOUNCE_MS: 300,
  CACHE_TTL_SHORT: 5 * 60 * 1000, // 5 minutes
  CACHE_TTL_MEDIUM: 30 * 60 * 1000, // 30 minutes  
  CACHE_TTL_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// File Upload Constraints
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_FILES_PER_UPLOAD: 5,
  CREATIVE_DIMENSIONS: {
    MIN_WIDTH: 300,
    MIN_HEIGHT: 300,
    MAX_WIDTH: 4000,
    MAX_HEIGHT: 4000,
  },
} as const;

// Notification and Communication
export const NOTIFICATION_CONFIG = {
  EMAIL_RETRY_ATTEMPTS: 3,
  SMS_RETRY_ATTEMPTS: 2,
  NOTIFICATION_BATCH_SIZE: 50,
  DIGEST_FREQUENCY_HOURS: 24,
} as const;
