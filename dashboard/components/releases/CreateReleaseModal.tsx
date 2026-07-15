"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FormField, FormHint } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
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
  { value: "frontend", label: "Frontend", color: "bg-info-50 border-info-200 text-info-600" },
  { value: "backend", label: "Backend", color: "bg-brand-50 border-brand-200 text-brand-600" },
  { value: "qa", label: "QA", color: "bg-success-50 border-success-200 text-success-600" },
  { value: "general", label: "General", color: "bg-neutral-100 border-neutral-300 text-neutral-600" },
];

const CATEGORY_COLORS: Record<JiraCategory, string> = {
  frontend: "bg-info-50 border-info-200 text-info-600",
  backend: "bg-brand-50 border-brand-200 text-brand-600",
  qa: "bg-success-50 border-success-200 text-success-600",
  general: "bg-neutral-100 border-neutral-300 text-neutral-600",
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
        <Dialog.Overlay className="fixed inset-0 bg-[var(--overlay-modal)] backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-surface-card border border-neutral-200 rounded-xl shadow-2xl max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 sticky top-0 bg-surface-card z-10">
            <Dialog.Title className="text-fg-primary font-semibold text-base">New Release</Dialog.Title>
            <button onClick={handleClose} className="text-fg-secondary hover:text-fg-primary transition-colors duration-200 ease-in-out">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {errors.form && <Alert variant="error">{errors.form}</Alert>}

            {/* Release Name */}
            <FormField className="mb-0">
              <Label>
                Release Name <span className="text-error-500">*</span>
              </Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp — Bulk Upload Feature"
                error={!!errors.name}
              />
              {errors.name && <FormHint error>{errors.name}</FormHint>}
            </FormField>

            {/* Release Type */}
            <FormField className="mb-0">
              <Label>
                Release Type <span className="text-error-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {RELEASE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setReleaseType(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-200 ease-in-out ${
                      releaseType === t.value
                        ? "bg-brand-500 border-brand-500 text-white"
                        : "bg-surface-card border-neutral-300 text-fg-secondary hover:border-neutral-400 hover:text-fg-primary"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {errors.releaseType && <FormHint error>{errors.releaseType}</FormHint>}
            </FormField>

            {/* Products (multi-select) */}
            <FormField className="mb-0">
              <Label>
                Product(s) <span className="text-fg-secondary text-xs font-normal">— select all that apply</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRODUCTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProduct(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-200 ease-in-out ${
                      products.includes(p)
                        ? "bg-brand-500 border-brand-500 text-white"
                        : "bg-surface-card border-neutral-300 text-fg-secondary hover:border-neutral-400 hover:text-fg-primary"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Clients */}
            <FormField className="mb-0">
              <Label>
                Client(s) <span className="text-error-500">*</span>
              </Label>

              {/* Selected client chips */}
              {clients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {clients.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 bg-brand-50 border border-brand-200 text-brand-600 text-xs px-2 py-0.5 rounded-pill">
                      {c}
                      <button type="button" onClick={() => removeClient(c)} className="text-brand-500 hover:text-brand-600">
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
                    <Input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => { setClientSearch(e.target.value); setClientDropdownOpen(true); }}
                      onFocus={() => setClientDropdownOpen(true)}
                      placeholder="Search existing clients…"
                      className="pr-9"
                    />
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-secondary pointer-events-none" />
                  </div>
                </div>

                {clientDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-card border border-neutral-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                    {/* All Clients option */}
                    <button
                      type="button"
                      onClick={selectAllClients}
                      className="w-full text-left px-3 py-2 text-sm text-brand-500 hover:bg-neutral-100 border-b border-neutral-200 font-medium"
                    >
                      All Clients
                    </button>

                    {filteredClients.length > 0 ? (
                      filteredClients.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => selectClient(c)}
                          className="w-full text-left px-3 py-2 text-sm text-fg-secondary hover:bg-neutral-100 hover:text-fg-primary"
                        >
                          {c}
                        </button>
                      ))
                    ) : (
                      clientSearch && (
                        <div className="px-3 py-2 text-xs text-fg-secondary">
                          No match — add as new below
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Add new client not in list */}
              <div className="flex gap-2 mt-2">
                <Input
                  ref={clientInputRef}
                  type="text"
                  value={clientInput}
                  onChange={(e) => setClientInput(e.target.value)}
                  onKeyDown={handleClientInputKeyDown}
                  onBlur={addCustomClient}
                  placeholder="Or type a new client name…"
                  className="flex-1"
                />
              </div>

              {errors.clients && <FormHint error>{errors.clients}</FormHint>}
            </FormField>

            {/* Jira Tickets */}
            <FormField className="mb-0">
              <Label>Jira Tickets</Label>

              {/* Category selector */}
              <div className="flex gap-1.5 mb-2">
                {JIRA_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setJiraCategory(cat.value)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors duration-200 ease-in-out ${
                      jiraCategory === cat.value
                        ? cat.color + " opacity-100"
                        : "bg-surface-card border-neutral-300 text-fg-secondary hover:text-fg-primary hover:border-neutral-400"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Ticket input */}
              <div className="bg-surface-card border border-neutral-300 rounded-lg px-3 py-2 focus-within:border-brand-500 focus-within:shadow-[0_0_0_4px_var(--color-focus)] transition-colors duration-200 ease-in-out min-h-[42px]">
                {/* Grouped existing tickets */}
                {(["frontend", "backend", "qa", "general"] as JiraCategory[]).map((cat) => {
                  const tickets = jiraTickets.filter((t) => t.category === cat);
                  if (tickets.length === 0) return null;
                  const catDef = JIRA_CATEGORIES.find((c) => c.value === cat)!;
                  return (
                    <div key={cat} className="mb-2">
                      <span className="text-[10px] text-fg-secondary uppercase tracking-wider font-medium">{catDef.label}</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {tickets.map((t) => (
                          <span
                            key={t.key}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-pill border ${CATEGORY_COLORS[t.category]}`}
                            title={t.summary ?? ""}
                          >
                            <span className="font-mono">{t.key}</span>
                            {t.summary && <span className="text-fg-secondary max-w-[100px] truncate">{t.summary}</span>}
                            <button type="button" onClick={() => removeJiraTicket(t.key)} className="hover:text-fg-primary ml-0.5">
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
                    <Loader2 size={14} className="text-brand-500 animate-spin" />
                  ) : (
                    <input
                      ref={jiraInputRef}
                      type="text"
                      value={jiraInput}
                      onChange={(e) => setJiraInput(e.target.value.toUpperCase())}
                      onKeyDown={handleJiraKeyDown}
                      placeholder={`Add ${jiraCategory} ticket, e.g. VC-1234`}
                      className="flex-1 bg-transparent text-sm text-fg-primary placeholder:text-fg-secondary outline-none font-mono"
                    />
                  )}
                </div>
              </div>
              <FormHint>Select category above, type ticket ID, press Enter to verify via Jira</FormHint>
            </FormField>

            {/* Production Deploy Date */}
            <FormField className="mb-0">
              <Label>
                Production Deploy Date <span className="text-error-500">*</span>
              </Label>
              <Input
                type="date"
                value={deploymentDate}
                onChange={(e) => setDeploymentDate(e.target.value)}
                error={!!errors.deploymentDate}
              />
              {errors.deploymentDate && <FormHint error>{errors.deploymentDate}</FormHint>}
            </FormField>

            {/* PM Owner */}
            <FormField className="mb-0">
              <Label>
                PM Owner <span className="text-error-500">*</span>
              </Label>
              <select
                value={pmOwner}
                onChange={(e) => setPmOwner(e.target.value)}
                className="w-full bg-surface-card border border-neutral-300 rounded-[8px] px-[16px] py-[12px] text-sm text-fg-primary transition-colors duration-200 ease-in-out outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)]"
              >
                <option value="">Select owner…</option>
                {TEAM_MEMBERS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              {errors.pmOwner && <FormHint error>{errors.pmOwner}</FormHint>}
            </FormField>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-200">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Create Release
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
