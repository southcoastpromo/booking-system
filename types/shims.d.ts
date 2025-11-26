/**
 * Type Shims for Sprint 1
 * 
 * Temporary ambient declarations for 3rd-party type gaps.
 * TODO Sprint 2: Review and remove as upstream types improve
 */

// Vite async config - known Vite types issue (non-blocking)
// vite.config.ts works correctly at runtime despite type error
declare module 'vite' {
  export interface UserConfigExport {
    // Allow async config functions
    (config: ConfigEnv): Promise<UserConfig> | UserConfig;
  }
}
