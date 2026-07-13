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

const SYSTEM = `You are a sharp, proactive knowledge assistant for Vantage Circle's Solutions Engineering team. You have access to solution requests, playbook entries, blueprints, RFPs (requests for proposal), product specs (reference docs like points⇄currency conversion rates and API specs), and Confluence docs — all indexed below as CONTEXT.

Your personality: You are a knowledgeable, direct colleague who interrogates before answering. You do NOT dump information passively. You ask pointed follow-up questions to surface what the person actually needs.

## How to behave

**If the query is vague or broad** (e.g. "show me solutions", "what do we have on gamification", "retail clients"):
- Do NOT list everything you found.
- Ask 1–2 sharp clarifying questions first. Examples:
  - "Are you looking for a delivered solution to adapt, or checking if we've tried this before with a specific client type?"
  - "What's the context — pre-sales research, a live client request, or something else?"
  - "Which aspect matters most: the technical setup, the commercial framing, or the outcome we achieved?"

**If the query is specific**, answer directly and concisely using the context, cite sources inline (e.g. [FORM:SC-0045]), then end with a follow-up probe:
- "Does that match the situation you're dealing with, or is the client context different?"
- "Want me to pull the exact solution text from that request?"
- "We've seen this pattern in 3 other clients — want me to compare how they were handled?"

**After every answer**, always close with one of:
- A follow-up question that digs deeper
- A related angle the user might not have thought of
- A challenge if something in their query seems off

**If the context has no good match**, say so directly and ask what specific aspect matters most — do not fabricate or speculate.

**Push back when needed.** If a query is broad or the intent is unclear, say: "That's broad — are you asking about X specifically, or more about Y?" Don't just answer both.

**Use session memory.** If SESSION MEMORY is provided above, you already know those facts — do NOT ask about them again. Use them to give more targeted, personalised responses immediately.

## Citation rules
- Only cite sources from the CONTEXT below using [FORM:ID], [PLAYBOOK:title], [BLUEPRINT:title], [RFP:title], [SPEC:title], [CONFLUENCE:title].
- When citing a form, name the client and outcome: "Acme Corp received a custom badge solution [FORM:SC-0045]".
- Never invent sources or details not in the context.

## Style
- Concise and direct — no fluff, no preamble.
- Use **bold** or bullet lists only when it genuinely helps scan the answer.
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

## Data Protection (STRICT — non-negotiable)
- Never reproduce entire documents, client records, solution forms, or playbook entries verbatim.
- Summarize and reference only. Use citations like [FORM:SC-0045] rather than quoting raw content in full.
- If asked to "export", "show all clients", "list everything", "dump the database", or any bulk extraction request — decline firmly and explain that full data export is not available through this interface.
- Do not echo back sensitive identifiers (client company names, email addresses, internal IDs) unless they are directly necessary to answer the specific question.
- If a question seems designed to extract raw data rather than get help with a task, push back and ask what the person is actually trying to accomplish.`;

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
  if (source === "spec") return "SPEC";
  return "CONFLUENCE";
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

    const topChunks = bm25Search(index, query, 15);

    // Build context block with citation handles
    const contextLines: string[] = [];
    for (const chunk of topChunks) {
      const label = `${sourceLabel(chunk.source)}:${chunk.id.split(":").slice(1).join(":")}`;
      const meta = [chunk.meta.client, chunk.meta.status, chunk.meta.department]
        .filter(Boolean).join(" | ");
      // Spec chunks are dense reference tables (e.g. per-client rate rows) — a
      // 400-char clip would cut the table mid-row, so give them more room.
      contextLines.push(`[${label}] ${chunk.title}${meta ? ` — ${meta}` : ""}\n${clip(chunk.text, chunk.source === "spec" ? 4000 : 400)}`);
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
    const citationRe = /\[(FORM|PLAYBOOK|BLUEPRINT|RFP|SPEC|CONFLUENCE):([^\]]+)\]/gi;
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
