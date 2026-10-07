import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMarkdownFiles, writeJSON } from "@/lib/github";
import { listSpacePages } from "@/lib/confluence";
import { computeTf, type KnowledgeChunk, type KnowledgeIndex } from "@/lib/knowledge";

const OWNER = process.env.GITHUB_REPO_OWNER ?? "";
const REPO = process.env.GITHUB_REPO_NAME ?? "";
const CONFLUENCE_DOMAIN = process.env.CONFLUENCE_DOMAIN ?? "";
const CONFLUENCE_PAGE_ID = process.env.CONFLUENCE_PAGE_ID ?? "";

function ghUrl(path: string): string {
  return OWNER && REPO ? `https://github.com/${OWNER}/${REPO}/blob/main/${path}` : "";
}

function fmStr(fm: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = fm[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function clip(s: string, n: number): string {
  const t = s.replace(/#+\s*/g, "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) : t;
}

function makeChunk(
  id: string,
  source: KnowledgeChunk["source"],
  title: string,
  text: string,
  meta: KnowledgeChunk["meta"]
): KnowledgeChunk {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return { id, source, title, text: cleaned, meta, tf: computeTf(cleaned), len: cleaned.length };
}

// Split a long markdown doc into one chunk per ##/### section, and window any
// section longer than maxLen. Indexing only the first ~1.5k chars meant most of
// a long playbook or RFP was invisible to search.
function sectionChunks(content: string, maxLen = 2500): { heading: string; body: string }[] {
  const out: { heading: string; body: string }[] = [];
  for (const sec of content.split(/^(?=##+\s)/m)) {
    const heading = sec.match(/^##+\s+(.+)$/m)?.[1]?.trim() ?? "";
    const body = clip(heading ? sec.replace(/^##+\s+.+$/m, "") : sec, Infinity);
    if (!body) continue;
    if (body.length <= maxLen) { out.push({ heading, body }); continue; }
    for (let i = 0, part = 1; i < body.length; i += maxLen, part++) {
      out.push({ heading: `${heading || "Part"} (${part})`, body: body.slice(i, i + maxLen) });
    }
  }
  return out;
}

function docTitleOf(f: { path: string; content: string; frontmatter: Record<string, unknown> }): string {
  return fmStr(f.frontmatter, "title")
    || f.content.match(/^#\s+(.+)$/m)?.[1]?.trim()
    || f.path.split("/").pop()!.replace(/\.md$/, "");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [forms, playbook, blueprints, rfps, specs, confluencePages, documents, confluenceSync] = await Promise.all([
      getMarkdownFiles("intake/solutions-forms"),
      getMarkdownFiles("playbook/entries"),
      getMarkdownFiles("pre-built-solutions/blueprints"),
      getMarkdownFiles("rfps/entries"),
      getMarkdownFiles("product-information/specs"),
      listSpacePages(process.env.CONFLUENCE_SPACE_KEY ?? "PMT", CONFLUENCE_PAGE_ID ? [CONFLUENCE_PAGE_ID] : []).catch(() => []),
      getMarkdownFiles("documents"),
      getMarkdownFiles("intake/confluence-sync"),
    ]);

    const chunks: KnowledgeChunk[] = [];

    // ── Solution forms ──────────────────────────────────────────────────────────
    for (const f of forms) {
      if (f.path.includes("skeleton-") || f.path.endsWith("README.md")) continue;
      const fm = f.frontmatter;
      const id = `form:${fmStr(fm, "form_id") || f.path.split("/").pop()!.replace(/\.md$/, "")}`;
      const client = fmStr(fm, "client", "client_name");
      const feature = fmStr(fm, "feature_name");
      const status = fmStr(fm, "status");
      const complexity = fmStr(fm, "complexity");
      const dept = fmStr(fm, "department");
      const spoc = fmStr(fm, "solution_spoc", "vc_spoc");
      const text = [
        fmStr(fm, "form_id"), client, feature, dept, status, complexity, spoc,
        clip(f.content, 1800),
      ].filter(Boolean).join(" ");
      chunks.push(makeChunk(id, "form", client || id, text, {
        client, status, complexity, department: dept,
        date: fmStr(fm, "submitted_at"), url: ghUrl(f.path),
      }));
    }

    // ── Playbook ────────────────────────────────────────────────────────────────
    for (const p of playbook) {
      if (p.path.endsWith("README.md")) continue;
      const fm = p.frontmatter;
      const docTitle = docTitleOf(p);
      const tags = Array.isArray(fm.tags) ? (fm.tags as string[]).join(" ") : "";
      const author = fmStr(fm, "author");
      for (const { heading, body } of sectionChunks(p.content)) {
        const title = heading ? `${docTitle} — ${heading}` : docTitle;
        const text = [title, tags, author, body].filter(Boolean).join(" ");
        chunks.push(makeChunk(`playbook:${title}`, "playbook", title, text, {
          tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
          author, date: fmStr(fm, "date"), url: ghUrl(p.path),
        }));
      }
    }

    // ── Blueprints ──────────────────────────────────────────────────────────────
    for (const b of blueprints) {
      if (b.path.endsWith("README.md")) continue;
      const fm = b.frontmatter;
      const docTitle = docTitleOf(b);
      const domain = fmStr(fm, "domain");
      const clientType = fmStr(fm, "client_type");
      const tags = Array.isArray(fm.tags) ? (fm.tags as string[]).join(" ") : "";
      for (const { heading, body } of sectionChunks(b.content)) {
        const title = heading ? `${docTitle} — ${heading}` : docTitle;
        const text = [title, domain, clientType, tags, body].filter(Boolean).join(" ");
        chunks.push(makeChunk(`blueprint:${title}`, "blueprint", title, text, {
          tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
          date: fmStr(fm, "date"),
          url: ghUrl(b.path),
        }));
      }
    }

    // ── RFPs ────────────────────────────────────────────────────────────────────
    for (const r of rfps) {
      if (r.path.endsWith(".gitkeep")) continue;
      const fm = r.frontmatter;
      const docTitle = docTitleOf(r);
      const client = fmStr(fm, "client");
      const status = fmStr(fm, "status");
      const assignedTo = fmStr(fm, "assigned_to");
      const deadline = fmStr(fm, "deadline");
      const estimatedValue = fmStr(fm, "estimated_value");
      const tags = Array.isArray(fm.tags) ? (fm.tags as string[]).join(" ") : "";
      for (const { heading, body } of sectionChunks(r.content)) {
        const title = heading ? `${docTitle} — ${heading}` : docTitle;
        const text = [title, client, status, assignedTo, deadline, estimatedValue, tags, body].filter(Boolean).join(" ");
        chunks.push(makeChunk(`rfp:${title}`, "rfp", title, text, {
          client, status, tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
          date: fmStr(fm, "date_received"), url: ghUrl(r.path),
        }));
      }
    }

    // ── Product specs ───────────────────────────────────────────────────────────
    // Specs are long reference docs (rate tables, API specs), so index one chunk
    // per ##/### section — BM25 then surfaces exactly the relevant section.
    for (const s of specs) {
      if (s.path.endsWith("README.md")) continue;
      const docTitle =
        s.content.match(/^#\s+(.+)$/m)?.[1]?.trim() ||
        s.path.split("/").pop()!.replace(/\.md$/, "");
      const sections = s.content.split(/^(?=##+\s)/m);
      for (const sec of sections) {
        const heading = sec.match(/^##+\s+(.+)$/m)?.[1]?.trim();
        const body = sec.replace(/^##+\s+.+$/m, "").trim();
        if (!body) continue;
        const title = heading ? `${docTitle} — ${heading}` : docTitle;
        chunks.push(makeChunk(`spec:${title}`, "spec", title, `${title} ${clip(body, 6000)}`, {
          date: fmStr(s.frontmatter, "date"),
          url: ghUrl(s.path),
        }));
      }
    }

    // ── Documents & imported notes (documents/, intake/confluence-sync/) ─────────
    for (const d of [...documents, ...confluenceSync]) {
      if (d.path.endsWith("README.md")) continue;
      const docTitle = docTitleOf(d);
      for (const { heading, body } of sectionChunks(d.content)) {
        const title = heading ? `${docTitle} — ${heading}` : docTitle;
        chunks.push(makeChunk(`doc:${title}`, "document", title, `${title} ${body}`, {
          date: fmStr(d.frontmatter, "date"),
          url: ghUrl(d.path),
        }));
      }
    }

    // ── Confluence pages ────────────────────────────────────────────────────────
    for (const page of confluencePages) {
      const text = [page.title, page.excerpt ?? ""].filter(Boolean).join(" ");
      const webUrl = CONFLUENCE_DOMAIN
        ? `https://${CONFLUENCE_DOMAIN}/wiki${page._links.webui}`
        : undefined;
      chunks.push(makeChunk(`confluence:${page.id}`, "confluence", page.title, text, {
        url: webUrl,
        date: page.version?.when?.slice(0, 10),
        author: page.version?.by?.displayName,
      }));
    }

    const index: KnowledgeIndex = {
      builtAt: new Date().toISOString(),
      chunkCount: chunks.length,
      chunks,
    };

    await writeJSON("dashboard-data/knowledge-index.json", index, "knowledge: rebuild index");

    const bySource = {
      form: chunks.filter((c) => c.source === "form").length,
      playbook: chunks.filter((c) => c.source === "playbook").length,
      blueprint: chunks.filter((c) => c.source === "blueprint").length,
      rfp: chunks.filter((c) => c.source === "rfp").length,
      spec: chunks.filter((c) => c.source === "spec").length,
      confluence: chunks.filter((c) => c.source === "confluence").length,
      document: chunks.filter((c) => c.source === "document").length,
    };

    return NextResponse.json({ ok: true, chunkCount: chunks.length, builtAt: index.builtAt, bySource });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Build failed" },
      { status: 500 }
    );
  }
}
