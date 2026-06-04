"use client";

import { useState, useEffect } from "react";
import { Loader2, GitCommit, ChevronRight, FilePlus2, FileMinus2, FilePen, AlertCircle, RefreshCw } from "lucide-react";

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
  added: { Icon: FilePlus2, color: "#34d399" },
  removed: { Icon: FileMinus2, color: "#f87171" },
  modified: { Icon: FilePen, color: "#fbbf24" },
  renamed: { Icon: FilePen, color: "#818cf8" },
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitCommit size={16} className="text-indigo-400" />
          <h2 className="text-white font-semibold">Recent Activity</h2>
          <span className="text-[11px] text-gray-500">who pushed what</span>
        </div>
        <button onClick={load} disabled={loading} className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-gray-800 transition-colors" title="Refresh">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && <div className="flex items-center gap-2 text-gray-500 text-sm py-6 justify-center"><Loader2 size={16} className="animate-spin" /> Loading commits…</div>}
      {error && <div className="flex items-start gap-2 text-red-400 text-sm"><AlertCircle size={14} className="shrink-0 mt-0.5" />{error}</div>}

      {!loading && !error && (
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.day}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-600 mb-2">{g.day}</p>
              <div className="space-y-1">
                {g.items.map((c) => {
                  const open = openSha === c.sha;
                  const files = filesBySha[c.sha];
                  return (
                    <div key={c.sha} className="rounded-lg bg-gray-950 border border-gray-800">
                      <button onClick={() => toggle(c.sha)} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-900/60 transition-colors rounded-lg">
                        {c.avatarUrl
                          ? <img src={c.avatarUrl} alt="" className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
                          : <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5"><span className="text-white text-[9px] font-semibold">{initials(c.author)}</span></div>}
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-200 text-sm truncate">{c.message}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            <span className="text-gray-400">{c.author}</span> · {timeLabel(c.date)} · <span className="font-mono">{c.sha.slice(0, 7)}</span>
                          </p>
                        </div>
                        <ChevronRight size={14} className={`text-gray-600 shrink-0 mt-1 transition-transform ${open ? "rotate-90" : ""}`} />
                      </button>
                      {open && (
                        <div className="px-3 pb-3 pt-1 border-t border-gray-800/60">
                          {filesLoading === c.sha ? (
                            <p className="text-gray-600 text-xs flex items-center gap-1.5 py-1"><Loader2 size={11} className="animate-spin" /> Loading changes…</p>
                          ) : files && files.length > 0 ? (
                            <ul className="space-y-1 mt-1">
                              {files.map((f) => {
                                const meta = STATUS_ICON[f.status] ?? STATUS_ICON.modified;
                                return (
                                  <li key={f.filename} className="flex items-center gap-2 text-xs">
                                    <meta.Icon size={12} style={{ color: meta.color }} className="shrink-0" />
                                    <span className="text-gray-400 truncate flex-1 font-mono">{f.filename}</span>
                                    {f.additions > 0 && <span className="text-emerald-400 shrink-0">+{f.additions}</span>}
                                    {f.deletions > 0 && <span className="text-red-400 shrink-0">−{f.deletions}</span>}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-gray-600 text-xs py-1">No file changes.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {groups.length === 0 && <p className="text-gray-600 text-sm">No commits found.</p>}
        </div>
      )}
    </div>
  );
}
