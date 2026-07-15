import { AppShell } from "@/components/layout/AppShell";
import { getMarkdownFiles } from "@/lib/github";
import { formatDate } from "@/lib/utils";
import { ClipboardList } from "lucide-react";
import { CommitActivity } from "@/components/worklogs/CommitActivity";
import { Card } from "@/components/ui/card";

const MEMBERS = [
  "bhargav-nath", "hemanga-bharadwaj", "pankaj-chakrabarty",
  "nilimpa-nizara-bora", "garima-kayal", "kongkana-bayan",
];

export const dynamic = "force-dynamic";

export default async function WorklogsPage() {
  const allLogs = await Promise.all(
    MEMBERS.map(async (member) => {
      const files = await getMarkdownFiles(`team/${member}/worklog`);
      return files.map((f) => ({ ...f, member }));
    })
  );

  const flat = allLogs
    .flat()
    .sort((a, b) => ((b.frontmatter.date as string) > (a.frontmatter.date as string) ? 1 : -1))
    .slice(0, 30);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-fg-primary text-2xl font-semibold">Worklogs</h1>
          <p className="text-fg-secondary text-sm mt-1">Code activity from GitHub + manual worklogs</p>
        </div>

        {/* Live commit activity — who pushed what */}
        <CommitActivity />

        {/* Manual worklog entries */}
        <h2 className="text-fg-primary font-semibold text-sm pt-2">Worklog entries</h2>
        <div className="space-y-3">
          {flat.map((log) => {
            const { date, member: memberName } = log.frontmatter as Record<string, string>;
            const displayMember = memberName ?? log.member.split("-").map((w: string) => w[0].toUpperCase() + w.slice(1)).join(" ");
            const work = log.content.match(/## Today's Work\n([\s\S]*?)(?=\n##|$)/)?.[1]?.trim();

            return (
              <Card key={log.path} compact>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-brand-500 rounded-pill flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-medium">
                        {displayMember.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <span className="text-fg-primary text-sm font-medium">{displayMember}</span>
                  </div>
                  {date && <span className="text-fg-secondary text-xs shrink-0">{formatDate(date)}</span>}
                </div>
                {work && <p className="text-fg-secondary text-sm ml-8">{work.slice(0, 200)}{work.length > 200 ? "…" : ""}</p>}
              </Card>
            );
          })}
          {flat.length === 0 && (
            <div className="text-center py-16">
              <ClipboardList size={32} className="text-neutral-300 mx-auto mb-3" />
              <p className="text-fg-secondary text-sm">No worklogs yet.</p>
              <p className="text-fg-secondary text-xs mt-1">Run "log today's work" in Claude to add one.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
