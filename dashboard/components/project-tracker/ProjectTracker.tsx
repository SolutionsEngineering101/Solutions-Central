"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  RefreshCw, ExternalLink, Plus, Pencil, Trash2, X, Check,
  AlertCircle, Loader2, Search, ChevronUp, ChevronDown,
  ChevronsUpDown, LayoutGrid, AlignJustify,
} from "lucide-react";

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

function statusStyle(text: string) {
  const v = text.toLowerCase();
  if (/done|complete|closed|delivered/i.test(v))
    return { bg: "rgba(52,211,153,0.12)", fg: "#34d399", dot: "#34d399" };
  if (/in.?progress|active|ongoing|wip/i.test(v))
    return { bg: "rgba(129,140,248,0.12)", fg: "#818cf8", dot: "#818cf8" };
  if (/block|hold|risk|stall/i.test(v))
    return { bg: "rgba(248,113,113,0.12)", fg: "#f87171", dot: "#f87171" };
  if (/review|pending|approval/i.test(v))
    return { bg: "rgba(251,191,36,0.12)", fg: "#fbbf24", dot: "#fbbf24" };
  if (/not.?start|to.?do|open|new/i.test(v))
    return { bg: "rgba(107,114,128,0.12)", fg: "#9ca3af", dot: "#6b7280" };
  return { bg: "rgba(107,114,128,0.10)", fg: "#9ca3af", dot: "#6b7280" };
}

function priorityStyle(text: string) {
  if (/critical|p0|urgent/i.test(text)) return { bg: "rgba(248,113,113,0.15)", fg: "#f87171" };
  if (/high|p1/i.test(text))            return { bg: "rgba(251,146,60,0.15)",  fg: "#fb923c" };
  if (/medium|med|p2/i.test(text))      return { bg: "rgba(251,191,36,0.12)",  fg: "#fbbf24" };
  if (/low|p3/i.test(text))             return { bg: "rgba(52,211,153,0.12)",  fg: "#34d399" };
  return { bg: "rgba(107,114,128,0.10)", fg: "#9ca3af" };
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function StatusPill({ text }: { text: string }) {
  const s = statusStyle(text);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
      {text}
    </span>
  );
}

function PriorityPill({ text }: { text: string }) {
  const s = priorityStyle(text);
  return (
    <span
      className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {text}
    </span>
  );
}

function OverdueBadge() {
  return (
    <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-red-950 text-red-400 border border-red-900">
      Overdue
    </span>
  );
}

function KPICard({ label, value, color }: {
  label: string; value: number | string; color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-3 flex flex-col gap-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 truncate">{label}</p>
      <p className="text-[22px] font-bold leading-none mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}

function SkeletonRow({ cols, density }: { cols: number; density: "compact" | "comfortable" }) {
  return (
    <tr className="border-b border-gray-800/60">
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <td key={i} className={`px-4 ${density === "compact" ? "py-2.5" : "py-3.5"}`}>
          <div
            className="h-4 rounded bg-gray-800 animate-pulse"
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
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2.5 pl-4 pr-3 py-3 rounded-xl shadow-xl text-sm font-medium
            ${t.type === "success"
              ? "bg-gray-900 border border-emerald-800 text-emerald-300"
              : "bg-gray-900 border border-red-800 text-red-300"}`}
        >
          {t.type === "success"
            ? <Check size={14} className="text-emerald-400 shrink-0" />
            : <AlertCircle size={14} className="text-red-400 shrink-0" />}
          <span>{t.msg}</span>
          <button onClick={() => dismiss(t.id)} className="ml-1 text-gray-600 hover:text-gray-400 transition-colors">
            <X size={13} />
          </button>
        </div>
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
    if (!data) return <span className="text-gray-300">{cell}</span>;
    const header = data.table.headers[colIdx] ?? "";
    const type = colType(header);

    // Overall Status: show computed status when cell is empty (manual value takes priority)
    if (/^overall.?status$/i.test(header)) {
      const display = cell.trim() || computeRowStatus(row, data.table.headers);
      return <StatusPill text={display} />;
    }

    if (!cell) return <span className="text-gray-700">—</span>;
    if (type === "status") return <StatusPill text={cell} />;
    if (type === "priority") return <PriorityPill text={cell} />;
    if (type === "date") {
      return (
        <span className="text-gray-400 text-sm whitespace-nowrap">
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
          className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors group/link"
        >
          <span>{label}</span>
          <ExternalLink size={11} className="shrink-0 opacity-50 group-hover/link:opacity-100 transition-opacity" />
        </a>
      );
    }
    return <span className="text-gray-300 text-sm">{cell}</span>;
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
      <div className="bg-gray-900 border border-red-900/60 rounded-xl p-6 max-w-xl">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-red-400 font-semibold text-sm mb-1">
              {isConfig ? "Confluence not configured" : "Failed to load data"}
            </p>
            {isConfig ? (
              <div className="text-gray-400 text-sm space-y-2">
                <p>Add to <code className="text-indigo-400 bg-gray-800 px-1 rounded">.env.local</code> then restart:</p>
                <pre className="bg-gray-800 rounded-lg p-3 text-xs text-gray-300">{`CONFLUENCE_EMAIL=bhargav.nath@vantagecircle.com
CONFLUENCE_API_TOKEN=<from id.atlassian.com>
CONFLUENCE_DOMAIN=vantagecirclejira.atlassian.net
CONFLUENCE_PAGE_ID=567050244`}</pre>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Full render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white text-2xl font-semibold">Confluence Project Dev Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading
              ? "Loading from Confluence…"
              : `${kpis?.total ?? 0} items · ${syncLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchPage}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          {data?.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm transition-colors"
            >
              <ExternalLink size={14} />
              Open in Confluence
            </a>
          )}
          <button
            onClick={() => { setShowAddRow(v => !v); setEditRowIdx(null); setDeleteConfirm(null); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            <Plus size={14} />
            Add Row
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-7 gap-2">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-3 h-16 animate-pulse" />
          ))
        ) : kpis ? (
          <>
            <KPICard label="Total"       value={kpis.total}      color="#e5e7eb" />
            <KPICard label="Not Started" value={kpis.notStarted} color="#6b7280" />
            <KPICard label="To Do"       value={kpis.todo}       color="#60a5fa" />
            <KPICard label="In Progress" value={kpis.inProgress} color="#818cf8" />
            <KPICard label="Blocked"     value={kpis.blocked}    color={kpis.blocked > 0 ? "#f87171" : "#6b7280"} />
            <KPICard label="Overdue"     value={kpis.overdue}    color={kpis.overdue > 0 ? "#fb923c" : "#6b7280"} />
            <KPICard label="Done"        value={kpis.done}       color="#34d399" />
          </>
        ) : null}
      </div>

      {/* Filter + search toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search anything…"
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {statusValues.length > 0 && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All statuses</option>
            {statusValues.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        )}

        <div className="flex items-center gap-0.5 bg-gray-800 border border-gray-700 rounded-lg p-1">
          <button
            onClick={() => setDensity("comfortable")}
            title="Comfortable"
            className={`p-1.5 rounded transition-colors ${density === "comfortable" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-white"}`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setDensity("compact")}
            title="Compact"
            className={`p-1.5 rounded transition-colors ${density === "compact" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-white"}`}
          >
            <AlignJustify size={14} />
          </button>
        </div>

        {(search || statusFilter !== "all") && (
          <span className="text-xs text-gray-500">
            {displayRows.length} of {kpis?.total ?? 0} shown
          </span>
        )}
      </div>

      {/* Add Row form */}
      {showAddRow && headers.length > 0 && (
        <div className="bg-gray-900 border border-indigo-800/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">New Row</h3>
            <button onClick={() => setShowAddRow(false)} className="text-gray-500 hover:text-white transition-colors">
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
                  <label className="block text-xs text-gray-500 mb-1">{h}</label>
                  {isStatus ? (
                    <select
                      value={newCells[i] ?? ""}
                      onChange={e => setNewCells(prev => {
                        const n = [...prev];
                        n[i] = e.target.value;
                        return n;
                      })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">—</option>
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      {newCells[i] && !STATUS_OPTIONS.includes(newCells[i]) && (
                        <option value={newCells[i]}>{newCells[i]}</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type={isDate ? "date" : "text"}
                      value={isDate ? dmyToIso(newCells[i] ?? "") : (newCells[i] ?? "")}
                      onChange={e => setNewCells(prev => {
                        const n = [...prev];
                        n[i] = isDate ? isoToDmy(e.target.value) : e.target.value;
                        return n;
                      })}
                      placeholder={isDate ? "" : h}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddRow(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave("append_row", newCells)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Add to Confluence
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-auto max-h-[72vh] hide-scrollbar">
          <table className="w-full text-sm">

            {/* Header — sticky on vertical scroll */}
            <thead className="sticky top-0 z-20">
              <tr className="border-b border-gray-800">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <th key={i} className="px-4 py-3 bg-gray-900">
                      <div className="h-3 rounded bg-gray-800 animate-pulse w-16" />
                    </th>
                  ))
                ) : (
                  <>
                    {visibleIdx.map((ci) => (
                      <th
                        key={ci}
                        onClick={() => cycleSort(ci)}
                        className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-gray-300 select-none whitespace-nowrap transition-colors bg-gray-900"
                      >
                        <span className="inline-flex items-center gap-1">
                          {headers[ci]}
                          {sort.col === ci ? (
                            sort.dir === "asc"
                              ? <ChevronUp size={11} className="text-indigo-400" />
                              : <ChevronDown size={11} className="text-indigo-400" />
                          ) : (
                            <ChevronsUpDown size={11} className="text-gray-700" />
                          )}
                        </span>
                      </th>
                    ))}
                    {/* Actions — pinned to the right + top corner */}
                    <th className="px-4 py-3 w-24 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500 sticky right-0 z-30 bg-gray-900">
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
                    <p className="text-gray-400 font-medium text-sm">
                      {search || statusFilter !== "all"
                        ? "No rows match your filters"
                        : "Nothing tracked yet"}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
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
                      <tr key={origIdx} className="border-b border-gray-800 bg-indigo-950/20">
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
                                  className="w-full min-w-[72px] px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                                  className="w-full min-w-[72px] px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              )}
                            </td>
                          );
                        })}
                        <td className={`px-3 ${density === "compact" ? "py-2" : "py-2.5"} sticky right-0 z-10 bg-indigo-950/60`}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSave("edit_row", editCells, origIdx)}
                              disabled={saving}
                              className="p-1.5 rounded-md text-emerald-400 hover:bg-gray-800 transition-colors disabled:opacity-50"
                              title="Save"
                            >
                              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            </button>
                            <button
                              onClick={() => setEditRowIdx(null)}
                              className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
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
                      <tr key={origIdx} className="border-b border-gray-800 bg-red-950/20">
                        <td colSpan={visibleIdx.length + 1} className={`px-4 ${density === "compact" ? "py-2.5" : "py-3.5"}`}>
                          <div className="flex items-center gap-3">
                            <AlertCircle size={14} className="text-red-400 shrink-0" />
                            <span className="text-sm text-red-300">Delete this row from Confluence? This cannot be undone.</span>
                            <div className="flex items-center gap-2 ml-auto shrink-0">
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1 text-xs text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSave("delete_row", [], origIdx)}
                                disabled={saving}
                                className="flex items-center gap-1.5 px-3 py-1 text-xs text-white font-semibold bg-red-700 hover:bg-red-600 rounded transition-colors disabled:opacity-50"
                              >
                                {saving ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                Delete
                              </button>
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
                      className={`border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors group ${density === "compact" ? "h-10" : "h-14"}`}
                    >
                      {visibleIdx.map((ci) => (
                        <td key={ci} className={`px-4 ${density === "compact" ? "py-2" : "py-3.5"} max-w-[260px]`}>
                          <div className="truncate">
                            {renderCell(paddedRow[ci], ci, paddedRow)}
                          </div>
                        </td>
                      ))}
                      <td className={`px-3 ${density === "compact" ? "py-2" : "py-3.5"} sticky right-0 z-10 bg-gray-900 group-hover:bg-[#171c26]`}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(origIdx)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-indigo-400 hover:bg-gray-800 transition-colors"
                            title="Edit row"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => { setDeleteConfirm(origIdx); setEditRowIdx(null); }}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
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
