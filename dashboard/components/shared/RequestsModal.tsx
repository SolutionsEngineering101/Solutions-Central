"use client";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface SegmentRequest {
  submittedAt: string;
  status: string;
  frontmatter: Record<string, unknown>;
  content: string;
  // Optional context shown in the row subtitle instead of department —
  // e.g. why a request is flagged in the Action Required notification.
  reason?: string;
}

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

export function RequestsModal({
  title,
  color,
  requests,
  initialDetail = null,
  onClose,
}: {
  title: string;
  color: string;
  requests: SegmentRequest[];
  initialDetail?: SegmentRequest | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<SegmentRequest | null>(initialDetail);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (detail) setDetail(null);
      else onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [detail, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-modal)] backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-card border border-neutral-200 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 shrink-0">
          {detail ? (
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
              <span className="text-xs font-medium text-fg-secondary tabular-nums">{requests.length}</span>
            </div>
          )}
          <button onClick={onClose} aria-label="Close" className="text-fg-secondary hover:text-fg-primary text-xl leading-none transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto">
          {detail ? (
            <RequestDetail request={detail} />
          ) : requests.length === 0 ? (
            <p className="text-sm text-fg-secondary text-center py-8">No requests in this segment.</p>
          ) : (
            <div className="p-2">
              {requests.map((r, i) => {
                const formId = get(r.frontmatter, "form_id");
                const client = get(r.frontmatter, "client", "client_name");
                const subtitle = r.reason || get(r.frontmatter, "department");
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDetail(r)}
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
      </div>
    </div>
  );
}
