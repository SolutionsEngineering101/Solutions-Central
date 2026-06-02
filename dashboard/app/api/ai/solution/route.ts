import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMarkdownFiles } from "@/lib/github";
import { callGemini, geminiConfigured, parseJsonLoose } from "@/lib/gemini";

const OWNER = process.env.GITHUB_REPO_OWNER ?? "";
const REPO = process.env.GITHUB_REPO_NAME ?? "";

// ── Incoming request context (from the selected Solution Request) ─────────────
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

// ── Retrieval: pull the most relevant past sources from the repo ──────────────

const STOP = new Set([
  "the","and","for","with","that","this","from","are","was","will","have","has","not","you","your",
  "our","their","they","its","into","onto","per","via","client","solution","request","feature","department",
  "requirement","requirements","need","needs","want","wants","please","would","could","should","new",
]);

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length >= 3 && !STOP.has(w));
}

function fmStr(fm: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = fm[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

interface Candidate {
  ref: string;        // stable handle the model cites: F1, P1, B1…
  type: "form" | "playbook" | "blueprint";
  id: string;         // human id/title
  title: string;
  path: string;
  url: string;
  snippet: string;    // compact context for the prompt
  score: number;
}

function ghUrl(path: string): string {
  return OWNER && REPO ? `https://github.com/${OWNER}/${REPO}/blob/main/${path}` : "";
}

function clip(s: string, n = 400): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

async function gather(query: Set<string>): Promise<Candidate[]> {
  const [forms, playbook, blueprints] = await Promise.all([
    getMarkdownFiles("intake/solutions-forms"),
    getMarkdownFiles("playbook/entries"),
    getMarkdownFiles("pre-built-solutions/blueprints"),
  ]);

  const score = (text: string): number => {
    const seen = new Set<string>();
    let n = 0;
    for (const t of tokenize(text)) {
      if (query.has(t) && !seen.has(t)) { seen.add(t); n++; }
    }
    return n;
  };

  const out: Candidate[] = [];

  forms
    .filter((f) => !f.path.includes("skeleton-") && !f.path.endsWith("README.md"))
    .forEach((f) => {
      const fm = f.frontmatter;
      const id = fmStr(fm, "form_id") || f.path.split("/").pop()!.replace(/\.md$/, "");
      const client = fmStr(fm, "client", "client_name");
      const text = [client, fmStr(fm, "department"), fmStr(fm, "feature_name"), fmStr(fm, "status"),
        fmStr(fm, "complexity"), fmStr(fm, "description", "brief"), f.content].join(" ");
      out.push({
        ref: "", type: "form", id, title: client || id, path: f.path, url: ghUrl(f.path),
        snippet: `${id} — Client: ${client || "—"} | Dept: ${fmStr(fm, "department") || "—"} | Feature: ${fmStr(fm, "feature_name") || "—"} | Status: ${fmStr(fm, "status") || "—"} | Complexity: ${fmStr(fm, "complexity") || "—"}\n  ${clip(fmStr(fm, "description", "brief") || f.content)}`,
        score: score(text),
      });
    });

  playbook
    .filter((p) => !p.path.endsWith("README.md"))
    .forEach((p) => {
      const fm = p.frontmatter;
      const title = fmStr(fm, "title") || p.path.split("/").pop()!.replace(/\.md$/, "");
      const tags = Array.isArray(fm.tags) ? (fm.tags as string[]).join(", ") : "";
      out.push({
        ref: "", type: "playbook", id: title, title, path: p.path, url: ghUrl(p.path),
        snippet: `"${title}"${tags ? ` (tags: ${tags})` : ""}\n  ${clip(p.content)}`,
        score: score([title, tags, p.content].join(" ")),
      });
    });

  blueprints
    .filter((b) => !b.path.endsWith("README.md"))
    .forEach((b) => {
      const fm = b.frontmatter;
      const title = fmStr(fm, "title") || b.path.split("/").pop()!.replace(/\.md$/, "");
      const domain = fmStr(fm, "domain");
      const tags = Array.isArray(fm.tags) ? (fm.tags as string[]).join(", ") : "";
      out.push({
        ref: "", type: "blueprint", id: title, title, path: b.path, url: ghUrl(b.path),
        snippet: `"${title}"${domain ? ` (domain: ${domain})` : ""}${tags ? ` (tags: ${tags})` : ""}\n  ${clip(b.content)}`,
        score: score([title, domain, tags, b.content].join(" ")),
      });
    });

  // Top-N per type so each knowledge source is represented; fall back to recent if nothing scores.
  const top = (type: Candidate["type"], n: number) =>
    out.filter((c) => c.type === type).sort((a, b) => b.score - a.score).slice(0, n);

  const picked = [...top("form", 6), ...top("playbook", 4), ...top("blueprint", 4)];
  let f = 1, p = 1, b = 1;
  for (const c of picked) {
    c.ref = c.type === "form" ? `F${f++}` : c.type === "playbook" ? `P${p++}` : `B${b++}`;
  }
  return picked;
}

// ── Schemas for structured output ─────────────────────────────────────────────

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
- The "draft" must be clean Markdown a consultant can send/tweak, using this structure:
  ## Problem Summary
  ## Recommended Approach
  ## Components
  ## Implementation Steps
  ## Suggested Attachments
  ## Open Questions
- "suggestions" = specific, actionable things the consultant should confirm or fill in for THIS request (e.g. exact fields, missing info to ask the client).
- Be concrete and concise. Reuse approaches from similar past requests where relevant.`;

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
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!geminiConfigured())
    return NextResponse.json({ error: "AI not configured — add GEMINI_API_KEY" }, { status: 503 });

  let body: { mode?: string; request?: ReqContext; draft?: string; instruction?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const request = body.request ?? {};
  const mode = body.mode === "refine" ? "refine" : "generate";

  try {
    if (mode === "refine") {
      const system = `${SYSTEM}\n\nThe consultant wants to refine an existing draft. Apply their instruction and return the full updated Markdown draft.`;
      const user = `CURRENT DRAFT:\n${body.draft ?? ""}\n\nORIGINAL REQUEST:\n${reqBlock(request)}\n\nINSTRUCTION:\n${body.instruction ?? "Improve the draft."}`;
      const raw = await callGemini({
        system,
        contents: [{ role: "user", parts: [{ text: user }] }],
        schema: REFINE_SCHEMA,
      });
      const out = parseJsonLoose<{ draft: string }>(raw);
      return NextResponse.json({ draft: out.draft });
    }

    // generate
    const query = new Set(tokenize([
      request.client, request.department, request.feature, request.description, request.content,
    ].filter(Boolean).join(" ")));
    const cands = await gather(query);

    const user = `INCOMING REQUEST:\n${reqBlock(request)}\n\nCANDIDATE SOURCES (cite these by ref):\n${sourcesBlock(cands)}`;
    const raw = await callGemini({
      system: SYSTEM,
      contents: [{ role: "user", parts: [{ text: user }] }],
      schema: GENERATE_SCHEMA,
    });
    const out = parseJsonLoose<{
      draft: string;
      suggestions: string[];
      references: { ref: string; why: string }[];
    }>(raw);

    // Map cited refs back to real sources (drop any hallucinated refs).
    const byRef = new Map(cands.map((c) => [c.ref, c]));
    const references = (out.references ?? [])
      .map((r) => {
        const c = byRef.get(r.ref);
        if (!c) return null;
        return { ref: c.ref, type: c.type, id: c.id, title: c.title, path: c.path, url: c.url, why: r.why };
      })
      .filter(Boolean);

    return NextResponse.json({
      draft: out.draft,
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
