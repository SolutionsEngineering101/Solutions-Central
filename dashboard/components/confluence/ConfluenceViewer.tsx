"use client";
import { useState, useEffect, useCallback } from "react";
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
      ? "bg-emerald-950 text-emerald-400 border-emerald-800"
      : lower.includes("progress") || lower.includes("active") || lower.includes("ongoing")
      ? "bg-indigo-950 text-indigo-400 border-indigo-800"
      : lower.includes("block") || lower.includes("hold") || lower.includes("risk")
      ? "bg-red-950 text-red-400 border-red-800"
      : lower.includes("review") || lower.includes("pending")
      ? "bg-amber-950 text-amber-400 border-amber-800"
      : "bg-gray-800 text-gray-400 border-gray-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading Confluence page…</span>
      </div>
    );
  }

  if (error) {
    const isConfig = error.includes("not configured");
    return (
      <div className="bg-gray-900 border border-red-900 rounded-xl p-6 max-w-xl">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-red-400 font-semibold text-sm mb-1">
              {isConfig ? "Confluence not configured" : "Failed to load page"}
            </p>
            {isConfig ? (
              <div className="text-gray-400 text-sm space-y-2">
                <p>Add these to your <code className="text-indigo-400 bg-gray-800 px-1 rounded">.env.local</code>:</p>
                <pre className="bg-gray-800 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto">{`CONFLUENCE_EMAIL=bhargav.nath@vantagecircle.com
CONFLUENCE_API_TOKEN=<from id.atlassian.com/manage-profile/security/api-tokens>
CONFLUENCE_DOMAIN=vantagecirclejira.atlassian.net
CONFLUENCE_PAGE_ID=567050244`}</pre>
                <p className="text-gray-500 text-xs">Then restart the dev server.</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{error}</p>
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
          <h1 className="text-white text-2xl font-semibold">{title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {table.rows.length} rows · v{version} · Synced from Confluence
          </p>
        </div>
        <div className="flex items-center gap-2">
          {successMsg && (
            <span className="text-emerald-400 text-sm flex items-center gap-1">
              <Check size={14} /> {successMsg}
            </span>
          )}
          <button
            onClick={fetchPage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <ExternalLink size={14} /> Open in Confluence
          </a>
          <button
            onClick={() => { setShowAddForm(true); setEditRowIdx(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            <Plus size={14} /> Add Row
          </button>
        </div>
      </div>

      {/* Add Row Form */}
      {showAddForm && hasTable && (
        <div className="bg-gray-900 border border-indigo-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">New Row</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {table.headers.map((h, i) => (
              <div key={i}>
                <label className="block text-xs text-gray-500 mb-1">{h}</label>
                <input
                  value={newCells[i] ?? ""}
                  onChange={e => setNewCells(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                  placeholder={h}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => handleSave("append_row", newCells)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Add to Confluence
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!hasTable ? (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">No table found on this Confluence page.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {table.headers.map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  editRowIdx === ri ? (
                    <tr key={ri} className="border-b border-gray-800 bg-indigo-950/30">
                      {editCells.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2">
                          <input
                            value={cell}
                            onChange={e => setEditCells(prev => { const n = [...prev]; n[ci] = e.target.value; return n; })}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSave("edit_row", editCells, ri)}
                            disabled={saving}
                            className="p-1 rounded text-emerald-400 hover:bg-gray-800 transition-colors disabled:opacity-50"
                            title="Save"
                          >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          </button>
                          <button onClick={() => setEditRowIdx(null)} className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-800 transition-colors" title="Cancel">
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={ri} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors group">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-4 py-3 text-gray-300 max-w-[240px] truncate">
                          {isStatusCol(table.headers[ci] ?? "") && cell
                            ? <StatusBadge text={cell} />
                            : cell || <span className="text-gray-700">—</span>}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => startEdit(ri)}
                          className="p-1 rounded text-gray-600 hover:text-indigo-400 hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
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
