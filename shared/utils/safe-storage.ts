/**
 * Safe Storage Utilities
 * 
 * Provides safe wrappers for localStorage and sessionStorage operations that never throw errors.
 * Handles quota exceeded errors, storage unavailability (private browsing), and other edge cases.
 * 
 * Features:
 * - Never throws exceptions - returns Result objects instead
 * - Handles storage quota exceeded gracefully
 * - Works in private browsing mode (returns appropriate errors)
 * - Type-safe operations with JSON serialization
 * - Comprehensive error reporting and logging
 * - Fallback mechanisms for degraded functionality
 * 
 * @fileoverview Core storage safety utilities for enterprise error handling
 * @version 1.0.0
 * @author SouthCoast ProMotion Development Team
 * @since 2024-01-01
 */

import { Result } from './result';
import { safeParseJSON, safeStringifyJSON, JsonError } from './safe-json';

/**
 * Storage Error Types
 * 
 * Explicit error types for storage operations to enable type-safe error handling
 */
export enum StorageError {
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SECURITY_ERROR = 'SECURITY_ERROR',
  INVALID_KEY = 'INVALID_KEY',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Storage Type Enum
 */
export enum StorageType {
  LOCAL = 'localStorage',
  SESSION = 'sessionStorage'
}

/**
 * Storage Interface
 * 
 * Abstraction over browser storage to enable testing and mock implementations
 */
interface StorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  readonly length: number;
  key(index: number): string | null;
}

/**
 * Check if storage is available
 * 
 * Tests storage availability by attempting to write and read a test value.
 * Handles private browsing mode and other storage restrictions.
 * 
 * @param storageType - Type of storage to check
 * @returns true if storage is available and functional
 */
function isStorageAvailable(storageType: StorageType): boolean {
  try {
    const storage = storageType === StorageType.LOCAL 
      ? window.localStorage 
      : window.sessionStorage;
    
    const testKey = '__storage_test__';
    const testValue = 'test';
    
    storage.setItem(testKey, testValue);
    const retrieved = storage.getItem(testKey);
    storage.removeItem(testKey);
    
    return retrieved === testValue;
  } catch {
    return false;
  }
}

/**
 * Get storage provider with availability check
 * 
 * @param storageType - Type of storage to get
 * @returns Result with storage provider or error
 */
function getStorageProvider(storageType: StorageType): Result<StorageProvider, StorageError> {
  try {
    if (typeof window === 'undefined') {
      return Result.err(StorageError.STORAGE_UNAVAILABLE);
    }

    const storage = storageType === StorageType.LOCAL 
      ? window.localStorage 
      : window.sessionStorage;

    if (!storage) {
      return Result.err(StorageError.STORAGE_UNAVAILABLE);
    }

    // Test availability
    if (!isStorageAvailable(storageType)) {
      return Result.err(StorageError.STORAGE_UNAVAILABLE);
    }

    return Result.ok(storage);
  } catch (error) {
    console.warn(`[SAFE-STORAGE] ${storageType} unavailable:`, error);
    return Result.err(StorageError.STORAGE_UNAVAILABLE);
  }
}

/**
 * Classify storage errors
 * 
 * @param error - Error from storage operation
 * @returns Classified storage error
 */
function classifyStorageError(error: unknown): StorageError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('quota') || message.includes('exceeded')) {
      return StorageError.QUOTA_EXCEEDED;
    }
    
    if (message.includes('security') || message.includes('access')) {
      return StorageError.SECURITY_ERROR;
    }
  }
  
  return StorageError.UNKNOWN_ERROR;
}

/**
 * Safe storage get operation
 * 
 * Retrieves and parses a value from storage safely. Handles all error conditions
 * and returns appropriate Result objects.
 * 
 * @template T - Expected type of stored value
 * @param key - Storage key
 * @param storageType - Type of storage to use
 * @param defaultValue - Default value if key doesn't exist or parsing fails
 * @returns Result with parsed value or error
 */
export function getItemSafe<T = unknown>(
  key: string,
  storageType: StorageType = StorageType.LOCAL,
  defaultValue?: T
): Result<T | null, StorageError> {
  // Validate key
  if (!key || typeof key !== 'string') {
    return Result.err(StorageError.INVALID_KEY);
  }

  const storageResult = getStorageProvider(storageType);
  if (!storageResult.success) {
    return storageResult;
  }

  try {
    const rawValue = storageResult.data.getItem(key);
    
    // Key doesn't exist
    if (rawValue === null) {
      return Result.ok(defaultValue !== undefined ? defaultValue : null);
    }

    // Parse JSON value
    const parseResult = safeParseJSON<T>(rawValue, defaultValue);
    if (!parseResult.success) {
      console.warn(`[SAFE-STORAGE] Failed to parse ${storageType} value for key "${key}":`, rawValue);
      return Result.err(StorageError.SERIALIZATION_ERROR);
    }

    return Result.ok(parseResult.data);
  } catch (error) {
    console.error(`[SAFE-STORAGE] Error getting ${storageType} item "${key}":`, error);
    const errorType = classifyStorageError(error);
    return Result.err(errorType);
  }
}

/**
 * Safe storage set operation
 * 
 * Stringifies and stores a value safely. Handles quota exceeded and other errors.
 * 
 * @param key - Storage key
 * @param value - Value to store
 * @param storageType - Type of storage to use
 * @returns Result indicating success or error
 */
export function setItemSafe(
  key: string,
  value: unknown,
  storageType: StorageType = StorageType.LOCAL
): Result<void, StorageError> {
  // Validate key
  if (!key || typeof key !== 'string') {
    return Result.err(StorageError.INVALID_KEY);
  }

  const storageResult = getStorageProvider(storageType);
  if (!storageResult.success) {
    return storageResult;
  }

  // Stringify value
  const stringifyResult = safeStringifyJSON(value);
  if (!stringifyResult.success) {
    console.warn(`[SAFE-STORAGE] Failed to stringify value for ${storageType} key "${key}":`, value);
    return Result.err(StorageError.SERIALIZATION_ERROR);
  }

  try {
    storageResult.data.setItem(key, stringifyResult.data);
    return Result.ok(undefined);
  } catch (error) {
    console.error(`[SAFE-STORAGE] Error setting ${storageType} item "${key}":`, error);
    const errorType = classifyStorageError(error);
    
    // Special handling for quota exceeded
    if (errorType === StorageError.QUOTA_EXCEEDED) {
      console.warn(`[SAFE-STORAGE] ${storageType} quota exceeded. Consider clearing old data.`);
    }
    
    return Result.err(errorType);
  }
}

/**
 * Safe storage remove operation
 * 
 * Removes a key from storage safely.
 * 
 * @param key - Storage key to remove
 * @param storageType - Type of storage to use
 * @returns Result indicating success or error
 */
export function removeItemSafe(
  key: string,
  storageType: StorageType = StorageType.LOCAL
): Result<void, StorageError> {
  // Validate key
  if (!key || typeof key !== 'string') {
    return Result.err(StorageError.INVALID_KEY);
  }

  const storageResult = getStorageProvider(storageType);
  if (!storageResult.success) {
    return storageResult;
  }

  try {
    storageResult.data.removeItem(key);
    return Result.ok(undefined);
  } catch (error) {
    console.error(`[SAFE-STORAGE] Error removing ${storageType} item "${key}":`, error);
    const errorType = classifyStorageError(error);
    return Result.err(errorType);
  }
}

/**
 * Safe storage clear operation
 * 
 * Clears all items from storage safely.
 * 
 * @param storageType - Type of storage to clear
 * @returns Result indicating success or error
 */
export function clearSafe(
  storageType: StorageType = StorageType.LOCAL
): Result<void, StorageError> {
  const storageResult = getStorageProvider(storageType);
  if (!storageResult.success) {
    return storageResult;
  }

  try {
    storageResult.data.clear();
    return Result.ok(undefined);
  } catch (error) {
    console.error(`[SAFE-STORAGE] Error clearing ${storageType}:`, error);
    const errorType = classifyStorageError(error);
    return Result.err(errorType);
  }
}

/**
 * Get storage info
 * 
 * Returns information about storage usage and availability.
 * 
 * @param storageType - Type of storage to check
 * @returns Storage information or error
 */
export function getStorageInfo(
  storageType: StorageType = StorageType.LOCAL
): Result<{ available: boolean; itemCount: number }, StorageError> {
  const storageResult = getStorageProvider(storageType);
  if (!storageResult.success) {
    return Result.ok({ available: false, itemCount: 0 });
  }

  try {
    const itemCount = storageResult.data.length;
    return Result.ok({ available: true, itemCount });
  } catch (error) {
    console.error(`[SAFE-STORAGE] Error getting ${storageType} info:`, error);
    return Result.ok({ available: false, itemCount: 0 });
  }
}

/**
 * Convenience helpers for localStorage
 */
export const LocalStorage = {
  get: <T = unknown>(key: string, defaultValue?: T) => 
    getItemSafe<T>(key, StorageType.LOCAL, defaultValue),
  set: (key: string, value: unknown) => 
    setItemSafe(key, value, StorageType.LOCAL),
  remove: (key: string) => 
    removeItemSafe(key, StorageType.LOCAL),
  clear: () => 
    clearSafe(StorageType.LOCAL),
  info: () => 
    getStorageInfo(StorageType.LOCAL)
};

/**
 * Convenience helpers for sessionStorage
 */
export const SessionStorage = {
  get: <T = unknown>(key: string, defaultValue?: T) => 
    getItemSafe<T>(key, StorageType.SESSION, defaultValue),
  set: (key: string, value: unknown) => 
    setItemSafe(key, value, StorageType.SESSION),
  remove: (key: string) => 
    removeItemSafe(key, StorageType.SESSION),
  clear: () => 
    clearSafe(StorageType.SESSION),
  info: () => 
    getStorageInfo(StorageType.SESSION)
};

/**
 * Storage hook for React components
 * 
 * Provides a React-friendly interface for safe storage operations.
 * Can be used to create custom hooks for specific storage needs.
 * 
 * @param key - Storage key
 * @param storageType - Type of storage to use
 * @param defaultValue - Default value
 * @returns Storage operations for React components
 */
export function createStorageHook<T>(
  key: string,
  storageType: StorageType = StorageType.LOCAL,
  defaultValue?: T
) {
  return {
    get: () => getItemSafe<T>(key, storageType, defaultValue),
    set: (value: T) => setItemSafe(key, value, storageType),
    remove: () => removeItemSafe(key, storageType),
    key
  };
}
