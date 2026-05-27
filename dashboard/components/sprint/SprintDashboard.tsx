"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw, ExternalLink, ArrowRight, Loader2, AlertCircle,
  CheckCircle2, Clock, TrendingUp, Database,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TableData { headers: string[]; rows: string[][]; }
interface PageData {
  id: string; title: string; version: number; url: string; table: TableData;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function colType(h: string): "status" | "date" | "text" {
  if (/status|state|phase/i.test(h)) return "status";
  if (/date|deadline|due|target|scheduled/i.test(h)) return "date";
  return "text";
}

function isStatusDone(v: string) { return /done|complete|closed|delivered/i.test(v); }
function isStatusInProgress(v: string) { return /in.?progress|active|ongoing|wip/i.test(v); }
function isStatusBlocked(v: string) { return /block|hold|risk|stall/i.test(v); }

function parseDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function isOverdue(row: string[], headers: string[]): boolean {
  for (let i = 0; i < headers.length; i++) {
    if (colType(headers[i]) === "status" && isStatusDone(row[i] ?? "")) return false;
  }
  for (let i = 0; i < headers.length; i++) {
    if (colType(headers[i]) === "date") {
      const d = parseDate(row[i] ?? "");
      if (d && d < new Date()) return true;
    }
  }
  return false;
}

function statusColor(v: string): string {
  if (isStatusDone(v)) return "#34d399";
  if (isStatusInProgress(v)) return "#818cf8";
  if (isStatusBlocked(v)) return "#f87171";
  if (/review|pending/i.test(v)) return "#fbbf24";
  return "#6b7280";
}

function statusBg(v: string): string {
  if (isStatusDone(v)) return "rgba(52,211,153,0.12)";
  if (isStatusInProgress(v)) return "rgba(129,140,248,0.12)";
  if (isStatusBlocked(v)) return "rgba(248,113,113,0.12)";
  if (/review|pending/i.test(v)) return "rgba(251,191,36,0.12)";
  return "rgba(107,114,128,0.10)";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({
  label, value, color, sub, icon: Icon,
}: {
  label: string; value: number | string; color: string; sub?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}18` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <p className="text-[34px] font-bold leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

function HealthCircle({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? "#34d399" : score >= 40 ? "#fbbf24" : "#f87171";
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
        <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}%</span>
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">health</span>
      </div>
    </div>
  );
}

function StatusPill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: statusBg(text), color: statusColor(text) }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: statusColor(text) }} />
      {text}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
      <div className="h-3 w-20 bg-gray-800 rounded mb-4" />
      <div className="h-9 w-16 bg-gray-800 rounded mb-2" />
      <div className="h-3 w-28 bg-gray-800 rounded" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SprintDashboard() {
  const router = useRouter();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [syncLabel, setSyncLabel] = useState("");

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/confluence");
      const json = await res.json() as PageData & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setData(json);
      setLastSynced(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  // Update "N min ago" label every 30s
  useEffect(() => {
    syncTimerRef.current = setInterval(() => {
      if (!lastSynced) return;
      const mins = Math.round((Date.now() - lastSynced.getTime()) / 60000);
      setSyncLabel(mins < 1 ? "Just synced" : `Synced ${mins}m ago`);
    }, 30000);
    if (lastSynced) {
      const mins = Math.round((Date.now() - lastSynced.getTime()) / 60000);
      setSyncLabel(mins < 1 ? "Just synced" : `Synced ${mins}m ago`);
    }
    return () => { if (syncTimerRef.current) clearInterval(syncTimerRef.current); };
  }, [lastSynced]);

  // ─── Derived metrics ────────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    if (!data) return null;
    const { headers, rows } = data.table;

    // Prefer "Overall Status" explicitly; fall back to first status-like column
    const statusColIdx = (() => {
      const overall = headers.findIndex(h => /overall.?status|status.?overall/i.test(h));
      if (overall >= 0) return overall;
      return headers.findIndex(h => colType(h) === "status");
    })();

    const epicColIdx = headers.findIndex(h => /epic|feature|name|title|requirement/i.test(h));
    const slNoColIdx = headers.findIndex(h => /^sl\.?\s*no/i.test(h));
    const actualReleaseDateColIdx = headers.findIndex(h => /actual.?release|release.?date/i.test(h));

    // A row is valid if at least one column OTHER than SL No is non-empty
    const validRows = rows.filter(r =>
      r.some((c, i) => i !== slNoColIdx && (c ?? "").trim() !== "")
    );

    const total = validRows.length;
    const done = validRows.filter(r => statusColIdx >= 0 && isStatusDone(r[statusColIdx] ?? "")).length;
    const inProgress = validRows.filter(r => statusColIdx >= 0 && isStatusInProgress(r[statusColIdx] ?? "")).length;
    const blocked = validRows.filter(r => statusColIdx >= 0 && isStatusBlocked(r[statusColIdx] ?? "")).length;
    const overdue = validRows.filter(r => isOverdue(r, headers)).length;
    const health = total === 0 ? 0 : Math.round(
      ((done * 1.0 + inProgress * 0.4 - blocked * 0.5 - overdue * 0.3) / total) * 100
    );

    // Status breakdown for bar chart
    const statusCounts: Record<string, number> = {};
    if (statusColIdx >= 0) {
      for (const r of validRows) {
        const s = r[statusColIdx] ?? "";
        if (s) statusCounts[s] = (statusCounts[s] ?? 0) + 1;
      }
    }
    const chartData = Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, color: statusColor(name) }));

    // Recent tickets — last 5 rows that have an Epic value
    const recentRows = [...validRows]
      .filter(r => epicColIdx >= 0 ? (r[epicColIdx] ?? "").trim() !== "" : true)
      .slice(-5)
      .reverse();

    // Recently completed — ALL done rows, sorted by Actual Release Date desc
    const allDoneRows = validRows.filter(r =>
      statusColIdx >= 0 && isStatusDone(r[statusColIdx] ?? "")
    );
    const recentCompleted = [...allDoneRows].sort((a, b) => {
      if (actualReleaseDateColIdx < 0) return 0;
      const da = parseDate(a[actualReleaseDateColIdx] ?? "");
      const db = parseDate(b[actualReleaseDateColIdx] ?? "");
      if (!da && !db) return 0;
      if (!da) return 1;  // no date → pushed to end
      if (!db) return -1;
      return db.getTime() - da.getTime(); // most recent first
    });

    return {
      total, done, inProgress, blocked, overdue,
      health: Math.max(0, Math.min(100, health)),
      chartData, statusCounts, statusColIdx, epicColIdx,
      recentRows, recentCompleted, headers, actualReleaseDateColIdx,
    };
  }, [data]);

  // ─── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-gray-900 border border-red-900/60 rounded-xl p-6 max-w-xl">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-red-400 font-semibold text-sm mb-1">Failed to load Confluence data</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white text-2xl font-semibold">Project Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? "Loading from Confluence…" : `${metrics?.total ?? 0} items · ${syncLabel}`}
          </p>
        </div>
        <button
          onClick={fetchPage}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : metrics ? (
          <>
            <KPICard label="Total Items"  value={metrics.total}      color="#e5e7eb" icon={Database}
              sub="tracked in Confluence" />
            <KPICard label="In Progress"  value={metrics.inProgress} color="#818cf8" icon={Clock}
              sub={`${Math.round((metrics.inProgress / (metrics.total || 1)) * 100)}% of total`} />
            <KPICard label="Completed"    value={metrics.done}       color="#34d399" icon={CheckCircle2}
              sub={`${Math.round((metrics.done / (metrics.total || 1)) * 100)}% completion rate`} />
            <KPICard label="Overdue"      value={metrics.overdue}    color={metrics.overdue > 0 ? "#f87171" : "#6b7280"} icon={TrendingUp}
              sub={metrics.overdue > 0 ? "Needs attention" : "All on track"} />
          </>
        ) : null}
      </div>

      {/* Middle row: Health + Status breakdown + Confluence card */}
      <div className="grid grid-cols-3 gap-4">

        {/* Health card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col">
          <h2 className="text-white font-medium text-sm mb-5">Portfolio Health</h2>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gray-800 animate-pulse" />
            </div>
          ) : metrics ? (
            <>
              <div className="flex justify-center mb-5">
                <HealthCircle score={metrics.health} />
              </div>
              <div className="space-y-0 mt-auto">
                {[
                  { label: "Completed",   value: metrics.done,       color: "#34d399" },
                  { label: "In Progress", value: metrics.inProgress,  color: "#818cf8" },
                  { label: "Blocked",     value: metrics.blocked,     color: "#f87171" },
                  { label: "Overdue",     value: metrics.overdue,     color: "#f87171" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between h-8 border-b border-gray-800 last:border-0">
                    <span className="text-sm text-gray-400">{label}</span>
                    <span className="text-sm font-semibold" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Status breakdown chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col">
          <h2 className="text-white font-medium text-sm mb-5">Status Breakdown</h2>
          {loading ? (
            <div className="flex-1 flex items-end gap-3 px-2 pb-2">
              {[60, 90, 40, 70, 50].map((h, i) => (
                <div key={i} className="flex-1 bg-gray-800 animate-pulse rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          ) : metrics && metrics.chartData.length > 0 ? (
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="0" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                    tickFormatter={v => v.length > 12 ? v.slice(0, 12) + "…" : v}
                  />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Items">
                    {metrics.chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
              No status data
            </div>
          )}
        </div>

        {/* Confluence card */}
        <div
          onClick={() => router.push("/sprint/tracker")}
          className="bg-gray-900 border border-gray-800 hover:border-indigo-700 rounded-xl p-5 flex flex-col cursor-pointer transition-all group hover:bg-gray-800/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center">
                <Database size={15} className="text-indigo-400" />
              </div>
              <h2 className="text-white font-medium text-sm">Confluence</h2>
            </div>
            <ArrowRight size={16} className="text-gray-600 group-hover:text-indigo-400 transition-colors" />
          </div>

          {loading ? (
            <div className="space-y-2 flex-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : metrics ? (
            <>
              {/* Mini KPI row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Total", value: metrics.total, color: "#e5e7eb" },
                  { label: "Done", value: metrics.done, color: "#34d399" },
                  { label: "Active", value: metrics.inProgress, color: "#818cf8" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-gray-800/60 rounded-lg px-3 py-2 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-lg font-bold" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Recent tickets */}
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-2">
                  Recent Tickets
                </p>
                <div className="space-y-1.5">
                  {metrics.recentRows.slice(0, 4).map((row, i) => {
                    const epicVal = metrics.epicColIdx >= 0 ? (row[metrics.epicColIdx] ?? "") : "";
                    const statusVal = metrics.statusColIdx >= 0 ? (row[metrics.statusColIdx] ?? "") : "";
                    const name = epicVal || row.find(c => c.trim() !== "") || "—";
                    return (
                      <div key={i} className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-gray-400 truncate flex-1 min-w-0">{name}</span>
                        {statusVal && <StatusPill text={statusVal} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-600">{syncLabel}</span>
                <span className="text-xs text-indigo-400 font-medium group-hover:underline">
                  Open tracker →
                </span>
              </div>
            </>
          ) : null}
        </div>

      </div>

      {/* Recent activity: completed + in-progress breakdown */}
      <div className="grid grid-cols-2 gap-4">

        {/* Recently completed */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <h2 className="text-white font-medium text-sm">Recently Completed</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : metrics && metrics.recentCompleted.length > 0 ? (
            <div className="space-y-0">
              {metrics.recentCompleted.slice(0, 5).map((row, i) => {
                const epicVal = metrics.epicColIdx >= 0 ? (row[metrics.epicColIdx] ?? "") : "";
                const name = epicVal || row.find(c => c.trim() !== "") || "—";
                const releaseDate = metrics.actualReleaseDateColIdx >= 0
                  ? (row[metrics.actualReleaseDateColIdx] ?? "") : "";
                return (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-sm text-gray-300 truncate flex-1">{name}</span>
                    <span className="text-xs text-gray-600 shrink-0">
                      {releaseDate || "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-gray-600">No completed items yet</p>
            </div>
          )}
        </div>

        {/* In progress */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} className="text-indigo-400" />
            <h2 className="text-white font-medium text-sm">Currently In Progress</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : metrics ? (
            (() => {
              const ipRows = data!.table.rows.filter(r =>
                metrics.statusColIdx >= 0 && isStatusInProgress(r[metrics.statusColIdx] ?? "")
              ).slice(0, 5);
              return ipRows.length > 0 ? (
                <div className="space-y-0">
                  {ipRows.map((row, i) => {
                    const epicVal = metrics.epicColIdx >= 0 ? (row[metrics.epicColIdx] ?? "") : "";
                    const name = epicVal || row.find(c => c.trim() !== "") || "—";
                    return (
                      <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span className="text-sm text-gray-300 truncate">{name}</span>
                        <span className="ml-auto text-xs text-indigo-400 font-medium shrink-0">Active</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-gray-600">Nothing in progress</p>
                </div>
              );
            })()
          ) : null}
        </div>

      </div>

      {/* Open in Confluence link */}
      {data?.url && (
        <div className="flex justify-end">
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            <ExternalLink size={12} />
            View source in Confluence
          </a>
        </div>
      )}

    </div>
  );
}
