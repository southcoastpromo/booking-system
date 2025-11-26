/**
 * Global Type Declarations
 * 
 * Extends globalThis and window objects with application-specific properties
 * to eliminate 'any' type usages throughout the codebase.
 */

declare global {
  /**
   * Extensions to globalThis for server-side application state
   */
  var __APP_STARTED: boolean | undefined;

  /**
   * Extensions to window object for client-side environment configuration
   */
  interface Window {
    ENV?: {
      MODE?: 'development' | 'production' | 'test';
    };
  }
}

export {};
