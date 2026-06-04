"use client";

import { useState, useCallback } from "react";
import { X, ChevronDown, ChevronRight, CheckSquare, Square, Loader2 } from "lucide-react";
import type { Release, SectionKey, SectionState, SectionStatus } from "./types";
import {
  CHECKLIST_DEFINITIONS,
  SECTIONS_FOR_TYPE,
  getEffectiveChecks,
  computeReleaseStatus,
} from "./types";

const TEAM_MEMBER_LABELS: Record<string, string> = {
  "hemanga-bharadwaj": "Hemanga Bharadwaj",
  "pankaj-chakrabarty": "Pankaj Chakrabarty",
  "bhargav-nath": "Bhargav Nath",
  "nilimpa-nizara-bora": "Nilimpa Nizara Bora",
  "garima-kayal": "Garima Kayal",
  "kongkona-bayan": "Kongkona Bayan",
};

const RELEASE_TYPE_LABELS: Record<string, string> = {
  "new-feature": "New Feature",
  customization: "Customization",
  hotfix: "Hotfix",
  integration: "Integration",
};

const RELEASE_TYPE_COLORS: Record<string, string> = {
  "new-feature": "bg-indigo-900/50 text-indigo-300 border-indigo-700",
  customization: "bg-blue-900/50 text-blue-300 border-blue-700",
  hotfix: "bg-red-900/50 text-red-300 border-red-700",
  integration: "bg-purple-900/50 text-purple-300 border-purple-700",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-800 text-gray-400 border-gray-700",
  "in-progress": "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  blocked: "bg-red-900/40 text-red-300 border-red-700",
  ready: "bg-green-900/40 text-green-300 border-green-700",
  deployed: "bg-indigo-900/40 text-indigo-300 border-indigo-700",
};

const SECTION_STATUS_COLORS: Record<SectionStatus, string> = {
  pending: "bg-gray-800 text-gray-400 border-gray-700",
  "in-progress": "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  complete: "bg-green-900/40 text-green-300 border-green-700",
  na: "bg-gray-800 text-gray-500 border-gray-700",
};

function computeSectionStatus(
  completedChecks: string[],
  totalItems: number,
  signedOffBy?: string
): SectionStatus {
  if (totalItems === 0) return "na";
  if (completedChecks.length === 0) return "pending";
  if (completedChecks.length >= totalItems && signedOffBy) return "complete";
  return "in-progress";
}

interface SectionPanelProps {
  release: Release;
  sectionKey: SectionKey;
  sectionState: SectionState;
  onUpdate: (key: SectionKey, update: Partial<SectionState>) => Promise<void>;
}

function SectionPanel({ release, sectionKey, sectionState, onUpdate }: SectionPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [signOffInput, setSignOffInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(sectionState.notes ?? "");
  const [signingOff, setSigningOff] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const definition = CHECKLIST_DEFINITIONS[sectionKey];
  const effectiveItems = getEffectiveChecks(release.releaseType, sectionKey);
  const completed = sectionState.completedChecks ?? [];
  const allDone = effectiveItems.length > 0 && completed.length >= effectiveItems.length;
  const dynamicStatus = computeSectionStatus(completed, effectiveItems.length, sectionState.signedOffBy);

  async function toggleCheck(itemId: string) {
    if (togglingId) return;
    setTogglingId(itemId);
    const isChecked = completed.includes(itemId);
    const newChecks = isChecked
      ? completed.filter((id) => id !== itemId)
      : [...completed, itemId];

    const newStatus = computeSectionStatus(newChecks, effectiveItems.length, sectionState.signedOffBy);

    try {
      await onUpdate(sectionKey, { completedChecks: newChecks, status: newStatus });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSignOff() {
    if (!signOffInput.trim()) return;
    setSigningOff(true);
    try {
      await onUpdate(sectionKey, {
        signedOffBy: signOffInput.trim(),
        signedOffAt: new Date().toISOString(),
        status: "complete",
      });
      setSignOffInput("");
    } finally {
      setSigningOff(false);
    }
  }

  async function handleNotesBlur() {
    if (notesValue === (sectionState.notes ?? "")) return;
    setSavingNotes(true);
    try {
      await onUpdate(sectionKey, { notes: notesValue });
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 hover:bg-gray-800/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-white text-sm font-medium">{definition?.title ?? sectionKey}</span>
          <span className="text-gray-500 text-xs">
            {completed.length}/{effectiveItems.length}
          </span>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${SECTION_STATUS_COLORS[dynamicStatus]}`}
          >
            {dynamicStatus}
          </span>
          {sectionState.signedOffBy && (
            <span className="text-[10px] text-green-400 font-medium">
              Signed off by {sectionState.signedOffBy}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronDown size={15} className="text-gray-500" />
        ) : (
          <ChevronRight size={15} className="text-gray-500" />
        )}
      </button>

      {expanded && (
        <div className="bg-gray-950 px-4 py-4 space-y-4">
          {/* Checklist items */}
          <div className="grid grid-cols-1 gap-1.5">
            {effectiveItems.map((item) => {
              const isChecked = completed.includes(item.id);
              const isLoading = togglingId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  disabled={isLoading}
                  className="flex items-start gap-2.5 text-left w-full group hover:bg-gray-900 rounded-lg px-2 py-1.5 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 size={15} className="text-indigo-400 animate-spin mt-0.5 shrink-0" />
                  ) : isChecked ? (
                    <CheckSquare size={15} className="text-green-400 mt-0.5 shrink-0" />
                  ) : (
                    <Square size={15} className="text-gray-600 group-hover:text-gray-400 mt-0.5 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      isChecked ? "text-gray-400 line-through" : "text-gray-300"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sign-off area */}
          {allDone && (
            <div className="border-t border-gray-800 pt-4">
              {sectionState.signedOffBy ? (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckSquare size={14} />
                  <span>
                    Signed off by <strong>{sectionState.signedOffBy}</strong>
                    {sectionState.signedOffAt && (
                      <span className="text-gray-500 ml-1 text-xs">
                        on {new Date(sectionState.signedOffAt).toLocaleDateString()}
                      </span>
                    )}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={signOffInput}
                    onChange={(e) => setSignOffInput(e.target.value)}
                    placeholder="Your name"
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 flex-1 max-w-[200px]"
                  />
                  <button
                    type="button"
                    onClick={handleSignOff}
                    disabled={signingOff || !signOffInput.trim()}
                    className="bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {signingOff && <Loader2 size={12} className="animate-spin" />}
                    Sign Off Section
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="border-t border-gray-800 pt-3">
            <label className="block text-xs text-gray-500 mb-1.5">Notes (optional)</label>
            <div className="relative">
              <textarea
                rows={2}
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Add section notes…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
              {savingNotes && (
                <Loader2
                  size={12}
                  className="absolute right-2.5 top-2.5 text-indigo-400 animate-spin"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  release: Release;
  onClose: () => void;
  onUpdated: () => void;
}

export default function ReleaseDetail({ release, onClose, onUpdated }: Props) {
  const [localRelease, setLocalRelease] = useState<Release>(release);
  const overallStatus = computeReleaseStatus(localRelease);
  const requiredSections = SECTIONS_FOR_TYPE[localRelease.releaseType];

  const handleSectionUpdate = useCallback(
    async (key: SectionKey, update: Partial<SectionState>) => {
      const current = localRelease.sections[key] ?? { status: "pending", completedChecks: [] };
      const merged = { ...current, ...update };

      setLocalRelease((prev) => ({
        ...prev,
        sections: { ...prev.sections, [key]: merged },
        updatedAt: new Date().toISOString(),
      }));

      await fetch(`/api/releases/${localRelease.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: { [key]: merged } }),
      });

      onUpdated();
    },
    [localRelease, onUpdated]
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 h-full w-[680px] bg-gray-950 border-l border-gray-800 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-800 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-indigo-400 text-sm font-semibold">
                  {localRelease.id}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                    RELEASE_TYPE_COLORS[localRelease.releaseType] ?? ""
                  }`}
                >
                  {RELEASE_TYPE_LABELS[localRelease.releaseType] ?? localRelease.releaseType}
                </span>
                {localRelease.product && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                    {localRelease.product}
                  </span>
                )}
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                    STATUS_COLORS[overallStatus] ?? ""
                  }`}
                >
                  {overallStatus}
                </span>
              </div>
              <h2 className="text-white font-semibold text-lg leading-tight truncate">
                {localRelease.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors shrink-0 mt-0.5"
            >
              <X size={18} />
            </button>
          </div>

          {/* Meta */}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
            <span>
              <span className="text-gray-600">Clients:</span>{" "}
              <span className="text-gray-300">{localRelease.clients.join(", ") || "—"}</span>
            </span>
            <span>
              <span className="text-gray-600">Deploy:</span>{" "}
              <span className="text-gray-300">
                {localRelease.deploymentDate
                  ? new Date(localRelease.deploymentDate + "T00:00:00").toLocaleDateString()
                  : "—"}
              </span>
            </span>
            <span>
              <span className="text-gray-600">PM:</span>{" "}
              <span className="text-gray-300">
                {TEAM_MEMBER_LABELS[localRelease.pmOwner] ?? localRelease.pmOwner}
              </span>
            </span>
            {localRelease.jiraTickets.length > 0 && (
              <span>
                <span className="text-gray-600">Tickets:</span>{" "}
                <span className="font-mono text-gray-300">
                  {localRelease.jiraTickets.join(", ")}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Body — scrollable sections */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {requiredSections.map((key) => (
            <SectionPanel
              key={key}
              release={localRelease}
              sectionKey={key}
              sectionState={
                localRelease.sections[key] ?? { status: "pending", completedChecks: [] }
              }
              onUpdate={handleSectionUpdate}
            />
          ))}
        </div>
      </div>
    </>
  );
}
