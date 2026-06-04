import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJSON, writeJSON } from "@/lib/github";
import type { Release, ReleaseType, SectionKey, SectionState } from "@/components/releases/types";
import { SECTIONS_FOR_TYPE, CHECKLIST_DEFINITIONS, HOTFIX_CHECKS } from "@/components/releases/types";

const DATA_PATH = "dashboard-data/releases.json";

function buildInitialSections(releaseType: ReleaseType): Partial<Record<SectionKey, SectionState>> {
  const keys = SECTIONS_FOR_TYPE[releaseType];
  const sections: Partial<Record<SectionKey, SectionState>> = {};
  for (const key of keys) {
    sections[key] = {
      status: "pending",
      completedChecks: [],
    };
  }
  return sections;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const releases = await getJSON<Release[]>(DATA_PATH);
  return NextResponse.json(releases ?? []);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    name: string;
    releaseType: ReleaseType;
    clients: string[];
    product: string;
    jiraTickets: string[];
    deploymentDate: string;
    pmOwner: string;
  };

  if (!body.name || !body.releaseType || !body.deploymentDate || !body.pmOwner) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const releases = (await getJSON<Release[]>(DATA_PATH)) ?? [];

  const year = new Date().getFullYear();
  const sequentialNumber = (releases.length + 1).toString().padStart(3, "0");
  const id = `REL-${year}-${sequentialNumber}`;

  const now = new Date().toISOString();

  const newRelease: Release = {
    id,
    name: body.name,
    releaseType: body.releaseType,
    clients: body.clients ?? [],
    product: body.product ?? "",
    jiraTickets: body.jiraTickets ?? [],
    deploymentDate: body.deploymentDate,
    pmOwner: body.pmOwner,
    status: "in-progress",
    createdAt: now,
    updatedAt: now,
    sections: buildInitialSections(body.releaseType),
  };

  releases.push(newRelease);
  await writeJSON(DATA_PATH, releases, `release: create ${id} — ${body.name}`);

  return NextResponse.json(newRelease, { status: 201 });
}
