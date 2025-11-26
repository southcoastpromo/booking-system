/**
 * Skip Links Component for Keyboard Navigation Accessibility
 * Provides quick navigation to main content areas for screen reader users
 */

import type { FC, ReactNode } from 'react';
import { cn } from '@/shared/utils';

interface SkipLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

const SkipLink: FC<SkipLinkProps> = ({ href, children, className }) => (
  <a
    href={href}
    className={cn(
      // Hidden by default, visible on focus
      'sr-only focus:not-sr-only',
      // Positioning when focused
      'focus:absolute focus:top-4 focus:left-4 focus:z-50',
      // Styling when focused
      'focus:bg-accent-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-md',
      'focus:border-2 focus:border-white focus:shadow-lg',
      // Typography
      'focus:font-medium focus:text-sm',
      // Animation
      'focus:transition-all focus:duration-200',
      className
    )}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          // Add tabindex to make element focusable if it's not normally
          if (!target.hasAttribute('tabindex')) {
            target.setAttribute('tabindex', '-1');
          }
          (target as HTMLElement).focus();
          // Scroll to element smoothly
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }}
  >
    {children}
  </a>
);

interface SkipLinksProps {
  className?: string;
}

export const SkipLinks: FC<SkipLinksProps> = ({ className }) => {
  return (
    <div className={cn('skip-links', className)} role="navigation" aria-label="Skip navigation">
      <SkipLink href="#main-content">
        Skip to main content
      </SkipLink>
      <SkipLink href="#main-navigation">
        Skip to navigation
      </SkipLink>
      <SkipLink href="#search-form">
        Skip to search
      </SkipLink>
      <SkipLink href="#footer">
        Skip to footer
      </SkipLink>
    </div>
  );
};

// Higher-order component to add skip link functionality to any page
export const withSkipLinks = <P extends object>(
  Component: React.ComponentType<P>
): FC<P> => {
  const WithSkipLinksComponent: FC<P> = (props) => (
    <>
      <SkipLinks />
      <Component {...props} />
    </>
  );

  WithSkipLinksComponent.displayName = `withSkipLinks(${Component.displayName || Component.name})`;
  return WithSkipLinksComponent;
};

export default SkipLinks;
