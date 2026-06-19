import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJSON } from "@/lib/github";
import { callGroq, groqConfigured, type GeminiContent } from "@/lib/groq";
import { bm25Search, type KnowledgeIndex, type SourceRef } from "@/lib/knowledge";

const SYSTEM = `You are the Solutions Engineering knowledge assistant for Vantage Circle (an HR-tech / employee rewards & recognition SaaS platform).

Answer the user's question using ONLY the context passages provided below. Cite sources inline using their bracketed IDs (e.g. [FORM:SC-0045], [PLAYBOOK:gamification], [CONFLUENCE:page-title]).

Rules:
- If the answer cannot be found in the provided context, say so clearly — do not guess.
- Be concise and specific. Use markdown bullet lists or bold text where it aids clarity.
- Only cite sources you genuinely used.
- When citing a form, include the client name and outcome (e.g. "Client Acme Corp received a custom badge solution [FORM:SC-0045]").`;

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
      temperature: 0.3,
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
