import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Per spec §8.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium leading-tight whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-200 ease-in-out focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--color-focus)] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-brand-500 text-white hover:bg-brand-600",
        outline: "bg-transparent border border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-white",
        ghost: "bg-transparent text-brand-500 hover:bg-[var(--overlay-subtle)]",
        neutral: "bg-surface-card border border-neutral-300 text-fg-primary hover:bg-neutral-100",
        success: "bg-[var(--color-success)] text-white hover:opacity-90",
        danger: "bg-[var(--color-error)] text-white hover:opacity-90",
        warning: "bg-[var(--color-warning)] text-[var(--color-warning-text)] hover:opacity-90",
      },
      size: {
        sm: "px-3 py-[5px] text-[length:var(--font-size-xs)]",
        default: "px-[18px] py-2 text-[length:var(--font-size-dense)]",
        lg: "px-[26px] py-[11px] text-[length:var(--font-size-md)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
