"use client";
import type { ItemStatus } from "./types";

const statusConfig: Record<ItemStatus, { emoji: string; label: string; color: string; bg: string }> = {
  not_started:    { emoji: "❌", label: "Not Started",    color: "var(--neutral-600)", bg: "var(--neutral-100)" },
  in_progress:    { emoji: "🔵", label: "In Progress",    color: "var(--brand-600)",   bg: "var(--brand-50)"    },
  review:         { emoji: "⏳", label: "Review",         color: "var(--warning-600)", bg: "var(--warning-50)"  },
  done:           { emoji: "✅", label: "Done",           color: "var(--success-600)", bg: "var(--success-50)"  },
  blocked:        { emoji: "🚫", label: "Blocked",        color: "var(--error-600)",   bg: "var(--error-50)"    },
  on_hold:        { emoji: "🛑", label: "On Hold",        color: "var(--info-600)",    bg: "var(--info-50)"     },
  not_applicable: { emoji: "➖", label: "N/A",            color: "var(--neutral-500)", bg: "var(--neutral-50)"  },
  tbd:            { emoji: "📋", label: "TBD",            color: "var(--warning-600)", bg: "var(--warning-100)" },
};

interface StatusBadgeProps {
  status: ItemStatus;
  onClick?: () => void;
  editable?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-xs px-2 py-1",
  md: "text-sm px-3 py-1.5",
  lg: "text-base px-4 py-2",
};

export function StatusBadge({ status, onClick, editable = false, size = "md" }: StatusBadgeProps) {
  const cfg = statusConfig[status];
  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-md font-medium transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${editable ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
      title={`${cfg.label}${editable ? " — click to edit" : ""}`}
    >
      <span>{cfg.emoji}</span>
      <span>{cfg.label}</span>
      {editable && <span className="ml-1 opacity-60">▼</span>}
    </button>
  );
}

export function StatusDropdown({ currentStatus, onStatusSelect, onClose }: {
  currentStatus: ItemStatus;
  onStatusSelect: (s: ItemStatus) => void;
  onClose: () => void;
}) {
  const statuses: ItemStatus[] = ["not_started", "in_progress", "review", "done", "blocked", "on_hold"];
  return (
    <div className="bg-surface-card border border-neutral-200 rounded-lg shadow-2xl py-1 min-w-40">
      {statuses.map(s => {
        const cfg = statusConfig[s];
        const isSelected = s === currentStatus;
        return (
          <button
            key={s}
            onClick={() => { onStatusSelect(s); onClose(); }}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${isSelected ? "bg-brand-50 text-brand-600 font-semibold" : "text-fg-primary hover:bg-neutral-100"}`}
          >
            <span>{cfg.emoji}</span>
            <span>{cfg.label}</span>
            {isSelected && <span className="ml-auto text-brand-500">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
