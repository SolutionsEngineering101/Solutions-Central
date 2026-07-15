"use client";

import { useState, useMemo } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RequestRow {
  submittedAt: string;
  status: string;
}

const STATUS_META: Record<string, { label: string; variant: NonNullable<BadgeProps["variant"]>; color: string }> = {
  "Solution Given Closed": { label: "Delivered",   variant: "success", color: "var(--success-400)" },
  "To Product Closed":     { label: "To Product",  variant: "brand",   color: "var(--brand-400)" },
  "Open":                  { label: "Open",        variant: "warning", color: "var(--warning-400)" },
  "Rejected":              { label: "Rejected",    variant: "error",   color: "var(--error-400)" },
  "No Response Closed":    { label: "No Response", variant: "neutral", color: "var(--neutral-500)" },
  "Unknown":               { label: "Unknown",     variant: "neutral", color: "var(--neutral-600)" },
};

function getQuarter(dateStr: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
}

function quarterOrder(q: string): number {
  const [qtr, yr] = q.split(" ");
  return Number(yr) * 10 + Number(qtr.slice(1));
}

export function QuarterlyBreakdown({ requests }: { requests: RequestRow[] }) {
  const quarters = useMemo(() => {
    const seen = new Set<string>();
    for (const r of requests) {
      const q = getQuarter(r.submittedAt);
      if (q) seen.add(q);
    }
    return [...seen].sort((a, b) => quarterOrder(a) - quarterOrder(b));
  }, [requests]);

  const ALL = "All";
  const [selected, setSelected] = useState<string>(ALL);

  const filtered = useMemo(
    () => selected === ALL ? requests : requests.filter(r => getQuarter(r.submittedAt) === selected),
    [requests, selected]
  );

  const total = filtered.length;
  const counts: Record<string, number> = {};
  for (const r of filtered) counts[r.status] = (counts[r.status] ?? 0) + 1;

  const delivered = counts["Solution Given Closed"] ?? 0;
  const open      = counts["Open"] ?? 0;
  const winRate   = total > 0 ? Math.round((delivered / total) * 100) : 0;

  // Always show every status in a fixed order so the card structure stays rigid
  // across quarter changes — only the counts/bars update.
  const breakdown = Object.entries(STATUS_META)
    .map(([key, meta]) => ({ ...meta, count: counts[key] ?? 0 }));

  return (
    <Card compact>

      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <CardTitle className="text-[length:var(--font-size-dense)]">Solution Requests by Quarter</CardTitle>
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setSelected(ALL)}
            className={cn(
              "px-2.5 py-1 rounded-[8px] text-[length:var(--font-size-xs)] font-semibold transition-colors duration-200 ease-in-out",
              selected === ALL ? "bg-brand-500 text-white" : "text-fg-secondary hover:text-fg-primary hover:bg-neutral-200"
            )}
          >
            All
          </button>
          <div className="w-px h-3.5 bg-neutral-300 mx-0.5" />
          {quarters.map(q => (
            <button
              key={q}
              onClick={() => setSelected(q)}
              className={cn(
                "px-2.5 py-1 rounded-[8px] text-[length:var(--font-size-xs)] font-semibold transition-colors duration-200 ease-in-out",
                selected === q ? "bg-brand-500 text-white" : "text-fg-secondary hover:text-fg-primary hover:bg-neutral-200"
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">

          {/* Mini KPIs */}
          <div className="col-span-1 grid grid-cols-2 gap-2">
            {[
              { label: "Total",     value: total,         className: "text-fg-primary" },
              { label: "Delivered", value: delivered,     className: "text-[var(--color-success)]" },
              { label: "Open",      value: open,          className: "text-[var(--color-warning)]" },
              { label: "Completion Rate",  value: `${winRate}%`, className: "text-brand-400" },
            ].map(({ label, value, className }) => (
              <div key={label} className="bg-neutral-200/50 rounded-lg px-3 py-2">
                <p className="text-[length:var(--font-size-xs)] text-fg-secondary uppercase tracking-wide mb-0.5">{label}</p>
                <p className={cn("text-[length:var(--font-size-lg)] font-bold leading-none", className)}>{value}</p>
              </div>
            ))}
          </div>

          {/* Status bars */}
          <div className="col-span-3 flex flex-col justify-center gap-2.5">
            {breakdown.map(({ label, variant, color, count }) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={label} className="flex items-center gap-3">
                  <Badge variant={variant} className="shrink-0 w-24 justify-center">{label}</Badge>
                  <div className="flex-1 h-1.5 bg-neutral-300 rounded-pill overflow-hidden">
                    <div
                      className="h-full rounded-pill transition-all duration-500 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-[length:var(--font-size-xs)] font-bold tabular-nums w-7 text-right" style={{ color }}>{count}</span>
                  <span className="text-[length:var(--font-size-xs)] text-fg-secondary tabular-nums w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>

        </div>
    </Card>
  );
}
