/**
 * Focus Management Hooks for Accessibility
 * Provides comprehensive focus management for modals, forms, and navigation
 */

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook to trap focus within a container (for modals, dialogs)
 */
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<HTMLElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(containerRef.current.querySelectorAll(focusableSelectors))
      .filter(element => {
        // Filter out elements that are not visible
        const style = window.getComputedStyle(element as HTMLElement);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }) as HTMLElement[];
  }, []);

  const handleTabKey = useCallback((e: KeyboardEvent) => {
    if (!isActive || e.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, [isActive, getFocusableElements]);

  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (!isActive || e.key !== 'Escape') return;

    // Return focus to the trigger element if available
    const triggerElement = document.querySelector('[aria-expanded="true"]') as HTMLElement;
    if (triggerElement) {
      triggerElement.focus();
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      firstFocusableRef.current = focusableElements[0];
      lastFocusableRef.current = focusableElements[focusableElements.length - 1];

      // Focus first element when trap becomes active
      firstFocusableRef.current?.focus();
    }

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive, handleTabKey, handleEscapeKey, getFocusableElements]);

  return containerRef;
};

/**
 * Hook to restore focus to a previous element
 */
export const useFocusRestore = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      // Respect prefers-reduced-motion for focus transitions
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) {
        // Immediate focus without any transition delay
        previousFocusRef.current.focus();
      } else {
        // Small delay to allow for smooth transitions
        setTimeout(() => {
          previousFocusRef.current?.focus();
        }, 100);
      }
    }
  }, []);

  return { saveFocus, restoreFocus };
};

/**
 * Hook to manage focus on route changes
 */
export const useRouteAnnouncement = () => {
  const announceRouteChange = useCallback((routeName: string) => {
    // Create or update live region for route announcements
    let announcer = document.getElementById('route-announcer');

    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'route-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }

    // Clear and announce new route
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = `Navigated to ${routeName}`;
    }, 100);

    // Focus the main heading if available (respect motion preferences)
    const mainHeading = document.querySelector('h1, [role="heading"][aria-level="1"]') as HTMLElement;
    if (mainHeading) {
      mainHeading.setAttribute('tabindex', '-1');
      
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        mainHeading.focus();
      } else {
        // Small delay for smooth route transitions
        setTimeout(() => mainHeading.focus(), 150);
      }
    }
  }, []);

  return announceRouteChange;
};

/**
 * Hook to manage focus for form validation
 */
export const useFormFocusManagement = () => {
  const focusFirstError = useCallback(() => {
    // Find first element with error state
    const firstError = document.querySelector(
      '[aria-invalid="true"], .error, [data-error="true"]'
    ) as HTMLElement;

    if (firstError) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      firstError.focus();
      firstError.scrollIntoView({ 
        behavior: prefersReducedMotion ? 'auto' : 'smooth', 
        block: 'center' 
      });
    }
  }, []);

  const focusSuccessMessage = useCallback(() => {
    const successMessage = document.querySelector('[role="status"], .success-message') as HTMLElement;
    if (successMessage) {
      successMessage.setAttribute('tabindex', '-1');
      successMessage.focus();
    }
  }, []);

  return { focusFirstError, focusSuccessMessage };
};

/**
 * Hook to announce dynamic content changes with conflict prevention
 */
export const useScreenReaderAnnouncement = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Prevent conflicts by checking for existing announcements
    const existingAnnouncer = document.getElementById('dynamic-announcer');
    
    let announcer: HTMLElement;
    if (existingAnnouncer) {
      announcer = existingAnnouncer;
      // Clear existing content to avoid conflicts
      announcer.textContent = '';
    } else {
      announcer = document.createElement('div');
      announcer.id = 'dynamic-announcer';
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }
    
    // Set priority and announce
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    
    // Small delay to ensure screen readers pick up the change
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);

    // Clear after announcement (but keep element for reuse)
    setTimeout(() => {
      announcer.textContent = '';
    }, 3000);
  }, []);

  return announce;
};

/**
 * Hook to check user's motion preferences
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => 
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook to manage focus for dropdown/combobox components
 */
export const useComboboxFocus = (isOpen: boolean) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const activeIndexRef = useRef<number>(-1);

  const focusOption = useCallback((index: number) => {
    if (!listRef.current) return;

    const options = listRef.current.querySelectorAll('[role="option"]') as NodeListOf<HTMLElement>;
    if (options[index]) {
      options.forEach(option => option.setAttribute('aria-selected', 'false'));
      options[index].setAttribute('aria-selected', 'true');
      options[index].scrollIntoView({ block: 'nearest' });
      activeIndexRef.current = index;
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen || !listRef.current) return;

    const options = listRef.current.querySelectorAll('[role="option"]');
    const currentIndex = activeIndexRef.current;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        focusOption(nextIndex);
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        focusOption(prevIndex);
        break;
      }

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex >= 0) {
          (options[currentIndex] as HTMLElement).click();
        }
        break;

      case 'Escape':
        e.preventDefault();
        inputRef.current?.focus();
        break;
    }
  }, [isOpen, focusOption]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      activeIndexRef.current = -1;
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  return { inputRef, listRef, focusOption };
};
