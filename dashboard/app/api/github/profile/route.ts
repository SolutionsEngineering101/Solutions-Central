import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMarkdownFiles, getFile, writeFile } from "@/lib/github";
import { slugify } from "@/lib/utils";

const DIR = "skills/member";

// GET — without params: list all member profiles (for the picker + editor).
//        with ?member=<slug>: list that member's personal MD files (skills/member/<slug>/).
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = new URL(req.url).searchParams.get("member");

  if (member) {
    if (!/^[a-z0-9-]+$/.test(member))
      return NextResponse.json({ error: "Invalid member" }, { status: 400 });
    const files = await getMarkdownFiles(`${DIR}/${member}`);
    return NextResponse.json({
      files: files.map((f) => ({
        name: f.path.split("/").pop()!,
        path: f.path,
        title: String(f.frontmatter.title ?? f.path.split("/").pop()!.replace(/\.md$/, "")),
        updated: String(f.frontmatter.updated ?? f.frontmatter.date ?? ""),
        content: f.content,
      })),
    });
  }

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

// PUT — save the member's capability profile (skills/member/<slug>.md).
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { slug?: string; name?: string; role?: string; email?: string; body?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const slug = String(body.slug ?? "");
  if (!/^[a-z0-9-]+$/.test(slug))
    return NextResponse.json({ error: "Invalid profile id" }, { status: 400 });

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

// POST — save a personal MD file to the member's folder (skills/member/<slug>/<file>.md).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { slug?: string; filename?: string; content?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const slug = String(body.slug ?? "");
  if (!/^[a-z0-9-]+$/.test(slug))
    return NextResponse.json({ error: "Invalid member" }, { status: 400 });

  const fileSlug = slugify(String(body.filename ?? "").replace(/\.md$/i, "")) || "untitled";
  const content = String(body.content ?? "");
  if (!content.trim()) return NextResponse.json({ error: "File is empty" }, { status: 400 });

  const path = `${DIR}/${slug}/${fileSlug}.md`;
  try {
    await writeFile(path, content, `profile: ${slug} save ${fileSlug}.md`);
    return NextResponse.json({ ok: true, path, name: `${fileSlug}.md` });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Save failed" }, { status: 500 });
  }
}
