"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Search, ArrowDownWideNarrow, ArrowUpNarrowWide, Sparkles, RefreshCw, CloudDownload, Check, Loader2, Wand2, Info } from "lucide-react";
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

// Returns the best available description from the markdown body.
function extractDescription(content: string): { subject: string; brief: string } {
  return {
    subject: extractSection(content, "Subject"),
    brief:
      extractSection(content, "Brief") ||
      extractSection(content, "Problem Description") ||
      extractSection(content, "Problem Statement"),
  };
}

const STATUS_OPTIONS = [
  "Open", "Solution Given Closed", "To Product Closed",
  "Rejected", "No Response Closed", "Unknown",
];
const COMPLEXITY_OPTIONS = ["Not Set", "Low", "Medium", "High"];

interface SuggestRef {
  ref: string; type: string; id: string; why: string; url?: string;
}

export function RequestsTable({ requests }: { requests: Request[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<"id-asc" | "id-desc" | "date-desc" | "date-asc" | "none">("id-asc");
  const [selected, setSelected] = useState<Request | null>(null);
  const [pullState, setPullState] = useState<"idle" | "pulling" | "done" | "error">("idle");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<"" | "saved" | "error">("");
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [suggestState, setSuggestState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [suggestRefs, setSuggestRefs] = useState<SuggestRef[]>([]);
  const { open: openAssistant } = useAssistant();

  function buildEditFields(r: Request): Record<string, string> {
    const s = get(r.frontmatter, "status");
    const c = get(r.frontmatter, "complexity");
    return {
      status:        s === "—" ? "Open" : s,
      complexity:    c === "—" ? "Not Set" : c,
      solution_spoc: get(r.frontmatter, "solution_spoc"),
      vc_spoc:       get(r.frontmatter, "vc_spoc"),
      dev_sprint:    get(r.frontmatter, "dev_sprint"),
      ticket:        get(r.frontmatter, "ticket"),
      closed_on:     get(r.frontmatter, "closed_on"),
      solution:      extractSection(r.content, "Solution Given"),
      remarks:       extractSection(r.content, "Remarks"),
    };
  }

  function selectRequest(req: Request | null) {
    setSelected(req);
    if (req) {
      setEditFields(buildEditFields(req));
      setSaveMsg("");
      setSuggestState("idle");
      setSuggestRefs([]);
    }
  }

  function handleRefresh() {
    startTransition(() => router.refresh());
  }

  async function handlePull() {
    setPullState("pulling");
    try {
      const res = await fetch("/api/github/pull-forms", { method: "POST" });
      if (!res.ok) throw new Error();
      setPullState("done");
      setTimeout(() => {
        startTransition(() => router.refresh());
        setPullState("idle");
      }, 3000);
    } catch {
      setPullState("error");
      setTimeout(() => setPullState("idle"), 3000);
    }
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
      const updatedFrontmatter = { ...selected.frontmatter, ...editFields };
      setSelected({ ...selected, frontmatter: updatedFrontmatter });
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

  function handleDiscard() {
    if (!selected) return;
    setEditFields(buildEditFields(selected));
    setSaveMsg("");
    setSuggestState("idle");
    setSuggestRefs([]);
  }

  async function handleSuggest() {
    if (!selected || suggestState === "loading") return;
    setSuggestState("loading");
    setSuggestRefs([]);
    try {
      const { subject, brief } = extractDescription(selected.content);
      const res = await fetch("/api/ai/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          request: {
            id:         get(selected.frontmatter, "form_id"),
            client:     get(selected.frontmatter, "client", "client_name"),
            department: get(selected.frontmatter, "department"),
            feature:    get(selected.frontmatter, "feature_name"),
            status:     get(selected.frontmatter, "status"),
            complexity: get(selected.frontmatter, "complexity"),
            // Pass description from body so semantic search has full context.
            description: brief || subject || get(selected.frontmatter, "description", "brief"),
            content: selected.content,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "AI request failed");
      setField("solution", json.draft ?? "");
      setSuggestRefs(json.references ?? []);
      setSuggestState("done");
    } catch {
      setSuggestState("error");
      setTimeout(() => setSuggestState("idle"), 4000);
    }
  }

  function setField(key: string, val: string) {
    setEditFields((prev) => ({ ...prev, [key]: val }));
  }

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
        {/* Sticky header block: title, filter bar, search/sort/refresh row, table column headers */}
        {/* -top-5/-mt-5/pt-5 cancel out <main>'s own top padding so this sticks flush to the
            viewport edge — otherwise the sticky offset sits 20px below it and scrolled rows
            peek through that gap. */}
        <div className="sticky -top-5 z-20 bg-gray-950 -mt-5 pt-5">
          <div className="mb-5">
            <h1 className="text-white text-2xl font-semibold">Solution Requests</h1>
            <p className="text-gray-400 text-sm mt-1">{requests.length} requests from clients</p>
          </div>

          {/* Status bar */}
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
          <div className="flex items-center gap-2 mb-3">
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

          {/* Table column headers — sticks with the rest of the header block.
              Only a bottom border (matches original design); the card's left/right/bottom
              border lives solely on the body box below so there's never two adjacent
              elements independently drawing the same border line. */}
          <div className="bg-gray-900 border-b border-gray-800 grid grid-cols-[180px_1fr_160px_1fr_120px_44px] gap-0 px-5 py-3">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Solution ID</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Client</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Department</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Feature</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Status</span>
            <span className="sr-only">AI</span>
          </div>
        </div>

        {/* Table body — scrolls under the sticky header block */}
        <div className="bg-gray-900 border border-t-0 border-gray-800 rounded-b-xl overflow-hidden">
          <div className="divide-y divide-gray-800/60">
            {sorted.map((req, i) => {
              const fm = req.frontmatter;
              const id = get(fm, "form_id");
              const client = get(fm, "client", "client_name");
              const department = get(fm, "department");
              const feature = get(fm, "feature_name");
              const status = get(fm, "status");
              const isActive = selected?.path === req.path;
              const { subject, brief } = extractDescription(req.content);
              const gist = brief || subject;

              return (
                <div
                  key={req.path + i}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectRequest(isActive ? null : req)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectRequest(isActive ? null : req); } }}
                  className={`group w-full px-5 py-3 text-left transition-colors cursor-pointer border-l-2
                    ${isActive ? "bg-indigo-950/40 border-l-indigo-500" : "hover:bg-gray-800/50 border-l-transparent"}`}
                >
                  <div className="grid grid-cols-[180px_1fr_160px_1fr_120px_44px] gap-0 items-center">
                    <span className="text-indigo-400 text-sm font-mono font-medium truncate pr-4">{id}</span>
                    <span className="text-white text-sm truncate pr-4">{client}</span>
                    <span className="text-gray-400 text-sm truncate pr-4">{department}</span>
                    <span className="text-gray-400 text-sm truncate pr-4">{feature}</span>
                    <span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${statusStyle(status)}`}>
                        {status}
                      </span>
                    </span>
                    <button
                      type="button"
                      title="Draft a solution with AI"
                      onClick={(e) => { e.stopPropagation(); openAssistant(toAssistant(req)); }}
                      className="justify-self-end p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-all"
                    >
                      <Sparkles size={16} />
                    </button>
                  </div>
                  {gist && (
                    <div className="flex items-center gap-1.5 mt-1 pl-[180px] pr-11" title={gist}>
                      <Info size={12} className="text-gray-600 hover:text-indigo-400 shrink-0 cursor-help transition-colors" />
                      <p className="text-gray-500 text-xs truncate">{gist}</p>
                    </div>
                  )}
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

      {/* Side panel — always-on form */}
      {selected && (
        <div className="w-[440px] shrink-0 ml-5 sticky top-0 self-start">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col max-h-[calc(100vh-2.5rem)]">

            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-800 shrink-0">
              <div className="min-w-0">
                <p className="text-indigo-400 text-xs font-mono mb-0.5">
                  {get(selected.frontmatter, "form_id")}
                </p>
                <h2 className="text-white font-semibold text-base leading-tight truncate">
                  {get(selected.frontmatter, "client", "client_name")}
                </h2>
                {get(selected.frontmatter, "submitted_at") !== "—" && (
                  <p className="text-gray-600 text-xs mt-0.5">
                    {formatDate(get(selected.frontmatter, "submitted_at"))}
                    {get(selected.frontmatter, "submitted_by") !== "—" && ` · ${get(selected.frontmatter, "submitted_by")}`}
                  </p>
                )}
              </div>
              <button
                onClick={() => selectRequest(null)}
                className="text-gray-600 hover:text-white transition-colors shrink-0 mt-0.5"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 min-h-0 overflow-y-auto">

              {/* ── Request context (read-only) ── */}
              <div className="px-5 py-4 border-b border-gray-800/60 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Request Details</p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { label: "Department", keys: ["department"] },
                    { label: "Feature", keys: ["feature_name"] },
                    { label: "Go-live required", keys: ["go_live_requirement"] },
                    { label: "Go-live date", keys: ["go_live_date"] },
                    { label: "Priority", keys: ["priority"] },
                    { label: "Email", keys: ["email"] },
                  ].map(({ label, keys }) => {
                    const val = get(selected.frontmatter, ...keys);
                    if (val === "—") return null;
                    return (
                      <div key={label}>
                        <p className="text-gray-600 text-[10px] mb-0.5">{label}</p>
                        <p className="text-gray-300 text-xs leading-snug">{val}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Description / Brief — extracted from body */}
                {(() => {
                  const { subject, brief } = extractDescription(selected.content);
                  if (!subject && !brief) return null;
                  return (
                    <div className="space-y-2">
                      {subject && (
                        <div>
                          <p className="text-gray-600 text-[10px] mb-0.5">Subject</p>
                          <p className="text-gray-300 text-xs font-medium">{subject}</p>
                        </div>
                      )}
                      {brief && (
                        <div>
                          <p className="text-gray-600 text-[10px] mb-0.5">Description</p>
                          <p className="text-gray-400 text-xs leading-relaxed line-clamp-6">{brief}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* ── Consultant response form ── */}
              <div className="px-5 py-4 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">Consultant Response</p>

                {/* Status + Complexity row */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-gray-500 text-[10px] mb-1">Status</label>
                    <select
                      value={editFields.status ?? "Open"}
                      onChange={(e) => setField("status", e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="block text-gray-500 text-[10px] mb-1">Complexity</label>
                    <select
                      value={editFields.complexity ?? "Not Set"}
                      onChange={(e) => setField("complexity", e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      {COMPLEXITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Text fields */}
                {([
                  { label: "Solution SPOC", key: "solution_spoc" },
                  { label: "VC SPOC",       key: "vc_spoc" },
                  { label: "Dev Sprint",    key: "dev_sprint" },
                  { label: "Ticket / Link", key: "ticket" },
                ] as const).map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-gray-500 text-[10px] mb-1">{label}</label>
                    <input
                      type="text"
                      value={editFields[key] === "—" ? "" : (editFields[key] ?? "")}
                      onChange={(e) => setField(key, e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-gray-500 text-[10px] mb-1">Closed On</label>
                  <input
                    type="date"
                    value={editFields.closed_on === "—" ? "" : (editFields.closed_on ?? "")}
                    onChange={(e) => setField("closed_on", e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Solution Given — with inline AI suggest */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-gray-500 text-[10px]">Solution Given</label>
                    <button
                      type="button"
                      onClick={handleSuggest}
                      disabled={suggestState === "loading"}
                      title="Suggest a solution using AI semantic search on past work"
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors disabled:opacity-50 ${
                        suggestState === "loading"
                          ? "bg-indigo-950 border-indigo-800 text-indigo-400"
                          : suggestState === "error"
                          ? "bg-red-950 border-red-800 text-red-400"
                          : suggestState === "done"
                          ? "bg-emerald-950 border-emerald-800 text-emerald-400"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:text-indigo-300 hover:border-indigo-700"
                      }`}
                    >
                      {suggestState === "loading"
                        ? <><Loader2 size={10} className="animate-spin" /> Searching…</>
                        : suggestState === "error"
                        ? "Failed — retry"
                        : suggestState === "done"
                        ? <><Check size={10} /> Suggested</>
                        : <><Wand2 size={10} /> AI Suggest</>
                      }
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={editFields.solution === "—" ? "" : (editFields.solution ?? "")}
                    onChange={(e) => setField("solution", e.target.value)}
                    placeholder="Describe the solution provided…"
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                  {/* Based-on strip */}
                  {suggestRefs.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className="text-gray-600 text-[10px] mr-0.5 self-center">Based on:</span>
                      {suggestRefs.map((r, i) => (
                        <span
                          key={i}
                          title={r.why}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-[10px] text-gray-400"
                        >
                          <span className={
                            r.type === "form" ? "text-indigo-400" :
                            r.type === "playbook" ? "text-amber-400" : "text-emerald-400"
                          }>{r.type === "form" ? "◆" : r.type === "playbook" ? "◉" : "▲"}</span>
                          {r.id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-500 text-[10px] mb-1">Remarks</label>
                  <textarea
                    rows={3}
                    value={editFields.remarks === "—" ? "" : (editFields.remarks ?? "")}
                    onChange={(e) => setField("remarks", e.target.value)}
                    placeholder="Internal notes…"
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-gray-800 shrink-0">
              <div className="flex items-center gap-2">
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
                  onClick={handleDiscard}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-60"
                >
                  Discard
                </button>
              </div>
              {saveMsg === "error" && (
                <p className="text-xs text-red-400 mt-2">Save failed — check your connection and try again.</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
