"use client";
import { useEffect, useState } from "react";
import type { ItemStatus, PortfolioItem } from "./types";
import { StatusBadge, StatusDropdown } from "./StatusBadge";

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
          <div className="absolute top-10 left-0 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 w-80">
            <h3 className="font-semibold text-white mb-3">Change {layerLabel[layer]} Status</h3>
            <div className="space-y-2 mb-4">
              <StatusDropdown currentStatus={currentStatus} onStatusSelect={handleStatusSelect} onClose={() => setIsOpen(false)} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Add Note (optional)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g., Waiting on infrastructure team..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsOpen(false)} className="flex-1 px-3 py-2 text-gray-400 font-semibold hover:bg-gray-800 rounded-lg transition-colors text-sm">Cancel</button>
              <button onClick={() => handleStatusSelect(currentStatus)} className="flex-1 px-3 py-2 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 rounded-lg transition-colors text-sm">Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
