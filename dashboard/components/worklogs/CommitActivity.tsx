"use client";

import { useState, useEffect } from "react";
import { Loader2, GitCommit, ChevronRight, FilePlus2, FileMinus2, FilePen, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

interface Commit {
  sha: string;
  message: string;
  fullMessage: string;
  author: string;
  login: string | null;
  avatarUrl: string | null;
  date: string;
}
interface FileChange { filename: string; status: string; additions: number; deletions: number }

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Earlier";
  const today = new Date(); const yest = new Date(); yest.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, yest)) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
function timeLabel(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function initials(name: string): string {
  return (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
const STATUS_ICON: Record<string, { Icon: typeof FilePlus2; color: string }> = {
  added: { Icon: FilePlus2, color: "var(--success-500)" },
  removed: { Icon: FileMinus2, color: "var(--error-500)" },
  modified: { Icon: FilePen, color: "var(--warning-500)" },
  renamed: { Icon: FilePen, color: "var(--brand-400)" },
};

export function CommitActivity() {
  const [commits, setCommits] = useState<Commit[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openSha, setOpenSha] = useState<string | null>(null);
  const [filesBySha, setFilesBySha] = useState<Record<string, FileChange[]>>({});
  const [filesLoading, setFilesLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/github/commits");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load activity");
      setCommits(json.commits ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (sha: string) => {
    if (openSha === sha) { setOpenSha(null); return; }
    setOpenSha(sha);
    if (!filesBySha[sha]) {
      setFilesLoading(sha);
      try {
        const res = await fetch(`/api/github/commits?sha=${sha}`);
        const json = await res.json();
        if (res.ok) setFilesBySha((p) => ({ ...p, [sha]: json.files ?? [] }));
      } finally { setFilesLoading(null); }
    }
  };

  // group by day
  const groups: { day: string; items: Commit[] }[] = [];
  for (const c of commits ?? []) {
    const day = dayLabel(c.date);
    const g = groups.find((x) => x.day === day);
    if (g) g.items.push(c); else groups.push({ day, items: [c] });
  }

  return (
    <Card compact>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitCommit size={16} className="text-brand-500" />
          <CardTitle className="text-[length:var(--font-size-md)] font-semibold">Recent Activity</CardTitle>
          <span className="text-[11px] text-fg-secondary">who pushed what</span>
        </div>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-fg-secondary hover:text-fg-primary hover:bg-neutral-100 transition-colors duration-200 ease-in-out" title="Refresh">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && <div className="flex items-center gap-2 text-fg-secondary text-sm py-6 justify-center"><Loader2 size={16} className="animate-spin" /> Loading commits…</div>}
      {error && <Alert variant="error" icon={<AlertCircle size={14} />}>{error}</Alert>}

      {!loading && !error && (
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.day}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-secondary mb-2">{g.day}</p>
              <div className="space-y-1">
                {g.items.map((c) => {
                  const open = openSha === c.sha;
                  const files = filesBySha[c.sha];
                  return (
                    <div key={c.sha} className="rounded-lg bg-neutral-100 border border-neutral-200">
                      <button onClick={() => toggle(c.sha)} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-neutral-200/60 transition-colors duration-200 ease-in-out rounded-lg">
                        {c.avatarUrl
                          ? <img src={c.avatarUrl} alt="" className="w-6 h-6 rounded-pill shrink-0 mt-0.5" />
                          : <div className="w-6 h-6 rounded-pill bg-brand-500 flex items-center justify-center shrink-0 mt-0.5"><span className="text-white text-[9px] font-semibold">{initials(c.author)}</span></div>}
                        <div className="min-w-0 flex-1">
                          <p className="text-fg-primary text-sm truncate">{c.message}</p>
                          <p className="text-[11px] text-fg-secondary mt-0.5">
                            <span className="text-fg-secondary">{c.author}</span> · {timeLabel(c.date)} · <span className="font-mono">{c.sha.slice(0, 7)}</span>
                          </p>
                        </div>
                        <ChevronRight size={14} className={`text-fg-secondary shrink-0 mt-1 transition-transform duration-200 ease-in-out ${open ? "rotate-90" : ""}`} />
                      </button>
                      {open && (
                        <div className="px-3 pb-3 pt-1 border-t border-neutral-200/60">
                          {filesLoading === c.sha ? (
                            <p className="text-fg-secondary text-xs flex items-center gap-1.5 py-1"><Loader2 size={11} className="animate-spin" /> Loading changes…</p>
                          ) : files && files.length > 0 ? (
                            <ul className="space-y-1 mt-1">
                              {files.map((f) => {
                                const meta = STATUS_ICON[f.status] ?? STATUS_ICON.modified;
                                return (
                                  <li key={f.filename} className="flex items-center gap-2 text-xs">
                                    <meta.Icon size={12} style={{ color: meta.color }} className="shrink-0" />
                                    <span className="text-fg-secondary truncate flex-1 font-mono">{f.filename}</span>
                                    {f.additions > 0 && <span className="text-success-500 shrink-0">+{f.additions}</span>}
                                    {f.deletions > 0 && <span className="text-error-500 shrink-0">−{f.deletions}</span>}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-fg-secondary text-xs py-1">No file changes.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {groups.length === 0 && <p className="text-fg-secondary text-sm">No commits found.</p>}
        </div>
      )}
    </Card>
  );
}
