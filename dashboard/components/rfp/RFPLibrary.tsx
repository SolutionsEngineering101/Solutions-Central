"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet, Upload, Search, X, Loader2, Check,
  AlertCircle, ChevronDown, ChevronUp, Plus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FormField } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { StatCard } from "@/components/ui/stat-card";

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

// Semantic extension of the same status→variant philosophy used for
// solution requests: amber/pending=warning, in-flight=brand, won=success,
// lost=error, closed=neutral.
const STATUS_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  open:      "warning",
  submitted: "brand",
  won:       "success",
  lost:      "error",
  closed:    "neutral",
};

function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANT[status.toLowerCase()] ?? "neutral";
  return <Badge variant={variant}>{status}</Badge>;
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

  const selectCls = "w-full bg-surface-card border border-neutral-300 rounded-[8px] px-[16px] py-[12px] text-sm text-fg-primary transition-colors duration-200 ease-in-out outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)]";

  return (
    <div className="fixed inset-0 bg-[var(--overlay-modal)] backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-neutral-200 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-fg-primary font-semibold text-sm">Upload RFP</h2>
          <button onClick={onClose} className="text-fg-secondary hover:text-fg-primary transition-colors"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* File picker */}
          <div>
            <Label className="block text-xs mb-1 font-normal">Excel File <span className="text-error-500">*</span></Label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex items-center gap-3 px-4 py-3 border border-dashed rounded-lg cursor-pointer transition-colors
                ${file ? "border-brand-500 bg-brand-50" : "border-neutral-300 hover:border-neutral-400"}`}
            >
              <FileSpreadsheet size={18} className={file ? "text-brand-500" : "text-neutral-400"} />
              <span className={`text-sm truncate ${file ? "text-brand-600" : "text-fg-secondary"}`}>
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
            <FormField className="col-span-2 mb-0">
              <Label>Client Name <span className="text-error-500">*</span></Label>
              <Input value={form.client} onChange={set("client")} placeholder="e.g. Acme Corp" />
            </FormField>
            <FormField className="col-span-2 mb-0">
              <Label>RFP Title</Label>
              <Input value={form.title} onChange={set("title")} placeholder="Leave blank to auto-generate" />
            </FormField>
            <FormField className="mb-0">
              <Label>Date Received</Label>
              <Input type="date" value={form.date_received} onChange={set("date_received")} />
            </FormField>
            <FormField className="mb-0">
              <Label>Submission Deadline</Label>
              <Input type="date" value={form.deadline} onChange={set("deadline")} />
            </FormField>
            <FormField className="mb-0">
              <Label>Status</Label>
              <select value={form.status} onChange={set("status")} className={selectCls}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField className="mb-0">
              <Label>Assigned To</Label>
              <Input value={form.assigned_to} onChange={set("assigned_to")} placeholder="Team member name" />
            </FormField>
            <FormField className="mb-0">
              <Label>Estimated Value</Label>
              <Input value={form.estimated_value} onChange={set("estimated_value")} placeholder="e.g. ₹50L" />
            </FormField>
            <FormField className="mb-0">
              <Label>Tags</Label>
              <Input value={form.tags} onChange={set("tags")} placeholder="enterprise, recognition" />
            </FormField>
          </div>

          {error && (
            <Alert variant="error" icon={<AlertCircle size={14} />}>
              {error}
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-neutral-200">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {saving ? "Uploading…" : "Upload RFP"}
          </Button>
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
          <h1 className="text-fg-primary text-2xl font-semibold">RFPs</h1>
          <p className="text-fg-secondary text-sm mt-1">{kpis.total} requests for proposal</p>
        </div>
        <div className="flex items-center gap-2">
          {success && (
            <span className="flex items-center gap-1 text-success-600 text-sm">
              <Check size={14} /> Uploaded to knowledge base
            </span>
          )}
          <Button variant="primary" onClick={() => setShowUpload(true)}>
            <Plus size={14} /> Upload RFP
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total" value={kpis.total} tone="neutral" />
        <StatCard label="Open" value={kpis.open} tone="warning" />
        <StatCard label="Submitted" value={kpis.submitted} tone="brand" />
        <StatCard label="Won" value={kpis.won} tone="success" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client, title, assignee…"
            className="pl-9 pr-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-secondary hover:text-fg-primary">
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 bg-surface-card border border-neutral-300 rounded-[8px] text-sm text-fg-primary outline-none transition-colors duration-200 ease-in-out focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)]"
        >
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* RFP list */}
      {rfps.length === 0 ? (
        <div className="bg-surface-card border border-dashed border-neutral-300 rounded-xl p-16 text-center">
          <FileSpreadsheet size={32} className="text-neutral-300 mx-auto mb-3" />
          <p className="text-fg-primary font-medium text-sm">
            {search || statusFilter !== "all" ? "No RFPs match your filters" : "No RFPs uploaded yet"}
          </p>
          <p className="text-fg-secondary text-xs mt-1">
            {search || statusFilter !== "all" ? "Clear filters to see all RFPs" : 'Click "Upload RFP" to add the first one'}
          </p>
        </div>
      ) : (
        <div className="bg-surface-card border border-neutral-200 rounded-xl overflow-hidden">
          {rfps.map((rfp, i) => (
            <div key={rfp.path} className={`${i < rfps.length - 1 ? "border-b border-neutral-200" : ""}`}>

              {/* Row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-neutral-100 transition-colors"
                onClick={() => setExpanded(expanded === rfp.path ? null : rfp.path)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-fg-primary text-sm font-medium truncate">{rfp.client}</span>
                    <StatusBadge status={rfp.status} />
                  </div>
                  <p className="text-fg-secondary text-xs truncate">{rfp.title}</p>
                </div>

                <div className="hidden sm:flex items-center gap-6 text-xs text-fg-secondary shrink-0">
                  {rfp.deadline && (
                    <div className="text-right">
                      <p className="text-fg-secondary text-[10px] uppercase tracking-wide">Deadline</p>
                      <p className="text-fg-secondary">{rfp.deadline}</p>
                    </div>
                  )}
                  {rfp.assignedTo && (
                    <div className="text-right">
                      <p className="text-fg-secondary text-[10px] uppercase tracking-wide">Assigned</p>
                      <p className="text-fg-secondary">{rfp.assignedTo.split(" ")[0]}</p>
                    </div>
                  )}
                  {rfp.estimatedValue && (
                    <div className="text-right">
                      <p className="text-fg-secondary text-[10px] uppercase tracking-wide">Value</p>
                      <p className="text-fg-secondary">{rfp.estimatedValue}</p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-fg-secondary text-[10px] uppercase tracking-wide">Received</p>
                    <p className="text-fg-secondary">{rfp.dateReceived}</p>
                  </div>
                </div>

                <div className="text-fg-secondary shrink-0">
                  {expanded === rfp.path ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </div>

              {/* Expanded content */}
              {expanded === rfp.path && (
                <div className="px-5 pb-5 border-t border-neutral-200 bg-neutral-50">
                  {rfp.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap pt-3 mb-3">
                      {rfp.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 rounded text-[11px] text-fg-secondary">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="prose-rfp text-sm text-fg-secondary overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                    {rfp.content || "_No content extracted._"}
                  </div>
                  {rfp.sourceFile && (
                    <p className="mt-3 text-[11px] text-fg-secondary">Source: {rfp.sourceFile}</p>
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
