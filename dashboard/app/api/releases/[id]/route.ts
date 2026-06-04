import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJSON, writeJSON } from "@/lib/github";
import type { Release, SectionKey, SectionState } from "@/components/releases/types";

const DATA_PATH = "dashboard-data/releases.json";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const releases = (await getJSON<Release[]>(DATA_PATH)) ?? [];
  const release = releases.find((r) => r.id === id);

  if (!release) return NextResponse.json({ error: "Release not found" }, { status: 404 });

  return NextResponse.json(release);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const releases = (await getJSON<Release[]>(DATA_PATH)) ?? [];
  const idx = releases.findIndex((r) => r.id === id);

  if (idx === -1) return NextResponse.json({ error: "Release not found" }, { status: 404 });

  const body = (await req.json()) as {
    sections?: Partial<Record<SectionKey, Partial<SectionState>>>;
    status?: Release["status"];
    deploymentDate?: string;
    pmOwner?: string;
    jiraTickets?: string[];
  };

  const existing = releases[idx];

  // Merge section updates
  if (body.sections) {
    for (const [key, update] of Object.entries(body.sections) as [SectionKey, Partial<SectionState>][]) {
      const current = existing.sections[key] ?? { status: "pending", completedChecks: [] };
      existing.sections[key] = { ...current, ...update };
    }
  }

  if (body.status !== undefined) existing.status = body.status;
  if (body.deploymentDate !== undefined) existing.deploymentDate = body.deploymentDate;
  if (body.pmOwner !== undefined) existing.pmOwner = body.pmOwner;
  if (body.jiraTickets !== undefined) existing.jiraTickets = body.jiraTickets;

  existing.updatedAt = new Date().toISOString();
  releases[idx] = existing;

  await writeJSON(DATA_PATH, releases, `release: update ${id}`);

  return NextResponse.json(existing);
}
