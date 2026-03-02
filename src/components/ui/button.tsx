import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/native";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 border border-primary/20",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm border border-destructive/20",
        outline: "border border-primary/15 bg-card/40 backdrop-blur-md hover:bg-primary/5 hover:border-primary/30 hover:text-primary",
        secondary: "bg-secondary/60 backdrop-blur-xl text-secondary-foreground hover:bg-secondary/80 border border-border/40 shadow-sm",
        ghost: "hover:bg-primary/5 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "bg-white/10 text-white border border-white/20 backdrop-blur-xl hover:bg-white/20 shadow-sm",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      hapticLight();
      onClick?.(e);
    }, [onClick]);
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} onClick={handleClick} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
