"use client";
import { useState, useRef } from "react";
import { X, UploadCloud, AlertCircle, CheckCircle, Download } from "lucide-react";
import type { PortfolioItem, ItemStatus } from "./types";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let inQuotes = false, current = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } else { inQuotes = !inQuotes; } }
      else if (ch === "," && !inQuotes) { row.push(current.trim()); current = ""; }
      else { current += ch; }
    }
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

function toStatus(val: string): ItemStatus {
  const v = val.toLowerCase().trim();
  if (v === "done" || v === "completed" || v === "complete") return "done";
  if (v === "in_progress" || v === "in progress") return "in_progress";
  if (v === "review" || v === "in review" || v === "in_review") return "review";
  if (v === "blocked") return "blocked";
  if (v === "on_hold" || v === "on hold") return "on_hold";
  if (v === "to do" || v === "todo" || v === "not_started" || v === "not started") return "not_started";
  if (v === "tbd" || v === "t.b.d" || v === "to be decided" || v === "to be determined") return "tbd";
  if (v === "na" || v === "n/a" || v === "not applicable" || v === "not_applicable" || v === "") return "not_applicable";
  return "not_started";
}

function parseDate(val: string): Date | null {
  const v = val?.trim();
  if (!v || v.toLowerCase() === "na") return null;
  const dmy = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]));
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function csvToItems(rows: string[][]): PortfolioItem[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.toLowerCase().trim());
  const get = (row: string[], col: string) => { const i = headers.indexOf(col); return i >= 0 ? (row[i] ?? "").trim() : ""; };
  return rows.slice(1).filter(r => r.some(c => c.trim())).map((row, idx) => {
    const category = get(row, "product category") || "General";
    const projectId = `proj-${category.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
    const slNo = get(row, "sl no") || String(idx + 1);
    const reqId = get(row, "form req id") || `REQ-${slNo.padStart(3, "0")}`;
    return {
      slNo, id: reqId, name: get(row, "epic"), projectId, productCategory: category,
      status: { backend: toStatus(get(row, "backend status")), frontend: toStatus(get(row, "frontend status")), qa: toStatus(get(row, "qa status")) },
      dueDate: parseDate(get(row, "planned release date")) ?? parseDate(get(row, "backend planned completion date")) ?? new Date(),
      assignee: "", assigneeId: "",
      blockers: get(row, "blocker").split(",").map(s => s.trim()).filter(s => s && !["na", "n/a", "none", "tbd"].includes(s.toLowerCase())),
      createdDate: new Date(),
      completedDate: parseDate(get(row, "actual release date")) ?? undefined,
      backendOwner: get(row, "backend owner") || undefined,
      backendTicket: get(row, "backend ticket") || undefined,
      backendStartDate: parseDate(get(row, "backend start date")) ?? undefined,
      backendPlannedCompletionDate: parseDate(get(row, "backend planned completion date")) ?? undefined,
      backendStoryPoints: parseInt(get(row, "backend story points")) || undefined,
      frontendOwner: get(row, "frontend owner") || undefined,
      frontendTicket: get(row, "frontend ticket") || undefined,
      frontendStartDate: parseDate(get(row, "frontend start date")) ?? undefined,
      frontendPlannedCompletionDate: parseDate(get(row, "frontend planned completion date")) ?? undefined,
      frontendStoryPoints: parseInt(get(row, "frontend story points")) || undefined,
      qaOwner: get(row, "qa owner") || undefined,
      qaTicket: get(row, "qa ticket") || undefined,
      qaStartDate: parseDate(get(row, "qa start date")) ?? undefined,
      qaPlannedCompletionDate: parseDate(get(row, "qa planned completion date")) ?? undefined,
      qaStoryPoints: parseInt(get(row, "qa story points")) || undefined,
      overallStatus: toStatus(get(row, "overall status")),
      docLink: get(row, "doc link(s)") || undefined,
    } satisfies PortfolioItem;
  });
}

const REQUIRED_COLS = ["sl no", "backend status", "frontend status", "qa status"];

interface CSVUploadProps {
  onClose: () => void;
  onUpload: (items: PortfolioItem[]) => void;
  currentItems: PortfolioItem[];
}

export default function CSVUpload({ onClose, onUpload, currentItems }: CSVUploadProps) {
  const [step, setStep] = useState<"select" | "preview" | "confirm">("select");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [parsedItems, setParsedItems] = useState<PortfolioItem[]>([]);
  const [missingDates, setMissingDates] = useState(0);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const [hasRequiredCols, setHasRequiredCols] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      const rows = parseCSV(text);
      setParsedRows(rows);
      if (rows.length > 1) {
        const headers = rows[0].map(h => h.toLowerCase().trim());
        setHasRequiredCols(REQUIRED_COLS.every(c => headers.includes(c)));
        const dataRows = rows.slice(1).filter(r => r.some(c => c.trim()));
        setMissingDates(dataRows.filter(r => !r[headers.indexOf("planned release date")]?.trim()).length);
        const slNos = dataRows.map(r => r[headers.indexOf("sl no")]?.trim()).filter(Boolean);
        setHasDuplicates(new Set(slNos).size !== slNos.length);
        setParsedItems(csvToItems(rows));
      }
    };
    reader.readAsText(file);
  };

  const handleFile = (file: File) => { if (file.name.endsWith(".csv")) { setUploadedFile(file); processFile(file); } };

  const totalItems = parsedItems.length;
  const updatedCount = parsedItems.filter(i => currentItems.some(c => c.slNo && c.slNo === i.slNo)).length;
  const newCount = totalItems - updatedCount;
  const retainedCount = currentItems.filter(c => c.slNo && !parsedItems.some(i => i.slNo === c.slNo)).length;

  const previewRows = parsedRows.length > 1 ? parsedRows.slice(1).filter(r => r.some(c => c.trim())).slice(0, 5) : [];
  const getCell = (row: string[], col: string) => {
    if (!parsedRows.length) return "";
    const h = parsedRows[0].map(x => x.toLowerCase().trim());
    const i = h.indexOf(col.toLowerCase());
    return i >= 0 ? (row[i] ?? "") : "";
  };

  return (
    <div className="fixed inset-0 bg-[var(--overlay-modal)] backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-[560px] max-w-[90vw] bg-surface-card border border-neutral-200 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-7 py-6 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-fg-primary">Upload Sprint Data</h2>
            <p className="text-fg-secondary text-sm mt-1">Upload using the standardized CSV template</p>
            <button onClick={downloadSample} className="mt-2 text-brand-500 text-xs flex items-center gap-1 hover:text-brand-600 transition-colors">
              <Download size={12} /> Download Sample Template
            </button>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center text-fg-secondary hover:text-fg-primary hover:bg-neutral-100 transition-colors ml-3 shrink-0">
            <X size={18} />
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />

        {/* Body */}
        <div className="p-7 flex flex-col gap-5 flex-1 overflow-auto">
          {step === "select" && (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={e => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[200px] cursor-pointer transition-colors ${uploadedFile ? "border-success-300 bg-success-25" : "border-neutral-300 bg-neutral-50 hover:border-brand-400 hover:bg-brand-25"}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${uploadedFile ? "bg-success-100" : "bg-brand-100"}`}>
                  {uploadedFile ? <CheckCircle size={26} className="text-success-600" /> : <UploadCloud size={26} className="text-brand-500" />}
                </div>
                {uploadedFile ? (
                  <>
                    <p className="text-lg font-semibold text-success-600">✓ File Selected</p>
                    <p className="text-fg-secondary text-sm mt-1">{uploadedFile.name}</p>
                    <p className="text-fg-secondary text-xs mt-2">Click again to choose a different file</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-fg-primary">Drag & drop your CSV</p>
                    <p className="text-fg-secondary text-sm mt-1">or click to browse</p>
                    <p className="text-fg-secondary text-xs mt-2">Max 5MB · CSV only</p>
                  </>
                )}
              </div>

              <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-fg-primary mb-3">Expected Columns</p>
                <div className="flex flex-wrap gap-2">
                  {["Sl No", "Form Req Id", "Epic", "Product Category", "Backend Status", "Frontend Status", "QA Status", "Overall Status", "Planned Release Date", "Blocker", "Backend Owner", "Frontend Owner", "QA Owner", "Backend Ticket", "Frontend Ticket", "QA Ticket", "Doc Link(s)"].map(col => (
                    <span key={col} className="px-2.5 py-1 rounded-pill bg-surface-card border border-neutral-300 text-xs text-fg-secondary">{col}</span>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === "preview" && (
            <>
              <p className="text-sm font-semibold text-fg-primary">Preview — first {previewRows.length} of {totalItems} rows</p>
              <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-200">
                      {["Form Req Id", "Epic", "Product Category", "Backend", "Frontend", "QA", "Release Date"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left font-semibold text-fg-secondary whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-neutral-200">
                        <td className="px-3 py-2.5 text-brand-500 font-medium">{getCell(row, "form req id")}</td>
                        <td className="px-3 py-2.5 text-fg-primary max-w-32 overflow-hidden text-ellipsis whitespace-nowrap">{getCell(row, "epic")}</td>
                        <td className="px-3 py-2.5 text-fg-secondary whitespace-nowrap">{getCell(row, "product category")}</td>
                        {["backend status", "frontend status", "qa status"].map(col => {
                          const v = getCell(row, col).toLowerCase();
                          const c = v === "done" ? "text-success-600 bg-success-50" : v.includes("progress") ? "text-brand-600 bg-brand-50" : v === "blocked" ? "text-error-600 bg-error-50" : "text-fg-secondary bg-neutral-100";
                          return <td key={col} className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-medium ${c}`}>{getCell(row, col) || "—"}</span></td>;
                        })}
                        <td className="px-3 py-2.5 text-fg-secondary whitespace-nowrap">{getCell(row, "planned release date") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-2">
                <Check ok={hasRequiredCols} text={hasRequiredCols ? "Required columns present" : "Missing required columns (Sl No, Backend/Frontend/QA Status)"} />
                <Check ok={!hasDuplicates} text={!hasDuplicates ? "No duplicate IDs" : "Duplicate IDs detected — last occurrence wins"} warn={hasDuplicates} />
                {missingDates > 0 && <Check ok={false} text={`${missingDates} item${missingDates > 1 ? "s" : ""} missing Release Date — will default to today`} warn />}
              </div>
            </>
          )}

          {step === "confirm" && (
            <>
              <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-fg-primary mb-1">Upload Summary</p>
                <p className="text-success-600 text-sm">✦ <strong>{newCount}</strong> new item{newCount !== 1 ? "s" : ""} will be added</p>
                <p className="text-brand-600 text-sm">✎ <strong>{updatedCount}</strong> existing item{updatedCount !== 1 ? "s" : ""} will be updated</p>
                <p className="text-fg-secondary text-sm">⟳ <strong>{retainedCount}</strong> item{retainedCount !== 1 ? "s" : ""} not in this file will be retained</p>
              </div>
              <Alert variant="brand" title="ℹ Merge behaviour">
                Items matched by <strong>Sl No</strong>. Items not in this CSV are preserved — nothing is deleted.
              </Alert>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-neutral-200 flex justify-end gap-3">
          {step === "select" && (
            <Button variant="primary" disabled={!uploadedFile} onClick={() => uploadedFile && setStep("preview")}>
              <UploadCloud size={15} /> Upload CSV
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="neutral" onClick={() => setStep("select")}>← Back</Button>
              <Button variant="primary" disabled={!hasRequiredCols} onClick={() => setStep("confirm")}>Continue →</Button>
            </>
          )}
          {step === "confirm" && (
            <>
              <Button variant="neutral" onClick={() => setStep("preview")}>← Back</Button>
              <Button variant="success" onClick={() => onUpload(parsedItems)}>Confirm Upload ✓</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Check({ ok, text, warn }: { ok: boolean; text: string; warn?: boolean }) {
  const Icon = ok ? CheckCircle : AlertCircle;
  const color = ok ? "text-success-600" : warn ? "text-warning-600" : "text-error-600";
  return (
    <div className={`flex items-start gap-2 text-sm font-medium ${color}`}>
      <Icon size={16} className="shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  );
}

function downloadSample() {
  const headers = ["Sl No","Form Req Id","Epic","Product Category","Backend Start Date","Backend Story Points","Backend Planned Completion Date","Backend Owner","Backend Status","Backend Ticket","Frontend Start Date","Frontend Story Points","Frontend Planned Completion Date","Frontend Owner","Frontend Status","Frontend Ticket","QA Start Date","QA Story Points","QA Planned Completion Date","QA Owner","QA Status","QA Ticket","Overall Status","Blocker","Planned Release Date","Actual Release Date","Doc Link(s)"];
  const rows = [["1","REQ-001","Backend Auth","Authentication","2026-04-12","8","2026-05-07","John Doe","done","JIRA-001","2026-04-14","5","2026-05-09","Mike Johnson","done","JIRA-002","2026-05-02","3","2026-05-11","Dave Wilson","done","JIRA-003","done","","2026-05-10","2026-05-10",""]];
  const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "portfolio-template.csv";
  a.click();
}
