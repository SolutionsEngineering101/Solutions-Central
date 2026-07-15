"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Layers, Upload, X, FileText, Loader2,
  AlertTriangle, CheckCircle2, UploadCloud, FileSpreadsheet, Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Excel → markdown (runs in the browser, no server round-trip) ─────────────

function cleanCell(v: unknown): string {
  // Only normalise whitespace and escape pipe chars — no truncation
  return String(v ?? "").replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
}

async function excelToMarkdown(file: File): Promise<string> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sections: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const allRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }) as unknown[][];

    // Drop entirely empty rows (lossless)
    const rows = allRows.filter(r => r.some(c => String(c).trim() !== ""));
    if (!rows.length) continue;

    // Drop entirely empty columns (lossless)
    const maxCols = Math.max(...rows.map(r => r.length));
    const colIndices = Array.from({ length: maxCols }, (_, ci) => ci)
      .filter(ci => rows.some(r => String(r[ci] ?? "").trim() !== ""));
    if (!colIndices.length) continue;

    sections.push(`### ${sheetName}\n`);

    const header = colIndices.map(ci => cleanCell(rows[0][ci]) || " ");
    sections.push(`| ${header.join(" | ")} |`);
    sections.push(`| ${header.map(() => "---").join(" | ")} |`);

    for (let i = 1; i < rows.length; i++) {
      const cells = colIndices.map(ci => cleanCell(rows[i][ci]));
      sections.push(`| ${cells.join(" | ")} |`);
    }

    sections.push("");
  }

  return sections.join("\n") || "_No content extracted._";
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type EntryKind = "playbook" | "blueprint" | "rfp";

interface Entry {
  path: string;
  frontmatter: Record<string, unknown>;
  content: string;
}

interface Props {
  kind: EntryKind;
  entries: Entry[];
}

// ─── Per-kind presentation ───────────────────────────────────────────────────

const CONFIG = {
  playbook: {
    title: "Playbook",
    noun: "entry",
    nounPlural: "entries",
    subtitle: "team learnings and processes",
    Icon: BookOpen,
    iconBg: "bg-warning-50",
    iconColor: "text-warning-600",
    emptyHint: 'Upload a document, or run "add to playbook" in Claude.',
  },
  blueprint: {
    title: "Blueprints",
    noun: "blueprint",
    nounPlural: "pre-built solutions",
    subtitle: "reusable across clients",
    Icon: Layers,
    iconBg: "bg-success-50",
    iconColor: "text-success-600",
    emptyHint: "Upload a document, or record a solution as a blueprint from the Pipeline page.",
  },
  rfp: {
    title: "RFPs",
    noun: "RFP",
    nounPlural: "RFPs",
    subtitle: "requests for proposal",
    Icon: FileSpreadsheet,
    iconBg: "bg-info-50",
    iconColor: "text-info-600",
    emptyHint: "Upload an Excel file (.xlsx / .xls) to add an RFP.",
  },
} as const;

const ACCEPT = ".md,.markdown,.txt,text/markdown,text/plain";
const ACCEPT_RFP = ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function metaLine(kind: EntryKind, fm: Record<string, unknown>): string {
  if (kind === "playbook") {
    const date = str(fm.date);
    return [str(fm.author), date ? formatDate(date) : ""].filter(Boolean).join(" · ");
  }
  if (kind === "rfp") {
    const date = str(fm.date_received);
    return [str(fm.client), str(fm.status), date ? formatDate(date) : ""].filter(Boolean).join(" · ");
  }
  const date = str(fm.date);
  return [str(fm.domain), str(fm.client_type), date ? formatDate(date) : ""].filter(Boolean).join(" · ");
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function EntryLibrary({ kind, entries }: Props) {
  const cfg = CONFIG[kind];
  const router = useRouter();

  const sorted = [...entries]
    .filter((e) => !e.path.endsWith("README.md"))
    .sort((a, b) => (str(b.frontmatter.date) > str(a.frontmatter.date) ? 1 : -1));

  // Viewing a document
  const [viewing, setViewing] = useState<Entry | null>(null);

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // path
  const [deleting, setDeleting]           = useState(false);

  const doDelete = async (path: string) => {
    setDeleting(true);
    try {
      const res = await fetch("/api/github/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Delete failed");
      setConfirmDelete(null);
      if (viewing?.path === path) setViewing(null);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  // Upload modal state machine: closed → pick → confirm → uploading → done
  const [step, setStep] = useState<"closed" | "pick" | "confirm" | "uploading" | "done">("closed");
  const [fileName, setFileName] = useState("");
  const [fileText, setFileText] = useState("");
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetUpload = () => {
    setStep("closed");
    setFileName("");
    setFileText("");
    setFileObj(null);
    setError(null);
  };

  const onFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (kind === "rfp") {
      setFileName(file.name);
      setStep("pick");
      excelToMarkdown(file).then(text => {
        setFileText(text);
      }).catch(() => setError("Could not parse the Excel file — check it's a valid .xlsx or .xls."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileName(file.name);
      setFileText(String(reader.result ?? ""));
    };
    reader.onerror = () => setError("Could not read that file.");
    reader.readAsText(file);
  };

  const doUpload = async () => {
    setStep("uploading");
    setError(null);
    try {
      const res = await fetch("/api/github/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, filename: fileName, content: fileText }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Upload failed");
      setStep("done");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep("confirm");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-fg-primary text-[length:var(--font-size-2xl)] font-semibold">{cfg.title}</h1>
          <p className="text-fg-secondary text-sm mt-1">
            {sorted.length} {sorted.length === 1 ? cfg.noun : cfg.nounPlural} — {cfg.subtitle}
          </p>
        </div>
        <Button onClick={() => setStep("pick")} className="shrink-0">
          <Upload size={15} />
          Upload document
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sorted.map((entry) => {
          const fm = entry.frontmatter as Record<string, string | string[]>;
          const title = str(fm.title) || entry.path.split("/").pop()!;
          const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : [];
          const isConfirming = confirmDelete === entry.path;

          return (
            <div
              key={entry.path}
              className="relative group bg-surface-card border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-neutral-300 transition-[box-shadow,border-color] duration-200 ease-in-out"
            >
              {/* Delete button — top right, visible on hover */}
              {!isConfirming && (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(entry.path); }}
                  className="absolute top-3 right-3 p-1.5 rounded-md text-neutral-400 hover:text-error-600 hover:bg-neutral-100 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              )}

              {/* Inline delete confirmation */}
              {isConfirming && (
                <div className="absolute inset-0 bg-surface-card/95 rounded-xl flex flex-col items-center justify-center gap-3 z-10 p-4">
                  <p className="text-fg-primary text-sm font-medium text-center">Delete this {cfg.noun}?</p>
                  <p className="text-fg-secondary text-xs text-center">This removes it from GitHub permanently.</p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(null)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => doDelete(entry.path)}
                      disabled={deleting}
                    >
                      {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      {deleting ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Card content */}
              <button
                onClick={() => setViewing(entry)}
                className="text-left w-full"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 ${cfg.iconBg} rounded-lg flex items-center justify-center shrink-0 mt-0.5`}>
                    <cfg.Icon size={14} className={cfg.iconColor} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-fg-primary text-sm font-medium">{title}</p>
                    <p className="text-fg-secondary text-xs mt-0.5">{metaLine(kind, entry.frontmatter)}</p>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-neutral-100 text-fg-secondary text-xs rounded-pill">{t}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-fg-secondary/70 text-xs mt-2 line-clamp-2">{entry.content.slice(0, 120)}…</p>
                  </div>
                </div>
              </button>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="col-span-2 text-center py-16">
            <cfg.Icon size={32} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-fg-secondary text-sm">No {cfg.nounPlural} yet.</p>
            <p className="text-fg-secondary/70 text-xs mt-1">{cfg.emptyHint}</p>
          </div>
        )}
      </div>

      {/* ── View panel — shows the document as is ─────────────────────────── */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-[var(--overlay-modal)]" onClick={() => setViewing(null)} />
          <div className="relative w-full max-w-2xl h-full bg-surface-card border-l border-neutral-200 overflow-y-auto">
            <div className="sticky top-0 bg-surface-card/95 backdrop-blur border-b border-neutral-200 px-6 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-fg-primary font-semibold">
                  {str(viewing.frontmatter.title) || viewing.path.split("/").pop()}
                </p>
                <p className="text-fg-secondary text-xs mt-0.5 truncate">{viewing.path}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-fg-secondary hover:text-fg-primary shrink-0 transition-colors duration-150 ease-in-out">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              {metaLine(kind, viewing.frontmatter) && (
                <p className="text-fg-secondary text-xs mb-4">{metaLine(kind, viewing.frontmatter)}</p>
              )}
              <pre className="whitespace-pre-wrap break-words text-fg-primary text-sm leading-relaxed font-sans">
                {viewing.content.trim()}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload modal ───────────────────────────────────────────────────── */}
      {step !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--overlay-modal)]" onClick={step === "uploading" ? undefined : resetUpload} />
          <div className="relative w-full max-w-md bg-surface-card border border-neutral-200 rounded-2xl shadow-2xl p-6">

            {/* Step 1 — pick a file */}
            {step === "pick" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <UploadCloud size={18} className="text-brand-500" />
                  <h2 className="text-fg-primary font-semibold">Upload to {cfg.title}</h2>
                </div>
                <p className="text-fg-secondary text-xs mb-4">
                  Choose a Markdown or text document. It will be saved to the {cfg.title} and committed to GitHub.
                </p>

                <label className="block border-2 border-dashed border-neutral-300 hover:border-brand-400 rounded-xl px-4 py-8 text-center cursor-pointer transition-colors duration-200 ease-in-out">
                  <input
                    type="file"
                    accept={kind === "rfp" ? ACCEPT_RFP : ACCEPT}
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0])}
                  />
                  {kind === "rfp"
                    ? <FileSpreadsheet size={22} className="text-fg-secondary mx-auto mb-2" />
                    : <FileText size={22} className="text-fg-secondary mx-auto mb-2" />}
                  {fileName ? (
                    <p className="text-fg-primary text-sm">{fileName}</p>
                  ) : (
                    <p className="text-fg-secondary text-sm">
                      {kind === "rfp" ? "Click to choose a file (.xlsx, .xls)" : "Click to choose a file (.md, .markdown, .txt)"}
                    </p>
                  )}
                </label>

                {error && <p className="text-error-600 text-xs mt-3">{error}</p>}

                <div className="flex justify-end gap-2 mt-5">
                  <Button variant="ghost" onClick={resetUpload}>
                    Cancel
                  </Button>
                  <Button disabled={!fileText} onClick={() => setStep("confirm")}>
                    Continue
                  </Button>
                </div>
              </>
            )}

            {/* Step 2 — "are you sure?" confirmation */}
            {(step === "confirm" || step === "uploading") && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={18} className="text-warning-500" />
                  <h2 className="text-fg-primary font-semibold">Are you sure?</h2>
                </div>
                <p className="text-fg-secondary text-sm mb-4">
                  Upload <span className="text-fg-primary font-medium">{fileName}</span> to the {cfg.title}? It will be
                  committed to GitHub and visible to the whole team. This appears on this page immediately.
                </p>

                {error && <p className="text-error-600 text-xs mb-3">{error}</p>}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => { setError(null); setStep("pick"); }}
                    disabled={step === "uploading"}
                  >
                    Back
                  </Button>
                  <Button onClick={doUpload} disabled={step === "uploading"}>
                    {step === "uploading" && <Loader2 size={14} className="animate-spin" />}
                    {step === "uploading" ? "Uploading…" : "Yes, upload"}
                  </Button>
                </div>
              </>
            )}

            {/* Step 3 — done */}
            {step === "done" && (
              <div className="text-center py-4">
                <CheckCircle2 size={40} className="text-success-500 mx-auto mb-3" />
                <h2 className="text-fg-primary font-semibold">Uploaded</h2>
                <p className="text-fg-secondary text-sm mt-1 mb-5">
                  <span className="text-fg-primary">{fileName}</span> was committed to GitHub and added to the {cfg.title}.
                </p>
                <Button onClick={resetUpload}>
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
