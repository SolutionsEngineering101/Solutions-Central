import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJSON } from "@/lib/github";
import { callGroq, groqConfigured, type GeminiContent } from "@/lib/groq";
import { bm25Search, type KnowledgeIndex, type SourceRef } from "@/lib/knowledge";

const SYSTEM = `You are a sharp, proactive knowledge assistant for Vantage Circle's Solutions Engineering team. You have access to solution requests, playbook entries, blueprints, and Confluence docs — all indexed below as CONTEXT.

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

## Citation rules
- Only cite sources from the CONTEXT below using [FORM:ID], [PLAYBOOK:title], [BLUEPRINT:title], [CONFLUENCE:title].
- When citing a form, name the client and outcome: "Acme Corp received a custom badge solution [FORM:SC-0045]".
- Never invent sources or details not in the context.

## Style
- Concise and direct — no fluff, no preamble.
- Use **bold** or bullet lists only when it genuinely helps scan the answer.
- Conversational tone, not corporate. You're a sharp teammate, not a search engine.`;

function clip(s: string, n = 400): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function sourceLabel(source: string): string {
  if (source === "form") return "FORM";
  if (source === "playbook") return "PLAYBOOK";
  if (source === "blueprint") return "BLUEPRINT";
  return "CONFLUENCE";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!groqConfigured())
    return NextResponse.json({ error: "AI not configured — add GROQ_API_KEY" }, { status: 503 });

  let body: { query?: string; history?: { role: string; text: string }[] };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const query = (body.query ?? "").trim();
  if (!query) return NextResponse.json({ error: "query is required" }, { status: 400 });

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
      contextLines.push(`[${label}] ${chunk.title}${meta ? ` — ${meta}` : ""}\n${clip(chunk.text)}`);
    }
    const contextBlock = contextLines.length
      ? contextLines.join("\n\n")
      : "(No matching documents found in the knowledge base.)";

    const systemWithContext = `${SYSTEM}\n\nCONTEXT:\n${contextBlock}`;

    // Convert history to GeminiContent shape
    const history: GeminiContent[] = (body.history ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

    const answer = await callGroq({
      system: systemWithContext,
      contents: [...history, { role: "user", parts: [{ text: query }] }],
      temperature: 0.5,
    });

    // Extract cited source IDs from the answer
    const citedIds = new Set<string>();
    const citationRe = /\[(FORM|PLAYBOOK|BLUEPRINT|CONFLUENCE):([^\]]+)\]/gi;
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

    return NextResponse.json({ answer, sources });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat request failed" },
      { status: 500 }
    );
  }
}
