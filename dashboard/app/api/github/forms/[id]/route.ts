import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFile, writeFile } from "@/lib/github";
import { updateFormRowInExcel, type ConsultantFields } from "@/lib/sharepoint";
import matter from "gray-matter";

// ─── Body section helpers ────────────────────────────────────────────────────

function extractSection(body: string, heading: string): string {
  const re = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
  const m = body.match(re);
  return m ? m[1].trim() : "";
}

function replaceSection(body: string, heading: string, newText: string): string {
  const re = new RegExp(`(##\\s+${heading}\\s*\\n)[\\s\\S]*?(?=\\n##\\s|$)`, "i");
  const replacement = `$1${newText}\n`;
  if (re.test(body)) return body.replace(re, replacement);
  // Section absent — append it
  return body.trimEnd() + `\n\n## ${heading}\n${newText}\n`;
}

// ─── PATCH /api/github/forms/[id] ───────────────────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path, fields } = (await req.json()) as {
    path: string;
    fields: ConsultantFields & { solution?: string; remarks?: string };
  };

  if (!path || !fields)
    return NextResponse.json({ error: "Missing path or fields" }, { status: 400 });

  // ── Read current file ──────────────────────────────────────────────────────
  const raw = await getFile(path);
  if (!raw) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const { data: fm, content: body } = matter(raw);

  // ── Update frontmatter (consultant-owned keys only) ────────────────────────
  const FRONTMATTER_KEYS = [
    "status", "complexity", "solution_spoc", "vc_spoc",
    "dev_sprint", "ticket", "closed_on",
  ] as const;

  const updatedFm = { ...fm };
  for (const key of FRONTMATTER_KEYS) {
    if (fields[key] !== undefined) updatedFm[key] = fields[key];
  }

  // ── Update body sections ───────────────────────────────────────────────────
  let updatedBody = body;
  if (fields.solution !== undefined)
    updatedBody = replaceSection(updatedBody, "Solution Given", fields.solution);
  if (fields.remarks !== undefined)
    updatedBody = replaceSection(updatedBody, "Remarks", fields.remarks);

  // ── Reconstruct and write ──────────────────────────────────────────────────
  const newContent = matter.stringify(updatedBody, updatedFm);
  const formId = String(fm.form_id ?? "").replace(/\D/g, ""); // "SF-270" → "270"
  await writeFile(path, newContent, `intake: update SF-${formId} via dashboard`);

  // ── Write back to SharePoint Excel (fire-and-forget) ──────────────────────
  const numericId = parseInt(formId, 10);
  if (!isNaN(numericId) && process.env.AZURE_TENANT_ID) {
    updateFormRowInExcel(numericId, fields).catch((err) =>
      console.error(`Excel write-back failed for SF-${numericId}:`, err)
    );
  }

  return NextResponse.json({ ok: true });
}

// ─── GET /api/github/forms/[id] — return editable fields for a given path ───

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = new URL(req.url).searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const raw = await getFile(path);
  if (!raw) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: fm, content: body } = matter(raw);
  return NextResponse.json({
    frontmatter: fm,
    solution: extractSection(body, "Solution Given"),
    remarks:  extractSection(body, "Remarks"),
  });
}
