"use client";
import { useEffect, useState } from "react";
import type { ItemStatus, PortfolioItem } from "./types";
import { StatusBadge, StatusDropdown } from "./StatusBadge";
import { Button } from "@/components/ui/button";

interface InlineStatusEditorProps {
  item: PortfolioItem;
  layer: "backend" | "frontend" | "qa";
  onStatusChange: (itemId: string, layer: string, newStatus: ItemStatus) => void;
  onClose: () => void;
}

export function InlineStatusEditor({ item, layer, onStatusChange, onClose }: InlineStatusEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const currentStatus = item.status[layer];

  const layerLabel = { backend: "Backend", frontend: "Frontend", qa: "QA" };

  const handleStatusSelect = (newStatus: ItemStatus) => {
    onStatusChange(item.id, layer, newStatus);
    setIsOpen(false);
    setNote("");
    setTimeout(onClose, 300);
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer hover:opacity-80 transition-opacity">
          <StatusBadge status={currentStatus} editable size="md" />
        </div>

        {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}

        {isOpen && (
          <div className="absolute top-10 left-0 z-50 bg-surface-card border border-neutral-200 rounded-xl shadow-2xl p-4 w-80">
            <h3 className="font-semibold text-fg-primary mb-3">Change {layerLabel[layer]} Status</h3>
            <div className="space-y-2 mb-4">
              <StatusDropdown currentStatus={currentStatus} onStatusSelect={handleStatusSelect} onClose={() => setIsOpen(false)} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-fg-secondary mb-2">Add Note (optional)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g., Waiting on infrastructure team..."
                className="w-full px-3 py-2 bg-surface-card border border-neutral-300 rounded-lg text-sm text-fg-primary placeholder:text-fg-secondary focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)]"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={() => handleStatusSelect(currentStatus)}>Save</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
