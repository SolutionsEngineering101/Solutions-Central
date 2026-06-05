import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJSON, writeJSON, writeFileBinary, deleteFile } from "@/lib/github";
import type { Release, ReleaseAttachment } from "@/components/releases/types";

const DATA_PATH = "dashboard-data/releases.json";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_|_$/g, "") || "file"
  );
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
    csv: "text/csv",
    zip: "application/zip",
    mp4: "video/mp4",
  };
  return map[ext] ?? "application/octet-stream";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });

  const filename = sanitizeFilename(file.name);
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const path = `dashboard-data/release-attachments/${id}/${filename}`;

  const releases = (await getJSON<Release[]>(DATA_PATH)) ?? [];
  const idx = releases.findIndex((r) => r.id === id);
  if (idx === -1) return NextResponse.json({ error: "Release not found" }, { status: 404 });

  await writeFileBinary(path, base64, `release: attach ${filename} to ${id}`);

  const attachment: ReleaseAttachment = {
    name: filename,
    path,
    size: file.size,
    uploadedBy: (session?.user?.name as string | undefined) ?? "Unknown",
    uploadedAt: new Date().toISOString(),
    mimeType: file.type || getMimeType(filename),
  };

  releases[idx].attachments = [...(releases[idx].attachments ?? []), attachment];
  releases[idx].updatedAt = new Date().toISOString();
  await writeJSON(DATA_PATH, releases, `release: add attachment to ${id}`);

  return NextResponse.json(releases[idx], { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const name = new URL(req.url).searchParams.get("name");
  if (!name) return NextResponse.json({ error: "name param required" }, { status: 400 });

  const releases = (await getJSON<Release[]>(DATA_PATH)) ?? [];
  const idx = releases.findIndex((r) => r.id === id);
  if (idx === -1) return NextResponse.json({ error: "Release not found" }, { status: 404 });

  const attachment = releases[idx].attachments?.find((a) => a.name === name);
  if (!attachment) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });

  await deleteFile(attachment.path, `release: remove ${name} from ${id}`);

  releases[idx].attachments = releases[idx].attachments?.filter((a) => a.name !== name) ?? [];
  releases[idx].updatedAt = new Date().toISOString();
  await writeJSON(DATA_PATH, releases, `release: remove attachment from ${id}`);

  return NextResponse.json(releases[idx]);
}
