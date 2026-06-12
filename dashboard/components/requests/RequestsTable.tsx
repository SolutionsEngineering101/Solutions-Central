"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Search, ArrowDownWideNarrow, ArrowUpNarrowWide, Sparkles, RefreshCw, CloudDownload, Pencil, Check, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAssistant, type AssistantRequest } from "@/components/ai/AssistantProvider";

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

function parseId(id: string): number {
  const m = id.match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : -1;
}

function extractSection(body: string, heading: string): string {
  const re = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
  const m = body.match(re);
  return m ? m[1].trim() : "";
}

const STATUS_OPTIONS = [
  "Open", "Solution Given Closed", "To Product Closed",
  "Rejected", "No Response Closed", "Unknown",
];
const COMPLEXITY_OPTIONS = ["Not Set", "Low", "Medium", "High"];

export function RequestsTable({ requests }: { requests: Request[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<"id-asc" | "id-desc" | "date-desc" | "date-asc" | "none">("id-asc");
  const [selected, setSelected] = useState<Request | null>(null);
  const [pullState, setPullState] = useState<"idle" | "pulling" | "done" | "error">("idle");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<"" | "saved" | "error">("");
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const { open: openAssistant } = useAssistant();

  function handleRefresh() {
    startTransition(() => router.refresh());
  }

  async function handlePull() {
    setPullState("pulling");
    try {
      const res = await fetch("/api/github/pull-forms", { method: "POST" });
      if (!res.ok) throw new Error();
      setPullState("done");
      // Give the workflow a moment to queue, then refresh the page data
      setTimeout(() => {
        startTransition(() => router.refresh());
        setPullState("idle");
      }, 3000);
    } catch {
      setPullState("error");
      setTimeout(() => setPullState("idle"), 3000);
    }
  }

  function openEditMode(r: Request) {
    setEditFields({
      status:       get(r.frontmatter, "status"),
      complexity:   get(r.frontmatter, "complexity"),
      solution_spoc: get(r.frontmatter, "solution_spoc"),
      vc_spoc:      get(r.frontmatter, "vc_spoc"),
      dev_sprint:   get(r.frontmatter, "dev_sprint"),
      ticket:       get(r.frontmatter, "ticket"),
      closed_on:    get(r.frontmatter, "closed_on"),
      solution:     extractSection(r.content, "Solution Given"),
      remarks:      extractSection(r.content, "Remarks"),
    });
    setIsEditing(true);
    setSaveMsg("");
  }

  async function handleSave() {
    if (!selected) return;
    setIsSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/github/forms/${encodeURIComponent(get(selected.frontmatter, "form_id").replace(/\D/g, ""))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selected.path, fields: editFields }),
      });
      if (!res.ok) throw new Error();
      // Optimistically update the selected row's frontmatter so the panel reflects changes immediately
      const updatedFrontmatter = { ...selected.frontmatter, ...editFields };
      setSelected({ ...selected, frontmatter: updatedFrontmatter });
      setIsEditing(false);
      setSaveMsg("saved");
      setTimeout(() => {
        setSaveMsg("");
        startTransition(() => router.refresh());
      }, 1800);
    } catch {
      setSaveMsg("error");
    } finally {
      setIsSaving(false);
    }
  }

  function setField(key: string, val: string) {
    setEditFields((prev) => ({ ...prev, [key]: val }));
  }

  // Build the assistant's request context from a row's frontmatter.
  const toAssistant = (r: Request): AssistantRequest => ({
    id: get(r.frontmatter, "form_id"),
    client: get(r.frontmatter, "client", "client_name"),
    department: get(r.frontmatter, "department"),
    feature: get(r.frontmatter, "feature_name"),
    status: get(r.frontmatter, "status"),
    complexity: get(r.frontmatter, "complexity"),
    description: get(r.frontmatter, "description", "brief"),
    content: r.content,
  });

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

  const sorted = useMemo(() => {
    if (sort === "none") return filtered;
    if (sort === "id-asc" || sort === "id-desc") {
      return [...filtered].sort((a, b) => {
        const ia = parseId(get(a.frontmatter, "form_id"));
        const ib = parseId(get(b.frontmatter, "form_id"));
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return sort === "id-asc" ? ia - ib : ib - ia;
      });
    }
    const ts = (r: Request): number | null => {
      const t = new Date(get(r.frontmatter, "submitted_at", "date")).getTime();
      return isNaN(t) ? null : t;
    };
    return [...filtered].sort((a, b) => {
      const ta = ts(a), tb = ts(b);
      if (ta === null && tb === null) return 0;
      if (ta === null) return 1;
      if (tb === null) return -1;
      return sort === "date-desc" ? tb - ta : ta - tb;
    });
  }, [filtered, sort]);

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

        {/* Search + sort + refresh */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by client, ID, status, feature…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setSort(sort === "id-asc" ? "id-desc" : "id-asc")}
              title="Sort by Solution ID"
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                sort === "id-asc" || sort === "id-desc"
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
              }`}
            >
              {sort === "id-desc" ? <ArrowUpNarrowWide size={14} /> : <ArrowDownWideNarrow size={14} />}
              ID
            </button>
            <button
              onClick={() => setSort(sort === "date-desc" ? "date-asc" : "date-desc")}
              title="Sort by submitted date"
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                sort === "date-desc" || sort === "date-asc"
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
              }`}
            >
              {sort === "date-asc" ? <ArrowUpNarrowWide size={14} /> : <ArrowDownWideNarrow size={14} />}
              Date
            </button>
            <button
              onClick={handleRefresh}
              disabled={isPending}
              title="Refresh page data"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={handlePull}
              disabled={pullState === "pulling" || isPending}
              title="Pull new responses from MS Forms"
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                pullState === "done"
                  ? "bg-emerald-950 border-emerald-700 text-emerald-400"
                  : pullState === "error"
                  ? "bg-red-950 border-red-700 text-red-400"
                  : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
              }`}
            >
              <CloudDownload size={14} className={pullState === "pulling" ? "animate-pulse" : ""} />
              {pullState === "pulling" ? "Pulling…" : pullState === "done" ? "Queued!" : pullState === "error" ? "Failed" : "Pull"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[180px_1fr_160px_1fr_120px_44px] gap-0 border-b border-gray-800 px-5 py-3">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Solution ID</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Client</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Department</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Feature</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Status</span>
            <span className="sr-only">AI</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-800/60">
            {sorted.map((req, i) => {
              const fm = req.frontmatter;
              const id = get(fm, "form_id");
              const client = get(fm, "client", "client_name");
              const department = get(fm, "department");
              const feature = get(fm, "feature_name");
              const status = get(fm, "status");
              const date = get(fm, "submitted_at", "submitted_at");
              const isActive = selected?.path === req.path;

              return (
                <div
                  key={req.path + i}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(isActive ? null : req)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(isActive ? null : req); } }}
                  className={`group w-full grid grid-cols-[180px_1fr_160px_1fr_120px_44px] gap-0 px-5 py-3.5 text-left transition-colors cursor-pointer items-center
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
                  {/* Solve with AI */}
                  <button
                    type="button"
                    title="Draft a solution with AI"
                    onClick={(e) => { e.stopPropagation(); openAssistant(toAssistant(req)); }}
                    className="justify-self-end p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-all"
                  >
                    <Sparkles size={16} />
                  </button>
                </div>
              );
            })}
            {sorted.length === 0 && (
              <div className="py-16 text-center text-gray-600 text-sm">No requests match your search.</div>
            )}
          </div>
        </div>

        <p className="text-gray-700 text-xs mt-2 text-right">{filtered.length} of {requests.length} requests</p>
      </div>

      {/* Side panel */}
      {selected && (
        <div className="w-[420px] shrink-0 ml-5 sticky top-0 self-start">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col max-h-[calc(100vh-2.5rem)]">

            {/* Panel header */}
            <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-gray-800 shrink-0">
              <div>
                <p className="text-indigo-400 text-xs font-mono mb-1">
                  {get(selected.frontmatter, "form_id")}
                </p>
                <h2 className="text-white font-semibold text-base leading-tight">
                  {get(selected.frontmatter, "client", "client_name")}
                </h2>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {!isEditing && (
                  <button
                    onClick={() => openEditMode(selected)}
                    title="Edit consultant fields"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                )}
                <button
                  onClick={() => { setSelected(null); setIsEditing(false); setSaveMsg(""); }}
                  className="text-gray-600 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Draft with AI (read mode only) */}
            {!isEditing && (
              <div className="px-6 py-3 border-b border-gray-800 shrink-0">
                <button
                  onClick={() => openAssistant(toAssistant(selected))}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold transition-colors"
                >
                  <Sparkles size={15} /> Draft a solution with AI
                </button>
              </div>
            )}

            {/* Status row */}
            <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-3 shrink-0">
              {isEditing ? (
                <div className="flex items-center gap-3 w-full">
                  <select
                    value={editFields.status ?? ""}
                    onChange={(e) => setField("status", e.target.value)}
                    className="flex-1 px-2 py-1 bg-gray-950 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    value={editFields.complexity ?? ""}
                    onChange={(e) => setField("complexity", e.target.value)}
                    className="w-28 px-2 py-1 bg-gray-950 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {COMPLEXITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Scrollable content */}
            <div className="px-6 py-4 space-y-4 flex-1 min-h-0 overflow-y-auto">

              {isEditing ? (
                /* ── Edit mode ────────────────────────────────────────────── */
                <>
                  {/* Read-only context fields */}
                  {[
                    { label: "Submitted by", keys: ["submitted_by"] },
                    { label: "Email", keys: ["email"] },
                    { label: "Department", keys: ["department"] },
                    { label: "Feature", keys: ["feature_name"] },
                    { label: "Go-live requirement", keys: ["go_live_requirement"] },
                    { label: "Priority", keys: ["priority"] },
                  ].map(({ label, keys }) => {
                    const val = get(selected.frontmatter, ...keys);
                    if (val === "—") return null;
                    return (
                      <div key={label}>
                        <p className="text-gray-600 text-xs mb-0.5">{label}</p>
                        <p className="text-gray-400 text-sm">{val}</p>
                      </div>
                    );
                  })}

                  <div className="border-t border-gray-800 pt-4 space-y-3">
                    <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest">Consultant Fields</p>

                    {([
                      { label: "Solution SPOC", key: "solution_spoc" },
                      { label: "VC SPOC", key: "vc_spoc" },
                      { label: "Dev Sprint", key: "dev_sprint" },
                      { label: "Ticket / Link", key: "ticket" },
                    ] as const).map(({ label, key }) => (
                      <div key={key}>
                        <label className="block text-gray-500 text-xs mb-1">{label}</label>
                        <input
                          type="text"
                          value={editFields[key] === "—" ? "" : (editFields[key] ?? "")}
                          onChange={(e) => setField(key, e.target.value)}
                          className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    ))}

                    <div>
                      <label className="block text-gray-500 text-xs mb-1">Closed On</label>
                      <input
                        type="date"
                        value={editFields.closed_on === "—" ? "" : (editFields.closed_on ?? "")}
                        onChange={(e) => setField("closed_on", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 text-xs mb-1">Solution Given</label>
                      <textarea
                        rows={4}
                        value={editFields.solution ?? ""}
                        onChange={(e) => setField("solution", e.target.value)}
                        placeholder="Describe the solution provided…"
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 text-xs mb-1">Remarks</label>
                      <textarea
                        rows={3}
                        value={editFields.remarks ?? ""}
                        onChange={(e) => setField("remarks", e.target.value)}
                        placeholder="Internal notes…"
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* ── Read mode ────────────────────────────────────────────── */
                <>
                  {[
                    { label: "Submitted by", keys: ["submitted_by"] },
                    { label: "Email", keys: ["email"] },
                    { label: "Department", keys: ["department"] },
                    { label: "Feature", keys: ["feature_name"] },
                    { label: "SPOC", keys: ["solution_spoc", "vc_spoc"] },
                    { label: "Go-live requirement", keys: ["go_live_requirement"] },
                    { label: "Go-live date", keys: ["go_live_date"] },
                    { label: "Closed on", keys: ["closed_on"] },
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

                  {selected.content.trim() && (
                    <div>
                      <p className="text-gray-600 text-xs mb-2">Notes</p>
                      <div className="bg-gray-950 rounded-lg p-3">
                        <pre className="text-gray-300 text-xs whitespace-pre-wrap break-words font-mono leading-relaxed">
                          {selected.content.trim()}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Edit mode footer */}
            {isEditing && (
              <div className="px-6 py-4 border-t border-gray-800 shrink-0 flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {isSaving
                    ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                    : saveMsg === "saved"
                    ? <><Check size={14} /> Saved</>
                    : "Save"}
                </button>
                <button
                  onClick={() => { setIsEditing(false); setSaveMsg(""); }}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            )}
            {saveMsg === "error" && (
              <p className="px-6 pb-3 text-xs text-red-400 shrink-0">Save failed — check your connection and try again.</p>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
