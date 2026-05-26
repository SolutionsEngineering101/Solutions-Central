"use client";
import { useState, useCallback } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import type { Project, PortfolioItem } from "./types";
import { StatusBadge } from "./StatusBadge";
import { InlineStatusEditor } from "./InlineStatusEditor";
import { calculateItemHealthScore, calculateRealVelocityTrend } from "./utils/healthScoring";
import { formatDate } from "./utils/dateUtils";

interface ProjectDetailProps {
  projects: Project[];
  allItems: PortfolioItem[];
  onBack: () => void;
  onDeleteItem: (slNo: string) => void;
  onDeleteItems: (slNos: string[]) => void;
  initialAtRiskFilter?: boolean;
}

const COLS = [
  { key: "slNo",     label: "Project ID", defaultWidth: 90  },
  { key: "reqId",    label: "Req ID",     defaultWidth: 110 },
  { key: "epic",     label: "Epic",       defaultWidth: 220 },
  { key: "project",  label: "Project",    defaultWidth: 190 },
  { key: "backend",  label: "Backend",    defaultWidth: 130 },
  { key: "frontend", label: "Frontend",   defaultWidth: 130 },
  { key: "qa",       label: "QA",         defaultWidth: 110 },
  { key: "overall",  label: "Overall",    defaultWidth: 130 },
  { key: "dueDate",  label: "Due Date",   defaultWidth: 100 },
];

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">{children}</div>;
}

export function ProjectDetail({ projects, onDeleteItem, onDeleteItems, initialAtRiskFilter = false }: ProjectDetailProps) {
  const [editingItem, setEditingItem] = useState<{ itemId: string; layer: string } | null>(null);
  const [detailsItem, setDetailsItem] = useState<PortfolioItem | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<PortfolioItem | null>(null);
  const [atRiskOnly, setAtRiskOnly] = useState(initialAtRiskFilter);
  const [selectedSlNos, setSelectedSlNos] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => Object.fromEntries(COLS.map(c => [c.key, c.defaultWidth])));

  const startResize = useCallback((colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colKey];
    const onMove = (me: MouseEvent) => setColWidths(prev => ({ ...prev, [colKey]: Math.max(60, startWidth + me.clientX - startX) }));
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [colWidths]);

  const allItems = projects.flatMap(p => p.items);
  const velocityTrend = calculateRealVelocityTrend(allItems);
  const allRows = [...allItems].sort((a, b) => parseInt(a.slNo ?? "0") - parseInt(b.slNo ?? "0"));
  const visibleRows = atRiskOnly ? allRows.filter(i => calculateItemHealthScore(i, allItems, velocityTrend).overallScore < 80) : allRows;

  const selectableSlNos = visibleRows.map(r => r.slNo).filter(Boolean) as string[];
  const allSelected = selectableSlNos.length > 0 && selectableSlNos.every(s => selectedSlNos.has(s));
  const someSelected = selectableSlNos.some(s => selectedSlNos.has(s));
  const toggleSelectAll = () => setSelectedSlNos(allSelected ? new Set() : new Set(selectableSlNos));
  const toggleSelect = (slNo: string) => setSelectedSlNos(prev => { const n = new Set(prev); n.has(slNo) ? n.delete(slNo) : n.add(slNo); return n; });
  const handleStatusChange = (_itemId: string, _layer: string, _newStatus: unknown) => setEditingItem(null);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-semibold">Project Details</h1>
          <p className="text-gray-400 text-sm mt-1">
            {visibleRows.length}{atRiskOnly ? " at-risk" : ""} item{visibleRows.length !== 1 ? "s" : ""}
            {!atRiskOnly ? ` across ${projects.length} project${projects.length !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <button
          onClick={() => setAtRiskOnly(v => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-semibold ${atRiskOnly ? "border-red-800 bg-red-950/50 text-red-400" : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"}`}
        >
          <div className={`w-9 h-5 rounded-full relative transition-colors ${atRiskOnly ? "bg-red-600" : "bg-gray-700"}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${atRiskOnly ? "left-[18px]" : "left-0.5"}`} />
          </div>
          At-Risk Only
        </button>
      </div>

      <Card>
        {someSelected && (
          <div className="flex items-center justify-between px-4 py-2.5 mb-3 rounded-lg bg-indigo-950/50 border border-indigo-800">
            <span className="text-sm font-semibold text-indigo-300">{selectedSlNos.size} item{selectedSlNos.size !== 1 ? "s" : ""} selected</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedSlNos(new Set())} className="px-3 py-1.5 rounded border border-indigo-700 bg-indigo-950 text-indigo-300 text-xs font-semibold hover:bg-indigo-900 transition-colors">Clear</button>
              <button onClick={() => setConfirmBulkDelete(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded border-none bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors">
                <Trash2 size={12} /> Delete {selectedSlNos.size}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table style={{ borderCollapse: "collapse", fontSize: "13px", tableLayout: "fixed", width: `${COLS.reduce((s, c) => s + colWidths[c.key], 40 + 56)}px` }}>
            <colgroup>
              <col style={{ width: "40px" }} />
              {COLS.map(c => <col key={c.key} style={{ width: `${colWidths[c.key]}px` }} />)}
              <col style={{ width: "56px" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-800" style={{ background: "#1f2937" }}>
                <th className="p-3 pl-4" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }} onChange={toggleSelectAll} className="w-4 h-4 cursor-pointer accent-indigo-500" />
                </th>
                {COLS.map(c => (
                  <th key={c.key} className="p-3 text-left text-xs font-bold text-gray-500 tracking-widest uppercase whitespace-nowrap relative select-none">
                    {c.label}
                    <div onMouseDown={e => startResize(c.key, e)} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10">
                      <div className="absolute right-0.5 top-[20%] bottom-[20%] w-px bg-gray-700" />
                    </div>
                  </th>
                ))}
                <th className="p-3" style={{ position: "sticky", right: 0, background: "#1f2937", zIndex: 2, boxShadow: "-2px 0 8px rgba(0,0,0,0.3)" }} />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(item => {
                const projectName = projects.find(p => p.id === item.projectId)?.name ?? "";
                const isSelected = item.slNo ? selectedSlNos.has(item.slNo) : false;
                const rowBg = isSelected ? "rgba(79,70,229,0.1)" : "#111827";
                const rowHover = isSelected ? "rgba(79,70,229,0.15)" : "#1f2937";

                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #1f2937", background: rowBg, transition: "background 0.15s", cursor: "pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = rowBg; }}
                    onClick={() => setDetailsItem(item)}
                  >
                    <td className="p-3 pl-4" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => item.slNo && toggleSelect(item.slNo)} className="w-4 h-4 cursor-pointer accent-indigo-500" />
                    </td>
                    <td className="p-3 font-semibold text-white overflow-hidden text-ellipsis whitespace-nowrap">{item.slNo ?? "—"}</td>
                    <td className="p-3 font-semibold text-indigo-400 overflow-hidden text-ellipsis whitespace-nowrap">{item.id}</td>
                    <td className="p-3 text-gray-300 overflow-hidden text-ellipsis whitespace-nowrap" title={item.name}>{item.name}</td>
                    <td className="p-3 overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="text-xs font-medium text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{projectName}</span>
                    </td>
                    <td className="p-3"><StatusBadge status={item.status.backend} editable={false} size="sm" /></td>
                    <td className="p-3"><StatusBadge status={item.status.frontend} editable={false} size="sm" /></td>
                    <td className="p-3"><StatusBadge status={item.status.qa} editable={false} size="sm" /></td>
                    <td className="p-3"><StatusBadge status={item.overallStatus ?? "not_started"} editable={false} size="sm" /></td>
                    <td className="p-3 text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">{formatDate(item.dueDate)}</td>
                    <td className="p-3" style={{ position: "sticky", right: 0, background: isSelected ? "rgba(79,70,229,0.15)" : "#111827", zIndex: 1, boxShadow: "-2px 0 8px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setConfirmDeleteItem(item)} title="Delete"
                        className="w-8 h-8 rounded-lg border border-red-900 bg-red-950/50 text-red-400 flex items-center justify-center hover:bg-red-900/50 hover:border-red-700 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {visibleRows.length === 0 && (
                <tr><td colSpan={COLS.length + 2} className="text-center py-12 text-gray-600 text-sm">No items to show. Upload a CSV to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete single item */}
      {confirmDeleteItem && (
        <Modal onClose={() => setConfirmDeleteItem(null)}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-950 border border-red-800 flex items-center justify-center shrink-0"><Trash2 size={18} className="text-red-400" /></div>
            <div><h3 className="text-white font-bold text-base">Delete item?</h3><p className="text-gray-500 text-xs mt-0.5">This cannot be undone.</p></div>
          </div>
          <div className="bg-gray-800 rounded-lg px-4 py-3 mb-5 border border-gray-700">
            <p className="text-gray-400 text-sm"><strong className="text-white">ID {confirmDeleteItem.slNo ?? confirmDeleteItem.id}:</strong> {confirmDeleteItem.name}</p>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setConfirmDeleteItem(null)} className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-gray-400 text-sm font-semibold hover:bg-gray-800 transition-colors">Cancel</button>
            <button onClick={() => { if (confirmDeleteItem.slNo) onDeleteItem(confirmDeleteItem.slNo); setConfirmDeleteItem(null); }} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">Delete</button>
          </div>
        </Modal>
      )}

      {/* Bulk delete */}
      {confirmBulkDelete && (
        <Modal onClose={() => setConfirmBulkDelete(false)}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-950 border border-red-800 flex items-center justify-center shrink-0"><Trash2 size={18} className="text-red-400" /></div>
            <div><h3 className="text-white font-bold text-base">Delete {selectedSlNos.size} item{selectedSlNos.size !== 1 ? "s" : ""}?</h3><p className="text-gray-500 text-xs mt-0.5">This cannot be undone.</p></div>
          </div>
          <div className="bg-red-950/50 rounded-lg px-4 py-3 mb-5 border border-red-900">
            <p className="text-red-400 text-sm">{selectedSlNos.size} item{selectedSlNos.size !== 1 ? "s" : ""} will be permanently removed.</p>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setConfirmBulkDelete(false)} className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-gray-400 text-sm font-semibold hover:bg-gray-800 transition-colors">Cancel</button>
            <button onClick={() => { onDeleteItems(Array.from(selectedSlNos)); setSelectedSlNos(new Set()); setConfirmBulkDelete(false); }} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">Delete {selectedSlNos.size}</button>
          </div>
        </Modal>
      )}

      {detailsItem && <ItemDetailsModal item={detailsItem} onClose={() => setDetailsItem(null)} />}

      {editingItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-2xl">
            <InlineStatusEditor item={allRows.find(i => i.id === editingItem.itemId)!} layer={editingItem.layer as "backend" | "frontend" | "qa"} onStatusChange={handleStatusChange} onClose={() => setEditingItem(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-7 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ItemDetailsModal({ item, onClose }: { item: PortfolioItem; onClose: () => void }) {
  const health = calculateItemHealthScore(item, [item], 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-3xl bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="px-7 py-6 border-b border-gray-800 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{item.id}: {item.name}</h2>
            {item.productCategory && <p className="text-gray-400 text-sm mt-1">{item.productCategory}</p>}
            <p className="text-gray-600 text-xs mt-1">Added: {formatDate(item.createdDate)}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl ml-3 mt-0.5">✕</button>
        </div>

        <div className="overflow-auto flex-1 p-7">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <SectionTitle>Health & Status</SectionTitle>
              <div className="space-y-2">
                <DetailRow label="Overall Health" value={`${health.overallScore}% (${health.healthLabel})`} valueColor={health.healthColor} />
                <DetailRow label="Backend" value={item.status.backend} />
                <DetailRow label="Frontend" value={item.status.frontend} />
                <DetailRow label="QA" value={item.status.qa} />
              </div>
              <SectionTitle className="mt-6">Timeline</SectionTitle>
              <div className="space-y-2">
                <DetailRow label="Due Date" value={formatDate(item.dueDate)} />
                {item.completedDate && <DetailRow label="Completed" value={formatDate(item.completedDate)} />}
              </div>
            </div>
            <div>
              <SectionTitle>Story Points</SectionTitle>
              <div className="space-y-2">
                <DetailRow label="Backend" value={item.backendStoryPoints?.toString() || "—"} />
                <DetailRow label="Frontend" value={item.frontendStoryPoints?.toString() || "—"} />
                <DetailRow label="QA" value={item.qaStoryPoints?.toString() || "—"} />
              </div>
              <SectionTitle className="mt-6">Assignees</SectionTitle>
              <div className="space-y-2">
                {[{ l: "Backend", n: item.backendOwner }, { l: "Frontend", n: item.frontendOwner }, { l: "QA", n: item.qaOwner }].map(({ l, n }) => (
                  <div key={l} className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs w-16 shrink-0">{l}:</span>
                    {n ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-300">
                          {n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-gray-200">{n}</span>
                      </div>
                    ) : <span className="text-sm text-gray-600">Unassigned</span>}
                  </div>
                ))}
              </div>
              <SectionTitle className="mt-6">Tickets</SectionTitle>
              <div className="space-y-2">
                {[{ l: "Backend", t: item.backendTicket }, { l: "Frontend", t: item.frontendTicket }, { l: "QA", t: item.qaTicket }].map(({ l, t }) => (
                  <div key={l} className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs">{l}:</span>
                    {t ? <a href={t.startsWith("http") ? t : "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400 text-sm font-semibold hover:underline">{t.startsWith("http") ? t.split("/").pop() : t}<ExternalLink size={11} /></a> : <span className="text-gray-600 text-sm">—</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <SectionTitle>Layer Timeline Dates</SectionTitle>
            <div className="grid grid-cols-3 gap-4 mt-3">
              {[
                { label: "Backend", start: item.backendStartDate, end: item.backendPlannedCompletionDate },
                { label: "Frontend", start: item.frontendStartDate, end: item.frontendPlannedCompletionDate },
                { label: "QA", start: item.qaStartDate, end: item.qaPlannedCompletionDate },
              ].map(({ label, start, end }) => (
                <div key={label}>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">{label}</h4>
                  <DetailRow label="Start" value={start ? formatDate(start) : "—"} />
                  <DetailRow label="Planned end" value={end ? formatDate(end) : "—"} />
                </div>
              ))}
            </div>
          </div>

          {item.blockers.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <SectionTitle>Blockers</SectionTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {item.blockers.map(b => <span key={b} className="px-3 py-1 bg-red-950/50 text-red-400 border border-red-900 rounded text-xs font-semibold">{b}</span>)}
              </div>
            </div>
          )}
        </div>

        <div className="px-7 py-4 border-t border-gray-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-gray-400 text-sm font-semibold hover:bg-gray-800 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-xs font-bold uppercase tracking-widest text-gray-600 mb-3 ${className}`}>{children}</h3>;
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center mb-1">
      <span className="text-xs text-gray-500">{label}:</span>
      <span className="text-sm font-semibold text-gray-200" style={valueColor ? { color: valueColor } : {}}>{value}</span>
    </div>
  );
}
