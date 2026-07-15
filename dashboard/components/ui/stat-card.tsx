import * as React from "react";
import { cn } from "@/lib/utils";

// Tone drives the icon chip + value color for status-coded KPIs (e.g. an
// "at-risk items" count reading in error-tone red). Not in the spec by
// name, but composed from the same badge-style tint/text token pairing.
const iconToneClass: Record<string, string> = {
  brand: "bg-brand-50 text-brand-600 dark:text-brand-300",
  success: "bg-success-50 text-success-600 dark:text-success-300",
  error: "bg-error-50 text-error-600 dark:text-error-300",
  warning: "bg-warning-50 text-warning-600 dark:text-warning-300",
  neutral: "bg-neutral-100 text-neutral-600",
};

const valueToneClass: Record<string, string> = {
  brand: "text-fg-primary",
  success: "text-success-600 dark:text-success-300",
  error: "text-error-600 dark:text-error-300",
  warning: "text-warning-600 dark:text-warning-300",
  neutral: "text-fg-primary",
};

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  subtext?: string;
  delta?: { direction: "up" | "down"; label: string };
  icon?: React.ReactNode;
  tone?: "brand" | "success" | "error" | "warning" | "neutral";
  square?: boolean;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, label, value, subtext, delta, icon, tone = "brand", square = false, onClick, ...props }, ref) => (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        "bg-surface-card border border-neutral-200 rounded-lg shadow-sm p-5 flex flex-col",
        square && "aspect-square",
        onClick && "cursor-pointer transition-[box-shadow,border-color] duration-200 ease-in-out hover:shadow-md hover:border-brand-400",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[length:var(--font-size-sm)] font-semibold uppercase tracking-wide text-fg-secondary">
          {label}
        </span>
        {icon && (
          <div className={cn("w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 text-lg", iconToneClass[tone])}>
            {icon}
          </div>
        )}
      </div>
      <span className={cn("text-[length:var(--font-size-2xl)] font-bold leading-none", valueToneClass[tone])}>
        {value}
      </span>
      {subtext && <span className="text-[length:var(--font-size-sm)] text-fg-secondary mt-2">{subtext}</span>}
      {delta && (
        <span
          className={cn(
            "text-[length:var(--font-size-sm)] font-medium mt-2",
            delta.direction === "up" ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
          )}
        >
          {delta.label}
        </span>
      )}
    </div>
  )
);
StatCard.displayName = "StatCard";

export { StatCard };
