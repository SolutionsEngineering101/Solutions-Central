import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Per spec §9: -50 background paired with -600 text.
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-[length:var(--font-size-xs)] font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        brand: "bg-brand-50 text-brand-600 dark:text-brand-300",
        success: "bg-success-50 text-success-600 dark:text-success-300",
        error: "bg-error-50 text-error-600 dark:text-error-300",
        warning: "bg-warning-50 text-warning-600 dark:text-warning-300",
        info: "bg-info-50 text-info-600 dark:text-info-300",
        neutral: "bg-neutral-100 text-neutral-600",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className="w-1.5 h-1.5 rounded-pill bg-current flex-shrink-0" />}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
