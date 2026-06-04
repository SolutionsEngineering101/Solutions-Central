"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, ChevronDown } from "lucide-react";
import type { ReleaseType, JiraCategory, JiraTicketEntry } from "./types";

const TEAM_MEMBERS = [
  { value: "hemanga-bharadwaj", label: "Hemanga Bharadwaj" },
  { value: "pankaj-chakrabarty", label: "Pankaj Chakrabarty" },
  { value: "bhargav-nath", label: "Bhargav Nath" },
  { value: "nilimpa-nizara-bora", label: "Nilimpa Nizara Bora" },
  { value: "garima-kayal", label: "Garima Kayal" },
  { value: "kongkona-bayan", label: "Kongkona Bayan" },
];

const PRODUCTS = ["Redemption", "Recognition", "Dashboard", "Fit", "Perks", "Pulse"];

const RELEASE_TYPES: { value: ReleaseType; label: string }[] = [
  { value: "new-feature", label: "New Feature" },
  { value: "enhancement", label: "Enhancement" },
  { value: "customization", label: "Customization" },
  { value: "integration", label: "Integration" },
  { value: "hotfix", label: "Hotfix" },
];

const JIRA_CATEGORIES: { value: JiraCategory; label: string; color: string }[] = [
  { value: "frontend", label: "Frontend", color: "bg-blue-900/40 border-blue-700 text-blue-300" },
  { value: "backend", label: "Backend", color: "bg-purple-900/40 border-purple-700 text-purple-300" },
  { value: "qa", label: "QA", color: "bg-green-900/40 border-green-700 text-green-300" },
  { value: "general", label: "General", color: "bg-gray-700 border-gray-600 text-gray-200" },
];

const CATEGORY_COLORS: Record<JiraCategory, string> = {
  frontend: "bg-blue-900/40 border-blue-700 text-blue-300",
  backend: "bg-purple-900/40 border-purple-700 text-purple-300",
  qa: "bg-green-900/40 border-green-700 text-green-300",
  general: "bg-gray-700 border-gray-600 text-gray-200",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateReleaseModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [releaseType, setReleaseType] = useState<ReleaseType | "">("");
  const [products, setProducts] = useState<string[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [clientInput, setClientInput] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [knownClients, setKnownClients] = useState<string[]>([]);
  const [jiraTickets, setJiraTickets] = useState<JiraTicketEntry[]>([]);
  const [jiraInput, setJiraInput] = useState("");
  const [jiraCategory, setJiraCategory] = useState<JiraCategory>("general");
  const [jiraLoading, setJiraLoading] = useState(false);
  const [deploymentDate, setDeploymentDate] = useState("");
  const [pmOwner, setPmOwner] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const jiraInputRef = useRef<HTMLInputElement>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch known clients from solution requests
  useEffect(() => {
    if (open) {
      fetch("/api/clients")
        .then((r) => r.json())
        .then((data: string[]) => setKnownClients(data))
        .catch(() => {});
    }
  }, [open]);

  // Close client dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function resetForm() {
    setName(""); setReleaseType(""); setProducts([]); setClients([]);
    setClientInput(""); setClientSearch(""); setClientDropdownOpen(false);
    setJiraTickets([]); setJiraInput(""); setJiraCategory("general");
    setDeploymentDate(""); setPmOwner(""); setErrors({}); setSubmitting(false);
  }

  function handleClose() { resetForm(); onClose(); }

  // ── Products (multi-select chips) ────────────────────────────────────────
  function toggleProduct(p: string) {
    setProducts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  // ── Clients ──────────────────────────────────────────────────────────────
  const filteredClients = knownClients.filter(
    (c) => c.toLowerCase().includes(clientSearch.toLowerCase()) && !clients.includes(c)
  );

  function selectClient(c: string) {
    if (!clients.includes(c)) setClients((prev) => [...prev, c]);
    setClientSearch(""); setClientDropdownOpen(false);
  }

  function selectAllClients() {
    setClients(["All Clients"]);
    setClientSearch(""); setClientDropdownOpen(false);
  }

  function addCustomClient() {
    const trimmed = clientInput.trim().replace(/,$/, "");
    if (trimmed && !clients.includes(trimmed)) setClients((prev) => [...prev, trimmed]);
    setClientInput("");
  }

  function handleClientInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addCustomClient(); }
    if (e.key === "Backspace" && clientInput === "" && clients.length > 0)
      setClients((prev) => prev.slice(0, -1));
  }

  function removeClient(c: string) { setClients((prev) => prev.filter((x) => x !== c)); }

  // ── Jira ─────────────────────────────────────────────────────────────────
  async function addJiraTicket() {
    const trimmed = jiraInput.trim().toUpperCase();
    if (!trimmed) return;
    if (jiraTickets.some((t) => t.key === trimmed)) { setJiraInput(""); return; }

    setJiraLoading(true);
    setJiraInput("");

    try {
      const res = await fetch(`/api/jira/search?ticket=${encodeURIComponent(trimmed)}`);
      const data = await res.json() as { key?: string; summary?: string; error?: string };
      setJiraTickets((prev) => [
        ...prev,
        { key: trimmed, category: jiraCategory, summary: data.summary, ...(data.error ? { error: data.error } : {}) } as JiraTicketEntry,
      ]);
    } catch {
      setJiraTickets((prev) => [...prev, { key: trimmed, category: jiraCategory }]);
    } finally {
      setJiraLoading(false);
    }
  }

  function handleJiraKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); addJiraTicket(); }
    if (e.key === "Backspace" && jiraInput === "" && jiraTickets.length > 0)
      setJiraTickets((prev) => prev.slice(0, -1));
  }

  function removeJiraTicket(key: string) {
    setJiraTickets((prev) => prev.filter((t) => t.key !== key));
  }

  // ── Validation & Submit ──────────────────────────────────────────────────
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Release name is required";
    if (!releaseType) errs.releaseType = "Release type is required";
    if (clients.length === 0) errs.clients = "At least one client is required";
    if (!deploymentDate) errs.deploymentDate = "Production deploy date is required";
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
          name: name.trim(), releaseType, clients, products,
          jiraTickets: jiraTickets.map((t) => ({ key: t.key, category: t.category })),
          deploymentDate, pmOwner,
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        setErrors({ form: err.error ?? "Failed to create release" });
        return;
      }
      onCreated(); handleClose();
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
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
            <Dialog.Title className="text-white font-semibold text-base">New Release</Dialog.Title>
            <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
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
              <div className="flex flex-wrap gap-2">
                {RELEASE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setReleaseType(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      releaseType === t.value
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {errors.releaseType && <p className="text-red-400 text-xs mt-1">{errors.releaseType}</p>}
            </div>

            {/* Products (multi-select) */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Product(s) <span className="text-gray-600 text-xs font-normal">— select all that apply</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PRODUCTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProduct(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      products.includes(p)
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Clients */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Client(s) <span className="text-red-400">*</span>
              </label>

              {/* Selected client chips */}
              {clients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {clients.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 bg-indigo-900/50 border border-indigo-700 text-indigo-300 text-xs px-2 py-0.5 rounded-full">
                      {c}
                      <button type="button" onClick={() => removeClient(c)} className="text-indigo-400 hover:text-white">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search dropdown */}
              <div className="relative" ref={clientDropdownRef}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => { setClientSearch(e.target.value); setClientDropdownOpen(true); }}
                      onFocus={() => setClientDropdownOpen(true)}
                      placeholder="Search existing clients…"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {clientDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                    {/* All Clients option */}
                    <button
                      type="button"
                      onClick={selectAllClients}
                      className="w-full text-left px-3 py-2 text-sm text-indigo-400 hover:bg-gray-700 border-b border-gray-700 font-medium"
                    >
                      All Clients
                    </button>

                    {filteredClients.length > 0 ? (
                      filteredClients.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => selectClient(c)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          {c}
                        </button>
                      ))
                    ) : (
                      clientSearch && (
                        <div className="px-3 py-2 text-xs text-gray-500">
                          No match — add as new below
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Add new client not in list */}
              <div className="flex gap-2 mt-2">
                <input
                  ref={clientInputRef}
                  type="text"
                  value={clientInput}
                  onChange={(e) => setClientInput(e.target.value)}
                  onKeyDown={handleClientInputKeyDown}
                  onBlur={addCustomClient}
                  placeholder="Or type a new client name…"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {errors.clients && <p className="text-red-400 text-xs mt-1">{errors.clients}</p>}
            </div>

            {/* Jira Tickets */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Jira Tickets</label>

              {/* Category selector */}
              <div className="flex gap-1.5 mb-2">
                {JIRA_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setJiraCategory(cat.value)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      jiraCategory === cat.value
                        ? cat.color + " opacity-100"
                        : "bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Ticket input */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus-within:border-indigo-500 min-h-[42px]">
                {/* Grouped existing tickets */}
                {(["frontend", "backend", "qa", "general"] as JiraCategory[]).map((cat) => {
                  const tickets = jiraTickets.filter((t) => t.category === cat);
                  if (tickets.length === 0) return null;
                  const catDef = JIRA_CATEGORIES.find((c) => c.value === cat)!;
                  return (
                    <div key={cat} className="mb-2">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{catDef.label}</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {tickets.map((t) => (
                          <span
                            key={t.key}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[t.category]}`}
                            title={t.summary ?? ""}
                          >
                            <span className="font-mono">{t.key}</span>
                            {t.summary && <span className="text-gray-400 max-w-[100px] truncate">{t.summary}</span>}
                            <button type="button" onClick={() => removeJiraTicket(t.key)} className="hover:text-white ml-0.5">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Input row */}
                <div className="flex items-center gap-2">
                  {jiraLoading ? (
                    <Loader2 size={14} className="text-indigo-400 animate-spin" />
                  ) : (
                    <input
                      ref={jiraInputRef}
                      type="text"
                      value={jiraInput}
                      onChange={(e) => setJiraInput(e.target.value.toUpperCase())}
                      onKeyDown={handleJiraKeyDown}
                      placeholder={`Add ${jiraCategory} ticket, e.g. VC-1234`}
                      className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none font-mono"
                    />
                  )}
                </div>
              </div>
              <p className="text-gray-600 text-xs mt-1">Select category above, type ticket ID, press Enter to verify via Jira</p>
            </div>

            {/* Production Deploy Date */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Production Deploy Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={deploymentDate}
                onChange={(e) => setDeploymentDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              {errors.deploymentDate && <p className="text-red-400 text-xs mt-1">{errors.deploymentDate}</p>}
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
              <button type="button" onClick={handleClose} className="text-gray-400 hover:text-white text-sm transition-colors px-3 py-1.5">
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
