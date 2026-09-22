import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMarkdownFiles } from "@/lib/github";
import { SPOC_KEYS } from "@/lib/spoc";

export const revalidate = 60;

const STALE_OPEN_DAYS = 7;

export interface ActionRequiredItem {
  path: string;
  formId: string;
  client: string;
  status: string;
  submittedAt: string;
  reason: string;
  frontmatter: Record<string, unknown>;
  content: string;
}

// The GitHub profile's "name" field is optional — plenty of accounts never
// set it — so identity is resolved against every signal the session has
// (display name, email, and the always-present GitHub username), matched
// against the same SPOC vocabulary the homepage leaderboard uses. Whichever
// key appears in any of them wins.
function resolveSpocKey(candidates: (string | null | undefined)[]): string | null {
  const lowered = candidates.filter((c): c is string => !!c).map((c) => c.toLowerCase());
  for (const key of Object.keys(SPOC_KEYS)) {
    if (lowered.some((c) => c.includes(key))) return key;
  }
  return null;
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
  const user = session?.user as { name?: string | null; email?: string | null; login?: string } | undefined;

  const spocKey = user
    ? resolveSpocKey([user.name, user.email, user.login])
    : devBypass
      ? resolveSpocKey([process.env.DEV_ACTION_REQUIRED_USER])
      : null;

  if (!spocKey) return NextResponse.json({ items: [] });

  const forms = await getMarkdownFiles("intake/solutions-forms");
  const requests = forms.filter((f) => !f.path.includes("skeleton-") && !f.path.endsWith("README.md"));

  const items: ActionRequiredItem[] = [];
  for (const r of requests) {
    const spoc = String(r.frontmatter.solution_spoc ?? "").toLowerCase();
    if (!spoc.includes(spocKey)) continue;

    const status = String(r.frontmatter.status ?? "").trim() || "Pending Update";
    const submittedAt = String(r.frontmatter.submitted_at ?? r.frontmatter.date ?? "");
    const openDays = daysSince(submittedAt);

    let reason: string | null = null;
    if (status === "Pending Update") reason = "No status set yet";
    else if (status === "Open" && openDays !== null && openDays > STALE_OPEN_DAYS) reason = `Open ${openDays} days with no resolution`;

    if (!reason) continue;
    items.push({
      path: r.path,
      formId: String(r.frontmatter.form_id ?? ""),
      client: String(r.frontmatter.client ?? r.frontmatter.client_name ?? "—"),
      status,
      submittedAt,
      reason,
      frontmatter: r.frontmatter,
      content: r.content,
    });
  }

  items.sort((a, b) => (daysSince(b.submittedAt) ?? 0) - (daysSince(a.submittedAt) ?? 0));
  return NextResponse.json({ items });
}
