import { z } from "zod";

// Centralized validation schemas and utilities
export const ValidationSchemas = {
  // Campaign ID validation (returns number)
  campaignId: z
    .union([z.string().regex(/^\d+$/).transform(Number), z.number()])
    .refine((num) => {
      return Number.isInteger(num) && num > 0 && num <= 999999;
    }, "Campaign ID must be a positive integer between 1-999999"),

  // Booking data validation
  bookingData: z.object({
    customerName: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters")
      .regex(/^[a-zA-Z\s\-'.]+$/, "Name contains invalid characters"),

    customerEmail: z
      .string()
      .email("Invalid email format")
      .max(254, "Email address too long")
      .toLowerCase(),

    customerPhone: z
      .string()
      .min(10, "Phone number too short")
      .max(20, "Phone number too long")
      .regex(/^[+]?[\d\s\-()]+$/, "Invalid phone number format"),

    slotsRequired: z
      .number()
      .int("Slots must be a whole number")
      .min(1, "Must book at least 1 slot")
      .max(20, "Cannot book more than 20 slots"),

    selectedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .refine((date) => {
        const selectedDate = new Date(date);
        const now = new Date();
        const maxDate = new Date();
        maxDate.setFullYear(now.getFullYear() + 2);
        return selectedDate >= now && selectedDate <= maxDate;
      }, "Date must be between today and 2 years from now"),

    campaignId: z.number().int().positive("Invalid campaign ID"),

    company: z.string().max(200, "Company name too long").optional().nullable(),
    requirements: z
      .string()
      .max(1000, "Requirements too long")
      .optional()
      .nullable(),
  }),

  // Query parameters validation
  queryParams: z
    .object({
      limit: z
        .string()
        .regex(/^\d+$/)
        .transform((val) => Math.min(Math.max(Number(val), 1), 10000))
        .optional(),
      offset: z
        .string()
        .regex(/^\d+$/)
        .transform((val) => Math.max(Number(val), 0))
        .optional(),
      search: z.string().max(100).optional(),
      availability: z.enum(["available", "limited", "full"]).optional(),
      sortBy: z.enum(["date", "price", "campaign", "availability"]).optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
    })
    .optional(),

  // Date format validation (DD/MM/YYYY)
  dateFormat: z
    .string()
    .regex(/^(\d{2})\/(\d{2})\/(\d{4})$/, "Date must be in DD/MM/YYYY format")
    .refine((dateStr) => {
      const [day, month, year] = dateStr.split("/").map(Number);
      if (day < 1 || day > 31 || month < 1 || month > 12) return false;

      const date = new Date(year, month - 1, day);
      return date.getDate() === day && date.getMonth() === month - 1;
    }, "Invalid date"),
};

// Validation error types
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// Unified validation utility
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw new ValidationError(message);
    }
    throw error;
  }
}

// Safe validation (returns null on error)
export function safeValidateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): T | null {
  try {
    return validateData(schema, data);
  } catch (_error) {
    return null;
  }
}

// Comprehensive input sanitization utilities
export function sanitizeString(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/[<>"'&]/g, (match) => {
      const entities: { [key: string]: string } = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      };
      return entities[match] || match;
    })
    .trim()
    .slice(0, 1000);
}

export function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

// Business validation result interface
export interface BusinessValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: unknown;
}

// Consolidated business validation function
export function validateAndSanitizeBooking(data: unknown): BusinessValidationResult {
  try {
    const validatedData = ValidationSchemas.bookingData.parse(data);
    const sanitizedData = sanitizeObject(validatedData) as typeof validatedData;
    
    return {
      isValid: true,
      errors: [],
      sanitizedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue) => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      return {
        isValid: false,
        errors,
      };
    }
    return {
      isValid: false,
      errors: ['Validation failed with unknown error'],
    };
  }
}
