"use client";

import { useState, useCallback, useRef } from "react";
import { X, Loader2, Trash2, Check, Minus, ChevronDown, ChevronRight, Paperclip, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
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

const RELEASE_TYPE_BADGE: Record<string, NonNullable<BadgeProps["variant"]>> = {
  "new-feature": "brand",
  enhancement: "success",
  customization: "info",
  hotfix: "error",
  integration: "neutral",
};

const STATUS_BADGE: Record<string, NonNullable<BadgeProps["variant"]>> = {
  draft: "neutral",
  "in-progress": "warning",
  blocked: "error",
  ready: "success",
  deployed: "brand",
};

const SECTION_STATUS_BADGE: Record<SectionStatus, NonNullable<BadgeProps["variant"]>> = {
  pending: "neutral",
  "in-progress": "warning",
  complete: "success",
  na: "neutral",
};

function getItemState(id: string, completedChecks: string[], naChecks: string[]): ItemState {
  if (completedChecks.includes(id)) return "done";
  if (naChecks.includes(id)) return "na";
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
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-100">
        <div className="flex items-center gap-3">
          <Paperclip size={13} className="text-fg-secondary" />
          <span className="text-fg-primary text-sm font-medium">Attachments</span>
          {attachments.length > 0 && (
            <span className="text-fg-secondary text-xs">{attachments.length}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 transition-colors duration-200 ease-in-out disabled:opacity-50"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {uploading ? "Uploading…" : "Upload file"}
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {attachments.length > 0 && (
        <div className="bg-surface-card px-4 py-3 space-y-2">
          {attachments.map((a) => (
            <div key={a.name} className="flex items-center gap-3 group">
              <Paperclip size={12} className="text-neutral-400 shrink-0" />
              <a
                href={`/api/releases/${release.id}/attachments/${encodeURIComponent(a.name)}`}
                download={a.name}
                className="text-sm text-fg-secondary hover:text-fg-primary flex-1 truncate transition-colors duration-200 ease-in-out"
              >
                {a.name}
              </a>
              <span className="text-xs text-fg-secondary shrink-0">{formatBytes(a.size)}</span>
              <span className="text-[10px] text-neutral-400 shrink-0 hidden group-hover:block">
                {a.uploadedBy}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(a)}
                disabled={deletingName === a.name}
                className="text-neutral-400 hover:text-error-500 transition-colors duration-200 ease-in-out shrink-0 opacity-0 group-hover:opacity-100"
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
          className="bg-surface-card px-4 py-6 text-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-xs text-fg-secondary">No attachments yet — click Upload file or drop files here</p>
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

  async function setItemState(itemId: string, next: ItemState) {
    if (togglingId || bulkUpdating) return;
    setTogglingId(itemId);

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

  function handleCheckboxClick(itemId: string, current: ItemState) {
    // Checkbox toggles Done ↔ Pending (also clears N/A back to Pending)
    setItemState(itemId, current === "done" ? "pending" : "done");
  }

  function handleNaClick(itemId: string, current: ItemState) {
    setItemState(itemId, current === "na" ? "pending" : "na");
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
    <div ref={panelRef} className="border border-neutral-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-100 hover:bg-neutral-200 transition-colors duration-200 ease-in-out"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-fg-primary text-sm font-medium">{definition?.title ?? sectionKey}</span>
          <span className="text-fg-secondary text-xs">{resolved}/{effectiveItems.length}</span>
          <Badge variant={SECTION_STATUS_BADGE[dynamicStatus]}>{dynamicStatus}</Badge>
          {sectionState.signedOffBy && (
            <span className="text-[10px] text-success-600 font-medium">
              Signed off · {sectionState.signedOffBy}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronDown size={15} className="text-fg-secondary shrink-0" />
        ) : (
          <ChevronRight size={15} className="text-fg-secondary shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="bg-surface-card px-4 py-4 space-y-4">
          {/* Bulk actions */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-fg-secondary">Mark all:</span>
            <button
              type="button"
              onClick={() => handleMarkAll("done")}
              disabled={bulkUpdating}
              className="text-xs text-success-600 hover:text-success-500 px-2 py-0.5 rounded border border-success-200 hover:border-success-300 transition-colors duration-200 ease-in-out disabled:opacity-40"
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll("na")}
              disabled={bulkUpdating}
              className="text-xs text-fg-secondary hover:text-fg-primary px-2 py-0.5 rounded border border-neutral-200 hover:border-neutral-300 transition-colors duration-200 ease-in-out disabled:opacity-40"
            >
              N/A
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll("reset")}
              disabled={bulkUpdating}
              className="text-xs text-fg-secondary hover:text-fg-primary px-2 py-0.5 rounded border border-neutral-200 hover:border-neutral-300 transition-colors duration-200 ease-in-out disabled:opacity-40"
            >
              Reset
            </button>
            {bulkUpdating && <Loader2 size={12} className="text-brand-500 animate-spin" />}
          </div>

          {/* Checklist items */}
          <div className="space-y-1">
            {effectiveItems.map((item) => {
              const state = getItemState(item.id, completed, naItems);
              const isLoading = togglingId === item.id;
              const disabled = isLoading || bulkUpdating;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 group hover:bg-neutral-100 rounded-lg px-2 py-1.5 transition-colors duration-200 ease-in-out"
                >
                  {/* Checkbox — toggles Done / Pending */}
                  <button
                    type="button"
                    onClick={() => handleCheckboxClick(item.id, state)}
                    disabled={disabled}
                    className="shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors duration-200 ease-in-out disabled:cursor-wait"
                    style={{
                      backgroundColor: state === "done" ? "var(--success-50)" : "var(--neutral-50)",
                      borderColor: state === "done" ? "var(--color-success)" : state === "na" ? "var(--neutral-400)" : "var(--neutral-300)",
                    }}
                  >
                    {isLoading ? (
                      <Loader2 size={10} className="text-brand-500 animate-spin" />
                    ) : state === "done" ? (
                      <Check size={11} className="text-success-600" />
                    ) : state === "na" ? (
                      <Minus size={11} className="text-neutral-400" />
                    ) : null}
                  </button>

                  {/* Label */}
                  <span
                    className={`text-sm flex-1 transition-colors duration-200 ease-in-out ${
                      state === "done"
                        ? "text-fg-secondary line-through"
                        : state === "na"
                        ? "text-fg-secondary line-through"
                        : "text-fg-primary group-hover:text-fg-primary"
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* N/A button — explicit toggle */}
                  <button
                    type="button"
                    onClick={() => handleNaClick(item.id, state)}
                    disabled={disabled}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors duration-200 ease-in-out shrink-0 disabled:cursor-wait ${
                      state === "na"
                        ? "text-fg-secondary border-neutral-300 bg-neutral-100"
                        : "text-neutral-400 border-neutral-200 opacity-0 group-hover:opacity-100 hover:text-fg-secondary hover:border-neutral-300"
                    }`}
                  >
                    N/A
                  </button>
                </div>
              );
            })}
          </div>

          {/* Sign-off */}
          {allResolved && (
            <div className="border-t border-neutral-200 pt-4">
              {sectionState.signedOffBy ? (
                <div className="flex items-center gap-2 text-sm text-success-600">
                  <Check size={14} />
                  <span>
                    Signed off by <strong>{sectionState.signedOffBy}</strong>
                    {sectionState.signedOffAt && (
                      <span className="text-fg-secondary ml-1.5 text-xs">
                        {new Date(sectionState.signedOffAt).toLocaleDateString()}
                      </span>
                    )}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-fg-secondary flex-1">
                    All items resolved. Sign off as{" "}
                    <span className="text-fg-primary font-medium">{userName || "you"}</span>?
                  </p>
                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    onClick={handleSignOff}
                    disabled={signingOff || !userName}
                    className="shrink-0"
                  >
                    {signingOff && <Loader2 size={12} className="animate-spin" />}
                    Sign Off
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="border-t border-neutral-200 pt-3">
            <label className="block text-xs text-fg-secondary mb-1.5">Notes</label>
            <div className="relative">
              <textarea
                rows={2}
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Add notes…"
                className="w-full bg-surface-card border border-neutral-300 rounded-lg px-3 py-2 text-sm text-fg-primary placeholder:text-fg-secondary focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)] transition-colors duration-200 ease-in-out resize-none"
              />
              {savingNotes && (
                <Loader2 size={12} className="absolute right-2.5 top-2.5 text-brand-500 animate-spin" />
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
      <div className="fixed inset-0 bg-[var(--overlay-modal)] z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-screen w-[680px] bg-surface-card border-l border-neutral-200 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-brand-500 text-sm font-semibold">
                  {localRelease.id}
                </span>
                <Badge variant={RELEASE_TYPE_BADGE[localRelease.releaseType] ?? "neutral"}>
                  {RELEASE_TYPE_LABELS[localRelease.releaseType] ?? localRelease.releaseType}
                </Badge>
                {localRelease.products?.map((p) => (
                  <Badge key={p} variant="neutral">{p}</Badge>
                ))}
                <Badge variant={STATUS_BADGE[overallStatus] ?? "neutral"}>{overallStatus}</Badge>
              </div>
              <h2 className="text-fg-primary font-semibold text-lg leading-tight">{localRelease.name}</h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Delete */}
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-error-500">Delete this release?</span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? <Loader2 size={11} className="animate-spin" /> : null}
                    Yes, delete
                  </Button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-fg-secondary hover:text-fg-primary px-2 py-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-neutral-400 hover:text-error-500 transition-colors duration-200 ease-in-out p-1 rounded"
                  title="Delete release"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button onClick={onClose} className="text-fg-secondary hover:text-fg-primary transition-colors duration-200 ease-in-out p-1">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-fg-secondary">
            <span>
              <span className="text-fg-secondary">Clients:</span>{" "}
              <span className="text-fg-primary">{localRelease.clients.join(", ") || "—"}</span>
            </span>
            <span>
              <span className="text-fg-secondary">Deploy:</span>{" "}
              <span className="text-fg-primary">
                {localRelease.deploymentDate
                  ? new Date(localRelease.deploymentDate + "T00:00:00").toLocaleDateString()
                  : "—"}
              </span>
            </span>
            <span>
              <span className="text-fg-secondary">PM:</span>{" "}
              <span className="text-fg-primary">
                {TEAM_MEMBER_LABELS[localRelease.pmOwner] ?? localRelease.pmOwner}
              </span>
            </span>
            {localRelease.jiraTickets?.length > 0 && (
              <span>
                <span className="text-fg-secondary">Tickets:</span>{" "}
                <span className="font-mono text-fg-primary">
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
