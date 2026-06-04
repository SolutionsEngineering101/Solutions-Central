import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJSON } from "@/lib/github";
import type { Release } from "@/components/releases/types";

const DATA_PATH = "dashboard-data/releases.json";

function getJiraAuth() {
  const domain = process.env.CONFLUENCE_DOMAIN;
  const email = process.env.CONFLUENCE_EMAIL;
  const token = process.env.CONFLUENCE_API_TOKEN;
  if (!domain || !email || !token) return null;
  const encoded = Buffer.from(`${email}:${token}`).toString("base64");
  return { domain, headers: { Authorization: `Basic ${encoded}`, Accept: "application/json" } };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NEXT_PUBLIC_DEV_NO_AUTH !== "1") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ticket = searchParams.get("ticket");
  const untracked = searchParams.get("untracked");

  const auth = getJiraAuth();
  if (!auth) {
    if (untracked) return NextResponse.json([]);
    return NextResponse.json({ error: "Jira not configured" });
  }

  // Single ticket lookup
  if (ticket) {
    try {
      const url = `https://${auth.domain}/rest/api/3/issue/${encodeURIComponent(ticket)}?fields=summary,status,assignee,issuetype`;
      const res = await fetch(url, { headers: auth.headers });

      if (!res.ok) {
        if (res.status === 404) return NextResponse.json({ error: "Ticket not found" });
        return NextResponse.json({ error: `Jira error: ${res.status}` });
      }

      const data = await res.json() as {
        id: string;
        key: string;
        fields: {
          summary: string;
          status: { name: string };
          assignee: { displayName: string } | null;
          issuetype: { name: string };
        };
      };

      return NextResponse.json({
        id: data.id,
        key: data.key,
        summary: data.fields.summary,
        status: data.fields.status.name,
        assignee: data.fields.assignee?.displayName ?? null,
        issueType: data.fields.issuetype.name,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: msg });
    }
  }

  // Untracked tickets
  if (untracked) {
    const projectKey = process.env.JIRA_PROJECT_KEY;
    if (!projectKey) return NextResponse.json([]);

    try {
      const releases = (await getJSON<Release[]>(DATA_PATH)) ?? [];
      const linkedTickets = new Set<string>();
      for (const release of releases) {
        for (const t of release.jiraTickets ?? []) {
          linkedTickets.add(t.toUpperCase());
        }
      }

      const jql = encodeURIComponent(
        `project=${projectKey} AND status in ("In Testing","Ready for Release","Approved for Deploy","Staging") ORDER BY updated DESC`
      );
      const url = `https://${auth.domain}/rest/api/3/search?jql=${jql}&fields=summary,status,assignee&maxResults=20`;
      const res = await fetch(url, { headers: auth.headers });

      if (!res.ok) return NextResponse.json([]);

      const data = await res.json() as {
        issues: Array<{
          id: string;
          key: string;
          fields: {
            summary: string;
            status: { name: string };
            assignee: { displayName: string } | null;
          };
        }>;
      };

      const unlinked = data.issues
        .filter((issue) => !linkedTickets.has(issue.key.toUpperCase()))
        .map((issue) => ({
          id: issue.id,
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status.name,
          assignee: issue.fields.assignee?.displayName ?? null,
        }));

      return NextResponse.json(unlinked);
    } catch {
      return NextResponse.json([]);
    }
  }

  return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
}
