"use client";
import type { ItemStatus } from "./types";

const statusConfig: Record<ItemStatus, { emoji: string; label: string; color: string; bg: string }> = {
  not_started:    { emoji: "❌", label: "Not Started",    color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
  in_progress:    { emoji: "🔵", label: "In Progress",    color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  review:         { emoji: "⏳", label: "Review",         color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  done:           { emoji: "✅", label: "Done",           color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  blocked:        { emoji: "🚫", label: "Blocked",        color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  on_hold:        { emoji: "🛑", label: "On Hold",        color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  not_applicable: { emoji: "➖", label: "N/A",            color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  tbd:            { emoji: "📋", label: "TBD",            color: "#d97706", bg: "rgba(217,119,6,0.12)"   },
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
    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl py-1 min-w-40">
      {statuses.map(s => {
        const cfg = statusConfig[s];
        const isSelected = s === currentStatus;
        return (
          <button
            key={s}
            onClick={() => { onStatusSelect(s); onClose(); }}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${isSelected ? "bg-indigo-950 text-indigo-300 font-semibold" : "text-gray-300 hover:bg-gray-800"}`}
          >
            <span>{cfg.emoji}</span>
            <span>{cfg.label}</span>
            {isSelected && <span className="ml-auto text-indigo-400">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
