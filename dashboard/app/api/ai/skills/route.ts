import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { callGroq, groqConfigured } from "@/lib/groq";

// Drafts a Claude-ready skills.md for a team member, grounded in the work they've done.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!groqConfigured())
    return NextResponse.json({ error: "AI not configured — add GROQ_API_KEY" }, { status: 503 });

  let body: {
    name?: string; role?: string; currentSkills?: string;
    tickets?: { id: string; client: string; brief: string }[];
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const tickets = (body.tickets ?? []).slice(0, 40);
  const ticketBlock = tickets.length
    ? tickets.map((t) => `- ${t.id} (${t.client}): ${t.brief}`).join("\n")
    : "(no tickets recorded)";

  const system = `You write a concise, Claude-ready skills.md for a Solutions Engineering team member at Vantage Circle (HR-tech / employee rewards SaaS).
The file describes what this person is good at so an AI assistant can route work to them and use their expertise.
Output clean Markdown only (no preamble). Structure:
# <Name> — Skills
## Summary  (2-3 sentences)
## Core Competencies  (bullet list)
## Domains & Products
## Tools & Tech
## Notable Work  (reference the ticket IDs they led)
Ground "Core Competencies" and "Notable Work" in the tickets provided. Be specific and concise.`;

  const user = `Name: ${body.name || "—"}
Role: ${body.role || "—"}

Existing capability notes:
${(body.currentSkills || "(none)").slice(0, 2000)}

Tickets this person worked on:
${ticketBlock}`;

  try {
    const out = await callGroq({
      system,
      contents: [{ role: "user", parts: [{ text: user }] }],
      temperature: 0.4,
    });
    return NextResponse.json({ content: out.trim() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "AI request failed" }, { status: 500 });
  }
}
