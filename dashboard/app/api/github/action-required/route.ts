import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMarkdownFiles } from "@/lib/github";

export const revalidate = 60;

const STALE_OPEN_DAYS = 7;

export interface ActionRequiredItem {
  formId: string;
  client: string;
  status: string;
  submittedAt: string;
  reason: string;
}

// Matches the logged-in GitHub user to the free-text `solution_spoc` field the
// same way the homepage's SPOC leaderboard does — first-name substring match,
// no separate name→login table to keep in sync.
function isAssignedTo(spoc: string, firstName: string): boolean {
  return spoc.toLowerCase().includes(firstName);
}

function daysSince(dateStr: string): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const devBypass = process.env.NEXT_PUBLIC_DEV_NO_AUTH === "1";
  const name = session?.user?.name ?? (devBypass ? process.env.DEV_ACTION_REQUIRED_USER : undefined);
  if (!name) return NextResponse.json({ items: [] });

  const firstName = name.trim().split(/\s+/)[0]?.toLowerCase();
  if (!firstName) return NextResponse.json({ items: [] });

  const forms = await getMarkdownFiles("intake/solutions-forms");
  const requests = forms.filter((f) => !f.path.includes("skeleton-") && !f.path.endsWith("README.md"));

  const items: ActionRequiredItem[] = [];
  for (const r of requests) {
    const spoc = String(r.frontmatter.solution_spoc ?? "");
    if (!spoc || !isAssignedTo(spoc, firstName)) continue;

    const status = String(r.frontmatter.status ?? "").trim() || "Pending Update";
    const submittedAt = String(r.frontmatter.submitted_at ?? r.frontmatter.date ?? "");
    const openDays = daysSince(submittedAt);

    let reason: string | null = null;
    if (status === "Pending Update") reason = "No status set yet";
    else if (status === "Open" && openDays !== null && openDays > STALE_OPEN_DAYS) reason = `Open ${openDays} days with no resolution`;

    if (!reason) continue;
    items.push({
      formId: String(r.frontmatter.form_id ?? ""),
      client: String(r.frontmatter.client ?? r.frontmatter.client_name ?? "—"),
      status,
      submittedAt,
      reason,
    });
  }

  items.sort((a, b) => (daysSince(b.submittedAt) ?? 0) - (daysSince(a.submittedAt) ?? 0));
  return NextResponse.json({ items });
}
