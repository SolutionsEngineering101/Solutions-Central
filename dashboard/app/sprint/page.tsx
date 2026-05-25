import { AppShell } from "@/components/layout/AppShell";
import { getJSON } from "@/lib/github";
import { formatDate } from "@/lib/utils";
import { Kanban, CheckCircle, Circle } from "lucide-react";

interface BacklogItem {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  member?: string;
  priority?: "high" | "medium" | "low";
}

interface SprintData {
  active_sprint?: {
    number: number;
    goal: string;
    start_date: string;
    end_date: string;
  };
  completed_sprints?: { number: number; summary: string }[];
}

interface BacklogData {
  items?: BacklogItem[];
}

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-gray-500",
};

export default async function SprintPage() {
  const [sprint, backlog] = await Promise.all([
    getJSON<SprintData>("dashboard-data/sprint-report.json"),
    getJSON<BacklogData>("dashboard-data/backlog.json"),
  ]);

  const items = backlog?.items ?? [];
  const todo = items.filter((i) => i.status === "todo");
  const inProgress = items.filter((i) => i.status === "in_progress");
  const done = items.filter((i) => i.status === "done");

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-white text-2xl font-semibold">Sprint</h1>
          <p className="text-gray-400 text-sm mt-1">Current sprint and backlog</p>
        </div>

        {sprint?.active_sprint ? (
          <div className="bg-gray-900 border border-indigo-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Kanban size={16} className="text-indigo-400" />
              <span className="text-indigo-400 text-sm font-medium">Sprint {sprint.active_sprint.number}</span>
              <span className="ml-auto text-gray-500 text-xs">
                {formatDate(sprint.active_sprint.start_date)} → {formatDate(sprint.active_sprint.end_date)}
              </span>
            </div>
            <p className="text-white text-base">{sprint.active_sprint.goal}</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-500 text-sm">No active sprint. Run "new sprint" in Claude to create one.</p>
          </div>
        )}

        <div>
          <h2 className="text-white font-medium mb-4">Backlog</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "To Do", items: todo, color: "border-gray-700", labelClass: "text-gray-400" },
              { label: "In Progress", items: inProgress, color: "border-amber-800", labelClass: "text-amber-400" },
              { label: "Done", items: done, color: "border-emerald-800", labelClass: "text-emerald-400" },
            ].map(({ label, items: colItems, color, labelClass }) => (
              <div key={label} className={`border rounded-xl p-4 ${color}`}>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-4 ${labelClass}`}>
                  {label} <span className="text-gray-600 font-normal">({colItems.length})</span>
                </p>
                <div className="space-y-2">
                  {colItems.map((item) => (
                    <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                      <p className="text-white text-sm">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.member && <span className="text-gray-500 text-xs">{item.member}</span>}
                        {item.priority && (
                          <span className={`text-xs ${PRIORITY_COLOR[item.priority] ?? "text-gray-500"}`}>
                            {item.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {colItems.length === 0 && <p className="text-gray-700 text-xs text-center py-4">Empty</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
