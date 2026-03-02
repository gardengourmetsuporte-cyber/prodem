import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// ── Context to share mobile state across compound components ──
const SheetMobileContext = React.createContext(false);

// ── Root ──
interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  modal?: boolean;
  /** When true, mobile drawer can only be closed via handle bar (not by dragging content) */
  mobileHandleOnly?: boolean;
}

const Sheet = React.forwardRef<HTMLDivElement, SheetProps>(({ children, mobileHandleOnly, ...props }, _ref) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <SheetMobileContext.Provider value={true}>
        <DrawerPrimitive.Root handleOnly={mobileHandleOnly} {...props}>
          {children}
        </DrawerPrimitive.Root>
      </SheetMobileContext.Provider>
    );
  }

  return (
    <SheetMobileContext.Provider value={false}>
      <SheetPrimitive.Root {...props}>{children}</SheetPrimitive.Root>
    </SheetMobileContext.Provider>
  );
});
Sheet.displayName = "Sheet";

// ── Trigger ──
const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger>
>((props, ref) => {
  const isMobile = React.useContext(SheetMobileContext);
  if (isMobile) return <DrawerPrimitive.Trigger ref={ref} {...props} />;
  return <SheetPrimitive.Trigger ref={ref} {...props} />;
});
SheetTrigger.displayName = "SheetTrigger";

// ── Close ──
const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Close>
>((props, ref) => {
  const isMobile = React.useContext(SheetMobileContext);
  if (isMobile) return <DrawerPrimitive.Close ref={ref} {...props} />;
  return <SheetPrimitive.Close ref={ref} {...props} />;
});
SheetClose.displayName = "SheetClose";

// ── Portal ──
const SheetPortal = (props: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Portal>) => {
  const isMobile = React.useContext(SheetMobileContext);
  if (isMobile) return <DrawerPrimitive.Portal {...props} />;
  return <SheetPrimitive.Portal {...props} />;
};

// ── Overlay ──
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const isMobile = React.useContext(SheetMobileContext);

  if (isMobile) {
    return (
      <DrawerPrimitive.Overlay
        ref={ref}
        className={cn("fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm", className)}
        {...props}
      />
    );
  }

  return (
    <SheetPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
      ref={ref}
    />
  );
});
SheetOverlay.displayName = "SheetOverlay";

// ── Content variants (desktop only) ──
const sheetVariants = cva(
  "fixed z-[90] gap-4 bg-background border-primary/10 p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = "right", className, children, ...props }, ref) => {
    const isMobile = React.useContext(SheetMobileContext);

    if (isMobile) {
      return (
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" />
          <DrawerPrimitive.Content
            ref={ref as React.Ref<HTMLDivElement>}
            className={cn(
              "fixed inset-x-0 bottom-0 z-[90] mt-24 flex h-auto min-h-[55vh] max-h-[96vh] flex-col rounded-t-3xl border border-primary/10 bg-background",
              className,
            )}
            {...(props as any)}
          >
            <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-primary/20" />
            <div className="flex flex-1 flex-col overflow-y-auto p-6">{children}</div>
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      );
    }

    return (
      <SheetPortal>
        <SheetOverlay />
        <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
          {children}
          <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-secondary hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        </SheetPrimitive.Content>
      </SheetPortal>
    );
  },
);
SheetContent.displayName = "SheetContent";

// ── Header ──
const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const isMobile = React.useContext(SheetMobileContext);
  if (isMobile) {
    return <div className={cn("grid gap-1.5 text-center sm:text-left", className)} {...props} />;
  }
  return <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />;
};
SheetHeader.displayName = "SheetHeader";

// ── Footer ──
const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
SheetFooter.displayName = "SheetFooter";

// ── Title ──
const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => {
  const isMobile = React.useContext(SheetMobileContext);

  if (isMobile) {
    return (
      <DrawerPrimitive.Title
        ref={ref}
        className={cn("text-lg font-semibold text-foreground", className)}
        {...props}
      />
    );
  }

  return (
    <SheetPrimitive.Title ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />
  );
});
SheetTitle.displayName = "SheetTitle";

// ── Description ──
const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => {
  const isMobile = React.useContext(SheetMobileContext);

  if (isMobile) {
    return (
      <DrawerPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
    );
  }

  return (
    <SheetPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
});
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
