import * as React from "react";
import { cn } from "@/shared/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    // Ensure button has accessible content
    if (!children && !props['aria-label']) {
      console.warn('Button requires either children or aria-label for accessibility');
    }
    
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 truncate touch-manipulation",
          variant === "default" && "bg-blue-600 hover:bg-blue-700 text-white active:bg-blue-800",
          variant === "destructive" && "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
          variant === "outline" &&
            "border border-gray-600 bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-800",
          variant === "secondary" && "bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800",
          variant === "ghost" && "hover:bg-gray-700 hover:text-white active:bg-gray-800",
          variant === "link" &&
            "text-blue-500 underline-offset-4 hover:underline focus:underline",
          size === "default" && "h-10 px-4 py-2 min-h-[44px]", // Ensure minimum touch target
          size === "sm" && "h-9 rounded-md px-3 min-h-[44px]",
          size === "lg" && "h-11 rounded-md px-8 min-h-[44px]",
          size === "icon" && "h-10 w-10 min-h-[44px] min-w-[44px]", // Minimum touch target for icons
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
