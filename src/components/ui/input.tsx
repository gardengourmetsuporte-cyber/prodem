import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onFocus, ...props }, ref) => {
    const handleFocus = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      // Auto-scroll into view after keyboard opens (300ms delay for iOS)
      setTimeout(() => {
        e.target.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      }, 300);
      onFocus?.(e);
    }, [onFocus]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border border-primary/15 bg-card/40 shadow-sm px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/40 focus-visible:bg-card/60 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        onFocus={handleFocus}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
