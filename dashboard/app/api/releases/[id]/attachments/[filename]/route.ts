import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJSON, getFileBinary } from "@/lib/github";
import type { Release } from "@/components/releases/types";

const DATA_PATH = "dashboard-data/releases.json";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, filename } = await params;
  const name = decodeURIComponent(filename);

  const releases = (await getJSON<Release[]>(DATA_PATH)) ?? [];
  const release = releases.find((r) => r.id === id);
  if (!release) return NextResponse.json({ error: "Release not found" }, { status: 404 });

  const attachment = release.attachments?.find((a) => a.name === name);
  if (!attachment) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });

  const binary = await getFileBinary(attachment.path);
  if (!binary) return NextResponse.json({ error: "File not found in storage" }, { status: 404 });

  const mimeType = attachment.mimeType ?? "application/octet-stream";
  const ab = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);

  return new NextResponse(ab as ArrayBuffer, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${name}"`,
      "Content-Length": String(binary.length),
    },
  });
}
