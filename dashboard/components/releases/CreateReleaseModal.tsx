"use client";

import { useState, useRef, KeyboardEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import type { ReleaseType } from "./types";

const TEAM_MEMBERS = [
  { value: "hemanga-bharadwaj", label: "Hemanga Bharadwaj" },
  { value: "pankaj-chakrabarty", label: "Pankaj Chakrabarty" },
  { value: "bhargav-nath", label: "Bhargav Nath" },
  { value: "nilimpa-nizara-bora", label: "Nilimpa Nizara Bora" },
  { value: "garima-kayal", label: "Garima Kayal" },
  { value: "kongkona-bayan", label: "Kongkona Bayan" },
];

const PRODUCTS = ["R&R", "Perks", "Pulse", "Fit"];

const RELEASE_TYPES: { value: ReleaseType; label: string }[] = [
  { value: "new-feature", label: "New Feature" },
  { value: "customization", label: "Customization" },
  { value: "hotfix", label: "Hotfix" },
  { value: "integration", label: "Integration" },
];

interface JiraTicketTag {
  key: string;
  summary?: string;
  error?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateReleaseModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [releaseType, setReleaseType] = useState<ReleaseType | "">("");
  const [product, setProduct] = useState("");
  const [clients, setClients] = useState<string[]>([]);
  const [clientInput, setClientInput] = useState("");
  const [jiraTickets, setJiraTickets] = useState<JiraTicketTag[]>([]);
  const [jiraInput, setJiraInput] = useState("");
  const [jiraLoading, setJiraLoading] = useState(false);
  const [deploymentDate, setDeploymentDate] = useState("");
  const [pmOwner, setPmOwner] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const jiraInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setName("");
    setReleaseType("");
    setProduct("");
    setClients([]);
    setClientInput("");
    setJiraTickets([]);
    setJiraInput("");
    setDeploymentDate("");
    setPmOwner("");
    setErrors({});
    setSubmitting(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function addClient() {
    const trimmed = clientInput.trim().replace(/,$/, "");
    if (trimmed && !clients.includes(trimmed)) {
      setClients((prev) => [...prev, trimmed]);
    }
    setClientInput("");
  }

  function handleClientKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addClient();
    }
    if (e.key === "Backspace" && clientInput === "" && clients.length > 0) {
      setClients((prev) => prev.slice(0, -1));
    }
  }

  function removeClient(c: string) {
    setClients((prev) => prev.filter((x) => x !== c));
  }

  async function addJiraTicket() {
    const trimmed = jiraInput.trim().toUpperCase();
    if (!trimmed) return;
    if (jiraTickets.some((t) => t.key === trimmed)) {
      setJiraInput("");
      return;
    }

    setJiraLoading(true);
    setJiraInput("");

    try {
      const res = await fetch(`/api/jira/search?ticket=${encodeURIComponent(trimmed)}`);
      const data = await res.json() as { key?: string; summary?: string; error?: string };

      if (data.error) {
        setJiraTickets((prev) => [...prev, { key: trimmed, error: data.error }]);
      } else {
        setJiraTickets((prev) => [...prev, { key: trimmed, summary: data.summary }]);
      }
    } catch {
      setJiraTickets((prev) => [...prev, { key: trimmed, error: "Failed to fetch" }]);
    } finally {
      setJiraLoading(false);
    }
  }

  function handleJiraKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addJiraTicket();
    }
    if (e.key === "Backspace" && jiraInput === "" && jiraTickets.length > 0) {
      setJiraTickets((prev) => prev.slice(0, -1));
    }
  }

  function removeJiraTicket(key: string) {
    setJiraTickets((prev) => prev.filter((t) => t.key !== key));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Release name is required";
    if (!releaseType) errs.releaseType = "Release type is required";
    if (clients.length === 0) errs.clients = "At least one client is required";
    if (!deploymentDate) errs.deploymentDate = "Deployment date is required";
    if (!pmOwner) errs.pmOwner = "PM Owner is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          releaseType,
          clients,
          product,
          jiraTickets: jiraTickets.map((t) => t.key),
          deploymentDate,
          pmOwner,
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        setErrors({ form: err.error ?? "Failed to create release" });
        return;
      }

      onCreated();
      handleClose();
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <Dialog.Title className="text-white font-semibold text-base">New Release</Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {errors.form && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                {errors.form}
              </p>
            )}

            {/* Release Name */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Release Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp — Bulk Upload Feature"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Release Type */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Release Type <span className="text-red-400">*</span>
              </label>
              <select
                value={releaseType}
                onChange={(e) => setReleaseType(e.target.value as ReleaseType)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select type…</option>
                {RELEASE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.releaseType && <p className="text-red-400 text-xs mt-1">{errors.releaseType}</p>}
            </div>

            {/* Product */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Product</label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select product…</option>
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Clients */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Client(s) <span className="text-red-400">*</span>
              </label>
              <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex flex-wrap gap-1.5 focus-within:border-indigo-500 min-h-[42px]">
                {clients.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 bg-indigo-900/50 border border-indigo-700 text-indigo-300 text-xs px-2 py-0.5 rounded-full"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => removeClient(c)}
                      className="text-indigo-400 hover:text-white"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={clientInput}
                  onChange={(e) => setClientInput(e.target.value)}
                  onKeyDown={handleClientKeyDown}
                  onBlur={addClient}
                  placeholder={clients.length === 0 ? "Type client name, press Enter…" : ""}
                  className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                />
              </div>
              {errors.clients && <p className="text-red-400 text-xs mt-1">{errors.clients}</p>}
              <p className="text-gray-600 text-xs mt-1">Press Enter or comma to add each client</p>
            </div>

            {/* Jira Tickets */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Jira Tickets</label>
              <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex flex-wrap gap-1.5 focus-within:border-indigo-500 min-h-[42px]">
                {jiraTickets.map((t) => (
                  <span
                    key={t.key}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                      t.error
                        ? "bg-red-900/30 border-red-700 text-red-300"
                        : "bg-gray-700 border-gray-600 text-gray-200"
                    }`}
                    title={t.summary ?? t.error ?? ""}
                  >
                    <span className="font-mono">{t.key}</span>
                    {t.summary && (
                      <span className="text-gray-400 max-w-[120px] truncate">{t.summary}</span>
                    )}
                    {t.error && <span className="text-red-400">!</span>}
                    <button
                      type="button"
                      onClick={() => removeJiraTicket(t.key)}
                      className="text-gray-400 hover:text-white ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {jiraLoading ? (
                  <Loader2 size={14} className="text-indigo-400 animate-spin self-center" />
                ) : (
                  <input
                    ref={jiraInputRef}
                    type="text"
                    value={jiraInput}
                    onChange={(e) => setJiraInput(e.target.value.toUpperCase())}
                    onKeyDown={handleJiraKeyDown}
                    placeholder={jiraTickets.length === 0 ? "e.g. VC-1234, press Enter…" : ""}
                    className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-gray-500 outline-none font-mono"
                  />
                )}
              </div>
              <p className="text-gray-600 text-xs mt-1">Press Enter to add and verify each ticket via Jira</p>
            </div>

            {/* Deployment Date */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Deployment Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={deploymentDate}
                onChange={(e) => setDeploymentDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              {errors.deploymentDate && (
                <p className="text-red-400 text-xs mt-1">{errors.deploymentDate}</p>
              )}
            </div>

            {/* PM Owner */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                PM Owner <span className="text-red-400">*</span>
              </label>
              <select
                value={pmOwner}
                onChange={(e) => setPmOwner(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select owner…</option>
                {TEAM_MEMBERS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              {errors.pmOwner && <p className="text-red-400 text-xs mt-1">{errors.pmOwner}</p>}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-white text-sm transition-colors px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Create Release
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
