"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, ExternalLink, Plus, Pencil, X, Check, AlertCircle, Loader2 } from "lucide-react";

interface TableData {
  headers: string[];
  rows: string[][];
}

interface PageData {
  id: string;
  title: string;
  version: number;
  url: string;
  table: TableData;
}

function StatusBadge({ text }: { text: string }) {
  const lower = text.toLowerCase();
  const style =
    lower.includes("done") || lower.includes("complete") || lower.includes("closed")
      ? "bg-success-50 text-success-600 border-success-200"
      : lower.includes("progress") || lower.includes("active") || lower.includes("ongoing")
      ? "bg-brand-50 text-brand-600 border-brand-200"
      : lower.includes("block") || lower.includes("hold") || lower.includes("risk")
      ? "bg-error-50 text-error-600 border-error-200"
      : lower.includes("review") || lower.includes("pending")
      ? "bg-warning-50 text-warning-600 border-warning-200"
      : "bg-neutral-100 text-neutral-600 border-neutral-200";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-pill text-xs font-medium border ${style}`}>
      {text}
    </span>
  );
}

function isStatusCol(header: string) {
  return /status|state|phase/i.test(header);
}

export function ConfluenceViewer() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editRowIdx, setEditRowIdx] = useState<number | null>(null);
  const [editCells, setEditCells] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCells, setNewCells] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/confluence");
      const json = await res.json() as PageData & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setData(json);
      setNewCells(Array(json.table.headers.length).fill(""));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSave = async (action: "append_row" | "edit_row", cells: string[], rowIndex?: number) => {
    setSaving(true);
    try {
      const res = await fetch("/api/confluence", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, cells, rowIndex }),
      });
      const json = await res.json() as { ok?: boolean; table?: TableData; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setData(prev => prev ? { ...prev, version: (json as { ok: boolean; version: number; table: TableData }).version, table: json.table! } : prev);
      setEditRowIdx(null);
      setShowAddForm(false);
      setNewCells(Array(data?.table.headers.length ?? 0).fill(""));
      flash(action === "append_row" ? "Row added to Confluence" : "Row updated in Confluence");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (rowIdx: number) => {
    setEditRowIdx(rowIdx);
    setEditCells([...(data?.table.rows[rowIdx] ?? [])]);
    setShowAddForm(false);
  };

  // Hooks must be before all early returns
  const visibleColIndices = useMemo(() => {
    if (!data) return [];
    return data.table.headers.map((_, ci) => ci).filter(ci =>
      data.table.rows.some(row => (row[ci] ?? "").trim() !== "")
    );
  }, [data]);

  const visibleRows = useMemo(() => {
    if (!data) return [];
    return data.table.rows
      .map((row, ri) => ({ row, ri }))
      .filter(({ row }) => row.some(cell => (cell ?? "").trim() !== ""));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-fg-secondary">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading Confluence page…</span>
      </div>
    );
  }

  if (error) {
    const isConfig = error.includes("not configured");
    return (
      <div className="bg-surface-card border border-error-200 rounded-xl shadow-sm p-6 max-w-xl">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-error-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-error-600 font-semibold text-sm mb-1">
              {isConfig ? "Confluence not configured" : "Failed to load page"}
            </p>
            {isConfig ? (
              <div className="text-fg-secondary text-sm space-y-2">
                <p>Add these to your <code className="text-brand-600 bg-neutral-100 px-1 rounded">.env.local</code>:</p>
                <pre className="bg-neutral-100 rounded-lg p-3 text-xs text-fg-primary overflow-x-auto">{`CONFLUENCE_EMAIL=bhargav.nath@vantagecircle.com
CONFLUENCE_API_TOKEN=<from id.atlassian.com/manage-profile/security/api-tokens>
CONFLUENCE_DOMAIN=vantagecirclejira.atlassian.net
CONFLUENCE_PAGE_ID=567050244`}</pre>
                <p className="text-fg-secondary/70 text-xs">Then restart the dev server.</p>
              </div>
            ) : (
              <p className="text-fg-secondary text-sm">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { table, url, title, version } = data;
  const hasTable = table.headers.length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-fg-primary text-2xl font-semibold">{title}</h1>
          <p className="text-fg-secondary text-sm mt-1">
            {visibleRows.length} rows · v{version} · Synced from Confluence
          </p>
        </div>
        <div className="flex items-center gap-2">
          {successMsg && (
            <span className="text-success-600 text-sm flex items-center gap-1">
              <Check size={14} /> {successMsg}
            </span>
          )}
          <button
            onClick={fetchPage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-fg-secondary hover:text-fg-primary text-sm transition-colors duration-200 ease-in-out"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-fg-secondary hover:text-fg-primary text-sm transition-colors duration-200 ease-in-out"
          >
            <ExternalLink size={14} /> Open in Confluence
          </a>
          <button
            onClick={() => { setShowAddForm(true); setEditRowIdx(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors duration-200 ease-in-out"
          >
            <Plus size={14} /> Add Row
          </button>
        </div>
      </div>

      {/* Add Row Form */}
      {showAddForm && hasTable && (
        <div className="bg-surface-card border border-brand-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-fg-primary font-semibold text-sm">New Row</h3>
            <button onClick={() => setShowAddForm(false)} className="text-fg-secondary hover:text-fg-primary transition-colors duration-150 ease-in-out">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {visibleColIndices.map(i => (
              <div key={i}>
                <label className="block text-xs text-fg-secondary mb-1">{table.headers[i]}</label>
                <input
                  value={newCells[i] ?? ""}
                  onChange={e => setNewCells(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                  placeholder={table.headers[i]}
                  className="w-full px-3 py-2 bg-surface-card border border-neutral-300 rounded-lg text-sm text-fg-primary placeholder:text-fg-secondary focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)] transition-colors duration-200 ease-in-out"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-fg-secondary hover:text-fg-primary rounded-lg hover:bg-neutral-100 transition-colors duration-200 ease-in-out">
              Cancel
            </button>
            <button
              onClick={() => handleSave("append_row", newCells)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors duration-200 ease-in-out disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Add to Confluence
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!hasTable ? (
        <div className="bg-surface-card border border-dashed border-neutral-300 rounded-xl p-12 text-center">
          <p className="text-fg-secondary text-sm">No table found on this Confluence page.</p>
        </div>
      ) : (
        <div className="bg-surface-card border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-260px)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-surface-card">
                <tr className="border-b border-neutral-200">
                  {visibleColIndices.map(i => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-fg-secondary whitespace-nowrap">
                      {table.headers[i]}
                    </th>
                  ))}
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(({ row, ri }) => (
                  editRowIdx === ri ? (
                    <tr key={ri} className="border-b border-neutral-200 bg-brand-25">
                      {visibleColIndices.map(ci => (
                        <td key={ci} className="px-3 py-2">
                          <input
                            value={editCells[ci] ?? ""}
                            onChange={e => setEditCells(prev => { const n = [...prev]; n[ci] = e.target.value; return n; })}
                            className="w-full min-w-[72px] px-2 py-1 bg-surface-card border border-neutral-300 rounded text-sm text-fg-primary focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)] transition-colors duration-200 ease-in-out"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSave("edit_row", editCells, ri)}
                            disabled={saving}
                            className="p-1 rounded text-success-600 hover:bg-neutral-100 transition-colors duration-200 ease-in-out disabled:opacity-50"
                            title="Save"
                          >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          </button>
                          <button onClick={() => setEditRowIdx(null)} className="p-1 rounded text-fg-secondary hover:text-fg-primary hover:bg-neutral-100 transition-colors duration-200 ease-in-out" title="Cancel">
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={ri} className="border-b border-neutral-200 last:border-0 hover:bg-neutral-100/60 transition-colors duration-200 ease-in-out group">
                      {visibleColIndices.map(ci => (
                        <td key={ci} className="px-4 py-3 text-fg-primary max-w-[240px] truncate">
                          {isStatusCol(table.headers[ci] ?? "") && row[ci]
                            ? <StatusBadge text={row[ci]!} />
                            : /^https?:\/\//i.test(row[ci] ?? "")
                              ? (() => {
                                  let label = row[ci]!;
                                  try {
                                    const parts = new URL(row[ci]!).pathname.split("/").filter(Boolean);
                                    label = parts[parts.length - 1] ?? row[ci]!;
                                  } catch { /* keep full URL */ }
                                  return (
                                    <a
                                      href={row[ci]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-500 text-sm font-medium transition-colors duration-200 ease-in-out group/link"
                                    >
                                      <span>{label}</span>
                                      <ExternalLink size={11} className="shrink-0 opacity-50 group-hover/link:opacity-100 transition-opacity duration-200 ease-in-out" />
                                    </a>
                                  );
                                })()
                              : row[ci] || <span className="text-neutral-300">—</span>}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => startEdit(ri)}
                          className="p-1 rounded text-neutral-400 hover:text-brand-500 hover:bg-neutral-100 transition-colors duration-200 ease-in-out opacity-0 group-hover:opacity-100"
                          title="Edit row"
                        >
                          <Pencil size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
