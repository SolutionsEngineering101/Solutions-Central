"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  RefreshCw, ExternalLink, Plus, Pencil, Trash2, X, Check,
  AlertCircle, Loader2, Search, ChevronUp, ChevronDown,
  ChevronsUpDown, LayoutGrid, AlignJustify,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TableData { headers: string[]; rows: string[][]; }
interface PageData { id: string; title: string; version: number; url: string; table: TableData; }
type SortDir = "asc" | "desc" | null;
interface ToastItem { id: number; msg: string; type: "success" | "error"; }

// ─── Column-type detection ────────────────────────────────────────────────────

function colType(header: string): "status" | "date" | "priority" | "text" {
  if (/status|state|phase/i.test(header)) return "status";
  if (/date|deadline|due|target|scheduled/i.test(header)) return "date";
  if (/priority|urgency|sev/i.test(header)) return "priority";
  return "text";
}

// Options for status-column dropdowns — mirrors the KPI strip categories
const STATUS_OPTIONS = ["Not Started", "To Do", "In Progress", "Blocked", "Overdue", "Done"];

function isStatusDone(val: string) {
  return /done|complete|closed|delivered/i.test(val);
}

function parseDate(val: string): Date | null {
  if (!val) return null;
  // Handle dd/mm/yyyy (primary storage format)
  const dmy = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// Converts dd/mm/yyyy → yyyy-mm-dd for <input type="date"> value attribute
function dmyToIso(dmy: string): string {
  const p = dmy.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!p) return dmy;
  return `${p[3]}-${p[2].padStart(2, "0")}-${p[1].padStart(2, "0")}`;
}

// Converts yyyy-mm-dd from <input type="date"> back to dd/mm/yyyy for storage
function isoToDmy(iso: string): string {
  const p = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!p) return iso;
  return `${p[3]}/${p[2]}/${p[1]}`;
}

function isOverdue(dateVal: string, row: string[], headers: string[], colHeader?: string): boolean {
  if (colHeader && /start/i.test(colHeader)) return false;
  const d = parseDate(dateVal);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (!d || d >= today) return false;
  for (let i = 0; i < headers.length; i++) {
    if (colType(headers[i]) === "status" && isStatusDone(row[i] ?? "")) return false;
  }
  return true;
}

// ─── Computed row status ──────────────────────────────────────────────────────
// Priority: Overall Status (manual override) → Actual Release Date → Blocker →
// Planned Release Date overdue → Phase completion overdue → In Progress → Not Started

function computeRowStatus(row: string[], headers: string[]): string {
  const get = (re: RegExp): string => {
    const idx = headers.findIndex(h => re.test(h));
    return idx >= 0 ? (row[idx] ?? "").trim() : "";
  };

  // 1. Manual override — Overall Status
  const overall = get(/^overall.?status$/i);
  if (overall) return overall;

  // 2. Actual Release Date filled → Done
  if (get(/actual.?release.?date/i)) return "Done";

  // 3. Blocker has content → Blocked
  if (get(/^blocker$/i)) return "Blocked";

  // 4. Any phase status explicitly says Overdue → Overdue
  const phaseStatuses = [
    get(/backend.?status/i),
    get(/frontend.?status/i),
    get(/qa.?status/i),
  ];
  if (phaseStatuses.some(s => /overdue/i.test(s))) return "Overdue";

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // 4. Planned Release Date passed → Overdue
  const plannedRelease = get(/planned.?release.?date/i);
  if (plannedRelease) {
    const d = parseDate(plannedRelease);
    if (d && d < today) return "Overdue";
  }

  // 5. Any phase past its planned completion date (and that phase isn't done) → Overdue
  const phases: [RegExp, RegExp][] = [
    [/backend.?planned.?completion/i,  /backend.?status/i],
    [/frontend.?planned.?completion/i, /frontend.?status/i],
    [/qa.?planned.?completion/i,       /qa.?status/i],
  ];
  for (const [completionRe, phaseStatusRe] of phases) {
    const completionVal = get(completionRe);
    const phaseStatus   = get(phaseStatusRe);
    if (completionVal && !isStatusDone(phaseStatus)) {
      const d = parseDate(completionVal);
      if (d && d < today) return "Overdue";
    }
  }

  // 6. Any start date filled → In Progress
  const started = [
    get(/backend.?start.?date/i),
    get(/frontend.?start.?date/i),
    get(/qa.?start.?date/i),
  ].some(v => v !== "");
  if (started) return "In Progress";

  // 7. Nothing started
  return "Not Started";
}

// ─── Style helpers ────────────────────────────────────────────────────────────
// Status/priority tiers map onto the badge semantic variants (§9) — brand
// stands in for "in progress" per the accent-colour mapping used across the
// dashboard, and the -50/-600 bg/text pairing lives inside the Badge primitive.

function statusVariant(text: string): NonNullable<BadgeProps["variant"]> {
  const v = text.toLowerCase();
  if (/done|complete|closed|delivered/i.test(v)) return "success";
  if (/in.?progress|active|ongoing|wip/i.test(v)) return "brand";
  if (/block|hold|risk|stall/i.test(v)) return "error";
  if (/review|pending|approval/i.test(v)) return "warning";
  return "neutral";
}

// Priority has four severity tiers but the token system only defines three
// status ramps (error/warning/success) — critical and high both read as
// urgent so they share the error/warning boundary via bg intensity (-100 vs
// -50) rather than inventing a fourth colour family.
function priorityStyle(text: string) {
  if (/critical|p0|urgent/i.test(text)) return { bg: "bg-error-50", fg: "text-error-600" };
  if (/high|p1/i.test(text))            return { bg: "bg-warning-100", fg: "text-warning-600" };
  if (/medium|med|p2/i.test(text))      return { bg: "bg-warning-50", fg: "text-warning-600" };
  if (/low|p3/i.test(text))             return { bg: "bg-success-50", fg: "text-success-600" };
  return { bg: "bg-neutral-100", fg: "text-neutral-600" };
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function StatusPill({ text }: { text: string }) {
  return (
    <Badge variant={statusVariant(text)} dot>
      {text}
    </Badge>
  );
}

function PriorityPill({ text }: { text: string }) {
  const s = priorityStyle(text);
  return (
    <span className={cn("inline-flex px-2.5 py-1 rounded-md text-[length:var(--font-size-xs)] font-semibold uppercase tracking-wide", s.bg, s.fg)}>
      {text}
    </span>
  );
}

function OverdueBadge() {
  return (
    <Badge variant="error" className="ml-2">
      Overdue
    </Badge>
  );
}

function KPICard({ label, value, color }: {
  label: string; value: number | string; color: string;
}) {
  return (
    <div className="bg-neutral-100 border border-neutral-200 rounded-lg px-3 py-3 flex flex-col gap-0.5">
      <p className="text-[length:var(--font-size-xs)] font-semibold uppercase tracking-widest text-fg-secondary truncate">{label}</p>
      <p className="text-[length:var(--font-size-2xl)] font-bold leading-none mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}

function SkeletonRow({ cols, density }: { cols: number; density: "compact" | "comfortable" }) {
  return (
    <tr className="border-b border-neutral-200">
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <td key={i} className={`px-4 ${density === "compact" ? "py-2.5" : "py-3.5"}`}>
          <div
            className="h-4 rounded bg-neutral-200 animate-pulse"
            style={{ width: i === 0 ? "55%" : i === cols ? "24px" : `${60 + (i * 13) % 30}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

function Toast({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: number) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map(t => (
        <Alert
          key={t.id}
          variant={t.type === "success" ? "success" : "error"}
          icon={t.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
          onDismiss={() => dismiss(t.id)}
          className="pointer-events-auto shadow-xl"
        >
          {t.msg}
        </Alert>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProjectTracker() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const [editRowIdx, setEditRowIdx] = useState<number | null>(null);
  const [editCells, setEditCells] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newCells, setNewCells] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<{ col: number; dir: SortDir }>({ col: -1, dir: null });
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable");

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);

  const toast = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/confluence");
      const json = await res.json() as PageData & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setData(json);
      setNewCells(Array(json.table.headers.length).fill(""));
      setLastSynced(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  // Unique computed status values for the filter dropdown
  const statusValues = useMemo(() => {
    if (!data) return [];
    const { headers, rows } = data.table;
    const slNoColIdx = headers.findIndex(h => /^sl\.?\s*no/i.test(h));
    const validRows = rows.filter(r => r.some((c, i) => i !== slNoColIdx && (c ?? "").trim() !== ""));
    return Array.from(new Set(validRows.map(r => computeRowStatus(r, headers)))).sort();
  }, [data]);

  // KPI counts — all driven by computeRowStatus
  const kpis = useMemo(() => {
    if (!data) return null;
    const { headers, rows } = data.table;
    const slNoColIdx = headers.findIndex(h => /^sl\.?\s*no/i.test(h));
    const validRows = rows.filter(r =>
      r.some((c, i) => i !== slNoColIdx && (c ?? "").trim() !== "")
    );
    const statuses = validRows.map(r => computeRowStatus(r, headers));
    return {
      total:      validRows.length,
      done:       statuses.filter(s => isStatusDone(s)).length,
      inProgress: statuses.filter(s => /in.?progress/i.test(s)).length,
      todo:       statuses.filter(s => /^to.?do$/i.test(s)).length,
      blocked:    statuses.filter(s => /block/i.test(s)).length,
      notStarted: statuses.filter(s => /not.?start/i.test(s)).length,
      // Overdue: any status field on the row says "overdue" — irrespective of computed status
      overdue:    validRows.filter(r =>
        headers.some((h, i) => colType(h) === "status" && /overdue/i.test(r[i] ?? ""))
      ).length,
    };
  }, [data]);

  // Filtered + sorted rows, keeping original indices for write-back
  const displayRows = useMemo(() => {
    if (!data) return [];
    const slNoColIdx = data.table.headers.findIndex(h => /^sl\.?\s*no/i.test(h));
    let rows = data.table.rows
      .map((row, origIdx) => ({ row, origIdx }))
      .filter(({ row }) => row.some((c, i) => i !== slNoColIdx && (c ?? "").trim() !== ""));

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(({ row }) => row.some(c => c.toLowerCase().includes(q)));
    }
    if (statusFilter !== "all") {
      rows = rows.filter(({ row }) =>
        computeRowStatus(row, data.table.headers).toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (sort.col >= 0 && sort.dir) {
      rows = [...rows].sort((a, b) => {
        const av = a.row[sort.col] ?? "";
        const bv = b.row[sort.col] ?? "";
        const da = parseDate(av), db = parseDate(bv);
        if (da && db) return sort.dir === "asc" ? da.getTime() - db.getTime() : db.getTime() - da.getTime();
        return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  }, [data, search, statusFilter, sort]);

  const cycleSort = (col: number) => {
    setSort(prev => {
      if (prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return { col: -1, dir: null };
    });
  };

  const handleSave = async (
    action: "append_row" | "edit_row" | "delete_row",
    cells: string[],
    rowIndex?: number
  ) => {
    setSaving(true);
    try {
      const res = await fetch("/api/confluence", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, cells, rowIndex }),
      });
      const json = await res.json() as { ok?: boolean; table?: TableData; version?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setData(prev =>
        prev && json.table ? { ...prev, version: json.version ?? prev.version, table: json.table! } : prev
      );
      setEditRowIdx(null);
      setDeleteConfirm(null);
      setShowAddRow(false);
      setNewCells(Array(data?.table.headers.length ?? 0).fill(""));
      setLastSynced(new Date());
      const label: Record<string, string> = {
        append_row: "Row added to Confluence",
        edit_row: "Changes saved to Confluence",
        delete_row: "Row deleted from Confluence",
      };
      toast(label[action] ?? "Saved");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (origIdx: number) => {
    setEditRowIdx(origIdx);
    setEditCells([...(data?.table.rows[origIdx] ?? [])]);
    setShowAddRow(false);
    setDeleteConfirm(null);
  };

  const renderCell = (cell: string, colIdx: number, row: string[]) => {
    if (!data) return <span className="text-fg-primary">{cell}</span>;
    const header = data.table.headers[colIdx] ?? "";
    const type = colType(header);

    // Overall Status: show computed status when cell is empty (manual value takes priority)
    if (/^overall.?status$/i.test(header)) {
      const display = cell.trim() || computeRowStatus(row, data.table.headers);
      return <StatusPill text={display} />;
    }

    if (!cell) return <span className="text-neutral-400">—</span>;
    if (type === "status") return <StatusPill text={cell} />;
    if (type === "priority") return <PriorityPill text={cell} />;
    if (type === "date") {
      return (
        <span className="text-fg-secondary text-[length:var(--font-size-md)] whitespace-nowrap">
          {cell}
          {isOverdue(cell, row, data.table.headers, header) && <OverdueBadge />}
        </span>
      );
    }
    // URL values (Jira tickets / links) → ticket key + open-in-new-tab icon
    if (/^https?:\/\//i.test(cell)) {
      let label = cell;
      try {
        const url = new URL(cell);
        const parts = url.pathname.split("/").filter(Boolean);
        const last = parts[parts.length - 1] ?? "";

        if (/^VC-\d+$/i.test(last)) {
          // Jira ticket key — ideal label
          label = last.toUpperCase();
        } else if (last.endsWith(".action") || last.endsWith(".html")) {
          // Confluence action URLs (resumedraft.action etc.) — use page/draft ID from query
          const id = url.searchParams.get("draftId") || url.searchParams.get("pageId") || url.searchParams.get("spaceKey");
          label = id ? `Confluence Doc` : "Confluence";
        } else if (/^\d+$/.test(last)) {
          // Bare numeric ID — show as "Doc #NNN" rather than a meaningless number
          label = `Doc #${last}`;
        } else {
          // Decode URL encoding (e.g. page titles with + or %20)
          label = decodeURIComponent(last.replace(/\+/g, " ")) || last;
        }
      } catch { /* keep full URL as label */ }
      return (
        <a
          href={cell}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-brand-500 hover:text-brand-600 text-[length:var(--font-size-md)] font-medium transition-colors duration-200 ease-in-out group/link"
        >
          <span>{label}</span>
          <ExternalLink size={11} className="shrink-0 opacity-50 group-hover/link:opacity-100 transition-opacity" />
        </a>
      );
    }
    return <span className="text-fg-primary text-[length:var(--font-size-md)]">{cell}</span>;
  };

  const syncLabel = lastSynced
    ? (() => {
        const mins = Math.round((Date.now() - lastSynced.getTime()) / 60000);
        return mins < 1 ? "Just synced" : `Synced ${mins}m ago`;
      })()
    : "";

  const headers = data?.table.headers ?? [];
  const padRow = (r: string[]) => [
    ...r,
    ...Array(Math.max(0, headers.length - r.length)).fill(""),
  ];

  // Only show columns that have at least one non-empty value — hides the empty
  // Confluence columns. Edits still send the full row, so hidden cells are preserved.
  const visibleIdx = useMemo(() => {
    const h = data?.table.headers ?? [];
    const rows = data?.table.rows ?? [];
    return h.map((_, i) => i).filter((i) => rows.some((r) => (r[i] ?? "").trim() !== ""));
  }, [data]);

  // ─── Error state ───────────────────────────────────────────────────────────
  if (error) {
    const isConfig = error.includes("not configured");
    return (
      <Alert
        variant="error"
        icon={<AlertCircle size={18} />}
        title={isConfig ? "Confluence not configured" : "Failed to load data"}
        className="max-w-xl"
      >
        {isConfig ? (
          <div className="space-y-2">
            <p>Add to <code className="text-brand-600 bg-neutral-100 px-1 rounded-xs">.env.local</code> then restart:</p>
            <pre className="bg-neutral-100 rounded-lg p-3 text-[length:var(--font-size-xs)] text-fg-primary">{`CONFLUENCE_EMAIL=bhargav.nath@vantagecircle.com
CONFLUENCE_API_TOKEN=<from id.atlassian.com>
CONFLUENCE_DOMAIN=vantagecirclejira.atlassian.net
CONFLUENCE_PAGE_ID=567050244`}</pre>
          </div>
        ) : (
          <p>{error}</p>
        )}
      </Alert>
    );
  }

  // ─── Full render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-fg-primary text-[length:var(--font-size-2xl)] font-semibold">Confluence Project Dev Tracker</h1>
          <p className="text-fg-secondary text-[length:var(--font-size-md)] mt-1">
            {loading
              ? "Loading from Confluence…"
              : `${kpis?.total ?? 0} items · ${syncLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="neutral" onClick={fetchPage} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          {data?.url && (
            <Button variant="neutral" asChild>
              <a href={data.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} />
                Open in Confluence
              </a>
            </Button>
          )}
          <Button onClick={() => { setShowAddRow(v => !v); setEditRowIdx(null); setDeleteConfirm(null); }}>
            <Plus size={14} />
            Add Row
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-7 gap-2">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-neutral-100 border border-neutral-200 rounded-lg px-3 py-3 h-16 animate-pulse" />
          ))
        ) : kpis ? (
          <>
            <KPICard label="Total"       value={kpis.total}      color="var(--text-primary)" />
            <KPICard label="Not Started" value={kpis.notStarted} color="var(--neutral-500)" />
            <KPICard label="To Do"       value={kpis.todo}       color="var(--info-400)" />
            <KPICard label="In Progress" value={kpis.inProgress} color="var(--brand-400)" />
            <KPICard label="Blocked"     value={kpis.blocked}    color={kpis.blocked > 0 ? "var(--error-400)" : "var(--neutral-400)"} />
            <KPICard label="Overdue"     value={kpis.overdue}    color={kpis.overdue > 0 ? "var(--warning-400)" : "var(--neutral-400)"} />
            <KPICard label="Done"        value={kpis.done}       color="var(--success-400)" />
          </>
        ) : null}
      </div>

      {/* Filter + search toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search anything…"
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-secondary hover:text-fg-primary transition-colors duration-200 ease-in-out"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {statusValues.length > 0 && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface-card border border-neutral-300 rounded-[8px] text-[length:var(--font-size-md)] text-fg-primary focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)] transition-colors duration-200 ease-in-out"
          >
            <option value="all">All statuses</option>
            {statusValues.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        )}

        <div className="flex items-center gap-0.5 bg-neutral-100 border border-neutral-300 rounded-lg p-1">
          <button
            onClick={() => setDensity("comfortable")}
            title="Comfortable"
            className={cn(
              "p-1.5 rounded-[6px] transition-colors duration-200 ease-in-out",
              density === "comfortable" ? "bg-surface-card text-fg-primary shadow-xs" : "text-fg-secondary hover:text-fg-primary"
            )}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setDensity("compact")}
            title="Compact"
            className={cn(
              "p-1.5 rounded-[6px] transition-colors duration-200 ease-in-out",
              density === "compact" ? "bg-surface-card text-fg-primary shadow-xs" : "text-fg-secondary hover:text-fg-primary"
            )}
          >
            <AlignJustify size={14} />
          </button>
        </div>

        {(search || statusFilter !== "all") && (
          <span className="text-[length:var(--font-size-xs)] text-fg-secondary">
            {displayRows.length} of {kpis?.total ?? 0} shown
          </span>
        )}
      </div>

      {/* Add Row form */}
      {showAddRow && headers.length > 0 && (
        <div className="bg-surface-card border border-brand-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-fg-primary font-semibold text-[length:var(--font-size-md)]">New Row</h3>
            <button onClick={() => setShowAddRow(false)} className="text-fg-secondary hover:text-fg-primary transition-colors duration-200 ease-in-out">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {headers.map((h, i) => {
              const type = colType(h);
              const isDate = type === "date";
              const isStatus = type === "status";
              return (
                <div key={i}>
                  <label className="block text-[length:var(--font-size-xs)] text-fg-secondary mb-1">{h}</label>
                  {isStatus ? (
                    <select
                      value={newCells[i] ?? ""}
                      onChange={e => setNewCells(prev => {
                        const n = [...prev];
                        n[i] = e.target.value;
                        return n;
                      })}
                      className="w-full px-3 py-2 bg-surface-card border border-neutral-300 rounded-[8px] text-[length:var(--font-size-md)] text-fg-primary focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)] transition-colors duration-200 ease-in-out"
                    >
                      <option value="">—</option>
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      {newCells[i] && !STATUS_OPTIONS.includes(newCells[i]) && (
                        <option value={newCells[i]}>{newCells[i]}</option>
                      )}
                    </select>
                  ) : (
                    <Input
                      type={isDate ? "date" : "text"}
                      value={isDate ? dmyToIso(newCells[i] ?? "") : (newCells[i] ?? "")}
                      onChange={e => setNewCells(prev => {
                        const n = [...prev];
                        n[i] = isDate ? isoToDmy(e.target.value) : e.target.value;
                        return n;
                      })}
                      placeholder={isDate ? "" : h}
                      className="px-3 py-2"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="neutral" onClick={() => setShowAddRow(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSave("append_row", newCells)} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Add to Confluence
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-card border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-auto max-h-[72vh] hide-scrollbar">
          <table className="w-full text-[length:var(--font-size-md)]">

            {/* Header — sticky on vertical scroll */}
            <thead className="sticky top-0 z-20">
              <tr className="border-b border-neutral-200">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <th key={i} className="px-4 py-3 bg-surface-card">
                      <div className="h-3 rounded bg-neutral-200 animate-pulse w-16" />
                    </th>
                  ))
                ) : (
                  <>
                    {visibleIdx.map((ci) => (
                      <th
                        key={ci}
                        onClick={() => cycleSort(ci)}
                        className="text-left px-4 py-3 text-[length:var(--font-size-xs)] font-semibold uppercase tracking-wide text-fg-secondary cursor-pointer hover:text-fg-primary select-none whitespace-nowrap transition-colors duration-200 ease-in-out bg-surface-card"
                      >
                        <span className="inline-flex items-center gap-1">
                          {headers[ci]}
                          {sort.col === ci ? (
                            sort.dir === "asc"
                              ? <ChevronUp size={11} className="text-brand-500" />
                              : <ChevronDown size={11} className="text-brand-500" />
                          ) : (
                            <ChevronsUpDown size={11} className="text-neutral-400" />
                          )}
                        </span>
                      </th>
                    ))}
                    {/* Actions — pinned to the right + top corner */}
                    <th className="px-4 py-3 w-24 text-right text-[length:var(--font-size-xs)] font-semibold uppercase tracking-wide text-fg-secondary sticky right-0 z-30 bg-surface-card">
                      Actions
                    </th>
                  </>
                )}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <SkeletonRow key={i} cols={6} density={density} />
                ))
              ) : displayRows.length === 0 ? (
                <tr>
                  <td colSpan={visibleIdx.length + 1} className="px-4 py-16 text-center">
                    <div className="text-4xl mb-3">🗂️</div>
                    <p className="text-fg-primary font-medium text-[length:var(--font-size-md)]">
                      {search || statusFilter !== "all"
                        ? "No rows match your filters"
                        : "Nothing tracked yet"}
                    </p>
                    <p className="text-fg-secondary text-[length:var(--font-size-xs)] mt-1">
                      {search || statusFilter !== "all"
                        ? "Clear the search or filter to see all rows"
                        : "Click \"Add Row\" to add the first item"}
                    </p>
                  </td>
                </tr>
              ) : (
                displayRows.map(({ row, origIdx }) => {
                  const paddedRow = padRow(row);
                  const isEditing = editRowIdx === origIdx;
                  const isDeleting = deleteConfirm === origIdx;

                  // Inline edit row
                  if (isEditing) {
                    return (
                      <tr key={origIdx} className="border-b border-neutral-200 bg-brand-25">
                        {visibleIdx.map((ci) => {
                          const cell = editCells[ci] ?? "";
                          const type = colType(data?.table.headers[ci] ?? "");
                          const isDate = type === "date";
                          const isStatus = type === "status";
                          return (
                            <td key={ci} className={`px-3 ${density === "compact" ? "py-2" : "py-2.5"}`}>
                              {isStatus ? (
                                <select
                                  value={cell}
                                  onChange={e => setEditCells(prev => {
                                    const n = [...prev];
                                    n[ci] = e.target.value;
                                    return n;
                                  })}
                                  className="w-full min-w-[72px] px-2 py-1.5 bg-surface-card border border-neutral-300 rounded-md text-[length:var(--font-size-md)] text-fg-primary focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)] transition-colors duration-200 ease-in-out"
                                >
                                  <option value="">—</option>
                                  {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  {cell && !STATUS_OPTIONS.includes(cell) && (
                                    <option value={cell}>{cell}</option>
                                  )}
                                </select>
                              ) : (
                                <input
                                  type={isDate ? "date" : "text"}
                                  value={isDate ? dmyToIso(cell) : cell}
                                  onChange={e => setEditCells(prev => {
                                    const n = [...prev];
                                    n[ci] = isDate ? isoToDmy(e.target.value) : e.target.value;
                                    return n;
                                  })}
                                  className="w-full min-w-[72px] px-2 py-1.5 bg-surface-card border border-neutral-300 rounded-md text-[length:var(--font-size-md)] text-fg-primary focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)] transition-colors duration-200 ease-in-out"
                                />
                              )}
                            </td>
                          );
                        })}
                        <td className={`px-3 ${density === "compact" ? "py-2" : "py-2.5"} sticky right-0 z-10 bg-brand-25`}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSave("edit_row", editCells, origIdx)}
                              disabled={saving}
                              className="p-1.5 rounded-md text-success-600 hover:bg-neutral-100 transition-colors duration-200 ease-in-out disabled:opacity-50"
                              title="Save"
                            >
                              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            </button>
                            <button
                              onClick={() => setEditRowIdx(null)}
                              className="p-1.5 rounded-md text-fg-secondary hover:text-fg-primary hover:bg-neutral-100 transition-colors duration-200 ease-in-out"
                              title="Cancel"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Delete confirm row
                  if (isDeleting) {
                    return (
                      <tr key={origIdx} className="border-b border-neutral-200 bg-error-25">
                        <td colSpan={visibleIdx.length + 1} className={`px-4 ${density === "compact" ? "py-2.5" : "py-3.5"}`}>
                          <div className="flex items-center gap-3">
                            <AlertCircle size={14} className="text-error-600 shrink-0" />
                            <span className="text-[length:var(--font-size-md)] text-error-600">Delete this row from Confluence? This cannot be undone.</span>
                            <div className="flex items-center gap-2 ml-auto shrink-0">
                              <Button variant="neutral" size="sm" onClick={() => setDeleteConfirm(null)}>
                                Cancel
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleSave("delete_row", [], origIdx)}
                                disabled={saving}
                              >
                                {saving ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                Delete
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Normal row
                  return (
                    <tr
                      key={origIdx}
                      className={`border-b border-neutral-200 last:border-0 hover:bg-neutral-100 transition-colors duration-200 ease-in-out group ${density === "compact" ? "h-10" : "h-14"}`}
                    >
                      {visibleIdx.map((ci) => (
                        <td key={ci} className={`px-4 ${density === "compact" ? "py-2" : "py-3.5"} max-w-[260px]`}>
                          <div className="truncate">
                            {renderCell(paddedRow[ci], ci, paddedRow)}
                          </div>
                        </td>
                      ))}
                      <td className={`px-3 ${density === "compact" ? "py-2" : "py-3.5"} sticky right-0 z-10 bg-surface-card group-hover:bg-neutral-100`}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(origIdx)}
                            className="p-1.5 rounded-md text-fg-secondary hover:text-brand-500 hover:bg-neutral-100 transition-colors duration-200 ease-in-out"
                            title="Edit row"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => { setDeleteConfirm(origIdx); setEditRowIdx(null); }}
                            className="p-1.5 rounded-md text-fg-secondary hover:text-error-600 hover:bg-neutral-100 transition-colors duration-200 ease-in-out"
                            title="Delete row"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Toast toasts={toasts} dismiss={dismissToast} />
    </div>
  );
}
