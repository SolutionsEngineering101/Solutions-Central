import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJSON } from "@/lib/github";
import { callGroq, groqConfigured, type GeminiContent } from "@/lib/groq";
import { bm25Search, type KnowledgeIndex, type SourceRef } from "@/lib/knowledge";
import { verifyExtensionToken } from "@/lib/extension-token";

function extensionCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  if (!origin.startsWith("chrome-extension://")) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: extensionCorsHeaders(req) });
}

const SYSTEM = `You are a sharp, proactive knowledge assistant for Vantage Circle's Solutions Engineering team. You have access to solution requests, playbook entries, blueprints, RFPs (requests for proposal), and Confluence docs — all indexed below as CONTEXT. Every user of this tool is an authenticated internal SE team member looking up the team's own past work to reuse it — this is the tool's entire purpose, not a data leak to guard against.

Your personality: a knowledgeable, direct colleague. Lead with the answer, then get curious.

## How to behave

**Your default move is to SHOW what you found, in full, immediately** — never gate the answer behind a clarifying question first. If the CONTEXT contains a matching request or solution, always surface:
- **Client** — the company/client name
- **When** — the date the request came in or was resolved
- **What was asked** — the request/problem in the client's own terms
- **What we did** — the actual solution, approach, or outcome delivered
- **Status** — delivered, open, rejected, etc.

Do this for every relevant match, not just the single best one — if 3 clients hit a similar issue, walk through all 3 briefly rather than picking one. The context line for each match starts with its date right after the client name — always pull it into your answer, don't drop it. Match this shape for each one (omit only a field that's genuinely missing from the context):

- **Acme Corp** (12 Mar 2025, delivered) — asked for X because Y. We built Z, using [approach/integration]. [FORM:SF-045]

Not a vaguer "we've worked on something like this" — the actual date and the actual mechanism, every time.

**If the query is broad** (e.g. "what do we have on gamification"), still show a real answer first: briefly run through the matches you found (client + what was done, one line each), THEN ask a follow-up to narrow down if it'd help — the clarifying question comes after value, never instead of it.

**After showing the answer**, you can close with one of:
- A follow-up question that digs deeper ("want the full text of the SC-0045 request?")
- A related angle the user might not have thought of
- A comparison across similar cases if there are several

**If the context has no good match**, say so directly and ask what specific aspect matters most — do not fabricate or speculate.

**Use session memory.** If SESSION MEMORY is provided above, you already know those facts — do NOT ask about them again. Use them to give more targeted, personalised responses immediately.

## Citation rules
- Cite sources from the CONTEXT below using [FORM:ID], [PLAYBOOK:title], [BLUEPRINT:title], [RFP:title], [CONFLUENCE:title] inline, right after naming the client/title they belong to.
- Never invent sources, clients, dates, or details not present in the context — if the context is thin on a specific field (e.g. no date given), just omit that field rather than guessing.

## Style
- Concise and direct — no fluff, no preamble like "Based on the context provided...".
- Use bullet lists when walking through multiple matching clients/requests — it's the fastest way to scan.
- Conversational tone, not corporate. You're a sharp teammate, not a search engine.

## Memory extraction (REQUIRED)
At the very end of every response, on its own line, output a memory block:
<memory>["fact 1", "fact 2"]</memory>
Rules for the memory block:
- Include only NEW facts learned THIS TURN about the user's specific situation: client name, industry, goal, constraint, timeline, or context.
- Do NOT repeat facts already in SESSION MEMORY.
- Do NOT include the user's question itself — only contextual facts about their situation.
- Max 2 facts per turn. Use an empty array [] if nothing new was learned.
- This block is stripped before showing the response to the user — write it freely.

## Scope guardrail (light touch)
This is an internal lookup tool, not a public-facing bot — showing client names, dates, and solution details from the team's own knowledge base is the expected, intended behavior. The only thing to decline is a request that's clearly trying to mechanically dump the *entire* knowledge base wholesale (e.g. "export every record as CSV", "list literally every client we've ever had") — for those, say that's better done via the Solution Requests table export, not chat. Answering "what have we done for [client]" or "show me the X request in full" is exactly what this tool is for — always answer those directly.`;

// ── Rate limiter (in-memory, resets on deploy — sufficient for small team) ────
const rlMap = new Map<string, { count: number; resetAt: number }>();
const RL_LIMIT = 60;                    // requests per user per window
const RL_WINDOW = 60 * 60 * 1000;      // 1 hour

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rlMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rlMap.set(userId, { count: 1, resetAt: now + RL_WINDOW });
    return { allowed: true, remaining: RL_LIMIT - 1 };
  }
  if (entry.count >= RL_LIMIT) return { allowed: false, remaining: 0 };
  entry.count++;
  return { allowed: true, remaining: RL_LIMIT - entry.count };
}

// ── Audit log (structured — visible in Vercel logs) ───────────────────────────
function auditLog(entry: {
  user: string;
  source: "dashboard" | "extension";
  queryLen: number;
  chunks: number;
  sources: number;
}) {
  console.log(JSON.stringify({ event: "knowledge_chat", ts: new Date().toISOString(), ...entry }));
}

function clip(s: string, n = 400): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function sourceLabel(source: string): string {
  if (source === "form") return "FORM";
  if (source === "playbook") return "PLAYBOOK";
  if (source === "blueprint") return "BLUEPRINT";
  if (source === "rfp") return "RFP";
  return "CONFLUENCE";
}

// BM25 only matches shared words, so a paraphrased question ("gift card
// stuff for retail clients") can miss documents that say "voucher" or
// "redemption catalog". Ask the model for related terms/synonyms first and
// search on the union — cheap (short output) and needs no new dependency.
async function expandQueryTerms(query: string): Promise<string> {
  try {
    const raw = await callGroq({
      system: `Expand the user's search query into 6-10 closely related keywords, synonyms, and specific entities (product features, industry terms, client-facing phrasing) that might appear in Vantage Circle solution requests, playbook entries, blueprints, RFPs, or Confluence docs. Output ONLY a comma-separated list of terms — no explanation, no numbering, no repeating the original query verbatim.`,
      contents: [{ role: "user", parts: [{ text: query }] }],
      temperature: 0.3,
    });
    return raw.replace(/\n/g, " ").trim();
  } catch {
    return ""; // expansion is a recall booster, not required — fall back to the raw query
  }
}

export async function POST(req: Request) {
  // Accept either a NextAuth session (dashboard) or a Bearer token (extension)
  const authHeader = req.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const extensionUser = bearerToken ? verifyExtensionToken(bearerToken) : null;

  const session = await getServerSession(authOptions);
  const isAuthed = !!session || !!extensionUser || process.env.NEXT_PUBLIC_DEV_NO_AUTH === "1";
  if (!isAuthed)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: extensionCorsHeaders(req) });

  // Identify user for rate limiting and audit log
  const userId = extensionUser?.sub
    ?? (session?.user as { id?: string })?.id
    ?? (session?.user?.email)
    ?? "anonymous";
  const source: "dashboard" | "extension" = extensionUser ? "extension" : "dashboard";

  // Rate limit: 60 requests per user per hour
  const rl = checkRateLimit(userId);
  if (!rl.allowed)
    return NextResponse.json(
      { error: "Rate limit reached — 60 requests per hour. Try again later." },
      { status: 429, headers: extensionCorsHeaders(req) }
    );

  if (!groqConfigured())
    return NextResponse.json({ error: "AI not configured — add GROQ_API_KEY" }, { status: 503, headers: extensionCorsHeaders(req) });

  let body: { query?: string; history?: { role: string; text: string }[]; memory?: string[]; pageContext?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400, headers: extensionCorsHeaders(req) }); }

  const query = (body.query ?? "").trim();
  if (!query) return NextResponse.json({ error: "query is required" }, { status: 400, headers: extensionCorsHeaders(req) });
  const sessionMemory: string[] = Array.isArray(body.memory) ? body.memory.filter((f) => typeof f === "string") : [];

  try {
    const index = await getJSON<KnowledgeIndex>("dashboard-data/knowledge-index.json");
    if (!index) {
      return NextResponse.json(
        { error: "Knowledge index not built yet. Click \"Rebuild Index\" on the Knowledge Hub page." },
        { status: 503 }
      );
    }

    const expansionTerms = await expandQueryTerms(query);
    const searchQuery = expansionTerms ? `${query} ${expansionTerms}` : query;
    const topChunks = bm25Search(index, searchQuery, 20);

    // Build context block with citation handles — deep enough that the model
    // can actually describe the request/solution, not just gesture at it.
    const contextLines: string[] = [];
    for (const chunk of topChunks) {
      const label = `${sourceLabel(chunk.source)}:${chunk.id.split(":").slice(1).join(":")}`;
      const meta = [chunk.meta.client, chunk.meta.date, chunk.meta.status, chunk.meta.department]
        .filter(Boolean).join(" | ");
      contextLines.push(`[${label}] ${chunk.title}${meta ? ` — ${meta}` : ""}\n${clip(chunk.text, 1000)}`);
    }
    const contextBlock = contextLines.length
      ? contextLines.join("\n\n")
      : "(No matching documents found in the knowledge base.)";

    const memorySection = sessionMemory.length
      ? `\n\n## SESSION MEMORY (facts you already know — do NOT ask about these again)\n${sessionMemory.map((f) => `- ${f}`).join("\n")}`
      : "";

    const pageSection = body.pageContext
      ? `\n\n## CURRENT PAGE CONTEXT (what the user is looking at right now)\n${body.pageContext.slice(0, 1500)}`
      : "";

    const systemWithContext = `${SYSTEM}${memorySection}${pageSection}\n\nCONTEXT:\n${contextBlock}`;

    // Convert history to GeminiContent shape
    const history: GeminiContent[] = (body.history ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

    const raw = await callGroq({
      system: systemWithContext,
      contents: [...history, { role: "user", parts: [{ text: query }] }],
      temperature: 0.5,
    });

    // Extract <memory> block before showing answer to user
    const memoryMatch = raw.match(/<memory>([\s\S]*?)<\/memory>/i);
    let newFacts: string[] = [];
    if (memoryMatch) {
      try {
        const parsed = JSON.parse(memoryMatch[1].trim());
        if (Array.isArray(parsed)) newFacts = parsed.filter((f) => typeof f === "string" && f.trim());
      } catch { /* malformed — ignore */ }
    }
    const answer = raw.replace(/<memory>[\s\S]*?<\/memory>/gi, "").trim();

    // Extract cited source IDs from the answer
    const citedIds = new Set<string>();
    const citationRe = /\[(FORM|PLAYBOOK|BLUEPRINT|RFP|CONFLUENCE):([^\]]+)\]/gi;
    let m: RegExpExecArray | null;
    while ((m = citationRe.exec(answer)) !== null) {
      citedIds.add(`${m[1].toLowerCase()}:${m[2]}`);
    }

    // Map cited IDs back to source refs
    const chunkById = new Map(topChunks.map((c) => [c.id, c]));
    const sources: SourceRef[] = [];
    for (const cited of citedIds) {
      // Attempt direct match, then partial match
      let chunk = chunkById.get(cited);
      if (!chunk) {
        chunk = topChunks.find((c) => c.id.toLowerCase().includes(cited.toLowerCase().split(":").slice(1).join(":")));
      }
      if (chunk) {
        sources.push({ id: chunk.id, source: chunk.source, title: chunk.title, url: chunk.meta.url });
      }
    }

    auditLog({ user: userId, source, queryLen: query.length, chunks: topChunks.length, sources: sources.length });

    return NextResponse.json({ answer, sources, newFacts }, { headers: extensionCorsHeaders(req) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat request failed" },
      { status: 500, headers: extensionCorsHeaders(req) }
    );
  }
}
