"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Layers, Upload, X, FileText, Loader2,
  AlertTriangle, CheckCircle2, UploadCloud, FileSpreadsheet,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

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
    iconBg: "bg-amber-950",
    iconColor: "text-amber-400",
    emptyHint: 'Upload a document, or run "add to playbook" in Claude.',
  },
  blueprint: {
    title: "Blueprints",
    noun: "blueprint",
    nounPlural: "pre-built solutions",
    subtitle: "reusable across clients",
    Icon: Layers,
    iconBg: "bg-emerald-950",
    iconColor: "text-emerald-400",
    emptyHint: "Upload a document, or record a solution as a blueprint from the Pipeline page.",
  },
  rfp: {
    title: "RFPs",
    noun: "RFP",
    nounPlural: "RFPs",
    subtitle: "requests for proposal",
    Icon: FileSpreadsheet,
    iconBg: "bg-blue-950",
    iconColor: "text-blue-400",
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
          <h1 className="text-white text-2xl font-semibold">{cfg.title}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {sorted.length} {sorted.length === 1 ? cfg.noun : cfg.nounPlural} — {cfg.subtitle}
          </p>
        </div>
        <button
          onClick={() => setStep("pick")}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          <Upload size={15} />
          Upload document
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sorted.map((entry) => {
          const fm = entry.frontmatter as Record<string, string | string[]>;
          const title = str(fm.title) || entry.path.split("/").pop()!;
          const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : [];
          return (
            <button
              key={entry.path}
              onClick={() => setViewing(entry)}
              className="text-left bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 ${cfg.iconBg} rounded-lg flex items-center justify-center shrink-0 mt-0.5`}>
                  <cfg.Icon size={14} className={cfg.iconColor} />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">{title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{metaLine(kind, entry.frontmatter)}</p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-gray-600 text-xs mt-2 line-clamp-2">{entry.content.slice(0, 120)}…</p>
                </div>
              </div>
            </button>
          );
        })}

        {sorted.length === 0 && (
          <div className="col-span-2 text-center py-16">
            <cfg.Icon size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No {cfg.nounPlural} yet.</p>
            <p className="text-gray-600 text-xs mt-1">{cfg.emptyHint}</p>
          </div>
        )}
      </div>

      {/* ── View panel — shows the document as is ─────────────────────────── */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setViewing(null)} />
          <div className="relative w-full max-w-2xl h-full bg-gray-950 border-l border-gray-800 overflow-y-auto">
            <div className="sticky top-0 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white font-semibold">
                  {str(viewing.frontmatter.title) || viewing.path.split("/").pop()}
                </p>
                <p className="text-gray-500 text-xs mt-0.5 truncate">{viewing.path}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-500 hover:text-white shrink-0">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              {metaLine(kind, viewing.frontmatter) && (
                <p className="text-gray-500 text-xs mb-4">{metaLine(kind, viewing.frontmatter)}</p>
              )}
              <pre className="whitespace-pre-wrap break-words text-gray-300 text-sm leading-relaxed font-sans">
                {viewing.content.trim()}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload modal ───────────────────────────────────────────────────── */}
      {step !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={step === "uploading" ? undefined : resetUpload} />
          <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6">

            {/* Step 1 — pick a file */}
            {step === "pick" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <UploadCloud size={18} className="text-indigo-400" />
                  <h2 className="text-white font-semibold">Upload to {cfg.title}</h2>
                </div>
                <p className="text-gray-500 text-xs mb-4">
                  Choose a Markdown or text document. It will be saved to the {cfg.title} and committed to GitHub.
                </p>

                <label className="block border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-xl px-4 py-8 text-center cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept={kind === "rfp" ? ACCEPT_RFP : ACCEPT}
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0])}
                  />
                  {kind === "rfp"
                    ? <FileSpreadsheet size={22} className="text-gray-500 mx-auto mb-2" />
                    : <FileText size={22} className="text-gray-500 mx-auto mb-2" />}
                  {fileName ? (
                    <p className="text-gray-200 text-sm">{fileName}</p>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      {kind === "rfp" ? "Click to choose a file (.xlsx, .xls)" : "Click to choose a file (.md, .markdown, .txt)"}
                    </p>
                  )}
                </label>

                {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={resetUpload} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button
                    disabled={!fileText}
                    onClick={() => setStep("confirm")}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* Step 2 — "are you sure?" confirmation */}
            {(step === "confirm" || step === "uploading") && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={18} className="text-amber-400" />
                  <h2 className="text-white font-semibold">Are you sure?</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Upload <span className="text-white font-medium">{fileName}</span> to the {cfg.title}? It will be
                  committed to GitHub and visible to the whole team. This appears on this page immediately.
                </p>

                {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setError(null); setStep("pick"); }}
                    disabled={step === "uploading"}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={doUpload}
                    disabled={step === "uploading"}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white transition-colors"
                  >
                    {step === "uploading" && <Loader2 size={14} className="animate-spin" />}
                    {step === "uploading" ? "Uploading…" : "Yes, upload"}
                  </button>
                </div>
              </>
            )}

            {/* Step 3 — done */}
            {step === "done" && (
              <div className="text-center py-4">
                <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
                <h2 className="text-white font-semibold">Uploaded</h2>
                <p className="text-gray-400 text-sm mt-1 mb-5">
                  <span className="text-white">{fileName}</span> was committed to GitHub and added to the {cfg.title}.
                </p>
                <button
                  onClick={resetUpload}
                  className="px-5 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
