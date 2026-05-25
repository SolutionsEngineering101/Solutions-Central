import { AppShell } from "@/components/layout/AppShell";
import { getMarkdownFiles } from "@/lib/github";
import { formatDate } from "@/lib/utils";
import { BookOpen } from "lucide-react";

export default async function PlaybookPage() {
  const entries = await getMarkdownFiles("playbook/entries");
  const sorted = entries
    .filter((e) => !e.path.endsWith("README.md"))
    .sort((a, b) => ((b.frontmatter.date as string) > (a.frontmatter.date as string) ? 1 : -1));

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-white text-2xl font-semibold">Playbook</h1>
          <p className="text-gray-400 text-sm mt-1">{sorted.length} entries — team learnings and processes</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sorted.map((entry) => {
            const { title, date, author, tags } = entry.frontmatter as Record<string, string | string[]>;
            return (
              <div key={entry.path} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-950 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen size={14} className="text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium">{(title as string) ?? entry.path.split("/").pop()}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {author as string}{date ? ` · ${formatDate(date as string)}` : ""}
                    </p>
                    {Array.isArray(tags) && tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(tags as string[]).map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-gray-600 text-xs mt-2 line-clamp-2">{entry.content.slice(0, 120)}…</p>
                  </div>
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div className="col-span-2 text-center py-16">
              <BookOpen size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No playbook entries yet.</p>
              <p className="text-gray-600 text-xs mt-1">Run "add to playbook" in Claude to add one.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
