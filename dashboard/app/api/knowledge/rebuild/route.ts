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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [forms, playbook, blueprints, rfps, confluencePages] = await Promise.all([
      getMarkdownFiles("intake/solutions-forms"),
      getMarkdownFiles("playbook/entries"),
      getMarkdownFiles("pre-built-solutions/blueprints"),
      getMarkdownFiles("rfps/entries"),
      listSpacePages(process.env.CONFLUENCE_SPACE_KEY ?? "PMT", CONFLUENCE_PAGE_ID ? [CONFLUENCE_PAGE_ID] : []).catch(() => []),
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
      const title = fmStr(fm, "title") || p.path.split("/").pop()!.replace(/\.md$/, "");
      const tags = Array.isArray(fm.tags) ? (fm.tags as string[]).join(" ") : "";
      const author = fmStr(fm, "author");
      const text = [title, tags, author, clip(p.content, 1400)].filter(Boolean).join(" ");
      chunks.push(makeChunk(`playbook:${title}`, "playbook", title, text, {
        tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
        author, date: fmStr(fm, "date"), url: ghUrl(p.path),
      }));
    }

    // ── Blueprints ──────────────────────────────────────────────────────────────
    for (const b of blueprints) {
      if (b.path.endsWith("README.md")) continue;
      const fm = b.frontmatter;
      const title = fmStr(fm, "title") || b.path.split("/").pop()!.replace(/\.md$/, "");
      const domain = fmStr(fm, "domain");
      const clientType = fmStr(fm, "client_type");
      const tags = Array.isArray(fm.tags) ? (fm.tags as string[]).join(" ") : "";
      const text = [title, domain, clientType, tags, clip(b.content, 1400)].filter(Boolean).join(" ");
      chunks.push(makeChunk(`blueprint:${title}`, "blueprint", title, text, {
        tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
        date: fmStr(fm, "date"),
        url: ghUrl(b.path),
      }));
    }

    // ── RFPs ────────────────────────────────────────────────────────────────────
    for (const r of rfps) {
      if (r.path.endsWith(".gitkeep")) continue;
      const fm = r.frontmatter;
      const title = fmStr(fm, "title") || r.path.split("/").pop()!.replace(/\.md$/, "");
      const client = fmStr(fm, "client");
      const status = fmStr(fm, "status");
      const assignedTo = fmStr(fm, "assigned_to");
      const deadline = fmStr(fm, "deadline");
      const estimatedValue = fmStr(fm, "estimated_value");
      const tags = Array.isArray(fm.tags) ? (fm.tags as string[]).join(" ") : "";
      const text = [title, client, status, assignedTo, deadline, estimatedValue, tags, clip(r.content, 1800)].filter(Boolean).join(" ");
      chunks.push(makeChunk(`rfp:${title}`, "rfp", title, text, {
        client, status, tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
        date: fmStr(fm, "date_received"), url: ghUrl(r.path),
      }));
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
      confluence: chunks.filter((c) => c.source === "confluence").length,
    };

    return NextResponse.json({ ok: true, chunkCount: chunks.length, builtAt: index.builtAt, bySource });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Build failed" },
      { status: 500 }
    );
  }
}
