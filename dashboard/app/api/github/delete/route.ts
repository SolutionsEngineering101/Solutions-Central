import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteFile } from "@/lib/github";

const ALLOWED_DIRS = ["playbook/entries", "pre-built-solutions/blueprints", "rfps/entries"];

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path } = await req.json() as { path?: string };
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const allowed = ALLOWED_DIRS.some(dir => path.startsWith(dir));
  if (!allowed) return NextResponse.json({ error: "Path not allowed" }, { status: 403 });

  const author = (session.user?.name as string | undefined) ?? "dashboard";
  const deleted = await deleteFile(path, `delete: remove "${path.split("/").pop()}" (${author})`);
  if (!deleted) return NextResponse.json({ error: "File not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
