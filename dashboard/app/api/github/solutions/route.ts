import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJSON, writeJSON, getMarkdownFiles } from "@/lib/github";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [provided, forms, skeletons] = await Promise.all([
    getJSON<Record<string, unknown>[]>("dashboard-data/solutions-provided.json"),
    getMarkdownFiles("intake/solutions-forms"),
    Promise.resolve([]),
  ]);

  const rawForms = (forms || []).filter((f) => !f.path.includes("skeleton-"));
  const rawSkeletons = (forms || []).filter((f) => f.path.includes("skeleton-"));

  return NextResponse.json({ provided: provided || [], forms: rawForms, skeletons: rawSkeletons });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const existing = (await getJSON<Record<string, unknown>[]>("dashboard-data/solutions-provided.json")) || [];
  const updated = [...existing, { ...body, recorded_at: new Date().toISOString() }];
  await writeJSON("dashboard-data/solutions-provided.json", updated, `dashboard: mark solution delivered — ${body.client}`);

  return NextResponse.json({ ok: true });
}
