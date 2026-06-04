import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listCommits, getCommitFiles } from "@/lib/github";

// GET            → recent commits (who pushed what, when)
// GET ?sha=<sha> → the files changed in that commit
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sha = new URL(req.url).searchParams.get("sha");
  try {
    if (sha) {
      if (!/^[0-9a-f]{7,40}$/i.test(sha)) return NextResponse.json({ error: "Bad sha" }, { status: 400 });
      return NextResponse.json(await getCommitFiles(sha));
    }
    return NextResponse.json({ commits: await listCommits(40) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
