"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BrainCircuit, FileText, BookOpen, Layers, Globe, Send, RefreshCw, AlertCircle, Database } from "lucide-react";
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
  return <Globe size={11} className={cls} />;
}

const SUGGESTIONS = [
  "What solutions have we delivered for gamification?",
  "Show me past work for retail or FMCG clients",
  "What playbook entries exist for onboarding?",
];

export function KnowledgeHub({ initialStats }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rebuilding, setRebuilding] = useState(false);
  const [stats, setStats] = useState<KnowledgeStats | null>(initialStats);
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
        body: JSON.stringify({ query: q, history }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setMessages((m) => [...m, { id: uid(), role: "assistant", text: json.answer, sources: json.sources }]);
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
      const res = await fetch("/api/knowledge/build", { method: "POST" });
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 rounded-lg">
            <BrainCircuit size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg leading-none">Knowledge Hub</h1>
            {stats ? (
              <p className="text-gray-500 text-xs mt-1">
                {stats.bySource.form} forms · {stats.bySource.playbook} playbook · {stats.bySource.blueprint} blueprints · {stats.bySource.confluence} Confluence
                {builtDate && <span className="ml-2 text-gray-600">— indexed {builtDate}</span>}
              </p>
            ) : (
              <p className="text-amber-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> Index not built — click Rebuild to get started
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleRebuild}
          disabled={rebuilding}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs bg-gray-800 text-gray-300
                     hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-wait transition-colors"
          aria-label="Rebuild knowledge index"
        >
          <RefreshCw size={12} className={rebuilding ? "animate-spin" : ""} />
          {rebuilding ? "Rebuilding…" : "Rebuild Index"}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-3 px-3 py-2 rounded-md bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-start gap-2 shrink-0">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Chat thread */}
      <div className="flex-1 min-h-0 overflow-y-auto py-5 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div>
              <Database size={36} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">Ask anything about the team's knowledge</p>
              <p className="text-gray-600 text-xs mt-1">Solution requests, playbook entries, blueprints, and Confluence docs</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-4 py-2.5 rounded-lg border border-gray-700 text-gray-400 text-sm
                             hover:border-indigo-600 hover:text-white transition-colors text-left"
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
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-gray-900 border border-gray-800 text-gray-200 rounded-bl-sm"
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
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]
                                   bg-gray-800 border border-gray-700 text-gray-300
                                   hover:border-indigo-500 hover:text-white transition-colors"
                      >
                        <SourceIcon source={s.source} />
                        <span className="truncate max-w-[160px]">{s.title}</span>
                      </a>
                    ) : (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]
                                   bg-gray-800 border border-gray-700 text-gray-400"
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
            <div className="bg-gray-900 border border-gray-800 rounded-xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="pt-3 border-t border-gray-800 shrink-0">
        <div className="flex items-end gap-2 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3
                        focus-within:border-indigo-600 transition-colors">
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about solutions, clients, playbook, blueprints…"
            aria-label="Ask the knowledge base"
            rows={1}
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 resize-none outline-none
                       leading-relaxed max-h-32 overflow-y-auto"
            style={{ minHeight: "1.5rem" }}
          />
          <button
            onClick={() => send()}
            disabled={!query.trim() || loading}
            className="shrink-0 p-1.5 rounded-lg bg-indigo-600 text-white
                       hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-gray-600 text-[10px] mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
