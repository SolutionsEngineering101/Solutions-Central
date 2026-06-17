import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMarkdownFiles } from "@/lib/github";
import { callGroq, groqConfigured, parseJsonLoose, batchEmbedTexts, cosineSim } from "@/lib/groq";

const OWNER = process.env.GITHUB_REPO_OWNER ?? "";
const REPO = process.env.GITHUB_REPO_NAME ?? "";

interface ReqContext {
  id?: string;
  client?: string;
  department?: string;
  feature?: string;
  status?: string;
  complexity?: string;
  description?: string;
  content?: string;
}

interface Candidate {
  ref: string;
  type: "form" | "playbook" | "blueprint";
  id: string;
  title: string;
  path: string;
  url: string;
  snippet: string;
  score: number;
}

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

function clip(s: string, n = 400): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

function extractSec(content: string, heading: string): string {
  const re = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
  const m = content.match(re);
  return m ? m[1].trim() : "";
}

// Build a compact text representation for embedding a candidate.
function candidateEmbedText(type: "form" | "playbook" | "blueprint", fm: Record<string, unknown>, content: string): string {
  if (type === "form") {
    const parts = [
      fmStr(fm, "feature_name"),
      fmStr(fm, "department"),
      fmStr(fm, "description", "brief"),
      extractSec(content, "Brief"),
      extractSec(content, "Subject"),
      extractSec(content, "Solution Given"),
    ].filter(Boolean);
    return parts.join(". ").slice(0, 1500);
  }
  const title = fmStr(fm, "title");
  const domain = fmStr(fm, "domain");
  const tags = Array.isArray(fm.tags) ? (fm.tags as string[]).join(", ") : "";
  return [title, domain, tags, content.slice(0, 800)].filter(Boolean).join(". ");
}

async function gather(queryText: string): Promise<Candidate[]> {
  const [forms, playbook, blueprints] = await Promise.all([
    getMarkdownFiles("intake/solutions-forms"),
    getMarkdownFiles("playbook/entries"),
    getMarkdownFiles("pre-built-solutions/blueprints"),
  ]);

  type CandidateInternal = Candidate & { embedText: string };
  const all: CandidateInternal[] = [];

  forms
    .filter((f) => !f.path.includes("skeleton-") && !f.path.endsWith("README.md"))
    .forEach((f) => {
      const fm = f.frontmatter;
      const id = fmStr(fm, "form_id") || f.path.split("/").pop()!.replace(/\.md$/, "");
      const client = fmStr(fm, "client", "client_name");
      const feature = fmStr(fm, "feature_name");
      const brief = extractSec(f.content, "Brief") || fmStr(fm, "description", "brief");
      all.push({
        ref: "", type: "form", id, title: client || id, path: f.path, url: ghUrl(f.path),
        snippet: `${id} — Client: ${client || "—"} | Feature: ${feature || "—"} | Status: ${fmStr(fm, "status") || "—"}\n  ${clip(brief || f.content)}`,
        score: 0,
        embedText: candidateEmbedText("form", fm, f.content),
      });
    });

  playbook
    .filter((p) => !p.path.endsWith("README.md"))
    .forEach((p) => {
      const fm = p.frontmatter;
      const title = fmStr(fm, "title") || p.path.split("/").pop()!.replace(/\.md$/, "");
      const tags = Array.isArray(fm.tags) ? (fm.tags as string[]).join(", ") : "";
      all.push({
        ref: "", type: "playbook", id: title, title, path: p.path, url: ghUrl(p.path),
        snippet: `"${title}"${tags ? ` (tags: ${tags})` : ""}\n  ${clip(p.content)}`,
        score: 0,
        embedText: candidateEmbedText("playbook", fm, p.content),
      });
    });

  blueprints
    .filter((b) => !b.path.endsWith("README.md"))
    .forEach((b) => {
      const fm = b.frontmatter;
      const title = fmStr(fm, "title") || b.path.split("/").pop()!.replace(/\.md$/, "");
      const domain = fmStr(fm, "domain");
      const tags = Array.isArray(fm.tags) ? (fm.tags as string[]).join(", ") : "";
      all.push({
        ref: "", type: "blueprint", id: title, title, path: b.path, url: ghUrl(b.path),
        snippet: `"${title}"${domain ? ` (domain: ${domain})` : ""}${tags ? ` (tags: ${tags})` : ""}\n  ${clip(b.content)}`,
        score: 0,
        embedText: candidateEmbedText("blueprint", fm, b.content),
      });
    });

  // Step 1 — keyword pre-filter to reduce candidates before embedding.
  // Keeps the embed call count small (~45 items) regardless of repo size.
  const qTokens = new Set(
    (queryText.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length >= 3)
  );
  function kwScore(text: string): number {
    const seen = new Set<string>();
    let n = 0;
    for (const t of (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])) {
      if (t.length >= 3 && qTokens.has(t) && !seen.has(t)) { seen.add(t); n++; }
    }
    return n;
  }

  const preFilter = (type: CandidateInternal["type"], n: number): CandidateInternal[] => {
    const typed = all.filter((c) => c.type === type);
    typed.forEach((c) => { c.score = kwScore(c.embedText); });
    return [...typed].sort((a, b) => b.score - a.score).slice(0, n);
  };

  const pool: CandidateInternal[] = [
    ...preFilter("form", 25),
    ...preFilter("playbook", 12),
    ...preFilter("blueprint", 8),
  ];
  pool.forEach((c) => { c.score = 0; });

  // Step 2 — semantic reranking on the pre-filtered pool (query + ~45 texts).
  // Falls back to keyword scores from step 1 when embeddings are unavailable (e.g. Groq).
  const embedTexts = [queryText, ...pool.map((c) => c.embedText)];
  const embeddings = await batchEmbedTexts(embedTexts);
  if (embeddings.length > 0) {
    const queryEmbed = embeddings[0];
    for (let i = 0; i < pool.length; i++) {
      pool[i].score = cosineSim(queryEmbed, embeddings[i + 1]);
    }
  }

  const top = (type: Candidate["type"], n: number) =>
    pool.filter((c) => c.type === type).sort((a, b) => b.score - a.score).slice(0, n);

  const picked = [...top("form", 6), ...top("playbook", 4), ...top("blueprint", 4)];
  let f = 1, p = 1, b = 1;
  for (const c of picked) {
    c.ref = c.type === "form" ? `F${f++}` : c.type === "playbook" ? `P${p++}` : `B${b++}`;
  }
  return picked;
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const GENERATE_SCHEMA = {
  type: "object",
  properties: {
    draft: { type: "string" },
    suggestions: { type: "array", items: { type: "string" } },
    references: {
      type: "array",
      items: {
        type: "object",
        properties: { ref: { type: "string" }, why: { type: "string" } },
        required: ["ref", "why"],
      },
    },
  },
  required: ["draft", "suggestions", "references"],
};

const REFINE_SCHEMA = {
  type: "object",
  properties: { draft: { type: "string" } },
  required: ["draft"],
};

const SYSTEM = `You are the Solutions Engineering assistant for Vantage Circle (an HR-tech / employee rewards & recognition SaaS).
A consultant has received a new client solution request. Help them draft a solution.

Rules:
- Ground your answer in the CANDIDATE SOURCES provided (past solution forms, playbook entries, blueprints). These are the team's prior work.
- For citations, you may ONLY cite the candidate sources by their ref handle (e.g. F1, P3, B2). Never invent ticket numbers or sources. Only cite sources you genuinely used.
- Be concrete and concise. Reuse approaches from similar past requests where relevant.
- If no relevant past sources exist, still produce a best-effort draft based on the request details alone, and note in ## Open Questions what additional context would help.

You MUST respond with a JSON object using EXACTLY these keys — no other keys, no wrapper objects:

{
  "draft": "<full Markdown solution draft using all six sections below>",
  "suggestions": ["<actionable item 1>", "<actionable item 2>"],
  "references": [{"ref": "F1", "why": "<why this source was used>"}, {"ref": "P2", "why": "..."}]
}

The "draft" value must be a Markdown string structured exactly as:
## Problem Summary
## Recommended Approach
## Components
## Implementation Steps
## Suggested Attachments
## Open Questions

"suggestions" = specific things the consultant should confirm or fill in (e.g. missing client info, field configs).
"references" = only cite refs from CANDIDATE SOURCES that you actually used. Empty array if none apply.`;

function reqBlock(r: ReqContext): string {
  return [
    `Request ID: ${r.id || "—"}`,
    `Client: ${r.client || "—"}`,
    `Department: ${r.department || "—"}`,
    `Feature: ${r.feature || "—"}`,
    `Status: ${r.status || "—"}`,
    `Complexity: ${r.complexity || "—"}`,
    `Details: ${(r.description || r.content || "—").slice(0, 1500)}`,
  ].join("\n");
}

function sourcesBlock(cands: Candidate[]): string {
  if (!cands.length) return "(no matching past sources found)";
  return cands.map((c) => `[${c.ref}] (${c.type}) ${c.snippet}`).join("\n\n");
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!groqConfigured())
    return NextResponse.json({ error: "AI not configured — add GROQ_API_KEY" }, { status: 503 });

  let body: { mode?: string; request?: ReqContext; draft?: string; instruction?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const request = body.request ?? {};
  const mode = body.mode === "refine" ? "refine" : "generate";

  try {
    if (mode === "refine") {
      const system = `${SYSTEM}\n\nThe consultant wants to refine an existing draft. Apply their instruction and return the full updated Markdown draft.`;
      const user = `CURRENT DRAFT:\n${body.draft ?? ""}\n\nORIGINAL REQUEST:\n${reqBlock(request)}\n\nINSTRUCTION:\n${body.instruction ?? "Improve the draft."}`;
      const raw = await callGroq({
        system,
        contents: [{ role: "user", parts: [{ text: user }] }],
        schema: REFINE_SCHEMA,
      });
      const out = parseJsonLoose<{ draft: string }>(raw);
      return NextResponse.json({ draft: out.draft });
    }

    // Semantic gather: build query from feature + description/brief
    const queryText = [
      request.feature,
      request.department,
      request.description,
      (request.content ?? "").slice(0, 500),
    ].filter(Boolean).join(". ");

    const cands = await gather(queryText);

    const focus = (body.instruction ?? "").trim();
    const user = `INCOMING REQUEST:\n${reqBlock(request)}\n\n${focus ? `CONSULTANT'S FOCUS: ${focus}\n\n` : ""}CANDIDATE SOURCES (cite these by ref):\n${sourcesBlock(cands)}`;
    const raw = await callGroq({
      system: SYSTEM,
      contents: [{ role: "user", parts: [{ text: user }] }],
      schema: GENERATE_SCHEMA,
    });
    const out = parseJsonLoose<{
      draft: string;
      suggestions: string[];
      references: { ref: string; why: string }[];
    }>(raw);

    const byRef = new Map(cands.map((c) => [c.ref, c]));
    const references = (out.references ?? [])
      .map((r) => {
        const c = byRef.get(r.ref);
        if (!c) return null;
        return { ref: c.ref, type: c.type, id: c.id, title: c.title, path: c.path, url: c.url, why: r.why };
      })
      .filter(Boolean);

    const draft = out.draft?.trim() || [
      "## Problem Summary",
      `No closely matching past solutions were found for this request (${cands.length} sources scanned).`,
      "",
      "## Recommended Approach",
      "This appears to be a novel request. Please provide additional context so a more tailored solution can be drafted.",
      "",
      "## Components",
      "- To be determined based on client requirements",
      "",
      "## Implementation Steps",
      "1. Gather detailed requirements from the client",
      "2. Identify applicable Vantage Circle product features",
      "3. Draft a customised solution",
      "",
      "## Suggested Attachments",
      "- Relevant product demo or feature spec",
      "",
      "## Open Questions",
      `- What is the client's primary goal for this feature?`,
      "- Are there any integration requirements with existing systems?",
      "- What is the expected timeline?",
    ].join("\n");

    return NextResponse.json({
      draft,
      suggestions: out.suggestions ?? [],
      references,
      sourcesScanned: cands.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 },
    );
  }
}
