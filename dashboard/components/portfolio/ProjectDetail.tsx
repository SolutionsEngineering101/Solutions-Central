"use client";
import { useState, useCallback } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import type { Project, PortfolioItem } from "./types";
import { StatusBadge } from "./StatusBadge";
import { InlineStatusEditor } from "./InlineStatusEditor";
import { calculateItemHealthScore, calculateRealVelocityTrend } from "./utils/healthScoring";
import { formatDate } from "./utils/dateUtils";
import { Button } from "@/components/ui/button";

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
  return <div className="bg-surface-card border border-neutral-200 rounded-xl p-6">{children}</div>;
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
          <h1 className="text-fg-primary text-2xl font-semibold">Project Details</h1>
          <p className="text-fg-secondary text-sm mt-1">
            {visibleRows.length}{atRiskOnly ? " at-risk" : ""} item{visibleRows.length !== 1 ? "s" : ""}
            {!atRiskOnly ? ` across ${projects.length} project${projects.length !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <button
          onClick={() => setAtRiskOnly(v => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-semibold ${atRiskOnly ? "border-error-200 bg-error-50 text-error-600" : "border-neutral-300 bg-surface-card text-fg-secondary hover:border-neutral-400"}`}
        >
          <div className={`w-9 h-5 rounded-pill relative transition-colors ${atRiskOnly ? "bg-[var(--color-error)]" : "bg-neutral-300"}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-pill bg-surface-card shadow transition-all ${atRiskOnly ? "left-[18px]" : "left-0.5"}`} />
          </div>
          At-Risk Only
        </button>
      </div>

      <Card>
        {someSelected && (
          <div className="flex items-center justify-between px-4 py-2.5 mb-3 rounded-lg bg-brand-25 border border-brand-200">
            <span className="text-sm font-semibold text-brand-600">{selectedSlNos.size} item{selectedSlNos.size !== 1 ? "s" : ""} selected</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedSlNos(new Set())}>Clear</Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmBulkDelete(true)}>
                <Trash2 size={12} /> Delete {selectedSlNos.size}
              </Button>
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
              <tr className="border-b border-neutral-200" style={{ background: "var(--neutral-100)" }}>
                <th className="p-3 pl-4" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }} onChange={toggleSelectAll} className="w-4 h-4 cursor-pointer accent-brand-500" />
                </th>
                {COLS.map(c => (
                  <th key={c.key} className="p-3 text-left text-xs font-bold text-fg-secondary tracking-widest uppercase whitespace-nowrap relative select-none">
                    {c.label}
                    <div onMouseDown={e => startResize(c.key, e)} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10">
                      <div className="absolute right-0.5 top-[20%] bottom-[20%] w-px bg-neutral-300" />
                    </div>
                  </th>
                ))}
                <th className="p-3" style={{ position: "sticky", right: 0, background: "var(--neutral-100)", zIndex: 2, boxShadow: "-2px 0 8px rgba(16,24,40,0.08)" }} />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(item => {
                const projectName = projects.find(p => p.id === item.projectId)?.name ?? "";
                const isSelected = item.slNo ? selectedSlNos.has(item.slNo) : false;
                const rowBg = isSelected ? "var(--brand-50)" : "var(--color-white)";
                const rowHover = isSelected ? "var(--brand-100)" : "var(--neutral-100)";

                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--neutral-200)", background: rowBg, transition: "background 0.15s", cursor: "pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = rowBg; }}
                    onClick={() => setDetailsItem(item)}
                  >
                    <td className="p-3 pl-4" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => item.slNo && toggleSelect(item.slNo)} className="w-4 h-4 cursor-pointer accent-brand-500" />
                    </td>
                    <td className="p-3 font-semibold text-fg-primary overflow-hidden text-ellipsis whitespace-nowrap">{item.slNo ?? "—"}</td>
                    <td className="p-3 font-semibold text-brand-500 overflow-hidden text-ellipsis whitespace-nowrap">{item.id}</td>
                    <td className="p-3 text-fg-primary overflow-hidden text-ellipsis whitespace-nowrap" title={item.name}>{item.name}</td>
                    <td className="p-3 overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="text-xs font-medium text-fg-secondary bg-neutral-100 px-2 py-0.5 rounded">{projectName}</span>
                    </td>
                    <td className="p-3"><StatusBadge status={item.status.backend} editable={false} size="sm" /></td>
                    <td className="p-3"><StatusBadge status={item.status.frontend} editable={false} size="sm" /></td>
                    <td className="p-3"><StatusBadge status={item.status.qa} editable={false} size="sm" /></td>
                    <td className="p-3"><StatusBadge status={item.overallStatus ?? "not_started"} editable={false} size="sm" /></td>
                    <td className="p-3 text-fg-secondary whitespace-nowrap overflow-hidden text-ellipsis">{formatDate(item.dueDate)}</td>
                    <td className="p-3" style={{ position: "sticky", right: 0, background: isSelected ? "var(--brand-100)" : "var(--color-white)", zIndex: 1, boxShadow: "-2px 0 8px rgba(16,24,40,0.08)" }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setConfirmDeleteItem(item)} title="Delete"
                        className="w-8 h-8 rounded-lg border border-error-200 bg-error-50 text-error-600 flex items-center justify-center hover:bg-error-100 hover:border-error-300 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {visibleRows.length === 0 && (
                <tr><td colSpan={COLS.length + 2} className="text-center py-12 text-fg-secondary text-sm">No items to show. Upload a CSV to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete single item */}
      {confirmDeleteItem && (
        <Modal onClose={() => setConfirmDeleteItem(null)}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-error-50 border border-error-200 flex items-center justify-center shrink-0"><Trash2 size={18} className="text-error-600" /></div>
            <div><h3 className="text-fg-primary font-bold text-base">Delete item?</h3><p className="text-fg-secondary text-xs mt-0.5">This cannot be undone.</p></div>
          </div>
          <div className="bg-neutral-100 rounded-lg px-4 py-3 mb-5 border border-neutral-200">
            <p className="text-fg-secondary text-sm"><strong className="text-fg-primary">ID {confirmDeleteItem.slNo ?? confirmDeleteItem.id}:</strong> {confirmDeleteItem.name}</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="neutral" onClick={() => setConfirmDeleteItem(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { if (confirmDeleteItem.slNo) onDeleteItem(confirmDeleteItem.slNo); setConfirmDeleteItem(null); }}>Delete</Button>
          </div>
        </Modal>
      )}

      {/* Bulk delete */}
      {confirmBulkDelete && (
        <Modal onClose={() => setConfirmBulkDelete(false)}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-error-50 border border-error-200 flex items-center justify-center shrink-0"><Trash2 size={18} className="text-error-600" /></div>
            <div><h3 className="text-fg-primary font-bold text-base">Delete {selectedSlNos.size} item{selectedSlNos.size !== 1 ? "s" : ""}?</h3><p className="text-fg-secondary text-xs mt-0.5">This cannot be undone.</p></div>
          </div>
          <div className="bg-error-50 rounded-lg px-4 py-3 mb-5 border border-error-200">
            <p className="text-error-600 text-sm">{selectedSlNos.size} item{selectedSlNos.size !== 1 ? "s" : ""} will be permanently removed.</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="neutral" onClick={() => setConfirmBulkDelete(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { onDeleteItems(Array.from(selectedSlNos)); setSelectedSlNos(new Set()); setConfirmBulkDelete(false); }}>Delete {selectedSlNos.size}</Button>
          </div>
        </Modal>
      )}

      {detailsItem && <ItemDetailsModal item={detailsItem} onClose={() => setDetailsItem(null)} />}

      {editingItem && (
        <div className="fixed inset-0 bg-[var(--overlay-modal)] flex items-center justify-center z-50">
          <div className="bg-surface-card border border-neutral-200 rounded-xl p-6 shadow-2xl">
            <InlineStatusEditor item={allRows.find(i => i.id === editingItem.itemId)!} layer={editingItem.layer as "backend" | "frontend" | "qa"} onStatusChange={handleStatusChange} onClose={() => setEditingItem(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-[var(--overlay-modal)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface-card border border-neutral-200 rounded-xl p-7 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ItemDetailsModal({ item, onClose }: { item: PortfolioItem; onClose: () => void }) {
  const health = calculateItemHealthScore(item, [item], 0);

  return (
    <div className="fixed inset-0 bg-[var(--overlay-modal)] backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-3xl bg-surface-card border border-neutral-200 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="px-7 py-6 border-b border-neutral-200 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-fg-primary">{item.id}: {item.name}</h2>
            {item.productCategory && <p className="text-fg-secondary text-sm mt-1">{item.productCategory}</p>}
            <p className="text-fg-secondary text-xs mt-1">Added: {formatDate(item.createdDate)}</p>
          </div>
          <button onClick={onClose} className="text-fg-secondary hover:text-fg-primary transition-colors text-xl ml-3 mt-0.5">✕</button>
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
                    <span className="text-fg-secondary text-xs w-16 shrink-0">{l}:</span>
                    {n ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-pill bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600">
                          {n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-fg-primary">{n}</span>
                      </div>
                    ) : <span className="text-sm text-fg-secondary">Unassigned</span>}
                  </div>
                ))}
              </div>
              <SectionTitle className="mt-6">Tickets</SectionTitle>
              <div className="space-y-2">
                {[{ l: "Backend", t: item.backendTicket }, { l: "Frontend", t: item.frontendTicket }, { l: "QA", t: item.qaTicket }].map(({ l, t }) => (
                  <div key={l} className="flex justify-between items-center">
                    <span className="text-fg-secondary text-xs">{l}:</span>
                    {t ? <a href={t.startsWith("http") ? t : "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-500 text-sm font-semibold hover:underline">{t.startsWith("http") ? t.split("/").pop() : t}<ExternalLink size={11} /></a> : <span className="text-fg-secondary text-sm">—</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-200">
            <SectionTitle>Layer Timeline Dates</SectionTitle>
            <div className="grid grid-cols-3 gap-4 mt-3">
              {[
                { label: "Backend", start: item.backendStartDate, end: item.backendPlannedCompletionDate },
                { label: "Frontend", start: item.frontendStartDate, end: item.frontendPlannedCompletionDate },
                { label: "QA", start: item.qaStartDate, end: item.qaPlannedCompletionDate },
              ].map(({ label, start, end }) => (
                <div key={label}>
                  <h4 className="text-sm font-semibold text-fg-primary mb-2">{label}</h4>
                  <DetailRow label="Start" value={start ? formatDate(start) : "—"} />
                  <DetailRow label="Planned end" value={end ? formatDate(end) : "—"} />
                </div>
              ))}
            </div>
          </div>

          {item.blockers.length > 0 && (
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <SectionTitle>Blockers</SectionTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {item.blockers.map(b => <span key={b} className="px-3 py-1 bg-error-50 text-error-600 border border-error-200 rounded text-xs font-semibold">{b}</span>)}
              </div>
            </div>
          )}
        </div>

        <div className="px-7 py-4 border-t border-neutral-200 flex justify-end">
          <Button variant="neutral" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-xs font-bold uppercase tracking-widest text-fg-secondary mb-3 ${className}`}>{children}</h3>;
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center mb-1">
      <span className="text-xs text-fg-secondary">{label}:</span>
      <span className="text-sm font-semibold text-fg-primary" style={valueColor ? { color: valueColor } : {}}>{value}</span>
    </div>
  );
}
