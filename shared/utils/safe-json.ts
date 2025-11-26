/**
 * Safe JSON Utilities
 * 
 * Provides type-safe JSON parsing and stringifying operations that never throw errors.
 * Follows Result<T, E> pattern for consistent error handling across the application.
 * 
 * Features:
 * - Never throws exceptions - returns Result objects instead
 * - Type-safe parsing with generic support
 * - Comprehensive error messages for debugging
 * - Graceful handling of malformed JSON
 * - Integration with existing error handling infrastructure
 * 
 * @fileoverview Core JSON safety utilities for enterprise error handling
 * @version 1.0.0
 * @author SouthCoast ProMotion Development Team
 * @since 2024-01-01
 */

import { Result } from './result';

/**
 * JSON Error Types
 * 
 * Explicit error types for JSON operations to enable type-safe error handling
 */
export enum JsonError {
  PARSE_ERROR = 'PARSE_ERROR',
  STRINGIFY_ERROR = 'STRINGIFY_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
  UNSUPPORTED_TYPE = 'UNSUPPORTED_TYPE'
}

/**
 * Safe JSON parsing with type safety
 * 
 * Parses JSON string without throwing exceptions. Returns Result object
 * with either successful parsed data or detailed error information.
 * 
 * @template T - Expected type of parsed data
 * @param jsonString - JSON string to parse
 * @param defaultValue - Optional default value if parsing fails
 * @returns Result with parsed data or error
 */
export function safeParseJSON<T = unknown>(
  jsonString: string | null | undefined,
  defaultValue?: T
): Result<T, JsonError> {
  // Handle null/undefined input
  if (jsonString === null || jsonString === undefined) {
    if (defaultValue !== undefined) {
      return Result.ok(defaultValue);
    }
    return Result.err(JsonError.INVALID_INPUT);
  }

  // Handle empty string
  if (typeof jsonString !== 'string') {
    if (defaultValue !== undefined) {
      return Result.ok(defaultValue);
    }
    return Result.err(JsonError.INVALID_INPUT);
  }

  // Handle empty string
  if (jsonString.trim() === '') {
    if (defaultValue !== undefined) {
      return Result.ok(defaultValue);
    }
    return Result.err(JsonError.INVALID_INPUT);
  }

  try {
    const parsed = JSON.parse(jsonString) as T;
    return Result.ok(parsed);
  } catch (error) {
    // Log parsing error for debugging
    console.warn('[SAFE-JSON] Parse error:', {
      error: error instanceof Error ? error.message : String(error),
      jsonString: jsonString.length > 100 ? jsonString.substring(0, 100) + '...' : jsonString
    });

    if (defaultValue !== undefined) {
      return Result.ok(defaultValue);
    }
    
    return Result.err(JsonError.PARSE_ERROR);
  }
}

/**
 * Safe JSON stringifying
 * 
 * Converts value to JSON string without throwing exceptions. Handles
 * circular references and other edge cases gracefully.
 * 
 * @param value - Value to stringify
 * @param space - Optional spacing for pretty printing
 * @returns Result with JSON string or error
 */
export function safeStringifyJSON(
  value: unknown,
  space?: string | number
): Result<string, JsonError> {
  // Handle undefined (JSON.stringify returns undefined)
  if (value === undefined) {
    return Result.err(JsonError.UNSUPPORTED_TYPE);
  }

  try {
    const result = JSON.stringify(value, null, space);
    
    // JSON.stringify can return undefined for functions and undefined values
    if (result === undefined) {
      return Result.err(JsonError.UNSUPPORTED_TYPE);
    }
    
    return Result.ok(result);
  } catch (error) {
    // Log stringification error for debugging
    console.warn('[SAFE-JSON] Stringify error:', {
      error: error instanceof Error ? error.message : String(error),
      valueType: typeof value,
      isArray: Array.isArray(value)
    });

    // Check for circular reference specifically
    if (error instanceof Error && error.message.includes('circular')) {
      return Result.err(JsonError.CIRCULAR_REFERENCE);
    }
    
    return Result.err(JsonError.STRINGIFY_ERROR);
  }
}

/**
 * Safe JSON parsing with validation
 * 
 * Parses JSON and validates the result using a type guard function.
 * Useful for ensuring parsed data matches expected structure.
 * 
 * @template T - Expected type of parsed data
 * @param jsonString - JSON string to parse
 * @param validator - Function to validate parsed data
 * @param defaultValue - Optional default value if parsing/validation fails
 * @returns Result with validated data or error
 */
export function safeParseJSONWithValidation<T>(
  jsonString: string | null | undefined,
  validator: (value: unknown) => value is T,
  defaultValue?: T
): Result<T, JsonError> {
  const parseResult = safeParseJSON<unknown>(jsonString);
  
  if (!parseResult.success) {
    if (defaultValue !== undefined) {
      return Result.ok(defaultValue);
    }
    return parseResult as Result<T, JsonError>;
  }

  if (validator(parseResult.data)) {
    return Result.ok(parseResult.data);
  }

  console.warn('[SAFE-JSON] Validation failed:', {
    parsedValue: parseResult.data,
    valueType: typeof parseResult.data
  });

  if (defaultValue !== undefined) {
    return Result.ok(defaultValue);
  }
  
  return Result.err(JsonError.INVALID_INPUT);
}

/**
 * Type guards for common data structures
 */
export const TypeGuards = {
  /**
   * Type guard for arrays
   */
  isArray: <T>(value: unknown): value is T[] => Array.isArray(value),

  /**
   * Type guard for objects (non-null, non-array)
   */
  isObject: <T extends Record<string, unknown>>(value: unknown): value is T =>
    typeof value === 'object' && value !== null && !Array.isArray(value),

  /**
   * Type guard for strings
   */
  isString: (value: unknown): value is string => typeof value === 'string',

  /**
   * Type guard for numbers
   */
  isNumber: (value: unknown): value is number => 
    typeof value === 'number' && !isNaN(value),

  /**
   * Type guard for booleans
   */
  isBoolean: (value: unknown): value is boolean => typeof value === 'boolean'
};

/**
 * Convenience helper for parsing arrays
 * 
 * @template T - Expected array element type
 * @param jsonString - JSON string containing array
 * @param defaultValue - Default array value
 * @returns Result with array or error
 */
export function safeParseJSONArray<T = unknown>(
  jsonString: string | null | undefined,
  defaultValue: T[] = []
): Result<T[], JsonError> {
  return safeParseJSONWithValidation(
    jsonString,
    TypeGuards.isArray<T>,
    defaultValue
  );
}

/**
 * Convenience helper for parsing objects
 * 
 * @template T - Expected object type
 * @param jsonString - JSON string containing object
 * @param defaultValue - Default object value
 * @returns Result with object or error
 */
export function safeParseJSONObject<T extends Record<string, unknown>>(
  jsonString: string | null | undefined,
  defaultValue?: T
): Result<T, JsonError> {
  return safeParseJSONWithValidation(
    jsonString,
    TypeGuards.isObject<T>,
    defaultValue
  );
}
