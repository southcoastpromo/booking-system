/**
 * Result<T, E> Pattern Implementation
 * 
 * Comprehensive Result type providing type-safe error handling throughout the service layer.
 * Eliminates throwing exceptions and provides explicit, predictable error handling patterns.
 * 
 * Core Features:
 * - Type-safe error handling with explicit error types
 * - Functional programming utilities (map, flatMap, match)
 * - Promise integration with async/await support
 * - Conversion utilities from throw-based patterns
 * - Zero-cost abstraction with full TypeScript inference
 * 
 * Usage Patterns:
 * - Service methods return Result<Data, ErrorType> instead of throwing
 * - Route handlers use pattern matching for error handling
 * - Business logic uses functional composition with map/flatMap
 * - Error types are explicit enums for compile-time safety
 * 
 * @fileoverview Core Result utility for enterprise error handling
 * @version 1.0.0
 * @author SouthCoast ProMotion Development Team
 * @since 2024-01-01
 */

/**
 * Core Result Type
 * 
 * Represents either a successful result (Ok) or an error result (Err).
 * Provides type safety by forcing explicit handling of both success and error cases.
 * 
 * @template T - Type of successful result data
 * @template E - Type of error data (should be explicit enum)
 */
export type Result<T, E> = 
  | { readonly success: true; readonly data: T; readonly error?: never }
  | { readonly success: false; readonly data?: never; readonly error: E };

/**
 * Result Construction Utilities
 * 
 * Factory functions for creating Result instances with proper type inference.
 * These functions ensure correct Result structure and enable functional composition.
 */
// eslint-disable-next-line no-redeclare
export const Result = {
  /**
   * Create successful Result with data
   * 
   * @template T - Type of success data
   * @param data - Success data to wrap
   * @returns Result representing success
   */
  ok: <T>(data: T): Result<T, never> => ({ success: true, data }),

  /**
   * Create error Result with typed error
   * 
   * @template E - Type of error (should be explicit enum)
   * @param error - Error data to wrap
   * @returns Result representing error
   */
  err: <E>(error: E): Result<never, E> => ({ success: false, error }),

  /**
   * Type guard to check if Result is successful
   * 
   * @param result - Result to check
   * @returns Type predicate indicating success
   */
  isOk: <T, E>(result: Result<T, E>): result is { success: true; data: T } => 
    result.success,

  /**
   * Type guard to check if Result is error
   * 
   * @param result - Result to check
   * @returns Type predicate indicating error
   */
  isErr: <T, E>(result: Result<T, E>): result is { success: false; error: E } => 
    !result.success,

  /**
   * Transform successful Result data with function
   * 
   * Applies transformation function only to successful Results.
   * Error Results pass through unchanged.
   * 
   * @template T - Input data type
   * @template U - Output data type
   * @template E - Error type
   * @param result - Result to transform
   * @param fn - Transformation function
   * @returns Transformed Result
   */
  map: <T, U, E>(
    result: Result<T, E>, 
    fn: (data: T) => U
  ): Result<U, E> => {
    return result.success 
      ? Result.ok(fn(result.data))
      : result as Result<U, E>;
  },

  /**
   * Chain Result-returning operations (flatMap/bind)
   * 
   * Enables composition of multiple Result-returning functions.
   * Short-circuits on first error encountered.
   * 
   * @template T - Input data type
   * @template U - Output data type
   * @template E - Error type
   * @param result - Result to chain
   * @param fn - Function returning new Result
   * @returns Chained Result
   */
  flatMap: <T, U, E>(
    result: Result<T, E>,
    fn: (data: T) => Result<U, E>
  ): Result<U, E> => {
    return result.success 
      ? fn(result.data)
      : result as Result<U, E>;
  },

  /**
   * Pattern matching for Result handling
   * 
   * Provides exhaustive case handling for both success and error cases.
   * Ensures all Result cases are handled at compile time.
   * 
   * @template T - Success data type
   * @template E - Error data type
   * @template U - Return type
   * @param result - Result to match against
   * @param matcher - Object with ok and err handlers
   * @returns Matched result
   */
  match: <T, E, U>(
    result: Result<T, E>,
    matcher: {
      ok: (data: T) => U;
      err: (error: E) => U;
    }
  ): U => {
    return result.success 
      ? matcher.ok(result.data)
      : matcher.err(result.error);
  },

  /**
   * Extract data from successful Result or throw
   * 
   * Use sparingly - prefer pattern matching for error handling.
   * Useful for testing or when certain success is guaranteed.
   * 
   * @template T - Data type
   * @template E - Error type
   * @param result - Result to unwrap
   * @returns Unwrapped data
   * @throws Error if Result is error
   */
  unwrap: <T, E>(result: Result<T, E>): T => {
    if (result.success) {
      return result.data;
    }
    throw new Error(`Failed to unwrap Result: ${JSON.stringify(result.error)}`);
  },

  /**
   * Extract data from Result or return default
   * 
   * Safe way to get data with fallback for error cases.
   * Useful when default values are acceptable.
   * 
   * @template T - Data type
   * @template E - Error type
   * @param result - Result to extract from
   * @param defaultValue - Default value for error cases
   * @returns Data or default value
   */
  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T => {
    return result.success ? result.data : defaultValue;
  },

  /**
   * Convert Promise to Result pattern
   * 
   * Wraps async operations to return Result instead of throwing.
   * Enables consistent error handling across sync and async operations.
   * 
   * @template T - Success data type
   * @template E - Error data type
   * @param promise - Promise to convert
   * @param errorMapper - Function to map thrown errors to typed errors
   * @returns Promise resolving to Result
   */
  fromPromise: async <T, E>(
    promise: Promise<T>,
    errorMapper: (error: unknown) => E
  ): Promise<Result<T, E>> => {
    try {
      const data = await promise;
      return Result.ok(data);
    } catch (error) {
      return Result.err(errorMapper(error));
    }
  },

  /**
   * Convert throwing function to Result pattern
   * 
   * Wraps synchronous functions that throw to return Result instead.
   * Useful for gradually converting throw-based code.
   * 
   * @template T - Success data type
   * @template E - Error data type
   * @param fn - Function that might throw
   * @param errorMapper - Function to map thrown errors to typed errors
   * @returns Result instead of throwing
   */
  fromThrowing: <T, E>(
    fn: () => T,
    errorMapper: (error: unknown) => E
  ): Result<T, E> => {
    try {
      const data = fn();
      return Result.ok(data);
    } catch (error) {
      return Result.err(errorMapper(error));
    }
  },

  /**
   * Combine multiple Results into single Result
   * 
   * All Results must be successful for combined Result to be successful.
   * Returns first error encountered if any Result fails.
   * 
   * @template T - Array of success data types
   * @template E - Error type
   * @param results - Array of Results to combine
   * @returns Combined Result with array of data or first error
   */
  all: <T extends readonly unknown[], E>(
    results: { [K in keyof T]: Result<T[K], E> }
  ): Result<T, E> => {
    const data: unknown[] = [];
    
    for (const result of results) {
      if (!result.success) {
        return result as Result<T, E>;
      }
      data.push(result.data);
    }
    
    return Result.ok(data as unknown as T);
  },

  /**
   * Filter and map Results in single operation
   * 
   * Applies function only to successful Results, collecting successful transformations.
   * Error Results are filtered out of the final array.
   * 
   * @template T - Input data type
   * @template U - Output data type
   * @template E - Error type
   * @param results - Array of Results to process
   * @param fn - Transformation function for successful data
   * @returns Array of transformed successful data
   */
  filterMapOk: <T, U, E>(
    results: Result<T, E>[],
    fn: (data: T) => U
  ): U[] => {
    return results
      .filter(Result.isOk)
      .map(result => fn(result.data));
  },

  /**
   * Partition Results into successes and errors
   * 
   * Separates array of Results into successful data and error arrays.
   * Useful for batch processing with partial failures.
   * 
   * @template T - Success data type
   * @template E - Error data type
   * @param results - Array of Results to partition
   * @returns Object with ok and err arrays
   */
  partition: <T, E>(
    results: Result<T, E>[]
  ): { ok: T[]; err: E[] } => {
    const ok: T[] = [];
    const err: E[] = [];
    
    for (const result of results) {
      if (result.success) {
        ok.push(result.data);
      } else {
        err.push(result.error);
      }
    }
    
    return { ok, err };
  }
};

/**
 * Utility type for async Result operations
 * Represents Promise that resolves to Result
 */
export type AsyncResult<T, E> = Promise<Result<T, E>>;

/**
 * Utility type for Result with multiple possible error types
 * Useful when operations can fail with different error categories
 */
export type MultiResult<T, E1, E2> = Result<T, E1 | E2>;

/**
 * Type guard for checking specific error types
 * Enables type-safe error handling in match operations
 */
export const isErrorType = <E, K extends keyof E>(
  error: E,
  errorType: K,
  errorMap: Record<K, unknown>
): error is E & Record<K, E[K]> => {
  return Object.prototype.hasOwnProperty.call(errorMap, errorType) &&
         Object.prototype.hasOwnProperty.call(error as Record<string, unknown>, errorType);
};

/**
 * Result-aware logging utilities
 * Provides structured logging for Result operations
 */
export const ResultLogger = {
  /**
   * Log successful Result operation
   */
  logOk: <T>(operation: string, result: T, metadata?: Record<string, unknown>) => {
    console.log(`✓ ${operation}`, { success: true, data: result, ...metadata });
  },

  /**
   * Log failed Result operation
   */
  logErr: <E>(operation: string, error: E, metadata?: Record<string, unknown>) => {
    console.error(`✗ ${operation}`, { success: false, error, ...metadata });
  },

  /**
   * Log Result with automatic success/error detection
   */
  logResult: <T, E>(
    operation: string, 
    result: Result<T, E>, 
    metadata?: Record<string, unknown>
  ) => {
    if (result.success) {
      ResultLogger.logOk(operation, result.data, metadata);
    } else {
      ResultLogger.logErr(operation, result.error, metadata);
    }
  }
};
