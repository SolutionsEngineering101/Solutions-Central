import { AppShell } from "@/components/layout/AppShell";
import { getJSON, getMarkdownFiles } from "@/lib/github";
import { formatDate } from "@/lib/utils";
import { TrendingUp, Layers, BookOpen, Users } from "lucide-react";

interface SolutionsFile {
  solutions?: { client?: string; recorded_at?: string; title?: string }[];
}

interface SprintReport {
  current_sprint?: {
    number: number | null;
    start_date: string;
    end_date: string;
    goals: string[];
    status: string;
  };
  team_activity?: Record<string, { last_log: string; today_summary: string }>;
}

export default async function OverviewPage() {
  const [solutionsFile, sprint, playbook, blueprints] = await Promise.all([
    getJSON<SolutionsFile>("dashboard-data/solutions-provided.json"),
    getJSON<SprintReport>("dashboard-data/sprint-report.json"),
    getMarkdownFiles("playbook/entries"),
    getMarkdownFiles("pre-built-solutions/blueprints"),
  ]);

  const solutions = solutionsFile?.solutions ?? [];
  const activeSprint = sprint?.current_sprint?.number ? sprint.current_sprint : null;
  const teamActivity = Object.entries(sprint?.team_activity ?? {})
    .filter(([, v]) => v.today_summary)
    .slice(0, 4);

  const stats = [
    { label: "Solutions Delivered", value: solutions.length, icon: TrendingUp, color: "text-indigo-400", bg: "bg-indigo-950" },
    { label: "Blueprints", value: blueprints.length, icon: Layers, color: "text-emerald-400", bg: "bg-emerald-950" },
    { label: "Playbook Entries", value: playbook.length, icon: BookOpen, color: "text-amber-400", bg: "bg-amber-950" },
    { label: "Team Members", value: 6, icon: Users, color: "text-sky-400", bg: "bg-sky-950" },
  ];

  const recent = [...solutions].reverse().slice(0, 5);

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
            {activeSprint ? (
              <div>
                <p className="text-indigo-400 text-sm font-medium mb-1">Sprint {activeSprint.number}</p>
                {activeSprint.goals.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {activeSprint.goals.map((g, i) => (
                      <li key={i} className="text-gray-300 text-sm flex gap-2"><span className="text-indigo-500">·</span>{g}</li>
                    ))}
                  </ul>
                )}
                {activeSprint.end_date && (
                  <p className="text-gray-500 text-xs mt-3">Ends {formatDate(activeSprint.end_date)}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No active sprint — run "new sprint" in Claude.</p>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-medium mb-4">
              {recent.length > 0 ? "Recent Solutions" : "Team Activity"}
            </h2>
            {recent.length > 0 ? (
              <ul className="space-y-3">
                {recent.map((s, i) => (
                  <li key={i} className="flex items-start justify-between gap-4">
                    <span className="text-gray-300 text-sm">{s.client ?? s.title ?? "—"}</span>
                    {s.recorded_at && <span className="text-gray-500 text-xs shrink-0">{formatDate(s.recorded_at)}</span>}
                  </li>
                ))}
              </ul>
            ) : teamActivity.length > 0 ? (
              <ul className="space-y-3">
                {teamActivity.map(([member, data]) => (
                  <li key={member}>
                    <p className="text-gray-400 text-xs font-medium capitalize mb-0.5">{member.replace(/-/g, " ")}</p>
                    <p className="text-gray-300 text-sm line-clamp-2">{data.today_summary}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No solutions recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
