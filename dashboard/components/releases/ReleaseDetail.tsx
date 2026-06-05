"use client";

import { useState, useCallback, useRef } from "react";
import { X, Loader2, Trash2, Check, Minus, ChevronDown, ChevronRight, Paperclip, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import type { Release, SectionKey, SectionState, SectionStatus, ReleaseAttachment } from "./types";
import { CHECKLIST_DEFINITIONS, SECTIONS_FOR_TYPE, getEffectiveChecks, computeReleaseStatus } from "./types";

type ItemState = "done" | "na" | "pending";

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
  enhancement: "Enhancement",
  customization: "Customization",
  hotfix: "Hotfix",
  integration: "Integration",
};

const RELEASE_TYPE_COLORS: Record<string, string> = {
  "new-feature": "bg-indigo-900/50 text-indigo-300 border-indigo-700",
  enhancement: "bg-teal-900/50 text-teal-300 border-teal-700",
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

function getItemState(id: string, completedChecks: string[], naChecks: string[]): ItemState {
  if (completedChecks.includes(id)) return "done";
  if (naChecks.includes(id)) return "na";
  return "pending";
}

function nextItemState(current: ItemState): ItemState {
  if (current === "pending") return "done";
  if (current === "done") return "na";
  return "pending";
}

function computeSectionStatus(
  completedChecks: string[],
  naChecks: string[],
  totalItems: number,
  signedOffBy?: string
): SectionStatus {
  if (totalItems === 0) return "na";
  const resolved = completedChecks.length + naChecks.length;
  if (resolved === 0) return "pending";
  if (resolved >= totalItems && signedOffBy) return "complete";
  if (resolved >= totalItems) return "in-progress";
  return "in-progress";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── AttachmentsSection ────────────────────────────────────────────────────────

interface AttachmentsSectionProps {
  release: Release;
  userName: string;
  onChanged: () => void;
}

function AttachmentsSection({ release, userName, onChanged }: AttachmentsSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachments = release.attachments ?? [];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await fetch(`/api/releases/${release.id}/attachments`, { method: "POST", body: fd });
      onChanged();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(a: ReleaseAttachment) {
    setDeletingName(a.name);
    try {
      await fetch(`/api/releases/${release.id}/attachments?name=${encodeURIComponent(a.name)}`, {
        method: "DELETE",
      });
      onChanged();
    } finally {
      setDeletingName(null);
    }
  }

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
        <div className="flex items-center gap-3">
          <Paperclip size={13} className="text-gray-500" />
          <span className="text-white text-sm font-medium">Attachments</span>
          {attachments.length > 0 && (
            <span className="text-gray-500 text-xs">{attachments.length}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {uploading ? "Uploading…" : "Upload file"}
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {attachments.length > 0 && (
        <div className="bg-gray-950 px-4 py-3 space-y-2">
          {attachments.map((a) => (
            <div key={a.name} className="flex items-center gap-3 group">
              <Paperclip size={12} className="text-gray-600 shrink-0" />
              <a
                href={`/api/releases/${release.id}/attachments/${encodeURIComponent(a.name)}`}
                download={a.name}
                className="text-sm text-gray-300 hover:text-white flex-1 truncate transition-colors"
              >
                {a.name}
              </a>
              <span className="text-xs text-gray-600 shrink-0">{formatBytes(a.size)}</span>
              <span className="text-[10px] text-gray-700 shrink-0 hidden group-hover:block">
                {a.uploadedBy}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(a)}
                disabled={deletingName === a.name}
                className="text-gray-700 hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                title="Remove attachment"
              >
                {deletingName === a.name ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <X size={12} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && (
        <div
          className="bg-gray-950 px-4 py-6 text-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-xs text-gray-600">No attachments yet — click Upload file or drop files here</p>
        </div>
      )}
    </div>
  );
}

// ── SectionPanel ──────────────────────────────────────────────────────────────

interface SectionPanelProps {
  release: Release;
  sectionKey: SectionKey;
  sectionState: SectionState;
  userName: string;
  onUpdate: (key: SectionKey, update: Partial<SectionState>) => Promise<void>;
}

function SectionPanel({ release, sectionKey, sectionState, userName, onUpdate }: SectionPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(sectionState.notes ?? "");
  const [signingOff, setSigningOff] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const definition = CHECKLIST_DEFINITIONS[sectionKey];
  const effectiveItems = getEffectiveChecks(release.releaseType, sectionKey);
  const completed = sectionState.completedChecks ?? [];
  const naItems = sectionState.naChecks ?? [];
  const resolved = completed.length + naItems.length;
  const allResolved = effectiveItems.length > 0 && resolved >= effectiveItems.length;
  const dynamicStatus = computeSectionStatus(completed, naItems, effectiveItems.length, sectionState.signedOffBy);

  function handleToggle() {
    setExpanded((v) => {
      if (!v) {
        setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
      }
      return !v;
    });
  }

  async function cycleItemState(itemId: string) {
    if (togglingId || bulkUpdating) return;
    setTogglingId(itemId);
    const current = getItemState(itemId, completed, naItems);
    const next = nextItemState(current);

    const newCompleted =
      next === "done"
        ? [...completed.filter((id) => id !== itemId), itemId]
        : completed.filter((id) => id !== itemId);

    const newNa =
      next === "na"
        ? [...naItems.filter((id) => id !== itemId), itemId]
        : naItems.filter((id) => id !== itemId);

    const newStatus = computeSectionStatus(newCompleted, newNa, effectiveItems.length, sectionState.signedOffBy);

    try {
      await onUpdate(sectionKey, { completedChecks: newCompleted, naChecks: newNa, status: newStatus });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleMarkAll(action: "done" | "na" | "reset") {
    if (bulkUpdating || togglingId) return;
    setBulkUpdating(true);
    const allIds = effectiveItems.map((item) => item.id);
    const newCompleted = action === "done" ? allIds : [];
    const newNa = action === "na" ? allIds : [];
    const newStatus = computeSectionStatus(newCompleted, newNa, effectiveItems.length, sectionState.signedOffBy);
    try {
      await onUpdate(sectionKey, { completedChecks: newCompleted, naChecks: newNa, status: newStatus });
    } finally {
      setBulkUpdating(false);
    }
  }

  async function handleSignOff() {
    if (!userName) return;
    setSigningOff(true);
    try {
      await onUpdate(sectionKey, {
        signedOffBy: userName,
        signedOffAt: new Date().toISOString(),
        status: "complete",
      });
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
    <div ref={panelRef} className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 hover:bg-gray-800/60 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-white text-sm font-medium">{definition?.title ?? sectionKey}</span>
          <span className="text-gray-500 text-xs">{resolved}/{effectiveItems.length}</span>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${SECTION_STATUS_COLORS[dynamicStatus]}`}
          >
            {dynamicStatus}
          </span>
          {sectionState.signedOffBy && (
            <span className="text-[10px] text-green-400 font-medium">
              Signed off · {sectionState.signedOffBy}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronDown size={15} className="text-gray-500 shrink-0" />
        ) : (
          <ChevronRight size={15} className="text-gray-500 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="bg-gray-950 px-4 py-4 space-y-4">
          {/* Bulk actions */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Mark all:</span>
            <button
              type="button"
              onClick={() => handleMarkAll("done")}
              disabled={bulkUpdating}
              className="text-xs text-green-500 hover:text-green-400 px-2 py-0.5 rounded border border-green-900/50 hover:border-green-700 transition-colors disabled:opacity-40"
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll("na")}
              disabled={bulkUpdating}
              className="text-xs text-gray-500 hover:text-gray-400 px-2 py-0.5 rounded border border-gray-800 hover:border-gray-600 transition-colors disabled:opacity-40"
            >
              N/A
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll("reset")}
              disabled={bulkUpdating}
              className="text-xs text-gray-600 hover:text-gray-400 px-2 py-0.5 rounded border border-gray-800 hover:border-gray-600 transition-colors disabled:opacity-40"
            >
              Reset
            </button>
            {bulkUpdating && <Loader2 size={12} className="text-indigo-400 animate-spin" />}
          </div>

          {/* Checklist items — 3 states */}
          <div className="space-y-1">
            {effectiveItems.map((item) => {
              const state = getItemState(item.id, completed, naItems);
              const isLoading = togglingId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => cycleItemState(item.id)}
                  disabled={isLoading || bulkUpdating}
                  className="flex items-center gap-3 w-full text-left group hover:bg-gray-900 rounded-lg px-2 py-1.5 transition-colors disabled:cursor-wait"
                >
                  <div
                    className="shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors"
                    style={{
                      backgroundColor:
                        state === "done"
                          ? "#16a34a22"
                          : state === "na"
                          ? "#37415122"
                          : "#1f293722",
                      borderColor:
                        state === "done" ? "#16a34a" : state === "na" ? "#6b7280" : "#374151",
                    }}
                  >
                    {isLoading ? (
                      <Loader2 size={10} className="text-indigo-400 animate-spin" />
                    ) : state === "done" ? (
                      <Check size={11} className="text-green-400" />
                    ) : state === "na" ? (
                      <Minus size={11} className="text-gray-500" />
                    ) : null}
                  </div>

                  <span
                    className={`text-sm flex-1 transition-colors ${
                      state === "done"
                        ? "text-gray-500 line-through"
                        : state === "na"
                        ? "text-gray-600 line-through"
                        : "text-gray-300 group-hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>

                  <span
                    className={`text-[10px] shrink-0 ${
                      state === "done"
                        ? "text-green-500"
                        : state === "na"
                        ? "text-gray-600"
                        : "text-gray-700 group-hover:text-gray-500"
                    }`}
                  >
                    {state === "done" ? "Done" : state === "na" ? "N/A" : "Pending"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sign-off */}
          {allResolved && (
            <div className="border-t border-gray-800 pt-4">
              {sectionState.signedOffBy ? (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <Check size={14} />
                  <span>
                    Signed off by <strong>{sectionState.signedOffBy}</strong>
                    {sectionState.signedOffAt && (
                      <span className="text-gray-500 ml-1.5 text-xs">
                        {new Date(sectionState.signedOffAt).toLocaleDateString()}
                      </span>
                    )}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-400 flex-1">
                    All items resolved. Sign off as{" "}
                    <span className="text-white font-medium">{userName || "you"}</span>?
                  </p>
                  <button
                    type="button"
                    onClick={handleSignOff}
                    disabled={signingOff || !userName}
                    className="bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {signingOff && <Loader2 size={12} className="animate-spin" />}
                    Sign Off
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="border-t border-gray-800 pt-3">
            <label className="block text-xs text-gray-500 mb-1.5">Notes</label>
            <div className="relative">
              <textarea
                rows={2}
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Add notes…"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
              {savingNotes && (
                <Loader2 size={12} className="absolute right-2.5 top-2.5 text-indigo-400 animate-spin" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ReleaseDetail ─────────────────────────────────────────────────────────────

interface Props {
  release: Release;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

export default function ReleaseDetail({ release, onClose, onUpdated, onDeleted }: Props) {
  const { data: session } = useSession();
  const userName = (session?.user?.name as string | undefined) ?? "";

  const [localRelease, setLocalRelease] = useState<Release>(release);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const overallStatus = computeReleaseStatus(localRelease);
  const requiredSections = SECTIONS_FOR_TYPE[localRelease.releaseType];

  async function refreshLocalRelease() {
    const res = await fetch(`/api/releases/${localRelease.id}`);
    if (res.ok) {
      const updated: Release = await res.json();
      setLocalRelease(updated);
    }
    onUpdated();
  }

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

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/releases/${localRelease.id}`, { method: "DELETE" });
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-screen w-[680px] bg-gray-950 border-l border-gray-800 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-800 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
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
                {localRelease.products?.map((p) => (
                  <span
                    key={p}
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300"
                  >
                    {p}
                  </span>
                ))}
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                    STATUS_COLORS[overallStatus] ?? ""
                  }`}
                >
                  {overallStatus}
                </span>
              </div>
              <h2 className="text-white font-semibold text-lg leading-tight">{localRelease.name}</h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Delete */}
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400">Delete this release?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs bg-red-700 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50"
                  >
                    {deleting ? <Loader2 size={11} className="animate-spin" /> : null}
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-gray-500 hover:text-white px-2 py-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded"
                  title="Delete release"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
                <X size={18} />
              </button>
            </div>
          </div>

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
            {localRelease.jiraTickets?.length > 0 && (
              <span>
                <span className="text-gray-600">Tickets:</span>{" "}
                <span className="font-mono text-gray-300">
                  {localRelease.jiraTickets
                    .map((t) => (typeof t === "string" ? t : t.key))
                    .join(", ")}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 min-h-0">
          {requiredSections.map((key) => (
            <SectionPanel
              key={key}
              release={localRelease}
              sectionKey={key}
              sectionState={
                localRelease.sections[key] ?? { status: "pending", completedChecks: [] }
              }
              userName={userName}
              onUpdate={handleSectionUpdate}
            />
          ))}

          {/* Attachments */}
          <AttachmentsSection
            release={localRelease}
            userName={userName}
            onChanged={refreshLocalRelease}
          />
        </div>
      </div>
    </>
  );
}
