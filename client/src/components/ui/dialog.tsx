import * as React from "react";
import { cn } from "@/shared/utils";
import { useFocusTrap, useFocusRestore } from "@/hooks/use-focus-management";

const Dialog = ({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const { saveFocus, restoreFocus } = useFocusRestore();
  const focusTrapRef = useFocusTrap(!!open);

  React.useEffect(() => {
    if (open) {
      saveFocus();
      document.body.style.overflow = "hidden";
      
      // Respect prefers-reduced-motion for transitions
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        document.body.style.transition = 'overflow 0.2s ease';
      }
    } else {
      document.body.style.overflow = "";
      restoreFocus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, saveFocus, restoreFocus]);

  // Handle escape key
  React.useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange?.(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
        aria-hidden="true"
      />
      <div className="relative z-50" ref={focusTrapRef as React.RefObject<HTMLDivElement>}>
        {children}
      </div>
    </div>
  );
};

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
  }
>(({ className, children, 'aria-labelledby': ariaLabelledby, 'aria-describedby': ariaDescribedby, ...props }, ref) => {
  // Check for reduced motion preference
  const prefersReducedMotion = React.useMemo(() => 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches, []
  );

  return (
    <div
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
        "bg-gray-800 border-gray-600",
        // Apply transition only if user doesn't prefer reduced motion
        !prefersReducedMotion && "duration-200",
        className,
      )}
      role="document"
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      {...props}
    >
      {children}
    </div>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { children: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-white",
      className,
    )}
    {...props}
  >
    {children}
  </h2>
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-slate-400", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
      className,
    )}
    {...props}
  />
));
DialogTrigger.displayName = "DialogTrigger";

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger };
