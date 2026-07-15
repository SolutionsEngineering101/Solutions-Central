import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Per spec §10: -25 background, -200 border, -600 text.
const alertVariants = cva("flex items-start gap-3 rounded-lg border p-[16px]", {
  variants: {
    variant: {
      brand: "bg-brand-25 border-brand-200 text-brand-600 dark:text-brand-300",
      info: "bg-info-25 border-info-200 text-info-600 dark:text-info-300",
      success: "bg-success-25 border-success-200 text-success-600 dark:text-success-300",
      warning: "bg-warning-25 border-warning-200 text-warning-600 dark:text-warning-300",
      error: "bg-error-25 border-error-200 text-error-600 dark:text-error-300",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
  title?: string;
  onDismiss?: () => void;
}

function Alert({ className, variant, icon, title, onDismiss, children, ...props }: AlertProps) {
  return (
    <div className={cn(alertVariants({ variant }), className)} {...props}>
      {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        {title && (
          <div className="text-[length:var(--font-size-md)] font-semibold text-fg-primary">{title}</div>
        )}
        <div className="text-[length:var(--font-size-sm)]">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-[length:var(--font-size-lg)] opacity-60 hover:opacity-100 transition-opacity duration-150 ease-in-out"
        >
          ×
        </button>
      )}
    </div>
  );
}

export { Alert, alertVariants };
