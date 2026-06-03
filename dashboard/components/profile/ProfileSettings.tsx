"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import {
  Loader2, Save, Check, AlertCircle, UserCog, ChevronDown, Pencil, X,
  FileText, Sparkles, Plus, Ticket, ExternalLink, FolderOpen,
} from "lucide-react";

interface Member { slug: string; name: string; role: string; email: string; updated: string; content: string }
interface MemberFile { name: string; path: string; title: string; updated: string; content: string }
interface MyTicket { id: string; client: string; status: string; brief: string }

const SECTIONS = [
  { key: "Core Skills", hint: "One per line" },
  { key: "Product Knowledge", hint: "Products / platforms" },
  { key: "Technical Capabilities", hint: "Tools, languages, integrations" },
  { key: "Client / Domain Experience", hint: "Industries / client types" },
  { key: "Focus / Working On", hint: "What you want to work on next" },
  { key: "Past Solutions Led", hint: "Blueprint / playbook links" },
  { key: "Notes", hint: "Anything else" },
] as const;

const LS_KEY = "sc_profile_member";

function parseSections(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  let cur: string | null = null, buf: string[] = [];
  for (const line of content.split("\n")) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) { if (cur) out[cur] = buf.join("\n").trim(); cur = m[1].trim(); buf = []; }
    else if (cur) buf.push(line);
  }
  if (cur) out[cur] = buf.join("\n").trim();
  return out;
}

function stripFrontmatter(md: string): string {
  return md.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
}

// Tiny markdown renderer (headings, bullets, bold, links) for a clean read view.
function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i} className="text-white">{p.slice(2, -2)}</strong>;
    const link = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{link[1]}</a>;
    return <span key={i}>{p}</span>;
  });
}
function MarkdownView({ md }: { md: string }) {
  const lines = stripFrontmatter(md).split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      blocks.push(<ul key={blocks.length} className="list-disc pl-5 space-y-1 text-gray-300 text-sm">{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>);
      list = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^#\s/.test(line)) { flush(); blocks.push(<h2 key={blocks.length} className="text-white font-semibold text-lg mt-4 first:mt-0">{line.replace(/^#\s/, "")}</h2>); }
    else if (/^##\s/.test(line)) { flush(); blocks.push(<h3 key={blocks.length} className="text-indigo-300 font-semibold text-sm uppercase tracking-wide mt-4">{line.replace(/^##\s/, "")}</h3>); }
    else if (/^###\s/.test(line)) { flush(); blocks.push(<h4 key={blocks.length} className="text-gray-200 font-medium text-sm mt-3">{line.replace(/^###\s/, "")}</h4>); }
    else if (/^[-*]\s/.test(line)) list.push(line.replace(/^[-*]\s/, ""));
    else if (line.trim() === "") flush();
    else { flush(); blocks.push(<p key={blocks.length} className="text-gray-300 text-sm leading-relaxed">{inline(line)}</p>); }
  }
  flush();
  return <div className="space-y-2">{blocks}</div>;
}

export function ProfileSettings() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // capability profile edit state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [sections, setSections] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // tickets + files
  const [allForms, setAllForms] = useState<{ frontmatter: Record<string, unknown>; content: string }[]>([]);
  const [files, setFiles] = useState<MemberFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  // file viewer + editor
  const [viewing, setViewing] = useState<MemberFile | null>(null);
  const [editor, setEditor] = useState<null | { filename: string; content: string }>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [savingFile, setSavingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const selected = members?.find((m) => m.slug === slug) ?? null;

  const loadMember = useCallback((m: Member) => {
    setName(m.name); setRole(m.role); setEmail(m.email);
    const parsed = parseSections(m.content);
    const next: Record<string, string> = {};
    for (const s of SECTIONS) next[s.key] = parsed[s.key] ?? "";
    setSections(next);
    setEditing(false); setProfileMsg(null);
  }, []);

  const loadFiles = useCallback(async (s: string) => {
    setFilesLoading(true);
    try {
      const res = await fetch(`/api/github/profile?member=${encodeURIComponent(s)}`);
      const json = await res.json();
      setFiles(res.ok ? (json.files ?? []) : []);
    } catch { setFiles([]); }
    finally { setFilesLoading(false); }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          fetch("/api/github/profile"),
          fetch("/api/github/solutions"),
        ]);
        const pJson = await pRes.json();
        if (!pRes.ok) throw new Error(pJson.error ?? "Failed to load profiles");
        const list: Member[] = pJson.members ?? [];
        setMembers(list);
        if (sRes.ok) { const sJson = await sRes.json(); setAllForms((sJson.forms ?? []).filter((f: { path: string }) => !f.path.includes("skeleton-"))); }
        const remembered = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
        const pick = list.find((m) => m.slug === remembered) ?? list[0];
        if (pick) { setSlug(pick.slug); loadMember(pick); loadFiles(pick.slug); }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : String(e));
      } finally { setLoading(false); }
    })();
  }, [loadMember, loadFiles]);

  const switchMember = (s: string) => {
    const m = members?.find((x) => x.slug === s);
    if (!m) return;
    setSlug(s); localStorage.setItem(LS_KEY, s);
    loadMember(m); loadFiles(s);
    setViewing(null); setEditor(null);
  };

  // Tickets this member worked on (SPOC by first name, or submitted_by full name).
  const firstName = (name || "").trim().split(" ")[0].toLowerCase();
  const myTickets: MyTicket[] = allForms
    .filter((f) => {
      const spoc = String(f.frontmatter.solution_spoc ?? "").toLowerCase();
      const by = String(f.frontmatter.submitted_by ?? "").toLowerCase();
      return (firstName && spoc.includes(firstName)) || (name && by.includes(name.toLowerCase()));
    })
    .map((f) => ({
      id: String(f.frontmatter.form_id ?? ""),
      client: String(f.frontmatter.client ?? f.frontmatter.client_name ?? "—"),
      status: String(f.frontmatter.status ?? ""),
      brief: String(f.frontmatter.description ?? f.frontmatter.brief ?? "").slice(0, 120),
    }));

  const saveProfile = async () => {
    setSavingProfile(true); setProfileMsg(null);
    try {
      const body = SECTIONS.map((s) => `## ${s.key}\n${(sections[s.key] ?? "").trim()}`).join("\n\n");
      const res = await fetch("/api/github/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, role, email, body }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Save failed");
      setMembers((prev) => prev?.map((m) => m.slug === slug ? { ...m, name, role, email, content: `# ${name} — Capability Profile\n\n${body}` } : m) ?? prev);
      setProfileMsg({ ok: true, text: "Saved — visible on Team & Skills." });
      setEditing(false);
    } catch (e) {
      setProfileMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally { setSavingProfile(false); }
  };

  const draftSkillsWithAI = async () => {
    setEditor({ filename: "skills", content: "" });
    setAiLoading(true); setFileError(null);
    try {
      const res = await fetch("/api/ai/skills", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, role,
          currentSkills: selected?.content ?? "",
          tickets: myTickets.slice(0, 40).map((t) => ({ id: t.id, client: t.client, brief: t.brief })),
        }),
      });
      const json = await res.json();
      if (res.status === 503) throw new Error(json.error ?? "AI not configured");
      if (!res.ok) throw new Error(json.error ?? "AI request failed");
      setEditor({ filename: "skills", content: json.content ?? "" });
    } catch (e) {
      setFileError(e instanceof Error ? e.message : String(e));
    } finally { setAiLoading(false); }
  };

  const saveFile = async () => {
    if (!editor || !editor.content.trim()) return;
    setSavingFile(true); setFileError(null);
    try {
      const res = await fetch("/api/github/profile", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, filename: editor.filename || "untitled", content: editor.content }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Save failed");
      setEditor(null);
      await loadFiles(slug);
    } catch (e) {
      setFileError(e instanceof Error ? e.message : String(e));
    } finally { setSavingFile(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 gap-2 text-gray-500"><Loader2 size={18} className="animate-spin" /> Loading your profile…</div>;
  if (loadError) return <div className="flex items-start gap-2 bg-red-950/60 border border-red-900 rounded-lg p-4 max-w-xl"><AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" /><p className="text-red-300 text-sm">{loadError}</p></div>;

  const initials = (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-5xl space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2"><UserCog size={20} className="text-indigo-400" /><h1 className="text-white text-2xl font-semibold">My Profile</h1></div>
        <label className="flex items-center gap-2 text-xs text-gray-500">
          You are
          <div className="relative">
            <select value={slug} onChange={(e) => switchMember(e.target.value)}
              className="appearance-none bg-gray-900 border border-gray-800 rounded-lg pl-3 pr-8 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-600">
              {members?.map((m) => <option key={m.slug} value={m.slug}>{m.name || m.slug}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </label>
      </div>

      {/* Identity banner */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-900/40 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xl font-semibold">{name || "—"}</p>
            <p className="text-gray-400 text-sm">{role || "Role not set"}</p>
            {email && <p className="text-gray-600 text-xs mt-0.5">{email}</p>}
          </div>
          <div className="ml-auto flex gap-6 text-center">
            <div><p className="text-2xl font-bold text-indigo-300">{myTickets.length}</p><p className="text-[11px] text-gray-500 uppercase tracking-wide">Tickets</p></div>
            <div><p className="text-2xl font-bold text-emerald-300">{files.length}</p><p className="text-[11px] text-gray-500 uppercase tracking-wide">Files</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left: Skills + Tickets */}
        <div className="lg:col-span-2 space-y-5">

          {/* Skills */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Skills</h2>
              <div className="flex items-center gap-2">
                <button onClick={draftSkillsWithAI}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 text-xs font-medium transition-colors">
                  <Sparkles size={13} /> Draft skills.md with AI
                </button>
                {!editing && (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors">
                    <Pencil size={13} /> Edit
                  </button>
                )}
              </div>
            </div>

            {!editing ? (
              <MarkdownView md={selected?.content ?? ""} />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Name" value={name} onChange={setName} />
                  <Field label="Role" value={role} onChange={setRole} />
                  <Field label="Email" value={email} onChange={setEmail} />
                </div>
                {SECTIONS.map((s) => (
                  <div key={s.key}>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <label className="text-gray-300 text-sm font-medium">{s.key}</label>
                      <span className="text-[11px] text-gray-600">{s.hint}</span>
                    </div>
                    <textarea value={sections[s.key] ?? ""} onChange={(e) => setSections((p) => ({ ...p, [s.key]: e.target.value }))}
                      rows={s.key === "Notes" ? 2 : 3}
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <button onClick={saveProfile} disabled={savingProfile}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50">
                    {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                  </button>
                  <button onClick={() => selected && loadMember(selected)} className="text-gray-400 hover:text-white text-sm">Cancel</button>
                </div>
              </div>
            )}
            {profileMsg && (
              <p className={`flex items-center gap-1.5 text-sm mt-3 ${profileMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
                {profileMsg.ok ? <Check size={14} /> : <AlertCircle size={14} />} {profileMsg.text}
              </p>
            )}
          </div>

          {/* Tickets worked on */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4"><Ticket size={16} className="text-indigo-400" /><h2 className="text-white font-semibold">Tickets worked on</h2><span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{myTickets.length}</span></div>
            {myTickets.length === 0 ? (
              <p className="text-gray-600 text-sm">No tickets found for {name || "this member"}.</p>
            ) : (
              <div className="divide-y divide-gray-800/60 max-h-80 overflow-y-auto -mx-2">
                {myTickets.map((t, i) => (
                  <div key={t.id + i} className="flex items-center gap-3 px-2 py-2.5">
                    <span className="text-indigo-400 font-mono text-xs shrink-0 w-16">{t.id}</span>
                    <span className="text-gray-200 text-sm truncate flex-1">{t.client}</span>
                    {t.status && <span className="text-[11px] text-gray-500 shrink-0">{t.status}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: My Files */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><FolderOpen size={16} className="text-emerald-400" /><h2 className="text-white font-semibold">My Files</h2></div>
            <button onClick={() => { setEditor({ filename: "", content: "" }); setFileError(null); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors">
              <Plus size={13} /> New file
            </button>
          </div>
          {filesLoading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-4"><Loader2 size={14} className="animate-spin" /> Loading…</div>
          ) : files.length === 0 ? (
            <p className="text-gray-600 text-sm">No files yet. Create a <span className="text-gray-400">skills.md</span> or notes — saved to GitHub under your profile.</p>
          ) : (
            <div className="space-y-1.5">
              {files.map((f) => (
                <button key={f.path} onClick={() => setViewing(f)}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-950 border border-gray-800 hover:border-indigo-600 transition-colors">
                  <FileText size={13} className="text-gray-500 shrink-0" />
                  <span className="text-gray-200 text-sm truncate flex-1">{f.name}</span>
                  {f.updated && <span className="text-[10px] text-gray-600 shrink-0">{f.updated}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File viewer */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setViewing(null)} />
          <div className="relative w-full max-w-2xl h-full bg-gray-950 border-l border-gray-800 overflow-y-auto">
            <div className="sticky top-0 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-center justify-between gap-3">
              <p className="text-white font-semibold truncate">{viewing.name}</p>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => { setEditor({ filename: viewing.name.replace(/\.md$/, ""), content: viewing.content }); setViewing(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs"><Pencil size={12} /> Edit</button>
                <button onClick={() => setViewing(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
              </div>
            </div>
            <div className="px-6 py-5"><MarkdownView md={viewing.content} /></div>
          </div>
        </div>
      )}

      {/* File editor */}
      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !savingFile && setEditor(null)} />
          <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold flex items-center gap-2"><FileText size={16} className="text-indigo-400" /> Save a file</h2>
              <button onClick={() => setEditor(null)} disabled={savingFile} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input value={editor.filename} onChange={(e) => setEditor((p) => p && { ...p, filename: e.target.value })}
                placeholder="file name (e.g. skills)" className="flex-1 px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <span className="text-gray-600 text-sm">.md</span>
              <button onClick={draftSkillsWithAI} disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 text-xs font-medium disabled:opacity-50">
                {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} AI draft
              </button>
            </div>
            <textarea value={editor.content} onChange={(e) => setEditor((p) => p && { ...p, content: e.target.value })}
              placeholder={aiLoading ? "Drafting with AI…" : "# Title\n\nWrite Markdown here…"}
              className="flex-1 min-h-[300px] w-full px-3 py-3 bg-gray-950 border border-gray-800 rounded-lg text-gray-200 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            {fileError && <p className="text-red-400 text-xs mt-2">{fileError}</p>}
            <div className="flex items-center gap-3 mt-4">
              <button onClick={saveFile} disabled={savingFile || !editor.content.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50">
                {savingFile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save to GitHub
              </button>
              <button onClick={() => setEditor(null)} disabled={savingFile} className="text-gray-400 hover:text-white text-sm">Cancel</button>
              <span className="text-gray-600 text-xs ml-auto">Saved under skills/member/{slug}/</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    </div>
  );
}
