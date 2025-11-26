import * as React from "react";
import { cn } from "@/shared/utils";

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(
  undefined,
);

const Select = ({
  children,
  value,
  onValueChange,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div ref={selectRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectTrigger must be used within a Select");

  const { open, setOpen } = context;

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onClick={() => setOpen(!open)}
      aria-haspopup="listbox"
      aria-expanded={open}
      {...props}
    >
      <span>{children}</span>
      <svg
        className={cn(
          "h-4 w-4 opacity-50 transition-transform",
          open && "rotate-180",
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within a Select");

  const { value } = context;

  return (
    <span className={cn(value ? "text-white" : "text-gray-400")}>
      {value || placeholder}
    </span>
  );
};

const SelectContent = ({ children }: { children: React.ReactNode }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectContent must be used within a Select");

  const { open } = context;

  if (!open) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
      <div className="p-1">{children}</div>
    </div>
  );
};

const SelectItem = ({
  children,
  value,
}: {
  children: React.ReactNode;
  value: string;
}) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectItem must be used within a Select");

  const { value: selectedValue, onValueChange, setOpen } = context;

  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-white hover:bg-gray-600",
        selectedValue === value && "bg-blue-600",
      )}
      onClick={() => {
        onValueChange?.(value);
        setOpen(false);
      }}
    >
      {children}
    </div>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
