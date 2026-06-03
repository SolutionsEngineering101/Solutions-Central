"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, Check, AlertCircle, UserCog, ChevronDown } from "lucide-react";

interface Member {
  slug: string;
  name: string;
  role: string;
  email: string;
  updated: string;
  content: string;
}

// The profile sections, in the order they're written back to the file.
const SECTIONS = [
  { key: "Core Skills", hint: "One per line, e.g. - API integrations" },
  { key: "Product Knowledge", hint: "Products / platforms you know" },
  { key: "Technical Capabilities", hint: "Tools, languages, integrations" },
  { key: "Client / Domain Experience", hint: "Industries / client types" },
  { key: "Focus / Working On", hint: "What you want to work on / learn next" },
  { key: "Past Solutions Led", hint: "Links to blueprints / playbook entries" },
  { key: "Notes", hint: "Anything else" },
] as const;

const LS_KEY = "sc_profile_member";

// Split a profile body into { "Section Heading": "content" }.
function parseSections(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  let cur: string | null = null;
  let buf: string[] = [];
  for (const line of content.split("\n")) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      if (cur) out[cur] = buf.join("\n").trim();
      cur = m[1].trim();
      buf = [];
    } else if (cur) {
      buf.push(line);
    }
  }
  if (cur) out[cur] = buf.join("\n").trim();
  return out;
}

export function ProfileSettings() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [slug, setSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // editable fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [sections, setSections] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load a member's data into the editable form.
  const loadMember = useCallback((m: Member) => {
    setName(m.name);
    setRole(m.role);
    setEmail(m.email);
    const parsed = parseSections(m.content);
    const next: Record<string, string> = {};
    for (const s of SECTIONS) next[s.key] = parsed[s.key] ?? "";
    setSections(next);
    setSaved(false);
    setSaveError(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/github/profile");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load profiles");
        const list: Member[] = json.members ?? [];
        setMembers(list);
        const remembered = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
        const pick = list.find((m) => m.slug === remembered) ?? list[0];
        if (pick) { setSlug(pick.slug); loadMember(pick); }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [loadMember]);

  const switchMember = (newSlug: string) => {
    const m = members?.find((x) => x.slug === newSlug);
    if (!m) return;
    setSlug(newSlug);
    localStorage.setItem(LS_KEY, newSlug);
    loadMember(m);
  };

  const save = async () => {
    setSaving(true); setSaveError(null); setSaved(false);
    try {
      const body = SECTIONS.map((s) => `## ${s.key}\n${(sections[s.key] ?? "").trim()}`).join("\n\n");
      const res = await fetch("/api/github/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, role, email, body }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Save failed");
      setSaved(true);
      // reflect the new content locally so re-selecting doesn't show stale data
      setMembers((prev) => prev?.map((m) => m.slug === slug ? { ...m, name, role, email, content: `# ${name} — Capability Profile\n\n${body}` } : m) ?? prev);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" /> Loading your profile…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-start gap-2 bg-red-950/60 border border-red-900 rounded-lg p-4 max-w-xl">
        <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
        <p className="text-red-300 text-sm">{loadError}</p>
      </div>
    );
  }

  const initials = (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <UserCog size={20} className="text-indigo-400" />
          <h1 className="text-white text-2xl font-semibold">My Profile</h1>
        </div>
        {/* "You are" selector — the GitHub login is a shared org account */}
        <label className="flex items-center gap-2 text-xs text-gray-500">
          You are
          <div className="relative">
            <select
              value={slug}
              onChange={(e) => switchMember(e.target.value)}
              className="appearance-none bg-gray-900 border border-gray-800 rounded-lg pl-3 pr-8 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-600"
            >
              {members?.map((m) => <option key={m.slug} value={m.slug}>{m.name || m.slug}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </label>
      </div>

      {/* Identity card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white font-semibold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium">{name || "—"}</p>
            <p className="text-gray-500 text-xs">{role || "Role not set"}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Name" value={name} onChange={setName} />
          <Field label="Role" value={role} onChange={setRole} />
          <Field label="Email" value={email} onChange={setEmail} />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <div key={s.key} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-baseline justify-between mb-2">
              <label className="text-white text-sm font-medium">{s.key}</label>
              <span className="text-[11px] text-gray-600">{s.hint}</span>
            </div>
            <textarea
              value={sections[s.key] ?? ""}
              onChange={(e) => setSections((p) => ({ ...p, [s.key]: e.target.value }))}
              rows={s.key === "Notes" ? 3 : 4}
              placeholder={`- …`}
              className="w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
            />
          </div>
        ))}
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-3 sticky bottom-0 bg-gray-950/90 backdrop-blur py-3 -mx-1 px-1">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save profile
        </button>
        {saved && <span className="flex items-center gap-1.5 text-emerald-400 text-sm"><Check size={15} /> Saved to the repo — visible on Team &amp; Skills.</span>}
        {saveError && <span className="flex items-center gap-1.5 text-red-400 text-sm"><AlertCircle size={15} /> {saveError}</span>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
