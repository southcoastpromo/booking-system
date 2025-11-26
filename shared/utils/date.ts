/**
 * Shared Date Utilities and Configuration
 * Single source of truth for date handling across client and server
 */

// UK Date Configuration - Force DD/MM/YYYY system-wide
export const UK_DATE_CONFIG = {
  LOCALE: 'en-GB',
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
  ISO_FORMAT: 'YYYY-MM-DD',
  TIMEZONE: 'Europe/London',
  
  // Intl.DateTimeFormat options
  INTL_OPTIONS: {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
  } as const,
  
  // Time display options
  TIME_OPTIONS: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  } as const,
  
  // Full datetime options
  DATETIME_OPTIONS: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  } as const,
} as const;

// Date validation patterns
export const DATE_PATTERNS = {
  DD_MM_YYYY: /^(\d{2})\/(\d{2})\/(\d{4})$/,
  YYYY_MM_DD: /^(\d{4})-(\d{2})-(\d{2})$/,
  TIME_HH_MM: /^\d{1,2}:\d{2}$/,
  TIME_RANGE: /^\d{1,2}:\d{2}(-\d{1,2}:\d{2})?$/,
} as const;

// Date limits and constraints
export const DATE_CONSTRAINTS = {
  MIN_YEAR: 1900,
  MAX_YEAR: 2100,
  MIN_BOOKING_DAYS_AHEAD: 1,
  MAX_BOOKING_DAYS_AHEAD: 365,
  BUSINESS_START_HOUR: 9,
  BUSINESS_END_HOUR: 17,
  WEEKEND_DAYS: [0, 6], // Sunday = 0, Saturday = 6
} as const;

/**
 * Parse DD/MM/YYYY date string to Date object
 */
export function parseUKDate(dateString: string): Date {
  const match = DATE_PATTERNS.DD_MM_YYYY.exec(dateString);
  if (!match) {
    throw new Error(`Invalid UK date format: ${dateString}. Expected DD/MM/YYYY`);
  }
  
  const [, day, month, year] = match;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

/**
 * Format Date object to DD/MM/YYYY string
 */
export function formatUKDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  return `${day}/${month}/${year}`;
}

/**
 * Format date string from DD/MM/YYYY to localized display
 */
export function formatDateDisplay(dateString: string): string {
  try {
    const date = parseUKDate(dateString);
    return date.toLocaleDateString(UK_DATE_CONFIG.LOCALE, UK_DATE_CONFIG.INTL_OPTIONS);
  } catch {
    return dateString; // Return original if parsing fails
  }
}

/**
 * Format time string(s) to 12-hour format with AM/PM
 */
export function formatTimeDisplay(timeString: string): string {
  if (timeString.includes("-")) {
    const [startTime, endTime] = timeString.split("-");
    return `${formatSingleTime(startTime)} - ${formatSingleTime(endTime)}`;
  }
  return formatSingleTime(timeString);
}

/**
 * Format single time to 12-hour format with AM/PM
 */
function formatSingleTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  
  return date.toLocaleTimeString(UK_DATE_CONFIG.LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD (for HTML date inputs)
 */
export function ukDateToISO(ukDate: string): string {
  if (!ukDate || ukDate.length !== 10) return '';
  
  const match = DATE_PATTERNS.DD_MM_YYYY.exec(ukDate);
  if (!match) return '';
  
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY (for display)
 */
export function isoDateToUK(isoDate: string): string {
  if (!isoDate || isoDate.length !== 10) return '';
  
  const match = DATE_PATTERNS.YYYY_MM_DD.exec(isoDate);
  if (!match) return '';
  
  const [, yyyy, mm, dd] = match;
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Validate DD/MM/YYYY format (checks actual date validity)
 */
export function isValidUKDate(dateStr: string): boolean {
  const match = DATE_PATTERNS.DD_MM_YYYY.exec(dateStr);
  if (!match) return false;
  
  const [, dd, mm, yyyy] = match;
  const day = parseInt(dd);
  const month = parseInt(mm);
  const year = parseInt(yyyy);
  
  // Check ranges
  if (month < 1 || month > 12) return false;
  if (year < DATE_CONSTRAINTS.MIN_YEAR || year > DATE_CONSTRAINTS.MAX_YEAR) return false;
  if (day < 1 || day > 31) return false;
  
  // Check if date is valid (handles leap years, month lengths)
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
}

/**
 * Validate time format HH:mm
 */
export function isValidTime(timeStr: string): boolean {
  const match = DATE_PATTERNS.TIME_HH_MM.exec(timeStr);
  if (!match) return false;
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/**
 * Check if date is a business day (Monday-Friday)
 */
export function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return !DATE_CONSTRAINTS.WEEKEND_DAYS.includes(dayOfWeek as 0 | 6);
}

/**
 * Check if time is within business hours
 */
export function isBusinessHour(timeStr: string): boolean {
  if (!isValidTime(timeStr)) return false;
  
  const [hours] = timeStr.split(':').map(Number);
  return hours >= DATE_CONSTRAINTS.BUSINESS_START_HOUR && 
         hours < DATE_CONSTRAINTS.BUSINESS_END_HOUR;
}

/**
 * Get next business day from given date
 */
export function getNextBusinessDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  
  while (!isBusinessDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

/**
 * Calculate business days between two dates
 */
export function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isBusinessDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Check if date is within valid booking range
 */
export function isValidBookingDate(dateStr: string): boolean {
  if (!isValidUKDate(dateStr)) return false;
  
  const date = parseUKDate(dateStr);
  const today = new Date();
  const minDate = new Date(today);
  const maxDate = new Date(today);
  
  minDate.setDate(today.getDate() + DATE_CONSTRAINTS.MIN_BOOKING_DAYS_AHEAD);
  maxDate.setDate(today.getDate() + DATE_CONSTRAINTS.MAX_BOOKING_DAYS_AHEAD);
  
  return date >= minDate && date <= maxDate;
}

/**
 * Get current date in UK format
 */
export function getCurrentUKDate(): string {
  return formatUKDate(new Date());
}

/**
 * Get current time in HH:mm format
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Add days to UK date string
 */
export function addDaysToUKDate(dateStr: string, days: number): string {
  const date = parseUKDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatUKDate(date);
}

/**
 * Get relative date description (e.g., "Today", "Tomorrow", "In 3 days")
 */
export function getRelativeDateDescription(dateStr: string): string {
  try {
    const date = parseUKDate(dateStr);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    
    return dateStr;
  } catch {
    return dateStr;
  }
}
