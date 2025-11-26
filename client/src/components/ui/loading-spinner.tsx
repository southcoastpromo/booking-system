/**
 * Loading Spinner Component
 * Used as Suspense fallback for lazy-loaded components
 */
import type { FC } from 'react';
import { cn } from "@/shared/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  size = "md",
  className,
  text = "Loading..."
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-accent-blue border-t-transparent",
          sizeClasses[size]
        )}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="mt-3 text-sm text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

/**
 * Minimal loading spinner for inline use
 */
export const InlineSpinner: FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "animate-spin rounded-full h-4 w-4 border-2 border-accent-blue border-t-transparent",
      className
    )}
    role="status"
    aria-label="Loading"
  />
);
