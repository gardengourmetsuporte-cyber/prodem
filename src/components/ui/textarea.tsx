import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, onFocus, ...props }, ref) => {
  const handleFocus = React.useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }, 300);
    onFocus?.(e);
  }, [onFocus]);

  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-primary/15 bg-card/40 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
        className,
      )}
      ref={ref}
      onFocus={handleFocus}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
