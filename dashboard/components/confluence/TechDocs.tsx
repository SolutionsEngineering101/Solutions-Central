"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X, Plus, Edit2, Save, Loader2, FileText,
  AlertCircle, Search, BookOpen, ExternalLink,
  MoreVertical, Trash2,
} from "lucide-react";
import type { SpacePage } from "@/lib/confluence";

interface PageView {
  id: string;
  title: string;
  version: number;
  body: string;
  url: string;
}

function htmlToEditableText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatWhen(when: string): string {
  if (!when) return "";
  const d = new Date(when);
  if (isNaN(d.getTime())) return when;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Buckets a page by the month/year of its last-updated date. Undated pages sort last.
function monthBucket(when?: string): { key: string; label: string; sort: number } {
  const d = when ? new Date(when) : null;
  if (!d || isNaN(d.getTime())) return { key: "undated", label: "Undated", sort: -Infinity };
  const y = d.getFullYear();
  const m = d.getMonth();
  return { key: `${y}-${m}`, label: `${MONTHS[m]} ${y}`, sort: y * 12 + m };
}

function SkeletonCard() {
  return (
    <div className="bg-surface-card border border-neutral-200 rounded-xl shadow-sm p-5 animate-pulse">
      <div className="h-4 bg-neutral-100 rounded w-3/4 mb-3" />
      <div className="h-3 bg-neutral-100 rounded w-full mb-2" />
      <div className="h-3 bg-neutral-100 rounded w-5/6 mb-4" />
      <div className="h-3 bg-neutral-100 rounded w-1/3" />
    </div>
  );
}

export function TechDocs() {
  const [pages, setPages] = useState<SpacePage[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<PageView | null>(null);
  const [panelMode, setPanelMode] = useState<"view" | "edit" | "new">("view");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const [listLoading, setListLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const autoEditRef = useRef(false);

  const closeMenu = () => { setOpenMenuId(null); setDeleteConfirmId(null); setMenuPos(null); };

  const toggleMenu = (id: string, btn: HTMLButtonElement) => {
    if (openMenuId === id) { closeMenu(); return; }
    const r = btn.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    setOpenMenuId(id);
    setDeleteConfirmId(null);
  };

  const HIDDEN_KEY = "techdocs_hidden_ids";

  const getHiddenIds = (): string[] => {
    try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]") as string[]; }
    catch { return []; }
  };

  const addHiddenId = (id: string) => {
    const next = Array.from(new Set([...getHiddenIds(), id]));
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
  };

  // Hides from this browser permanently — page stays in Confluence untouched
  const handleLocalDelete = (id: string) => {
    addHiddenId(id);
    setPages(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) closePanel();
    closeMenu();
  };

  // no document listener — menu is closed via a fixed backdrop rendered below the dropdown

  const panelOpen = selectedId !== null || panelMode === "new";

  const fetchPages = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch("/api/confluence/docs");
      const json = await res.json() as { pages?: SpacePage[]; error?: string };
      if (res.status === 503) { setNotConfigured(true); return; }
      if (!res.ok) throw new Error(json.error ?? "Failed to load pages");
      const hidden = getHiddenIds();
      setPages((json.pages ?? []).filter(p => !hidden.includes(p.id)));
    } catch (e) {
      setListError(e instanceof Error ? e.message : String(e));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const fetchPage = useCallback(async (id: string) => {
    setPageLoading(true);
    setPageError(null);
    setSelectedPage(null);
    try {
      const res = await fetch(`/api/confluence/docs?id=${encodeURIComponent(id)}`);
      const json = await res.json() as PageView & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load page");
      setSelectedPage(json);
      if (autoEditRef.current) {
        setEditTitle(json.title);
        setEditContent(htmlToEditableText(json.body));
        setPanelMode("edit");
        autoEditRef.current = false;
      }
    } catch (e) {
      setPageError(e instanceof Error ? e.message : String(e));
      autoEditRef.current = false;
    } finally {
      setPageLoading(false);
    }
  }, []);

  const openDoc = (id: string) => {
    setSelectedId(id);
    setPanelMode("view");
    setSaveError(null);
    fetchPage(id);
  };

  const openDocForEdit = (id: string) => {
    autoEditRef.current = true;
    setSelectedId(id);
    setPanelMode("view");
    setSaveError(null);
    fetchPage(id);
  };


  const closePanel = () => {
    setSelectedId(null);
    setSelectedPage(null);
    setPanelMode("view");
    setPageError(null);
    setSaveError(null);
    setNewTitle("");
    setNewContent("");
  };

  const startEdit = () => {
    if (!selectedPage) return;
    setEditTitle(selectedPage.title);
    setEditContent(htmlToEditableText(selectedPage.body));
    setPanelMode("edit");
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!selectedPage) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/confluence/docs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedPage.id, version: selectedPage.version, title: editTitle, content: editContent }),
      });
      const json = await res.json() as PageView & { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setSelectedPage({ id: json.id, title: json.title, version: json.version, body: json.body, url: json.url });
      setPages(prev => prev.map(p => p.id === json.id ? { ...p, title: json.title } : p));
      setPanelMode("view");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/confluence/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      const json = await res.json() as { ok?: boolean; id?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Create failed");
      await fetchPages();
      if (json.id) openDoc(json.id);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const filteredPages = pages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  // Group the visible pages into month/year buckets, newest month first,
  // and newest page first within each bucket.
  const groups = (() => {
    const map = new Map<string, { label: string; sort: number; pages: SpacePage[] }>();
    for (const p of filteredPages) {
      const { key, label, sort } = monthBucket(p.version?.when);
      if (!map.has(key)) map.set(key, { label, sort, pages: [] });
      map.get(key)!.pages.push(p);
    }
    const arr = [...map.values()];
    for (const g of arr) {
      g.pages.sort((a, b) =>
        new Date(b.version?.when ?? 0).getTime() - new Date(a.version?.when ?? 0).getTime()
      );
    }
    arr.sort((a, b) => b.sort - a.sort);
    return arr;
  })();

  const renderCard = (page: SpacePage) => {
    const active = page.id === selectedId;
    const menuOpen = openMenuId === page.id;
    return (
      <div
        key={page.id}
        className={`rounded-xl flex flex-col transition-all duration-200 ease-in-out p-5 ${
          active
            ? "bg-brand-25 border-2 border-brand-500"
            : "bg-surface-card border border-neutral-200 shadow-sm hover:border-brand-300 hover:shadow-md"
        }`}
      >
        {/* Title row: clickable title + three-dot button side by side */}
        <div className="flex items-start gap-2 mb-2">
          <p
            onClick={() => openDoc(page.id)}
            className={`font-semibold text-sm leading-snug line-clamp-2 flex-1 cursor-pointer transition-colors duration-200 ease-in-out ${active ? "text-brand-600" : "text-fg-primary hover:text-brand-600"}`}
          >
            {page.title}
          </p>

          {/* Three-dot */}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); toggleMenu(page.id, e.currentTarget); }}
            className={`p-1 rounded-md transition-colors duration-200 ease-in-out shrink-0 ${menuOpen ? "bg-neutral-200 text-fg-primary" : "text-fg-secondary hover:text-fg-primary hover:bg-neutral-100"}`}
          >
            <MoreVertical size={15} />
          </button>
        </div>

        {/* Excerpt + date — clickable */}
        <div onClick={() => openDoc(page.id)} className="cursor-pointer">
          {page.excerpt && (
            <p className="text-fg-secondary text-xs line-clamp-2 mb-3">{page.excerpt}</p>
          )}
          <p className="text-fg-secondary/70 text-xs">
            {page.version.when ? formatWhen(page.version.when) : ""}
            {page.version.by?.displayName ? ` · ${page.version.by.displayName}` : ""}
          </p>
        </div>
      </div>
    );
  };

  if (notConfigured) {
    return (
      <div className="bg-surface-card border border-neutral-200 rounded-xl shadow-sm p-8 max-w-xl">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-warning-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-fg-primary font-semibold text-sm mb-2">Tech Docs not configured</p>
            <p className="text-fg-secondary text-sm">
              Add <code className="text-brand-600 bg-neutral-100 px-1 rounded">CONFLUENCE_SPACE_KEY=&lt;key&gt;</code> to{" "}
              <code className="text-brand-600 bg-neutral-100 px-1 rounded">.env.local</code> and restart.
            </p>
            <p className="text-fg-secondary/70 text-xs mt-1">Space key appears in Confluence URLs: <code className="bg-neutral-100 px-1 rounded">/wiki/spaces/YOURKEY/…</code></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Scoped styles for rendered Confluence HTML */}
      <style>{`
        .conf-body { color: var(--text-primary); line-height: 1.75; }
        .conf-body a { color: var(--brand-500); text-decoration: underline; }
        .conf-body h1, .conf-body h2, .conf-body h3, .conf-body h4 {
          color: var(--text-primary); font-weight: 600; margin: 1.25rem 0 0.6rem;
        }
        .conf-body h1 { font-size: 1.35rem; }
        .conf-body h2 { font-size: 1.15rem; }
        .conf-body h3 { font-size: 1.05rem; }
        .conf-body p  { margin-bottom: 0.75rem; }
        .conf-body ul, .conf-body ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .conf-body li { margin-bottom: 0.2rem; }
        .conf-body table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.83rem; }
        .conf-body td, .conf-body th { border: 1px solid var(--neutral-300); padding: 0.45rem 0.7rem; }
        .conf-body th { background: var(--neutral-100); color: var(--text-secondary); font-weight: 600; }
        .conf-body code { background: var(--neutral-100); border: 1px solid var(--neutral-300); border-radius: 0.25rem; font-family: ui-monospace,monospace; font-size: 0.78rem; padding: 0.1rem 0.3rem; }
        .conf-body pre  { background: var(--neutral-100); border: 1px solid var(--neutral-300); border-radius: 0.5rem; font-family: ui-monospace,monospace; font-size: 0.78rem; padding: 1rem; overflow-x: auto; margin-bottom: 1rem; }
        .conf-body pre code { background: none; border: none; padding: 0; }
        .conf-body blockquote { border-left: 3px solid var(--brand-500); padding-left: 1rem; margin: 0 0 0.75rem; color: var(--text-secondary); }
        .conf-body img { max-width: 100%; border-radius: 0.5rem; }
        .conf-body hr  { border-color: var(--neutral-300); margin: 1.5rem 0; }
      `}</style>

      {/* ── Page list (always visible) ─────────────────────────────────── */}
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <BookOpen size={20} className="text-brand-500" />
            <h1 className="text-fg-primary text-2xl font-semibold">Tech Docs</h1>
            {!listLoading && pages.length > 0 && (
              <span className="text-xs text-fg-secondary bg-neutral-100 px-2 py-0.5 rounded-pill">{pages.length}</span>
            )}
          </div>
          <button
            onClick={() => { setPanelMode("new"); setSelectedId(null); setSelectedPage(null); setNewTitle(""); setNewContent(""); setSaveError(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors duration-200 ease-in-out"
          >
            <Plus size={14} />
            New Document
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full pl-9 pr-9 py-2.5 bg-surface-card border border-neutral-300 rounded-lg text-sm text-fg-primary placeholder:text-fg-secondary focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)] transition-colors duration-200 ease-in-out"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-secondary hover:text-fg-primary transition-colors duration-150 ease-in-out">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Error */}
        {listError && (
          <div className="flex items-start gap-2 bg-error-25 border border-error-200 rounded-lg p-4 max-w-xl">
            <AlertCircle size={14} className="text-error-500 shrink-0 mt-0.5" />
            <p className="text-error-600 text-sm">{listError}</p>
          </div>
        )}

        {/* Skeletons */}
        {listLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!listLoading && !listError && pages.length === 0 && (
          <div className="border border-dashed border-neutral-300 rounded-xl p-16 text-center">
            <FileText size={30} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-fg-secondary text-sm">No documents found in this space.</p>
          </div>
        )}

        {/* No results */}
        {!listLoading && pages.length > 0 && filteredPages.length === 0 && (
          <div className="border border-dashed border-neutral-300 rounded-xl p-12 text-center">
            <Search size={26} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-fg-secondary text-sm">No documents match your search.</p>
          </div>
        )}

        {/* Cards — grouped into month/year buckets */}
        {!listLoading && filteredPages.length > 0 && (
          <div className="space-y-8">
            {groups.map(group => (
              <section key={group.label}>
                {/* Bucket header */}
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-sm font-semibold text-fg-primary whitespace-nowrap">{group.label}</h2>
                  <span className="text-[11px] text-fg-secondary bg-neutral-100 px-2 py-0.5 rounded-pill tabular-nums">
                    {group.pages.length}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-neutral-200 to-transparent" />
                </div>
                {/* Cards in this bucket */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.pages.map(renderCard)}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* ── Three-dot backdrop + fixed dropdown ───────────────────────── */}
      {openMenuId && menuPos && (
        <>
          {/* Transparent backdrop — closes the menu on any outside click */}
          <div className="fixed inset-0" style={{ zIndex: 998 }} onClick={closeMenu} />

          {/* Dropdown rendered fixed so overflow-y-auto on <main> can't clip it */}
          <div
            style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 999 }}
            className="bg-surface-card border border-neutral-200 rounded-lg shadow-2xl py-1 w-56"
            onClick={e => e.stopPropagation()}
          >
            {deleteConfirmId === openMenuId ? (
              <div className="px-3 py-2.5">
                <p className="text-fg-primary text-xs font-medium mb-0.5">Remove from view?</p>
                <p className="text-fg-secondary/70 text-[11px] mb-2.5">The page stays in Confluence.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 px-2 py-1.5 text-xs text-fg-secondary hover:text-fg-primary rounded-md hover:bg-neutral-100 transition-colors duration-200 ease-in-out"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLocalDelete(openMenuId)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-white font-semibold bg-error-500 hover:bg-error-600 rounded-md transition-colors duration-200 ease-in-out"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { openDocForEdit(openMenuId); closeMenu(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-fg-secondary hover:text-fg-primary hover:bg-neutral-100 transition-colors duration-200 ease-in-out"
                >
                  <Edit2 size={13} className="text-fg-secondary" /> Edit
                </button>
                {pages.find(p => p.id === openMenuId)?.url && (
                  <a
                    href={pages.find(p => p.id === openMenuId)!.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-fg-secondary hover:text-fg-primary hover:bg-neutral-100 transition-colors duration-200 ease-in-out"
                  >
                    <ExternalLink size={13} className="text-fg-secondary" /> Open in Confluence
                  </a>
                )}
                <div className="border-t border-neutral-200 my-1" />
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(openMenuId)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-error-600 hover:text-error-500 hover:bg-error-25 transition-colors duration-200 ease-in-out"
                >
                  <Trash2 size={13} /> Remove from view
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Backdrop ───────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 bg-[var(--overlay-modal)] z-40 transition-opacity duration-300 ease-in-out ${panelOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={closePanel}
      />

      {/* ── Slide-in panel ─────────────────────────────────────────────── */}
      <div
        className="fixed top-0 right-0 h-screen bg-surface-card border-l border-neutral-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{ width: "62%", transform: panelOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-neutral-200 shrink-0">
          <div className="min-w-0 flex-1">
            {panelMode === "new" && <p className="text-fg-primary font-semibold text-sm">New Document</p>}
            {panelMode === "edit" && <p className="text-brand-600 font-semibold text-sm">Editing</p>}
            {panelMode === "view" && (
              selectedPage
                ? <p className="text-fg-primary font-semibold text-sm truncate">{selectedPage.title}</p>
                : <div className="h-4 w-40 bg-neutral-100 rounded animate-pulse" />
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View mode actions */}
            {panelMode === "view" && selectedPage && (
              <>
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-fg-secondary hover:text-fg-primary text-xs font-medium transition-colors duration-200 ease-in-out"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <a
                  href={selectedPage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-fg-secondary hover:text-fg-primary text-xs font-medium transition-colors duration-200 ease-in-out"
                >
                  <ExternalLink size={12} /> Confluence
                </a>
              </>
            )}
            {/* Edit mode actions — in header so they're always visible */}
            {panelMode === "edit" && (
              <>
                <button
                  onClick={() => { setPanelMode("view"); setSaveError(null); }}
                  className="px-3 py-1.5 rounded-lg text-fg-secondary hover:text-fg-primary hover:bg-neutral-100 text-xs font-medium transition-colors duration-200 ease-in-out"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition-colors duration-200 ease-in-out disabled:opacity-50"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save to Confluence
                </button>
              </>
            )}
            {/* New form actions — in header */}
            {panelMode === "new" && (
              <>
                <button
                  onClick={closePanel}
                  className="px-3 py-1.5 rounded-lg text-fg-secondary hover:text-fg-primary hover:bg-neutral-100 text-xs font-medium transition-colors duration-200 ease-in-out"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !newTitle.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg transition-colors duration-200 ease-in-out disabled:opacity-50"
                >
                  {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Create
                </button>
              </>
            )}
            <button
              onClick={closePanel}
              className="p-1.5 rounded-lg text-fg-secondary hover:text-fg-primary hover:bg-neutral-100 transition-colors duration-200 ease-in-out ml-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Panel body — flex column so textarea can fill remaining height */}
        <div className="flex-1 min-h-0 flex flex-col px-6 py-5 gap-4">

          {/* ── New document form ──────────────────────────────────────── */}
          {panelMode === "new" && (
            <>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-fg-secondary mb-1.5">Title</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Document title"
                  className="w-full px-4 py-2.5 bg-surface-card border border-neutral-300 rounded-lg text-fg-primary placeholder:text-fg-secondary focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)] transition-colors duration-200 ease-in-out text-sm"
                />
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-fg-secondary mb-1.5">Content</label>
                <textarea
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder={"Write your document content here…\n\nSeparate paragraphs with a blank line."}
                  className="flex-1 w-full px-4 py-3 bg-surface-card border border-neutral-300 rounded-lg text-fg-primary placeholder:text-fg-secondary focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)] transition-colors duration-200 ease-in-out text-sm font-mono resize-none"
                />
              </div>
              {saveError && (
                <div className="flex items-start gap-2 bg-error-25 border border-error-200 rounded-lg p-3 shrink-0">
                  <AlertCircle size={14} className="text-error-500 shrink-0 mt-0.5" />
                  <p className="text-error-600 text-sm">{saveError}</p>
                </div>
              )}
            </>
          )}

          {/* ── Doc viewer ─────────────────────────────────────────────── */}
          {panelMode === "view" && (
            <div className="flex-1 overflow-y-auto">
              {pageLoading && (
                <div className="flex items-center justify-center h-48 gap-3 text-fg-secondary">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Loading document…</span>
                </div>
              )}
              {pageError && (
                <div className="flex items-start gap-2 bg-error-25 border border-error-200 rounded-lg p-4">
                  <AlertCircle size={14} className="text-error-500 shrink-0 mt-0.5" />
                  <p className="text-error-600 text-sm">{pageError}</p>
                </div>
              )}
              {selectedPage && !pageLoading && (
                <div className="conf-body" dangerouslySetInnerHTML={{ __html: selectedPage.body }} />
              )}
            </div>
          )}

          {/* ── Edit mode ──────────────────────────────────────────────── */}
          {panelMode === "edit" && (
            <>
              <div className="shrink-0">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-fg-secondary mb-1.5">Title</label>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-card border border-neutral-300 rounded-lg text-fg-primary focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)] transition-colors duration-200 ease-in-out text-sm font-semibold"
                />
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-fg-secondary mb-1.5">Content</label>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="flex-1 w-full px-4 py-3 bg-surface-card border border-neutral-300 rounded-lg text-fg-primary focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_4px_var(--color-focus)] transition-colors duration-200 ease-in-out text-sm font-mono resize-none"
                />
              </div>
              <p className="text-fg-secondary/70 text-xs shrink-0">
                Paragraphs separated by blank lines will be preserved. For rich formatting, edit directly in Confluence.
              </p>
              {saveError && (
                <div className="flex items-start gap-2 bg-error-25 border border-error-200 rounded-lg p-3 shrink-0">
                  <AlertCircle size={14} className="text-error-500 shrink-0 mt-0.5" />
                  <p className="text-error-600 text-sm">{saveError}</p>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}
