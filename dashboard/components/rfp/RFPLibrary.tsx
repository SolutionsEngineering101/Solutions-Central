"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet, Upload, Search, X, Loader2, Check,
  AlertCircle, ChevronDown, ChevronUp, Plus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Entry {
  path: string;
  frontmatter: Record<string, unknown>;
  content: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

const STATUS_STYLES: Record<string, string> = {
  open:      "bg-amber-950 text-amber-400 border-amber-800",
  submitted: "bg-indigo-950 text-indigo-400 border-indigo-800",
  won:       "bg-emerald-950 text-emerald-400 border-emerald-800",
  lost:      "bg-red-950 text-red-400 border-red-800",
  closed:    "bg-gray-800 text-gray-400 border-gray-700",
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? STATUS_STYLES.closed;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status}
    </span>
  );
}

const STATUSES = ["Open", "Submitted", "Won", "Lost", "Closed"];

// ─── Upload modal ─────────────────────────────────────────────────────────────

interface UploadModalProps { onClose: () => void; onSuccess: () => void; }

function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    client: "", title: "", date_received: new Date().toISOString().split("T")[0],
    deadline: "", status: "Open", assigned_to: "", estimated_value: "", tags: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!file)         return setError("Please select an Excel file");
    if (!form.client)  return setError("Client name is required");
    setError(null);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const res = await fetch("/api/rfp/upload", { method: "POST", body: fd });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs text-gray-500 mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold text-sm">Upload RFP</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* File picker */}
          <div>
            <label className={labelCls}>Excel File <span className="text-red-500">*</span></label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex items-center gap-3 px-4 py-3 border border-dashed rounded-lg cursor-pointer transition-colors
                ${file ? "border-indigo-600 bg-indigo-950/20" : "border-gray-700 hover:border-gray-500"}`}
            >
              <FileSpreadsheet size={18} className={file ? "text-indigo-400" : "text-gray-600"} />
              <span className={`text-sm truncate ${file ? "text-indigo-300" : "text-gray-500"}`}>
                {file ? file.name : "Click to select .xlsx / .xls file"}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Client Name <span className="text-red-500">*</span></label>
              <input value={form.client} onChange={set("client")} placeholder="e.g. Acme Corp" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>RFP Title</label>
              <input value={form.title} onChange={set("title")} placeholder="Leave blank to auto-generate" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Date Received</label>
              <input type="date" value={form.date_received} onChange={set("date_received")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Submission Deadline</label>
              <input type="date" value={form.deadline} onChange={set("deadline")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={set("status")} className={inputCls}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Assigned To</label>
              <input value={form.assigned_to} onChange={set("assigned_to")} placeholder="Team member name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Estimated Value</label>
              <input value={form.estimated_value} onChange={set("estimated_value")} placeholder="e.g. ₹50L" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tags</label>
              <input value={form.tags} onChange={set("tags")} placeholder="enterprise, recognition" className={inputCls} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/40 border border-red-900/60 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {saving ? "Uploading…" : "Upload RFP"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RFPLibrary({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [showUpload, setShowUpload]= useState(false);
  const [success, setSuccess]     = useState(false);

  const rfps = useMemo(() => {
    let list = entries
      .filter(e => !e.path.endsWith(".gitkeep"))
      .map(e => ({
        path:           e.path,
        title:          str(e.frontmatter.title),
        client:         str(e.frontmatter.client),
        dateReceived:   str(e.frontmatter.date_received),
        deadline:       str(e.frontmatter.deadline),
        status:         str(e.frontmatter.status) || "Open",
        assignedTo:     str(e.frontmatter.assigned_to),
        estimatedValue: str(e.frontmatter.estimated_value),
        tags:           Array.isArray(e.frontmatter.tags) ? (e.frontmatter.tags as string[]) : [],
        sourceFile:     str(e.frontmatter.source_file),
        content:        e.content,
      }))
      .sort((a, b) => b.dateReceived.localeCompare(a.dateReceived));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.client.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.assignedTo.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter(r => r.status.toLowerCase() === statusFilter.toLowerCase());
    }
    return list;
  }, [entries, search, statusFilter]);

  const handleSuccess = () => {
    setShowUpload(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    router.refresh();
  };

  const kpis = useMemo(() => ({
    total:     entries.filter(e => !e.path.endsWith(".gitkeep")).length,
    open:      entries.filter(e => str(e.frontmatter.status).toLowerCase() === "open").length,
    won:       entries.filter(e => str(e.frontmatter.status).toLowerCase() === "won").length,
    submitted: entries.filter(e => str(e.frontmatter.status).toLowerCase() === "submitted").length,
  }), [entries]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white text-2xl font-semibold">RFPs</h1>
          <p className="text-gray-500 text-sm mt-1">{kpis.total} requests for proposal</p>
        </div>
        <div className="flex items-center gap-2">
          {success && (
            <span className="flex items-center gap-1 text-emerald-400 text-sm">
              <Check size={14} /> Uploaded to knowledge base
            </span>
          )}
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus size={14} /> Upload RFP
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total",     value: kpis.total,     color: "#e5e7eb" },
          { label: "Open",      value: kpis.open,      color: "#fbbf24" },
          { label: "Submitted", value: kpis.submitted, color: "#818cf8" },
          { label: "Won",       value: kpis.won,       color: "#34d399" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">{label}</p>
            <p className="text-[34px] font-bold leading-none mt-1" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client, title, assignee…"
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* RFP list */}
      {rfps.length === 0 ? (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-16 text-center">
          <FileSpreadsheet size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium text-sm">
            {search || statusFilter !== "all" ? "No RFPs match your filters" : "No RFPs uploaded yet"}
          </p>
          <p className="text-gray-600 text-xs mt-1">
            {search || statusFilter !== "all" ? "Clear filters to see all RFPs" : 'Click "Upload RFP" to add the first one'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {rfps.map((rfp, i) => (
            <div key={rfp.path} className={`${i < rfps.length - 1 ? "border-b border-gray-800" : ""}`}>

              {/* Row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-800/40 transition-colors"
                onClick={() => setExpanded(expanded === rfp.path ? null : rfp.path)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white text-sm font-medium truncate">{rfp.client}</span>
                    <StatusBadge status={rfp.status} />
                  </div>
                  <p className="text-gray-500 text-xs truncate">{rfp.title}</p>
                </div>

                <div className="hidden sm:flex items-center gap-6 text-xs text-gray-500 shrink-0">
                  {rfp.deadline && (
                    <div className="text-right">
                      <p className="text-gray-600 text-[10px] uppercase tracking-wide">Deadline</p>
                      <p className="text-gray-400">{rfp.deadline}</p>
                    </div>
                  )}
                  {rfp.assignedTo && (
                    <div className="text-right">
                      <p className="text-gray-600 text-[10px] uppercase tracking-wide">Assigned</p>
                      <p className="text-gray-400">{rfp.assignedTo.split(" ")[0]}</p>
                    </div>
                  )}
                  {rfp.estimatedValue && (
                    <div className="text-right">
                      <p className="text-gray-600 text-[10px] uppercase tracking-wide">Value</p>
                      <p className="text-gray-400">{rfp.estimatedValue}</p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-gray-600 text-[10px] uppercase tracking-wide">Received</p>
                    <p className="text-gray-400">{rfp.dateReceived}</p>
                  </div>
                </div>

                <div className="text-gray-600 shrink-0">
                  {expanded === rfp.path ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </div>

              {/* Expanded content */}
              {expanded === rfp.path && (
                <div className="px-5 pb-5 border-t border-gray-800 bg-gray-900/60">
                  {rfp.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap pt-3 mb-3">
                      {rfp.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-[11px] text-gray-400">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="prose-rfp text-sm text-gray-400 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                    {rfp.content || "_No content extracted._"}
                  </div>
                  {rfp.sourceFile && (
                    <p className="mt-3 text-[11px] text-gray-600">Source: {rfp.sourceFile}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={handleSuccess} />}
    </div>
  );
}
