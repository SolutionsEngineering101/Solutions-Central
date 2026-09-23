"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Check, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface SegmentRequest {
  path: string;
  submittedAt: string;
  status: string;
  frontmatter: Record<string, unknown>;
  content: string;
  // Optional context shown in the row subtitle instead of department —
  // e.g. why a request is flagged in the Action Required notification.
  reason?: string;
}

const STATUS_OPTIONS = [
  "Open", "Solution Given Closed", "To Product Closed",
  "Rejected", "No Response Closed", "Pending Update",
];
const COMPLEXITY_OPTIONS = ["Not Set", "Low", "Medium", "High"];

function get(fm: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = fm[k];
    if (v && typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function extractSection(body: string, heading: string): string {
  const re = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
  const m = body.match(re);
  return m ? m[1].trim() : "";
}

function buildEditFields(r: SegmentRequest): Record<string, string> {
  return {
    status:        get(r.frontmatter, "status") || "Open",
    complexity:    get(r.frontmatter, "complexity") || "Not Set",
    solution_spoc: get(r.frontmatter, "solution_spoc"),
    vc_spoc:       get(r.frontmatter, "vc_spoc"),
    dev_sprint:    get(r.frontmatter, "dev_sprint"),
    ticket:        get(r.frontmatter, "ticket"),
    closed_on:     get(r.frontmatter, "closed_on"),
    solution:      extractSection(r.content, "Solution Given"),
    remarks:       extractSection(r.content, "Remarks"),
  };
}

// Field, plus every fallback key it might be stored under across form versions.
const DETAIL_FIELDS: { label: string; keys: string[] }[] = [
  { label: "Department",        keys: ["department"] },
  { label: "Feature",           keys: ["feature_name"] },
  { label: "Complexity",        keys: ["complexity"] },
  { label: "Priority",          keys: ["priority"] },
  { label: "Go-live required",  keys: ["go_live_requirement"] },
  { label: "Go-live date",      keys: ["go_live_date"] },
  { label: "Solution SPOC",     keys: ["solution_spoc"] },
  { label: "VC SPOC",           keys: ["vc_spoc"] },
  { label: "Dev sprint",        keys: ["dev_sprint"] },
  { label: "Ticket",            keys: ["ticket"] },
  { label: "Closed on",         keys: ["closed_on"] },
  { label: "Email",             keys: ["email"] },
];

function RequestDetail({ request }: { request: SegmentRequest }) {
  const fm = request.frontmatter;
  const formId = get(fm, "form_id");
  const client = get(fm, "client", "client_name");
  const submittedBy = get(fm, "submitted_by");
  const subject = extractSection(request.content, "Subject");
  const brief = extractSection(request.content, "Brief") || extractSection(request.content, "Problem Description") || extractSection(request.content, "Problem Statement");
  const solutionGiven = extractSection(request.content, "Solution Given");
  const remarks = extractSection(request.content, "Remarks");

  const fields = DETAIL_FIELDS
    .map(({ label, keys }) => ({ label, value: get(fm, ...keys) }))
    .filter(f => f.value);

  return (
    <div className="p-5 space-y-4">
      <div>
        {formId && <p className="text-brand-500 text-xs font-mono mb-0.5">{formId}</p>}
        <h3 className="text-fg-primary font-semibold text-base leading-tight">{client || "—"}</h3>
        {request.submittedAt && (
          <p className="text-fg-secondary text-xs mt-0.5">
            {formatDate(request.submittedAt)}{submittedBy && ` · ${submittedBy}`}
          </p>
        )}
      </div>

      {(subject || brief) && (
        <div className="space-y-2 border-t border-neutral-200 pt-4">
          {subject && (
            <div>
              <p className="text-fg-secondary text-[10px] uppercase tracking-wide mb-0.5">Subject</p>
              <p className="text-fg-primary text-sm font-medium">{subject}</p>
            </div>
          )}
          {brief && (
            <div>
              <p className="text-fg-secondary text-[10px] uppercase tracking-wide mb-0.5">Description</p>
              <p className="text-fg-secondary text-sm leading-relaxed">{brief}</p>
            </div>
          )}
        </div>
      )}

      {fields.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-neutral-200 pt-4">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <p className="text-fg-secondary text-[10px] uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-fg-primary text-xs leading-snug">{value}</p>
            </div>
          ))}
        </div>
      )}

      {(solutionGiven || remarks) && (
        <div className="space-y-3 border-t border-neutral-200 pt-4">
          {solutionGiven && (
            <div>
              <p className="text-fg-secondary text-[10px] uppercase tracking-wide mb-0.5">Solution Given</p>
              <p className="text-fg-primary text-sm leading-relaxed whitespace-pre-wrap">{solutionGiven}</p>
            </div>
          )}
          {remarks && (
            <div>
              <p className="text-fg-secondary text-[10px] uppercase tracking-wide mb-0.5">Remarks</p>
              <p className="text-fg-secondary text-sm leading-relaxed whitespace-pre-wrap">{remarks}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RequestEditForm({
  fields, onChange,
}: {
  fields: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="p-5 space-y-3.5">
      <div className="flex gap-2.5">
        <div className="flex-1">
          <label className="block text-fg-secondary text-[10px] mb-1">Status</label>
          <select
            value={fields.status}
            onChange={(e) => onChange("status", e.target.value)}
            className="w-full px-2.5 py-1.5 bg-surface-card border border-neutral-300 rounded-lg text-xs text-fg-primary focus:outline-none focus:border-brand-500 transition-colors"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="w-28">
          <label className="block text-fg-secondary text-[10px] mb-1">Complexity</label>
          <select
            value={fields.complexity}
            onChange={(e) => onChange("complexity", e.target.value)}
            className="w-full px-2.5 py-1.5 bg-surface-card border border-neutral-300 rounded-lg text-xs text-fg-primary focus:outline-none focus:border-brand-500 transition-colors"
          >
            {COMPLEXITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {([
        { label: "Solution SPOC", key: "solution_spoc" },
        { label: "VC SPOC",       key: "vc_spoc" },
        { label: "Dev Sprint",    key: "dev_sprint" },
        { label: "Ticket / Link", key: "ticket" },
      ] as const).map(({ label, key }) => (
        <div key={key}>
          <label className="block text-fg-secondary text-[10px] mb-1">{label}</label>
          <input
            type="text"
            value={fields[key] ?? ""}
            onChange={(e) => onChange(key, e.target.value)}
            className="w-full px-3 py-1.5 bg-surface-card border border-neutral-300 rounded-lg text-xs text-fg-primary placeholder:text-fg-secondary focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      ))}

      <div>
        <label className="block text-fg-secondary text-[10px] mb-1">Closed On</label>
        <input
          type="date"
          value={fields.closed_on ?? ""}
          onChange={(e) => onChange("closed_on", e.target.value)}
          className="w-full px-3 py-1.5 bg-surface-card border border-neutral-300 rounded-lg text-xs text-fg-primary focus:outline-none focus:border-brand-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-fg-secondary text-[10px] mb-1">Solution Given</label>
        <textarea
          rows={5}
          value={fields.solution ?? ""}
          onChange={(e) => onChange("solution", e.target.value)}
          placeholder="Describe the solution provided…"
          className="w-full px-3 py-2 bg-surface-card border border-neutral-300 rounded-lg text-xs text-fg-primary placeholder:text-fg-secondary focus:outline-none focus:border-brand-500 transition-colors resize-none"
        />
      </div>

      <div>
        <label className="block text-fg-secondary text-[10px] mb-1">Remarks</label>
        <textarea
          rows={3}
          value={fields.remarks ?? ""}
          onChange={(e) => onChange("remarks", e.target.value)}
          className="w-full px-3 py-2 bg-surface-card border border-neutral-300 rounded-lg text-xs text-fg-primary placeholder:text-fg-secondary focus:outline-none focus:border-brand-500 transition-colors resize-none"
        />
      </div>
    </div>
  );
}

export function RequestsModal({
  title,
  color,
  requests,
  initialDetail = null,
  onClose,
  onSaved,
}: {
  title: string;
  color: string;
  requests: SegmentRequest[];
  initialDetail?: SegmentRequest | null;
  onClose: () => void;
  // Called with the updated request after a successful save, so a caller
  // holding its own copy of the data (a fetched list, or aggregate counts
  // computed from it) can react — this modal's own optimistic update only
  // covers what it renders itself.
  onSaved?: (updated: SegmentRequest) => void;
}) {
  const router = useRouter();
  // Only the edited items are tracked locally — the rest still come straight
  // from the `requests` prop, so external updates to it (e.g. switching the
  // quarter behind this modal) show up without a sync effect.
  const [edits, setEdits] = useState<Record<string, SegmentRequest>>({});
  const localRequests = requests.map((r) => edits[r.path] ?? r);
  const [detail, setDetail] = useState<SegmentRequest | null>(initialDetail);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<"" | "saved" | "error">("");

  function openDetail(r: SegmentRequest) {
    setDetail(r);
    setEditing(false);
    setSaveMsg("");
  }

  function startEdit() {
    if (!detail) return;
    setEditFields(buildEditFields(detail));
    setEditing(true);
    setSaveMsg("");
  }

  async function handleSave() {
    if (!detail) return;
    setIsSaving(true);
    setSaveMsg("");
    try {
      const formId = get(detail.frontmatter, "form_id").replace(/\D/g, "");
      const res = await fetch(`/api/github/forms/${encodeURIComponent(formId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: detail.path, fields: editFields }),
      });
      if (!res.ok) throw new Error();

      const updated: SegmentRequest = {
        ...detail,
        status: editFields.status,
        frontmatter: {
          ...detail.frontmatter,
          status: editFields.status,
          complexity: editFields.complexity,
          solution_spoc: editFields.solution_spoc,
          vc_spoc: editFields.vc_spoc,
          dev_sprint: editFields.dev_sprint,
          ticket: editFields.ticket,
          closed_on: editFields.closed_on,
        },
        content: (() => {
          const withSolution = editFields.solution !== undefined
            ? detail.content.replace(
                /(##\s+Solution Given\s*\n)[\s\S]*?(?=\n##\s|$)/i,
                `$1${editFields.solution}\n`
              )
            : detail.content;
          return editFields.remarks !== undefined
            ? withSolution.replace(
                /(##\s+Remarks\s*\n)[\s\S]*?(?=\n##\s|$)/i,
                `$1${editFields.remarks}\n`
              )
            : withSolution;
        })(),
      };

      setDetail(updated);
      setEdits((prev) => ({ ...prev, [updated.path]: updated }));
      setEditing(false);
      setSaveMsg("saved");
      onSaved?.(updated);
      setTimeout(() => { setSaveMsg(""); router.refresh(); }, 1200);
    } catch {
      setSaveMsg("error");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editing) setEditing(false);
      else if (detail) setDetail(null);
      else onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [detail, editing, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-modal)] backdrop-blur-sm p-4"
      onClick={(e) => { if (!editing && e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-card border border-neutral-200 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 shrink-0">
          {editing ? (
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-fg-secondary hover:text-fg-primary transition-colors"
            >
              <ArrowLeft size={15} /> Cancel
            </button>
          ) : detail ? (
            <button
              onClick={() => setDetail(null)}
              className="flex items-center gap-1.5 text-sm font-medium text-fg-secondary hover:text-fg-primary transition-colors"
            >
              <ArrowLeft size={15} /> Back
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-pill shrink-0" style={{ backgroundColor: color }} />
              <h2 className="text-[length:var(--font-size-lg)] font-semibold text-fg-primary">{title}</h2>
              <span className="text-xs font-medium text-fg-secondary tabular-nums">{localRequests.length}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {detail && !editing && (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-brand-500 border border-brand-200 bg-brand-50 hover:bg-brand-100 transition-colors"
              >
                <Pencil size={12} /> Edit
              </button>
            )}
            <button onClick={onClose} aria-label="Close" className="text-fg-secondary hover:text-fg-primary text-xl leading-none transition-colors">✕</button>
          </div>
        </div>

        <div className="overflow-y-auto">
          {editing && detail ? (
            <RequestEditForm
              fields={editFields}
              onChange={(key, value) => setEditFields((f) => ({ ...f, [key]: value }))}
            />
          ) : detail ? (
            <RequestDetail request={detail} />
          ) : localRequests.length === 0 ? (
            <p className="text-sm text-fg-secondary text-center py-8">No requests in this segment.</p>
          ) : (
            <div className="p-2">
              {localRequests.map((r, i) => {
                const formId = get(r.frontmatter, "form_id");
                const client = get(r.frontmatter, "client", "client_name");
                const subtitle = r.reason || get(r.frontmatter, "department");
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => openDetail(r)}
                    className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors"
                  >
                    <span className="text-xs font-medium text-fg-secondary w-16 shrink-0 tabular-nums">{formId || "—"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-fg-primary truncate">{client || "—"}</p>
                      {subtitle && <p className="text-xs text-fg-secondary truncate">{subtitle}</p>}
                    </div>
                    <span className="text-xs text-fg-secondary shrink-0 tabular-nums">{r.submittedAt ? formatDate(r.submittedAt) : "—"}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {editing && (
          <div className="flex items-center justify-between gap-3 p-4 border-t border-neutral-200 shrink-0">
            <span className={`text-xs font-medium ${saveMsg === "saved" ? "text-[var(--color-success)]" : saveMsg === "error" ? "text-[var(--color-error)]" : "text-fg-secondary"}`}>
              {saveMsg === "saved" ? "Saved" : saveMsg === "error" ? "Failed to save — try again" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-fg-secondary hover:text-fg-primary hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
              >
                {isSaving ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : <><Check size={12} /> Save</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
