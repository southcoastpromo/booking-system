/**
 * UI Constants and Theme Configuration
 * Single source of truth for design system constants
 */

// Color Palette
export const UI_COLORS = {
  // Status Colors
  SUCCESS: '#10b981',
  WARNING: '#f59e0b', 
  ERROR: '#ef4444',
  INFO: '#3b82f6',
  NEUTRAL: '#6b7280',
  
  // Brand Colors
  PRIMARY: '#2c3e50',
  SECONDARY: '#34495e',
  ACCENT: '#3498db',
  HIGHLIGHT: '#e74c3c',
  
  // Grayscale
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY_50: '#f9fafb',
  GRAY_100: '#f3f4f6',
  GRAY_200: '#e5e7eb',
  GRAY_300: '#d1d5db',
  GRAY_400: '#9ca3af',
  GRAY_500: '#6b7280',
  GRAY_600: '#4b5563',
  GRAY_700: '#374151',
  GRAY_800: '#1f2937',
  GRAY_900: '#111827',
  
  // Background Colors
  BACKGROUND_PRIMARY: '#ffffff',
  BACKGROUND_SECONDARY: '#f8fafc',
  BACKGROUND_TERTIARY: '#f1f5f9',
  
  // Text Colors
  TEXT_PRIMARY: '#1f2937',
  TEXT_SECONDARY: '#6b7280',
  TEXT_MUTED: '#9ca3af',
  TEXT_INVERSE: '#ffffff',
} as const;

// Spacing Scale
export const UI_SPACING = {
  // Base spacing units (rem)
  XS: '0.25rem',  // 4px
  SM: '0.5rem',   // 8px
  MD: '1rem',     // 16px
  LG: '1.5rem',   // 24px
  XL: '2rem',     // 32px
  XXL: '3rem',    // 48px
  XXXL: '4rem',   // 64px
  
  // Component specific
  TOUCH_TARGET_MIN: '44px',
  BORDER_RADIUS: '8px',
  BORDER_RADIUS_SM: '4px',
  BORDER_RADIUS_LG: '12px',
  BORDER_RADIUS_FULL: '9999px',
  CONTAINER_PADDING: '1rem',
  SECTION_PADDING: '2rem',
  
  // Layout
  HEADER_HEIGHT: '64px',
  SIDEBAR_WIDTH: '280px',
  NAVBAR_HEIGHT: '56px',
  FOOTER_HEIGHT: '80px',
} as const;

// Typography Scale
export const UI_TYPOGRAPHY = {
  // Font Families
  FONT_PRIMARY: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  FONT_MONO: "'JetBrains Mono', Consolas, Monaco, 'Courier New', monospace",
  FONT_DISPLAY: "'DM Sans', Georgia, serif",
  
  // Font Sizes (rem)
  TEXT_XS: '0.75rem',   // 12px
  TEXT_SM: '0.875rem',  // 14px
  TEXT_BASE: '1rem',    // 16px
  TEXT_LG: '1.125rem',  // 18px
  TEXT_XL: '1.25rem',   // 20px
  TEXT_2XL: '1.5rem',   // 24px
  TEXT_3XL: '1.875rem', // 30px
  TEXT_4XL: '2.25rem',  // 36px
  TEXT_5XL: '3rem',     // 48px
  
  // Font Weights
  WEIGHT_LIGHT: '300',
  WEIGHT_NORMAL: '400',
  WEIGHT_MEDIUM: '500',
  WEIGHT_SEMIBOLD: '600',
  WEIGHT_BOLD: '700',
  WEIGHT_EXTRABOLD: '800',
  
  // Line Heights
  LEADING_TIGHT: '1.25',
  LEADING_SNUG: '1.375',
  LEADING_NORMAL: '1.5',
  LEADING_RELAXED: '1.625',
  LEADING_LOOSE: '2',
} as const;

// Transitions and Animations
export const UI_TRANSITIONS = {
  FAST: '0.1s ease',
  NORMAL: '0.2s ease',
  SLOW: '0.3s ease',
  BOUNCE: '0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // Specific animation durations
  HOVER: '0.15s ease',
  BUTTON_PRESS: '0.1s ease',
  MODAL_ENTER: '0.2s ease-out',
  MODAL_EXIT: '0.15s ease-in',
  TOOLTIP: '0.1s ease',
  
  // Animation timing functions
  EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
  EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Z-Index Scale
export const UI_Z_INDEX = {
  NEGATIVE: -1,
  BASE: 0,
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080,
  LOADING: 9990,
  DEBUG: 9999,
} as const;

// Shadow Scale
export const UI_SHADOWS = {
  NONE: 'none',
  SM: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  MD: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  LG: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  XL: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  INNER: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// Breakpoints for Responsive Design
export const UI_BREAKPOINTS = {
  XS: '320px',
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  XXL: '1536px',
} as const;

// Component Sizes
export const UI_SIZES = {
  // Button sizes
  BUTTON_SM: '32px',
  BUTTON_MD: '40px',
  BUTTON_LG: '48px',
  
  // Input sizes
  INPUT_SM: '32px',
  INPUT_MD: '40px',
  INPUT_LG: '48px',
  
  // Avatar sizes
  AVATAR_XS: '24px',
  AVATAR_SM: '32px',
  AVATAR_MD: '40px',
  AVATAR_LG: '48px',
  AVATAR_XL: '64px',
  
  // Icon sizes
  ICON_XS: '12px',
  ICON_SM: '16px',
  ICON_MD: '20px',
  ICON_LG: '24px',
  ICON_XL: '32px',
} as const;

// Google Fonts Configuration
export const UI_FONTS = {
  GOOGLE_FONTS_URL: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap',
  GOOGLE_FONTS_MONO_URL: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap',
  PRELOAD_FONTS: [
    'https://fonts.gstatic.com/s/dmsans/v11/rP2Hp2ywxg089UriCZOIHQ.woff2',
    'https://fonts.gstatic.com/s/jetbrainsmono/v13/tDbY_J40kE68Y_g8W3u8Q7g3QOA.woff2',
  ],
} as const;

// Accessibility Constants
export const UI_ACCESSIBILITY = {
  FOCUS_RING: '2px solid #3b82f6',
  FOCUS_RING_OFFSET: '2px',
  MIN_CONTRAST_RATIO: 4.5,
  MIN_TOUCH_TARGET: '44px',
  SCREEN_READER_ONLY: 'sr-only',
} as const;

// Theme Configuration
export const UI_THEME = {
  LIGHT: {
    name: 'light',
    colors: {
      background: UI_COLORS.BACKGROUND_PRIMARY,
      foreground: UI_COLORS.TEXT_PRIMARY,
      muted: UI_COLORS.GRAY_100,
      accent: UI_COLORS.ACCENT,
      border: UI_COLORS.GRAY_200,
    },
  },
  DARK: {
    name: 'dark',
    colors: {
      background: UI_COLORS.GRAY_900,
      foreground: UI_COLORS.WHITE,
      muted: UI_COLORS.GRAY_800,
      accent: UI_COLORS.ACCENT,
      border: UI_COLORS.GRAY_700,
    },
  },
} as const;

// Animation Presets
export const UI_ANIMATIONS = {
  FADE_IN: 'fadeIn 0.2s ease-out',
  FADE_OUT: 'fadeOut 0.15s ease-in',
  SLIDE_UP: 'slideUp 0.3s ease-out',
  SLIDE_DOWN: 'slideDown 0.3s ease-out',
  SCALE_IN: 'scaleIn 0.2s ease-out',
  SCALE_OUT: 'scaleOut 0.15s ease-in',
  BOUNCE: 'bounce 0.6s ease',
  PULSE: 'pulse 2s infinite',
  SPIN: 'spin 1s linear infinite',
} as const;
