"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BrainCircuit, FileText, BookOpen, Layers, Globe, Send, RefreshCw, AlertCircle, Database, X, Zap, FileSpreadsheet } from "lucide-react";
import type { KnowledgeStats } from "@/app/knowledge/page";
import type { SourceRef } from "@/lib/knowledge";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: SourceRef[];
}

interface Props {
  initialStats: KnowledgeStats | null;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function SourceIcon({ source }: { source: SourceRef["source"] }) {
  const cls = "shrink-0";
  if (source === "form") return <FileText size={11} className={cls} />;
  if (source === "playbook") return <BookOpen size={11} className={cls} />;
  if (source === "blueprint") return <Layers size={11} className={cls} />;
  if (source === "rfp") return <FileSpreadsheet size={11} className={cls} />;
  return <Globe size={11} className={cls} />;
}

const SUGGESTIONS = [
  "Which clients in our intake have asked for recognition or rewards program integrations, and what did we deliver?",
  "What does the playbook say about handling integration challenges or blockers during client onboarding?",
  "Is there a pre-built blueprint for employee engagement or gamification use cases we can reuse?",
  "Summarise what the Confluence docs cover for the current sprint's active projects.",
];

export function KnowledgeHub({ initialStats }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rebuilding, setRebuilding] = useState(false);
  const [stats, setStats] = useState<KnowledgeStats | null>(initialStats);
  const [sessionMemory, setSessionMemory] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async (text?: string) => {
    const q = (text ?? query).trim();
    if (!q || loading) return;
    setQuery("");
    setError(null);
    const userMsg: ChatMsg = { id: uid(), role: "user", text: q };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const res = await fetch("/api/knowledge/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, history, memory: sessionMemory }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setMessages((m) => [...m, { id: uid(), role: "assistant", text: json.answer, sources: json.sources }]);
      if (Array.isArray(json.newFacts) && json.newFacts.length > 0) {
        setSessionMemory((prev) => {
          const merged = [...prev];
          for (const f of json.newFacts as string[]) {
            if (!merged.some((e) => e.toLowerCase() === f.toLowerCase())) merged.push(f);
          }
          return merged;
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setMessages((m) => m.filter((msg) => msg.id !== userMsg.id));
      setQuery(q);
    } finally {
      setLoading(false);
    }
  }, [query, loading, messages]);

  async function handleRebuild() {
    setRebuilding(true);
    setError(null);
    try {
      const res = await fetch("/api/knowledge/rebuild", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Rebuild failed");
      setStats({ chunkCount: json.chunkCount, builtAt: json.builtAt, bySource: json.bySource });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRebuilding(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const builtDate = stats?.builtAt
    ? new Date(stats.builtAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <div className="flex flex-col h-full bg-surface-card border border-neutral-200 rounded-xl shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-50 rounded-lg">
            <BrainCircuit size={20} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-fg-primary font-semibold text-lg leading-none">Knowledge Hub</h1>
            {stats ? (
              <p className="text-fg-secondary text-xs mt-1">
                {stats.bySource.form} forms · {stats.bySource.playbook} playbook · {stats.bySource.blueprint} blueprints · {stats.bySource.rfp ?? 0} RFPs · {stats.bySource.confluence} Confluence
                {builtDate && <span className="ml-2 text-fg-secondary/70">— indexed {builtDate}</span>}
              </p>
            ) : (
              <p className="text-warning-600 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> Index not built — click Rebuild to get started
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleRebuild}
          disabled={rebuilding}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs bg-neutral-100 text-fg-secondary
                     hover:bg-neutral-200 hover:text-fg-primary disabled:opacity-50 disabled:cursor-wait transition-colors duration-200 ease-in-out"
          aria-label="Rebuild knowledge index"
        >
          <RefreshCw size={12} className={rebuilding ? "animate-spin" : ""} />
          {rebuilding ? "Rebuilding…" : "Rebuild Index"}
        </button>
      </div>

      {/* Session memory strip */}
      {sessionMemory.length > 0 && (
        <div className="mt-3 flex items-start gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-warning-600 shrink-0 mt-0.5">
            <Zap size={12} />
            <span className="text-[11px] font-medium uppercase tracking-wider">Memory</span>
          </div>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {sessionMemory.map((fact, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px]
                           bg-warning-50 border border-warning-200 text-warning-600"
              >
                {fact}
                <button
                  onClick={() => setSessionMemory((m) => m.filter((_, j) => j !== i))}
                  className="text-warning-500 hover:text-warning-600 transition-colors duration-150 ease-in-out"
                  aria-label="Remove memory"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <button
              onClick={() => setSessionMemory([])}
              className="text-[11px] text-fg-secondary/70 hover:text-fg-secondary transition-colors duration-150 ease-in-out px-1"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mt-3 px-3 py-2 rounded-md bg-error-25 border border-error-200 text-error-600 text-xs flex items-start gap-2 shrink-0">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Chat thread */}
      <div className="flex-1 min-h-0 overflow-y-auto py-5 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div>
              <Database size={36} className="text-neutral-300 mx-auto mb-3" />
              <p className="text-fg-secondary text-sm font-medium">Ask anything about the team's knowledge</p>
              <p className="text-fg-secondary/70 text-xs mt-1">Solution requests, playbook entries, blueprints, RFPs, and Confluence docs</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-4 py-2.5 rounded-lg border border-neutral-200 text-fg-secondary text-sm
                             hover:border-brand-400 hover:text-fg-primary transition-colors duration-200 ease-in-out text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] ${msg.role === "user" ? "max-w-[65%]" : "w-full max-w-[85%]"}`}>
              <div
                className={`rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-brand-500 text-white rounded-br-sm"
                    : "bg-neutral-100 border border-neutral-200 text-fg-primary rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>

              {/* Source pills */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.sources.map((s) => (
                    s.url ? (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px]
                                   bg-neutral-100 border border-neutral-200 text-fg-secondary
                                   hover:border-brand-400 hover:text-fg-primary transition-colors duration-200 ease-in-out"
                      >
                        <SourceIcon source={s.source} />
                        <span className="truncate max-w-[160px]">{s.title}</span>
                      </a>
                    ) : (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px]
                                   bg-neutral-100 border border-neutral-200 text-fg-secondary"
                      >
                        <SourceIcon source={s.source} />
                        <span className="truncate max-w-[160px]">{s.title}</span>
                      </span>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start" role="status" aria-live="polite" aria-label="Loading answer">
            <div className="bg-neutral-100 border border-neutral-200 rounded-xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-pill bg-brand-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-pill bg-brand-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-pill bg-brand-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="pt-3 border-t border-neutral-200 shrink-0">
        <div className="flex items-end gap-2 bg-surface-card border border-neutral-300 rounded-xl px-4 py-3
                        focus-within:border-brand-500 transition-colors duration-200 ease-in-out">
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about solutions, clients, playbook, blueprints…"
            aria-label="Ask the knowledge base"
            rows={1}
            className="flex-1 bg-transparent text-fg-primary text-sm placeholder:text-fg-secondary resize-none outline-none
                       leading-relaxed max-h-32 overflow-y-auto"
            style={{ minHeight: "1.5rem" }}
          />
          <button
            onClick={() => send()}
            disabled={!query.trim() || loading}
            className="shrink-0 p-1.5 rounded-lg bg-brand-500 text-white
                       hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out"
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-fg-secondary/70 text-[10px] mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
