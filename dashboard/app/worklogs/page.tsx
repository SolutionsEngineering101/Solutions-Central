import { AppShell } from "@/components/layout/AppShell";
import { getMarkdownFiles } from "@/lib/github";
import { formatDate } from "@/lib/utils";
import { ClipboardList } from "lucide-react";

const MEMBERS = [
  "bhargav-nath", "hemanga-bharadwaj", "pankaj-chakrabarty",
  "nilimpa-nizara-bora", "garima-kayal", "kongkana-bayan",
];

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
          <h1 className="text-white text-2xl font-semibold">Worklogs</h1>
          <p className="text-gray-400 text-sm mt-1">Recent activity across the team</p>
        </div>
        <div className="space-y-3">
          {flat.map((log) => {
            const { date, member: memberName } = log.frontmatter as Record<string, string>;
            const displayMember = memberName ?? log.member.split("-").map((w: string) => w[0].toUpperCase() + w.slice(1)).join(" ");
            const work = log.content.match(/## Today's Work\n([\s\S]*?)(?=\n##|$)/)?.[1]?.trim();

            return (
              <div key={log.path} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-medium">
                        {displayMember.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <span className="text-white text-sm font-medium">{displayMember}</span>
                  </div>
                  {date && <span className="text-gray-500 text-xs shrink-0">{formatDate(date)}</span>}
                </div>
                {work && <p className="text-gray-400 text-sm ml-8">{work.slice(0, 200)}{work.length > 200 ? "…" : ""}</p>}
              </div>
            );
          })}
          {flat.length === 0 && (
            <div className="text-center py-16">
              <ClipboardList size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No worklogs yet.</p>
              <p className="text-gray-600 text-xs mt-1">Run "log today's work" in Claude to add one.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
