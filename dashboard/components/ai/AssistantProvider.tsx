"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import {
  Sparkles, X, Loader2, Send, FileText, BookOpen, Layers,
  ExternalLink, Download, Check, Wand2, Search,
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

type Msg =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; draft: string; suggestions: string[]; references: Reference[] };

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

// A pickable request, shown in the panel's empty-state picker.
interface FormItem {
  id: string; client: string; submittedBy: string; email: string;
  brief: string; department: string; status: string; complexity: string;
  content: string; submittedAt: string;
}

// Pull a one-line summary for the picker: frontmatter description/brief, else from the body.
function extractBrief(fm: Record<string, unknown>, content: string): string {
  const direct = fm.description ?? fm.brief;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const m =
    content.match(/##\s*Brief\s*\n+([^\n]+)/i) ||
    content.match(/##\s*Problem[^\n]*\n+([^\n]+)/i) ||
    content.match(/##\s*Subject\s*\n+([^\n]+)/i);
  if (m) return m[1].replace(/\*\*/g, "").trim();
  const line = content
    .split("\n")
    .map((l) => l.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim())
    .find((l) => l && !/^date:/i.test(l) && !l.startsWith("|"));
  return line ?? "";
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(" ")[0] ?? "there";
  const author = session?.user?.name ?? "Solutions Central";

  const [isOpen, setIsOpen] = useState(false);
  const [request, setRequest] = useState<AssistantRequest | null>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");

  // single export controller, keyed to the assistant message being exported
  const [exp, setExp] = useState<{ id: string; choosing: boolean; exporting: boolean; done: "playbook" | "blueprint" | null; error: string | null }>(
    { id: "", choosing: false, exporting: false, done: null, error: null }
  );

  // request picker (empty state, when opened from the orb with no request)
  const [forms, setForms] = useState<FormItem[] | null>(null);
  const [formsLoading, setFormsLoading] = useState(false);
  const [formsError, setFormsError] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");

  const idRef = useRef(0);
  const nextId = () => String(++idRef.current);
  const threadRef = useRef<HTMLDivElement>(null);

  const fetchForms = useCallback(async () => {
    setFormsLoading(true); setFormsError(null);
    try {
      const res = await fetch("/api/github/solutions");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load requests");
      const items: FormItem[] = (json.forms ?? [])
        .filter((f: { path: string }) => !f.path.endsWith("README.md"))
        .map((f: { path: string; frontmatter: Record<string, unknown>; content: string }) => {
          const fm = f.frontmatter ?? {};
          const s = (k: string) => (typeof fm[k] === "string" ? (fm[k] as string) : "");
          return {
            id: s("form_id") || f.path.split("/").pop()?.replace(/\.md$/, "") || "",
            client: s("client") || s("client_name") || "—",
            submittedBy: s("submitted_by"),
            email: s("email"),
            brief: extractBrief(fm, f.content ?? ""),
            department: s("department"),
            status: s("status"),
            complexity: s("complexity"),
            content: f.content ?? "",
            submittedAt: s("submitted_at") || s("date"),
          };
        })
        .sort((a: FormItem, b: FormItem) => (b.submittedAt > a.submittedAt ? 1 : -1));
      setForms(items);
    } catch (e) {
      setFormsError(e instanceof Error ? e.message : String(e));
    } finally {
      setFormsLoading(false);
    }
  }, []);

  // Lazy-load the request list the first time the panel opens without a request.
  useEffect(() => {
    if (isOpen && !request && forms === null && !formsLoading) fetchForms();
  }, [isOpen, request, forms, formsLoading, fetchForms]);

  const pickRequest = (f: FormItem) => {
    setRequest({
      id: f.id, client: f.client, department: f.department,
      status: f.status, complexity: f.complexity, description: f.brief, content: f.content,
    });
    setMessages([]); setError(null); setInput("");
    setExp({ id: "", choosing: false, exporting: false, done: null, error: null });
  };

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const open = useCallback((req?: AssistantRequest | null) => {
    setRequest(req ?? null);
    setMessages([]); setError(null); setInput("");
    setExp({ id: "", choosing: false, exporting: false, done: null, error: null });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const lastAssistant = (): Extract<Msg, { role: "assistant" }> | undefined =>
    [...messages].reverse().find((m): m is Extract<Msg, { role: "assistant" }> => m.role === "assistant");

  // ── API ─────────────────────────────────────────────────────────────────────

  const callApi = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/ai/solution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (res.status === 503) throw new Error(json.error ?? "AI not configured");
    if (!res.ok) throw new Error(json.error ?? "Request failed");
    return json;
  };

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || loading || !request) return;
    setInput("");
    setError(null);
    setMessages((m) => [...m, { id: nextId(), role: "user", text: t }]);

    const prev = lastAssistant();
    setLoading(true);
    try {
      if (prev) {
        // refine the most recent (possibly edited) draft
        const json = await callApi({ mode: "refine", request, draft: prev.draft, instruction: t });
        setMessages((m) => [...m, { id: nextId(), role: "assistant", draft: json.draft ?? prev.draft, suggestions: [], references: prev.references }]);
      } else {
        // first turn → generate, using the prompt as focus
        const json = await callApi({ mode: "generate", request, instruction: t });
        setMessages((m) => [...m, { id: nextId(), role: "assistant", draft: json.draft ?? "", suggestions: json.suggestions ?? [], references: json.references ?? [] }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = (id: string, value: string) =>
    setMessages((m) => m.map((x) => (x.id === id && x.role === "assistant" ? { ...x, draft: value } : x)));

  // ── Export ──────────────────────────────────────────────────────────────────

  const buildMarkdown = (draft: string, references: Reference[], kind: "playbook" | "blueprint"): string => {
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

  const doExport = async (msg: Extract<Msg, { role: "assistant" }>, kind: "playbook" | "blueprint") => {
    setExp((e) => ({ ...e, exporting: true, error: null }));
    try {
      const res = await fetch("/api/github/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, filename: `${request?.client || "solution"}-solution`, content: buildMarkdown(msg.draft, msg.references, kind) }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Export failed");
      setExp({ id: msg.id, choosing: false, exporting: false, done: kind, error: null });
    } catch (e) {
      setExp((prev) => ({ ...prev, exporting: false, error: e instanceof Error ? e.message : String(e) }));
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────

  const chips = ["Draft a solution from our past work", "What info should I confirm with the client?"];
  const hasMessages = messages.length > 0;
  const pq = pickerSearch.toLowerCase();
  const pickerFiltered = (forms ?? []).filter(
    (f) => !pq || [f.id, f.client, f.submittedBy, f.email, f.brief].join(" ").toLowerCase().includes(pq)
  );

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}

      {/* Floating orb */}
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
          <div className="px-5 py-2.5 border-b border-gray-800 shrink-0 bg-gray-900/50 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-gray-500">Working on</p>
              <p className="text-xs text-gray-300 truncate">
                <span className="text-indigo-400 font-mono">{request.id || "—"}</span>
                {request.client ? ` · ${request.client}` : ""}
                {request.feature ? ` · ${request.feature}` : ""}
              </p>
            </div>
            <button
              onClick={() => { setRequest(null); setMessages([]); setError(null); setInput(""); }}
              className="text-[11px] text-gray-500 hover:text-indigo-300 transition-colors shrink-0"
            >
              Change
            </button>
          </div>
        )}

        {/* Thread */}
        <div ref={threadRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4">

          {/* Empty state */}
          {!hasMessages && !loading && (
            <div>
              <h2 className="text-2xl font-semibold text-indigo-300">Hello, {userName}</h2>
              <p className="text-2xl font-semibold text-gray-400 mb-6">How can I help you today?</p>
              {request ? (
                <div className="flex flex-col gap-2">
                  {chips.map((c) => (
                    <button key={c} onClick={() => send(c)}
                      className="text-left px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-300 hover:border-indigo-600 hover:text-white transition-colors">
                      {c}
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Pick the request you want to work on:</p>
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      placeholder="Search by client, ID, person, email…"
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {formsLoading && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm py-6 justify-center">
                      <Loader2 size={16} className="animate-spin" /> Loading requests…
                    </div>
                  )}
                  {formsError && <p className="text-red-400 text-xs">{formsError}</p>}

                  {forms && !formsLoading && (
                    <div className="flex flex-col gap-2">
                      {pickerFiltered.slice(0, 60).map((f) => (
                        <button
                          key={f.id + f.client}
                          onClick={() => pickRequest(f)}
                          className="text-left px-3 py-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-600 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-400 font-mono text-xs shrink-0">{f.id}</span>
                            <span className="text-white text-sm font-medium truncate">{f.client}</span>
                            {f.status && <span className="ml-auto text-[10px] text-gray-500 shrink-0">{f.status}</span>}
                          </div>
                          {(f.submittedBy || f.email) && (
                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                              {[f.submittedBy, f.email].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          {f.brief && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{f.brief}</p>}
                        </button>
                      ))}
                      {pickerFiltered.length === 0 && (
                        <p className="text-gray-600 text-xs text-center py-4">No matching requests.</p>
                      )}
                      {pickerFiltered.length > 60 && (
                        <p className="text-gray-600 text-[11px] text-center pt-1">Showing first 60 — refine your search.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] bg-indigo-600 text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="bg-gray-900/60 border border-gray-800 rounded-2xl rounded-tl-sm p-4 space-y-4">
                {/* References */}
                {m.references.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Based on</p>
                    <div className="flex flex-col gap-1.5">
                      {m.references.map((r, i) => {
                        const meta = REF_META[r.type];
                        return (
                          <a key={i} href={r.url || undefined} target="_blank" rel="noopener noreferrer"
                            className="group flex items-start gap-2 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                            <meta.Icon size={13} className="shrink-0 mt-0.5" style={{ color: meta.color }} />
                            <span className="min-w-0 flex-1">
                              <span className="text-xs text-gray-300 font-medium">{r.id}</span>
                              <span className="text-[10px] text-gray-600 ml-1.5">{meta.label}</span>
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
                {m.suggestions.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Confirm / fill in</p>
                    <ul className="space-y-1">
                      {m.suggestions.map((s, i) => (
                        <li key={i} className="text-xs text-gray-400 flex gap-2"><span className="text-indigo-500 shrink-0">•</span>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Editable draft */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Solution draft (editable)</p>
                  <textarea
                    value={m.draft}
                    onChange={(e) => updateDraft(m.id, e.target.value)}
                    className="w-full h-64 px-3 py-3 bg-gray-950 border border-gray-800 rounded-lg text-gray-200 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  />
                </div>

                {/* Export (per message) */}
                {exp.id === m.id && exp.done ? (
                  <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-900 rounded-lg p-3 text-emerald-300 text-sm">
                    <Check size={15} /> Saved to {exp.done === "playbook" ? "Playbook" : "Blueprints"}. It now appears on that page.
                  </div>
                ) : exp.id === m.id && exp.choosing ? (
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-2.5">Save this solution as:</p>
                    {exp.error && <p className="text-red-400 text-xs mb-2">{exp.error}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => doExport(m, "playbook")} disabled={exp.exporting}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-semibold transition-colors disabled:opacity-50">
                        {exp.exporting ? <Loader2 size={13} className="animate-spin" /> : <BookOpen size={13} />} Playbook
                      </button>
                      <button onClick={() => doExport(m, "blueprint")} disabled={exp.exporting}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50">
                        {exp.exporting ? <Loader2 size={13} className="animate-spin" /> : <Layers size={13} />} Blueprint
                      </button>
                      <button onClick={() => setExp((e) => ({ ...e, id: "", choosing: false }))} disabled={exp.exporting}
                        className="px-3 py-2 rounded-lg text-gray-400 hover:text-white text-xs transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setExp({ id: m.id, choosing: true, exporting: false, done: null, error: null })}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition-colors">
                    <Download size={15} /> Export — Playbook or Blueprint
                  </button>
                )}
              </div>
            )
          )}

          {/* Loading bubble */}
          {loading && (
            <div className="flex items-center gap-2 text-gray-400 text-sm px-1">
              <Loader2 size={15} className="animate-spin text-indigo-400" />
              {lastAssistant() ? "Refining the draft…" : "Searching past solutions & drafting…"}
            </div>
          )}

          {error && <p className="text-red-400 text-xs px-1">{error}</p>}
        </div>

        {/* Composer */}
        <div className="border-t border-gray-800 p-3 shrink-0">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !loading) send(input); }}
              disabled={!request || loading}
              placeholder={!request ? "Pick a request above to start…" : hasMessages ? "Ask AI to refine… (e.g. add a rollout plan)" : "Describe what you need, or pick a suggestion above…"}
              className="flex-1 px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim() || !request}
              title={hasMessages ? "Refine" : "Generate"}
              className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : hasMessages ? <Send size={16} /> : <Wand2 size={16} />}
            </button>
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
