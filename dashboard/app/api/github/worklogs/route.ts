import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMarkdownFiles, writeFile } from "@/lib/github";

const MEMBERS = [
  "bhargav-nath",
  "hemanga-bharadwaj",
  "pankaj-chakrabarty",
  "nilimpa-nizara-bora",
  "garima-kayal",
  "kongkana-bayan",
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const all = await Promise.all(
    MEMBERS.map(async (member) => {
      const files = await getMarkdownFiles(`team/${member}/worklog`);
      return files.map((f) => ({ ...f, member }));
    })
  );

  const flat = all.flat().sort((a, b) =>
    (b.frontmatter.date as string) > (a.frontmatter.date as string) ? 1 : -1
  );

  return NextResponse.json(flat);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { member, date, work, blockers, tomorrow, flags } = await req.json();
  const path = `team/${member}/worklog/${date}.md`;
  const name = member.split("-").map((w: string) => w[0].toUpperCase() + w.slice(1)).join(" ");

  const content = `---
date: ${date}
member: "${name}"
---

# Worklog — ${name} — ${date}

## Today's Work
${work}

## Blockers
${blockers || "None"}

## Tomorrow's Plan
${tomorrow}

## Team Flags
${flags || "None"}
`;

  await writeFile(path, content, `worklog: ${member} ${date}`);
  return NextResponse.json({ ok: true });
}
