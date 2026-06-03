import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMarkdownFiles, getFile, writeFile } from "@/lib/github";

const DIR = "skills/member";

// GET — list all member profiles (for the "you are" selector + editor).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profiles = await getMarkdownFiles(DIR);
  const members = profiles
    .filter((p) => !p.path.includes("_template") && !p.path.endsWith("README.md"))
    .map((p) => ({
      slug: p.path.split("/").pop()!.replace(/\.md$/, ""),
      name: String(p.frontmatter.name ?? ""),
      role: String(p.frontmatter.role ?? ""),
      email: String(p.frontmatter.email ?? ""),
      updated: String(p.frontmatter.updated ?? ""),
      content: p.content,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ members });
}

// PUT — save one member's profile back to the repo.
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { slug?: string; name?: string; role?: string; email?: string; body?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const slug = String(body.slug ?? "");
  if (!/^[a-z0-9-]+$/.test(slug))
    return NextResponse.json({ error: "Invalid profile id" }, { status: 400 });

  // Only allow editing existing member profiles (no path traversal / new files here).
  const path = `${DIR}/${slug}.md`;
  if (!(await getFile(path)))
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const name = String(body.name ?? "").trim();
  const role = String(body.role ?? "").trim();
  const email = String(body.email ?? "").trim();
  const sectionBody = String(body.body ?? "").trim();
  const date = new Date().toISOString().split("T")[0];

  const fileContent = `---
name: "${name.replace(/"/g, "'")}"
role: "${role.replace(/"/g, "'")}"
email: "${email.replace(/"/g, "'")}"
updated: ${date}
---

# ${name || "Member"} — Capability Profile

${sectionBody}
`;

  try {
    await writeFile(path, fileContent, `profile: update ${name || slug}`);
    return NextResponse.json({ ok: true, path });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Save failed" }, { status: 500 });
  }
}
