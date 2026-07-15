import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error = false, success = false, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full bg-surface-card border rounded-[8px] px-[16px] py-[12px] text-[length:var(--font-size-md)] text-fg-primary placeholder:text-fg-secondary transition-colors duration-200 ease-in-out outline-none",
        "focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)]",
        "disabled:bg-[var(--color-disabled-bg)] disabled:text-[var(--color-disabled-text)] disabled:cursor-not-allowed",
        error ? "border-[var(--color-error)]" : success ? "border-[var(--color-success)]" : "border-neutral-300",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
