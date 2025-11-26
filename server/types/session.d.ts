/**
 * Session Type Definitions
 * Extends Express Session to include custom properties
 */

import type { Session } from 'express-session';

declare global {
  namespace Express {
    interface Request {
      session: Session & {
        userId?: number;
        email?: string;
        role?: string;
        csrfToken?: string;
        csrfSecret?: string;
        csrfTokenCreated?: number;
        isAuthenticated?: boolean;
        authenticated?: boolean;
        save: (callback?: (err?: Error | null) => void) => void;
        regenerate: (callback?: (err?: Error | null) => void) => void;
        destroy: (callback?: (err?: Error | null) => void) => void;
        reload: (callback?: (err?: Error | null) => void) => void;
        resetMaxAge: () => void;
        touch: () => void;
      };
    }
  }
}

// Also extend express-session module for compatibility
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    email?: string;
    role?: string;
    csrfToken?: string;
    csrfSecret?: string;
    csrfTokenCreated?: number;
    isAuthenticated?: boolean;
    authenticated?: boolean;
  }
}
