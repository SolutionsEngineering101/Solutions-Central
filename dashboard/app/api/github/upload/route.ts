import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFile, writeFile } from "@/lib/github";
import { slugify } from "@/lib/utils";

// Where each kind of document lives in the repo.
const DIRS: Record<string, string> = {
  playbook: "playbook/entries",
  blueprint: "pre-built-solutions/blueprints",
  rfp: "rfps/entries",
};

// Per-kind size limits
const MAX_BYTES: Record<string, number> = {
  playbook:  512 * 1024,       // 512 KB
  blueprint: 512 * 1024,       // 512 KB
  rfp:       4 * 1024 * 1024,  // 4 MB — Excel → markdown can be large
};

// Find a path that does not already exist, so we never overwrite an entry
// (global rule: always create new dated files). Appends -2, -3, … on collision.
async function uniquePath(dir: string, date: string, slug: string): Promise<string> {
  const base = `${dir}/${date}-${slug}`;
  if (!(await getFile(`${base}.md`))) return `${base}.md`;
  for (let n = 2; n < 100; n++) {
    const candidate = `${base}-${n}.md`;
    if (!(await getFile(candidate))) return candidate;
  }
  // Extremely unlikely fallback.
  return `${base}-${Date.now()}.md`;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { kind?: string; filename?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { kind, filename, content } = body;

  const dir = kind ? DIRS[kind] : undefined;
  if (!dir) return NextResponse.json({ error: "Invalid kind" }, { status: 400 });

  if (typeof content !== "string" || content.trim().length === 0)
    return NextResponse.json({ error: "Document is empty" }, { status: 400 });

  const limit = MAX_BYTES[kind!] ?? 512 * 1024;
  if (Buffer.byteLength(content, "utf-8") > limit)
    return NextResponse.json({ error: `Document is too large (max ${Math.round(limit / 1024)}KB)` }, { status: 413 });

  // Derive a clean slug from the uploaded file name (minus its extension).
  const rawName = String(filename ?? "").replace(/\.[^.]+$/, "");
  const slug = slugify(rawName) || "untitled";
  const date = new Date().toISOString().split("T")[0];

  try {
    const path = await uniquePath(dir, date, slug);
    const label = kind ?? "upload";
    const author = (session?.user?.name as string | undefined) ?? "dashboard";
    await writeFile(path, content, `${label}: upload "${rawName || slug}" via dashboard (${author})`);
    return NextResponse.json({ ok: true, path });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to write file" },
      { status: 500 },
    );
  }
}
