"use client";

import { useState, useMemo } from "react";

interface RequestRow {
  submittedAt: string;
  status: string;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  "Solution Given Closed": { label: "Delivered",   color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  "To Product Closed":     { label: "To Product",  color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  "Open":                  { label: "Open",        color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  "Rejected":              { label: "Rejected",    color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  "No Response Closed":    { label: "No Response", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  "Unknown":               { label: "Unknown",     color: "#4b5563", bg: "rgba(75,85,99,0.12)"    },
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

  const breakdown = Object.entries(STATUS_META)
    .map(([key, meta]) => ({ ...meta, count: counts[key] ?? 0 }))
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-white font-semibold text-sm">Solution Requests by Quarter</h2>
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setSelected(ALL)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              selected === ALL ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-white hover:bg-gray-800"
            }`}
          >
            All
          </button>
          <div className="w-px h-3.5 bg-gray-700 mx-0.5" />
          {quarters.map(q => (
            <button
              key={q}
              onClick={() => setSelected(q)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                selected === q ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-white hover:bg-gray-800"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <p className="text-gray-600 text-sm text-center py-6">No requests found</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">

          {/* Mini KPIs */}
          <div className="col-span-1 grid grid-cols-2 gap-2">
            {[
              { label: "Total",     value: total,         color: "#e5e7eb" },
              { label: "Delivered", value: delivered,     color: "#34d399" },
              { label: "Open",      value: open,          color: "#fbbf24" },
              { label: "Win Rate",  value: `${winRate}%`, color: "#818cf8" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-800/50 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-lg font-bold leading-none" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Status bars */}
          <div className="col-span-3 flex flex-col justify-center gap-2.5">
            {breakdown.map(({ label, color, bg, count }) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={label} className="flex items-center gap-3">
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 w-24 text-center"
                    style={{ color, backgroundColor: bg }}
                  >
                    {label}
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-xs font-bold tabular-nums w-7 text-right" style={{ color }}>{count}</span>
                  <span className="text-[11px] text-gray-600 tabular-nums w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
