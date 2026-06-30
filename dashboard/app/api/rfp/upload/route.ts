import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFile, writeFile } from "@/lib/github";
import { slugify } from "@/lib/utils";
import * as XLSX from "xlsx";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function excelToMarkdown(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sections: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }) as unknown[][];

    const filled = rows.filter(row => (row as unknown[]).some(c => String(c).trim() !== ""));
    if (!filled.length) continue;

    sections.push(`### ${sheetName}\n`);

    const maxCols = Math.max(...filled.map(r => (r as unknown[]).length));
    const header = Array.from({ length: maxCols }, (_, i) =>
      String((filled[0] as unknown[])[i] ?? "").replace(/\|/g, "\\|").trim() || " "
    );

    sections.push(`| ${header.join(" | ")} |`);
    sections.push(`| ${header.map(() => "---").join(" | ")} |`);

    for (let i = 1; i < filled.length; i++) {
      const cells = Array.from({ length: maxCols }, (_, ci) =>
        String((filled[i] as unknown[])[ci] ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ").trim()
      );
      sections.push(`| ${cells.join(" | ")} |`);
    }

    sections.push("");
  }

  return sections.join("\n");
}

async function uniquePath(date: string, slug: string): Promise<string> {
  const base = `rfps/entries/${date}-${slug}`;
  if (!(await getFile(`${base}.md`))) return `${base}.md`;
  for (let n = 2; n < 100; n++) {
    const c = `${base}-${n}.md`;
    if (!(await getFile(c))) return c;
  }
  return `${base}-${Date.now()}.md`;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file          = formData.get("file") as File | null;
  const client        = String(formData.get("client")          ?? "").trim();
  const title         = String(formData.get("title")           ?? "").trim();
  const dateReceived  = String(formData.get("date_received")   ?? new Date().toISOString().split("T")[0]);
  const deadline      = String(formData.get("deadline")        ?? "").trim();
  const status        = String(formData.get("status")          ?? "Open").trim();
  const assignedTo    = String(formData.get("assigned_to")     ?? "").trim();
  const estimatedValue= String(formData.get("estimated_value") ?? "").trim();
  const tagsRaw       = String(formData.get("tags")            ?? "").trim();

  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  const resolvedClient = client || file.name.replace(/\.[^.]+$/, "");
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());

  let extracted = "";
  try { extracted = excelToMarkdown(buffer); }
  catch { return NextResponse.json({ error: "Could not parse Excel file — check the format" }, { status: 400 }); }

  const rfpTitle = title || `RFP — ${resolvedClient}`;
  const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : [];
  if (!tags.includes("rfp")) tags.unshift("rfp");

  const q = (s: string) => s.replace(/"/g, '\\"');

  const frontmatter = [
    `---`,
    `title: "${q(rfpTitle)}"`,
    `client: "${q(resolvedClient)}"`,
    `date_received: "${dateReceived}"`,
    `deadline: "${deadline}"`,
    `status: "${status}"`,
    `assigned_to: "${q(assignedTo)}"`,
    `estimated_value: "${q(estimatedValue)}"`,
    `tags: [${tags.map(t => `"${t}"`).join(", ")}]`,
    `source_file: "${q(file.name)}"`,
    `---`,
  ].join("\n");

  const body = [
    `# ${rfpTitle}`,
    "",
    `## Details`,
    `- **Client:** ${resolvedClient}`,
    `- **Date Received:** ${dateReceived}`,
    deadline      ? `- **Deadline:** ${deadline}`               : null,
    `- **Status:** ${status}`,
    assignedTo    ? `- **Assigned To:** ${assignedTo}`          : null,
    estimatedValue? `- **Estimated Value:** ${estimatedValue}`  : null,
    "",
    `## Extracted Content`,
    "",
    extracted || "_No content could be extracted from this file._",
  ].filter(l => l !== null).join("\n");

  const content = `${frontmatter}\n\n${body}\n`;
  const slug    = slugify(resolvedClient) || "rfp";
  const path    = await uniquePath(dateReceived, slug);
  const author  = (session.user?.name as string | undefined) ?? "dashboard";

  await writeFile(path, content, `rfp: upload "${rfpTitle}" (${author})`);

  return NextResponse.json({ ok: true, path });
}
