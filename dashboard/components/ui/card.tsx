import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, compact = false, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-surface-card border border-neutral-200 rounded-xl shadow-sm transition-[box-shadow,transform] duration-300 ease-out",
        compact ? "p-5 md:p-6" : "p-6 md:p-8",
        interactive && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-[length:var(--font-size-lg)] font-medium text-fg-primary", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export { Card, CardTitle };
