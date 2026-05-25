import { AppShell } from "@/components/layout/AppShell";
import { getJSON, getMarkdownFiles } from "@/lib/github";
import { formatDate } from "@/lib/utils";
import { TrendingUp, Layers, BookOpen, Users } from "lucide-react";

interface SolutionEntry {
  client?: string;
  recorded_at?: string;
  title?: string;
}

interface SprintReport {
  active_sprint?: { number: number; goal: string; end_date: string };
}

export default async function OverviewPage() {
  const [solutions, sprint, playbook, blueprints] = await Promise.all([
    getJSON<SolutionEntry[]>("dashboard-data/solutions-provided.json"),
    getJSON<SprintReport>("dashboard-data/sprint-report.json"),
    getMarkdownFiles("playbook/entries"),
    getMarkdownFiles("pre-built-solutions/blueprints"),
  ]);

  const stats = [
    { label: "Solutions Delivered", value: solutions?.length ?? 0, icon: TrendingUp, color: "text-indigo-400", bg: "bg-indigo-950" },
    { label: "Blueprints", value: blueprints.length, icon: Layers, color: "text-emerald-400", bg: "bg-emerald-950" },
    { label: "Playbook Entries", value: playbook.length, icon: BookOpen, color: "text-amber-400", bg: "bg-amber-950" },
    { label: "Team Members", value: 6, icon: Users, color: "text-sky-400", bg: "bg-sky-950" },
  ];

  const recent = [...(solutions ?? [])].reverse().slice(0, 5);

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-white text-2xl font-semibold">Overview</h1>
          <p className="text-gray-400 text-sm mt-1">Solutions Engineering · Vantage Circle</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-white text-2xl font-bold">{value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-medium mb-4">Active Sprint</h2>
            {sprint?.active_sprint ? (
              <div>
                <p className="text-indigo-400 text-sm font-medium mb-1">Sprint {sprint.active_sprint.number}</p>
                <p className="text-gray-300 text-sm">{sprint.active_sprint.goal}</p>
                <p className="text-gray-500 text-xs mt-2">Ends {formatDate(sprint.active_sprint.end_date)}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No active sprint</p>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-medium mb-4">Recent Solutions</h2>
            {recent.length > 0 ? (
              <ul className="space-y-3">
                {recent.map((s, i) => (
                  <li key={i} className="flex items-start justify-between gap-4">
                    <span className="text-gray-300 text-sm">{s.client ?? s.title ?? "—"}</span>
                    {s.recorded_at && <span className="text-gray-500 text-xs shrink-0">{formatDate(s.recorded_at)}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No solutions recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
