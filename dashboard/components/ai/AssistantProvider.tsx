"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";
import {
  Sparkles, X, Loader2, Send, FileText, BookOpen, Layers,
  ExternalLink, Download, Check, AlertCircle, Wand2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AssistantRequest {
  id?: string;
  client?: string;
  department?: string;
  feature?: string;
  status?: string;
  complexity?: string;
  description?: string;
  content?: string;
}

interface Reference {
  ref: string;
  type: "form" | "playbook" | "blueprint";
  id: string;
  title: string;
  path: string;
  url: string;
  why: string;
}

interface AssistantCtx {
  open: (request?: AssistantRequest | null) => void;
  close: () => void;
}

const Ctx = createContext<AssistantCtx | null>(null);

export function useAssistant(): AssistantCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAssistant must be used within <AssistantProvider>");
  return c;
}

const REF_META = {
  form:      { Icon: FileText, label: "Ticket",    color: "#818cf8" },
  playbook:  { Icon: BookOpen, label: "Playbook",  color: "#fbbf24" },
  blueprint: { Icon: Layers,   label: "Blueprint", color: "#34d399" },
} as const;

// ── Provider ──────────────────────────────────────────────────────────────────

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(" ")[0] ?? "there";
  const author = session?.user?.name ?? "Solutions Central";

  const [isOpen, setIsOpen] = useState(false);
  const [request, setRequest] = useState<AssistantRequest | null>(null);

  // generation state
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);

  // refine + export state
  const [instruction, setInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [exportMode, setExportMode] = useState<"hidden" | "choosing">("hidden");
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState<null | "playbook" | "blueprint">(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const resetSession = () => {
    setPhase("idle"); setError(null); setDraft(""); setSuggestions([]); setReferences([]);
    setInstruction(""); setExportMode("hidden"); setExportDone(null); setExportError(null);
  };

  const open = useCallback((req?: AssistantRequest | null) => {
    setRequest(req ?? null);
    resetSession();
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  // ── API calls ───────────────────────────────────────────────────────────────

  const generate = async () => {
    setPhase("loading"); setError(null); setExportDone(null);
    try {
      const res = await fetch("/api/ai/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "generate", request: request ?? {} }),
      });
      const json = await res.json();
      if (res.status === 503) throw new Error(json.error ?? "AI not configured");
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      setDraft(json.draft ?? "");
      setSuggestions(json.suggestions ?? []);
      setReferences(json.references ?? []);
      setPhase("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  };

  const refine = async () => {
    const instr = instruction.trim();
    if (!instr || !draft) return;
    setRefining(true); setError(null);
    try {
      const res = await fetch("/api/ai/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "refine", request: request ?? {}, draft, instruction: instr }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Refine failed");
      setDraft(json.draft ?? draft);
      setInstruction("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefining(false);
    }
  };

  const buildMarkdown = (kind: "playbook" | "blueprint"): string => {
    const date = new Date().toISOString().split("T")[0];
    const title = `Solution — ${request?.client || "Client"}${request?.feature ? ` · ${request.feature}` : ""}`;
    const fm =
      kind === "playbook"
        ? `---\ntitle: "${title}"\ndate: ${date}\nauthor: "${author}"\ntags: [ai-drafted, solution]\nrelated_solutions: [${request?.id ? `"${request.id}"` : ""}]\n---\n`
        : `---\ntitle: "${title}"\ndate: ${date}\nauthor: "${author}"\ndomain: "${request?.department || request?.feature || ""}"\nclient_type: ""\ntags: [ai-drafted, solution]\n---\n`;
    const refs = references.length
      ? `\n\n## References\n${references.map((r) => `- (${REF_META[r.type].label}) ${r.id} — ${r.why}${r.url ? ` — ${r.url}` : ""}`).join("\n")}`
      : "";
    return `${fm}\n${draft.trim()}${refs}\n\n_Drafted with AI from Solutions Central knowledge${request?.id ? ` for request ${request.id}` : ""}._\n`;
  };

  const doExport = async (kind: "playbook" | "blueprint") => {
    setExporting(true); setExportError(null);
    try {
      const res = await fetch("/api/github/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          filename: `${request?.client || "solution"}-solution`,
          content: buildMarkdown(kind),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Export failed");
      setExportDone(kind);
      setExportMode("hidden");
    } catch (e) {
      setExportError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────

  const chips = request
    ? ["Draft a solution from our past work", "What info should I confirm with the client?"]
    : ["Open a Solution Request, then click ✨ to draft a solution"];

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}

      {/* Floating orb — on every screen */}
      <button
        onClick={() => open(request)}
        title="Solution Assistant"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-900/40 flex items-center justify-center text-white hover:scale-105 transition-transform"
      >
        <Sparkles size={20} />
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={close}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-screen bg-gray-950 border-l border-gray-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{ width: "min(560px, 95vw)", transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles size={15} className="text-white" />
            </div>
            <p className="text-white font-semibold text-sm">Solution Assistant</p>
          </div>
          <button onClick={close} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Context chip */}
        {request && (
          <div className="px-5 py-2.5 border-b border-gray-800 shrink-0 bg-gray-900/50">
            <p className="text-[11px] text-gray-500">Working on</p>
            <p className="text-xs text-gray-300 truncate">
              <span className="text-indigo-400 font-mono">{request.id || "—"}</span>
              {request.client ? ` · ${request.client}` : ""}
              {request.feature ? ` · ${request.feature}` : ""}
            </p>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">

          {/* Idle / greeting */}
          {phase === "idle" && (
            <div>
              <h2 className="text-2xl font-semibold text-indigo-300">Hello, {userName}</h2>
              <p className="text-2xl font-semibold text-gray-400 mb-6">How can I help you today?</p>
              <div className="flex flex-col gap-2">
                {chips.map((c) => (
                  <button
                    key={c}
                    disabled={!request}
                    onClick={generate}
                    className="text-left px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-300 hover:border-indigo-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {c}
                  </button>
                ))}
              </div>
              {request && (
                <button
                  onClick={generate}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                >
                  <Wand2 size={15} /> Draft solution from past work
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {phase === "loading" && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
              <p className="text-sm">Searching past solutions, playbook & blueprints…</p>
            </div>
          )}

          {/* Error */}
          {phase === "error" && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 bg-red-950/60 border border-red-900 rounded-lg p-4">
                <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button onClick={generate} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium">
                Try again
              </button>
            </div>
          )}

          {/* Ready */}
          {phase === "ready" && (
            <div className="space-y-5">
              {/* References */}
              {references.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Based on</p>
                  <div className="flex flex-col gap-1.5">
                    {references.map((r, i) => {
                      const m = REF_META[r.type];
                      return (
                        <a
                          key={i}
                          href={r.url || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start gap-2 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors"
                        >
                          <m.Icon size={13} className="shrink-0 mt-0.5" style={{ color: m.color }} />
                          <span className="min-w-0 flex-1">
                            <span className="text-xs text-gray-300 font-medium">{r.id}</span>
                            <span className="text-[10px] text-gray-600 ml-1.5">{m.label}</span>
                            <span className="block text-[11px] text-gray-500">{r.why}</span>
                          </span>
                          {r.url && <ExternalLink size={11} className="text-gray-600 group-hover:text-gray-400 shrink-0 mt-0.5" />}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Confirm / fill in</p>
                  <ul className="space-y-1">
                    {suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-gray-400 flex gap-2">
                        <span className="text-indigo-500 shrink-0">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Editable draft */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Solution draft (editable)</p>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full h-72 px-3 py-3 bg-gray-900 border border-gray-800 rounded-lg text-gray-200 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>

              {/* Export */}
              {exportDone ? (
                <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-900 rounded-lg p-3 text-emerald-300 text-sm">
                  <Check size={15} /> Saved to {exportDone === "playbook" ? "Playbook" : "Blueprints"}. It now appears on that page.
                </div>
              ) : exportMode === "choosing" ? (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-2.5">Save this solution as:</p>
                  {exportError && <p className="text-red-400 text-xs mb-2">{exportError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => doExport("playbook")} disabled={exporting}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-semibold transition-colors disabled:opacity-50">
                      {exporting ? <Loader2 size={13} className="animate-spin" /> : <BookOpen size={13} />} Playbook
                    </button>
                    <button onClick={() => doExport("blueprint")} disabled={exporting}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50">
                      {exporting ? <Loader2 size={13} className="animate-spin" /> : <Layers size={13} />} Blueprint
                    </button>
                    <button onClick={() => setExportMode("hidden")} disabled={exporting}
                      className="px-3 py-2 rounded-lg text-gray-400 hover:text-white text-xs transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setExportMode("choosing"); setExportError(null); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition-colors">
                  <Download size={15} /> Export — Playbook or Blueprint
                </button>
              )}
            </div>
          )}
        </div>

        {/* Refine bar (only when a draft exists) */}
        {phase === "ready" && (
          <div className="border-t border-gray-800 p-3 shrink-0">
            {error && <p className="text-red-400 text-xs mb-2 px-1">{error}</p>}
            <div className="flex items-center gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !refining) refine(); }}
                placeholder="Ask AI to refine the draft… (e.g. add a rollout plan)"
                className="flex-1 px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={refine}
                disabled={refining || !instruction.trim()}
                className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40"
              >
                {refining ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
