"use client";

import { useState, useMemo } from "react";
import { X, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Request {
  path: string;
  frontmatter: Record<string, unknown>;
  content: string;
}

const STATUS_STYLES: Record<string, string> = {
  new:                  "bg-indigo-950 text-indigo-300 border-indigo-800",
  "in progress":        "bg-amber-950 text-amber-300 border-amber-800",
  delivered:            "bg-emerald-950 text-emerald-300 border-emerald-800",
  closed:               "bg-gray-800 text-gray-400 border-gray-700",
  "no response closed": "bg-gray-800 text-gray-500 border-gray-700",
  "no action":          "bg-gray-800 text-gray-500 border-gray-700",
};

function statusStyle(status: string) {
  return STATUS_STYLES[status.toLowerCase()] ?? "bg-gray-800 text-gray-400 border-gray-700";
}

// Canonical statuses for the summary bar — fixed order, matches the Overview page.
const STATUS_BAR: { key: string; label: string; color: string; bg: string }[] = [
  { key: "Solution Given Closed", label: "Delivered",   color: "#34d399", bg: "rgba(52,211,153,0.14)"  },
  { key: "To Product Closed",     label: "To Product",  color: "#818cf8", bg: "rgba(129,140,248,0.14)" },
  { key: "Open",                  label: "Open",        color: "#fbbf24", bg: "rgba(251,191,36,0.14)"  },
  { key: "Rejected",              label: "Rejected",    color: "#f87171", bg: "rgba(248,113,113,0.14)" },
  { key: "No Response Closed",    label: "No Response", color: "#9ca3af", bg: "rgba(156,163,175,0.14)" },
  { key: "Unknown",               label: "Unknown",     color: "#6b7280", bg: "rgba(107,114,128,0.14)" },
];
const CANON = new Set(STATUS_BAR.map((s) => s.key));

function normalizeStatus(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s || s === "—") return "Unknown";
  if (s.toLowerCase() === "new") return "Open";
  return CANON.has(s) ? s : "Unknown";
}

function get(fm: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = fm[k];
    if (v && typeof v === "string" && v.trim()) return v.trim();
  }
  return "—";
}

export function RequestsTable({ requests }: { requests: Request[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Request | null>(null);

  // Per-status counts across all requests (the status bar analytics — stable, not affected by search).
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of requests) {
      const k = normalizeStatus(get(r.frontmatter, "status"));
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [requests]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return requests.filter((r) => {
      const fm = r.frontmatter;
      if (statusFilter && normalizeStatus(get(fm, "status")) !== statusFilter) return false;
      if (!q) return true;
      const searchable = [
        get(fm, "form_id"),
        get(fm, "client", "client_name"),
        get(fm, "department"),
        get(fm, "feature_name"),
        get(fm, "status"),
      ].join(" ").toLowerCase();
      return searchable.includes(q);
    });
  }, [requests, query, statusFilter]);

  return (
    <div className="flex gap-0 relative">
      {/* Main table */}
      <div className={`flex-1 min-w-0 transition-all duration-200 ${selected ? "pr-0" : ""}`}>
        {/* Status bar — counts per status, click to filter */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <button
            onClick={() => setStatusFilter(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === null
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
            }`}
          >
            All <span className="tabular-nums opacity-80">{requests.length}</span>
          </button>
          {STATUS_BAR.map((s) => {
            const active = statusFilter === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setStatusFilter(active ? null : s.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  active ? "" : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                }`}
                style={active ? { backgroundColor: s.bg, borderColor: s.color, color: s.color } : undefined}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                {s.label}
                <span className="tabular-nums opacity-80">{counts[s.key] ?? 0}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by client, ID, status, feature…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-600 transition-colors"
          />
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[180px_1fr_160px_1fr_120px] gap-0 border-b border-gray-800 px-5 py-3">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Solution ID</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Client</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Department</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Feature</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Status</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-800/60">
            {filtered.map((req, i) => {
              const fm = req.frontmatter;
              const id = get(fm, "form_id");
              const client = get(fm, "client", "client_name");
              const department = get(fm, "department");
              const feature = get(fm, "feature_name");
              const status = get(fm, "status");
              const date = get(fm, "submitted_at", "submitted_at");
              const isActive = selected?.path === req.path;

              return (
                <button
                  key={req.path + i}
                  onClick={() => setSelected(isActive ? null : req)}
                  className={`w-full grid grid-cols-[180px_1fr_160px_1fr_120px] gap-0 px-5 py-3.5 text-left transition-colors
                    ${isActive ? "bg-indigo-950/40 border-l-2 border-l-indigo-500" : "hover:bg-gray-800/50 border-l-2 border-l-transparent"}`}
                >
                  <span className="text-indigo-400 text-sm font-mono font-medium truncate pr-4">{id}</span>
                  <span className="text-white text-sm truncate pr-4">{client}</span>
                  <span className="text-gray-400 text-sm truncate pr-4">{department}</span>
                  <span className="text-gray-400 text-sm truncate pr-4">{feature}</span>
                  <span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${statusStyle(status)}`}>
                      {status}
                    </span>
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-16 text-center text-gray-600 text-sm">No requests match your search.</div>
            )}
          </div>
        </div>

        <p className="text-gray-700 text-xs mt-2 text-right">{filtered.length} of {requests.length} requests</p>
      </div>

      {/* Side panel */}
      {selected && (
        <div className="w-[420px] shrink-0 ml-5 sticky top-0 self-start">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {/* Panel header */}
            <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-gray-800">
              <div>
                <p className="text-indigo-400 text-xs font-mono mb-1">
                  {get(selected.frontmatter, "form_id")}
                </p>
                <h2 className="text-white font-semibold text-base leading-tight">
                  {get(selected.frontmatter, "client", "client_name")}
                </h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-600 hover:text-white transition-colors mt-0.5"
              >
                <X size={16} />
              </button>
            </div>

            {/* Status badge */}
            <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-3">
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${statusStyle(get(selected.frontmatter, "status"))}`}>
                {get(selected.frontmatter, "status")}
              </span>
              {get(selected.frontmatter, "complexity") !== "—" && (
                <span className="text-gray-500 text-xs">{get(selected.frontmatter, "complexity")}</span>
              )}
              {get(selected.frontmatter, "submitted_at") !== "—" && (
                <span className="text-gray-600 text-xs ml-auto">
                  {formatDate(get(selected.frontmatter, "submitted_at"))}
                </span>
              )}
            </div>

            {/* Detail rows */}
            <div className="px-6 py-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
              {[
                { label: "Submitted by", keys: ["submitted_by"] },
                { label: "Department", keys: ["department"] },
                { label: "Feature", keys: ["feature_name"] },
                { label: "SPOC", keys: ["solution_spoc", "vc_spoc"] },
                { label: "Go-live requirement", keys: ["go_live_requirement"] },
                { label: "Go-live date", keys: ["go_live_date"] },
                { label: "Priority", keys: ["priority", "priority_justification"] },
                { label: "Dev sprint", keys: ["dev_sprint"] },
                { label: "Ticket", keys: ["ticket"] },
              ].map(({ label, keys }) => {
                const val = get(selected.frontmatter, ...keys);
                if (val === "—") return null;
                return (
                  <div key={label}>
                    <p className="text-gray-600 text-xs mb-0.5">{label}</p>
                    <p className="text-gray-300 text-sm">{val}</p>
                  </div>
                );
              })}

              {/* Description / brief */}
              {(() => {
                const desc = get(selected.frontmatter, "description", "brief");
                if (desc === "—") return null;
                return (
                  <div>
                    <p className="text-gray-600 text-xs mb-0.5">Description</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{desc}</p>
                  </div>
                );
              })()}

              {/* Markdown body if present */}
              {selected.content.trim() && (
                <div>
                  <p className="text-gray-600 text-xs mb-2">Notes</p>
                  <div className="bg-gray-950 rounded-lg p-3">
                    <pre className="text-gray-400 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                      {selected.content.trim().slice(0, 800)}
                      {selected.content.trim().length > 800 ? "\n…" : ""}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
