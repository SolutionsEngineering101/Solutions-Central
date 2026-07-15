import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-[length:var(--font-size-sm)] font-medium text-fg-primary", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

function FormField({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-2 mb-[16px]", className)} {...props} />;
}

function FormHint({ className, error = false, ...props }: React.HTMLAttributes<HTMLSpanElement> & { error?: boolean }) {
  return (
    <span
      className={cn(
        "text-[length:var(--font-size-xs)]",
        error ? "text-[var(--color-error)]" : "text-fg-secondary",
        className
      )}
      {...props}
    />
  );
}

export { Label, FormField, FormHint };
