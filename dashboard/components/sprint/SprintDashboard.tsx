"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw, ExternalLink, ArrowRight, Loader2, AlertCircle,
  CheckCircle2, Clock, TrendingUp, Database, AlertTriangle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

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
  // Handle dd/mm/yyyy (primary storage format)
  const dmy = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function isOverdue(row: string[], headers: string[]): boolean {
  for (let i = 0; i < headers.length; i++) {
    if (colType(headers[i]) === "status" && isStatusDone(row[i] ?? "")) return false;
  }
  for (let i = 0; i < headers.length; i++) {
    if (colType(headers[i]) === "date" && !/start/i.test(headers[i])) {
      const d = parseDate(row[i] ?? "");
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (d && d < today) return true;
    }
  }
  return false;
}

// Chart/decorative colors — CSS var refs (support the same as Recharts fill
// props elsewhere in this codebase, e.g. ComplexityDonut's Cell fill).
function statusColor(v: string): string {
  if (isStatusDone(v)) return "var(--success-500)";
  if (isStatusInProgress(v)) return "var(--brand-400)";
  if (isStatusBlocked(v)) return "var(--error-500)";
  if (/review|pending/i.test(v)) return "var(--warning-500)";
  return "var(--neutral-500)";
}

// Badge variant equivalent of statusColor, for the StatusPill primitive below.
function statusVariant(v: string): "success" | "brand" | "error" | "warning" | "neutral" {
  if (isStatusDone(v)) return "success";
  if (isStatusInProgress(v)) return "brand";
  if (isStatusBlocked(v)) return "error";
  if (/review|pending/i.test(v)) return "warning";
  return "neutral";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({
  label, value, color, sub, icon: Icon,
}: {
  label: string; value: number | string; color: string; sub?: string;
  icon: React.ElementType;
}) {
  return (
    <Card compact className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-secondary">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}18` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <p className="text-[34px] font-bold leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-fg-secondary mt-1">{sub}</p>}
    </Card>
  );
}

function HealthCircle({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? "var(--success-500)" : score >= 40 ? "var(--warning-500)" : "var(--error-500)";
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--neutral-200)" strokeWidth="10" />
        <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-fg-primary">{score}%</span>
        <span className="text-[10px] text-fg-secondary uppercase tracking-wide">health</span>
      </div>
    </div>
  );
}

function StatusPill({ text }: { text: string }) {
  return (
    <Badge variant={statusVariant(text)} dot>
      {text}
    </Badge>
  );
}

function SkeletonCard() {
  return (
    <Card compact className="animate-pulse">
      <div className="h-3 w-20 bg-neutral-200 rounded mb-4" />
      <div className="h-9 w-16 bg-neutral-200 rounded mb-2" />
      <div className="h-3 w-28 bg-neutral-200 rounded" />
    </Card>
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
    const dateColIdx = headers.findIndex(h => colType(h) === "date");

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
      if (!da) return 1;
      if (!db) return -1;
      return db.getTime() - da.getTime();
    });

    // Overdue rows — not done and past their due date
    const overdueRows = validRows.filter(r => isOverdue(r, headers));

    return {
      total, done, inProgress, blocked, overdue,
      health: Math.max(0, Math.min(100, health)),
      chartData, statusCounts, statusColIdx, epicColIdx,
      recentRows, recentCompleted, overdueRows, headers,
      actualReleaseDateColIdx, dateColIdx,
    };
  }, [data]);

  // ─── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Alert
        variant="error"
        icon={<AlertCircle size={18} />}
        title="Failed to load Confluence data"
        className="max-w-xl"
      >
        {error}
      </Alert>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-fg-primary text-2xl font-semibold">Project Tracker</h1>
          <p className="text-fg-secondary text-sm mt-1">
            {loading ? "Loading from Confluence…" : `${metrics?.total ?? 0} items · ${syncLabel}`}
          </p>
        </div>
        <Button
          onClick={fetchPage}
          disabled={loading}
          variant="neutral"
          size="sm"
          className="gap-1.5"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : metrics ? (
          <>
            <KPICard label="Total Items"  value={metrics.total}      color="#5c6c7c" icon={Database}
              sub="tracked in Confluence" />
            <KPICard label="In Progress"  value={metrics.inProgress} color="#7a56bd" icon={Clock}
              sub={`${Math.round((metrics.inProgress / (metrics.total || 1)) * 100)}% of total`} />
            <KPICard label="Completed"    value={metrics.done}       color="#12b76a" icon={CheckCircle2}
              sub={`${Math.round((metrics.done / (metrics.total || 1)) * 100)}% completion rate`} />
            <KPICard label="Overdue"      value={metrics.overdue}    color={metrics.overdue > 0 ? "#f04438" : "#5c6c7c"} icon={TrendingUp}
              sub={metrics.overdue > 0 ? "Needs attention" : "All on track"} />
          </>
        ) : null}
      </div>

      {/* Middle row: Health + Status breakdown + Confluence card */}
      <div className="grid grid-cols-3 gap-4">

        {/* Health card */}
        <Card compact className="flex flex-col">
          <CardTitle className="text-sm mb-5">Portfolio Health</CardTitle>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-32 h-32 rounded-pill bg-neutral-100 animate-pulse" />
            </div>
          ) : metrics ? (
            <>
              <div className="flex justify-center mb-5">
                <HealthCircle score={metrics.health} />
              </div>
              <div className="space-y-0 mt-auto">
                {[
                  { label: "Completed",   value: metrics.done,       color: "var(--success-500)" },
                  { label: "In Progress", value: metrics.inProgress,  color: "var(--brand-400)" },
                  { label: "Blocked",     value: metrics.blocked,     color: "var(--error-500)" },
                  { label: "Overdue",     value: metrics.overdue,     color: "var(--error-500)" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between h-8 border-b border-neutral-200 last:border-0">
                    <span className="text-sm text-fg-secondary">{label}</span>
                    <span className="text-sm font-semibold" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </Card>

        {/* Status breakdown chart */}
        <Card compact className="flex flex-col">
          <CardTitle className="text-sm mb-5">Status Breakdown</CardTitle>
          {loading ? (
            <div className="flex-1 flex items-end gap-3 px-2 pb-2">
              {[60, 90, 40, 70, 50].map((h, i) => (
                <div key={i} className="flex-1 bg-neutral-200 animate-pulse rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          ) : metrics && metrics.chartData.length > 0 ? (
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.chartData} margin={{ top: 0, right: 0, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="0" stroke="var(--neutral-200)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--neutral-500)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                    tickFormatter={v => v.length > 12 ? v.slice(0, 12) + "…" : v}
                  />
                  <YAxis tick={{ fill: "var(--neutral-500)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--color-white)", border: "1px solid var(--neutral-300)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "12px" }}
                    cursor={{ fill: "var(--neutral-100)" }}
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
            <div className="flex-1 flex items-center justify-center text-fg-secondary text-sm">
              No status data
            </div>
          )}
        </Card>

        {/* Confluence card */}
        <Card compact interactive onClick={() => router.push("/sprint/tracker")} className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                <Database size={15} className="text-brand-500" />
              </div>
              <CardTitle className="text-sm">Confluence</CardTitle>
            </div>
            <ArrowRight size={16} className="text-fg-secondary" />
          </div>

          {loading ? (
            <div className="space-y-2 flex-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-neutral-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : metrics ? (
            <>
              {/* Mini KPI row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Total", value: metrics.total, color: "var(--neutral-600)" },
                  { label: "Done", value: metrics.done, color: "var(--success-500)" },
                  { label: "Active", value: metrics.inProgress, color: "var(--brand-400)" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-neutral-100 rounded-lg px-3 py-2 text-center">
                    <p className="text-[10px] text-fg-secondary uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-lg font-bold" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Recent tickets */}
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-secondary mb-2">
                  Recent Tickets
                </p>
                <div className="space-y-1.5">
                  {metrics.recentRows.slice(0, 4).map((row, i) => {
                    const epicVal = metrics.epicColIdx >= 0 ? (row[metrics.epicColIdx] ?? "") : "";
                    const statusVal = metrics.statusColIdx >= 0 ? (row[metrics.statusColIdx] ?? "") : "";
                    const name = epicVal || row.find(c => c.trim() !== "") || "—";
                    return (
                      <div key={i} className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-fg-primary truncate flex-1 min-w-0">{name}</span>
                        {statusVal && <StatusPill text={statusVal} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-xs text-fg-secondary">{syncLabel}</span>
                <span className="text-xs text-brand-500 font-medium group-hover:underline">
                  Open tracker →
                </span>
              </div>
            </>
          ) : null}
        </Card>

      </div>

      {/* Recent activity: completed · in-progress · overdue */}
      <div className="grid grid-cols-3 gap-4">

        {/* Recently completed */}
        <Card compact>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={15} className="text-success-500" />
            <CardTitle className="text-sm">Recently Completed</CardTitle>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-neutral-100 rounded animate-pulse" />
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
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-neutral-200 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-pill bg-success-500 shrink-0" />
                    <span className="text-sm text-fg-primary truncate flex-1">{name}</span>
                    <span className="text-xs text-fg-secondary shrink-0">{releaseDate || "—"}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-fg-secondary">No completed items yet</p>
            </div>
          )}
        </Card>

        {/* Currently in progress */}
        <Card compact>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} className="text-brand-500" />
            <CardTitle className="text-sm">Currently In Progress</CardTitle>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-neutral-100 rounded animate-pulse" />
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
                      <div key={i} className="flex items-center gap-3 py-2.5 border-b border-neutral-200 last:border-0">
                        <div className="w-1.5 h-1.5 rounded-pill bg-brand-500 shrink-0" />
                        <span className="text-sm text-fg-primary truncate flex-1">{name}</span>
                        <span className="text-xs text-brand-500 font-medium shrink-0">Active</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-fg-secondary">Nothing in progress</p>
                </div>
              );
            })()
          ) : null}
        </Card>

        {/* Overdue */}
        <Card compact className="border-error-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-error-500" />
              <CardTitle className="text-sm">Overdue</CardTitle>
            </div>
            {metrics && metrics.overdueRows.length > 0 && (
              <Badge variant="error">{metrics.overdueRows.length}</Badge>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-neutral-100 rounded animate-pulse" />
              ))}
            </div>
          ) : metrics && metrics.overdueRows.length > 0 ? (
            <div className="space-y-0">
              {metrics.overdueRows.slice(0, 5).map((row, i) => {
                const epicVal = metrics.epicColIdx >= 0 ? (row[metrics.epicColIdx] ?? "") : "";
                const name = epicVal || row.find(c => c.trim() !== "") || "—";
                const dueDate = metrics.dateColIdx >= 0 ? (row[metrics.dateColIdx] ?? "") : "";
                const statusVal = metrics.statusColIdx >= 0 ? (row[metrics.statusColIdx] ?? "") : "";
                return (
                  <div key={i} className="flex items-start gap-3 py-2.5 border-b border-neutral-200/60 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-pill bg-error-500 shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-fg-primary truncate">{name}</p>
                      {statusVal && (
                        <p className="text-[11px] text-fg-secondary mt-0.5">{statusVal}</p>
                      )}
                    </div>
                    {dueDate && (
                      <span className="text-xs text-error-500 font-medium shrink-0">{dueDate}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-1">
              <CheckCircle2 size={20} className="text-success-500 mb-1" />
              <p className="text-sm text-fg-secondary">All on track</p>
            </div>
          )}
        </Card>

      </div>

      {/* Open in Confluence link */}
      {data?.url && (
        <div className="flex justify-end">
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-fg-secondary hover:text-fg-primary transition-colors duration-200 ease-in-out"
          >
            <ExternalLink size={12} />
            View source in Confluence
          </a>
        </div>
      )}

    </div>
  );
}
