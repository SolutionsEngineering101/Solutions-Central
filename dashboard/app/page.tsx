import { AppShell } from "@/components/layout/AppShell";
import { getJSON, getMarkdownFiles } from "@/lib/github";
import { formatDate } from "@/lib/utils";
import { TrendingUp, Layers, BookOpen, Users, CheckCircle, Circle, Clock, XCircle } from "lucide-react";

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

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Solution Given Closed": { bg: "bg-emerald-950", text: "text-emerald-400", border: "border-emerald-800" },
  "To Product Closed":     { bg: "bg-indigo-950",  text: "text-indigo-400",  border: "border-indigo-800" },
  "Open":                  { bg: "bg-amber-950",   text: "text-amber-400",   border: "border-amber-800" },
  "Rejected":              { bg: "bg-red-950",     text: "text-red-400",     border: "border-red-800" },
  "No Response Closed":    { bg: "bg-gray-800",    text: "text-gray-400",    border: "border-gray-700" },
  "Unknown":               { bg: "bg-gray-800",    text: "text-gray-500",    border: "border-gray-700" },
};

function normalizeStatus(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s || s === "—") return "Unknown";
  return s;
}

export default async function OverviewPage() {
  const [sprint, playbook, blueprints, forms] = await Promise.all([
    getJSON<SprintReport>("dashboard-data/sprint-report.json"),
    getMarkdownFiles("playbook/entries"),
    getMarkdownFiles("pre-built-solutions/blueprints"),
    getMarkdownFiles("intake/solutions-forms"),
  ]);

  const requests = forms.filter(
    (f) => !f.path.includes("skeleton-") && !f.path.endsWith("README.md")
  );

  // Count by status
  const statusCounts = new Map<string, number>();
  for (const req of requests) {
    const s = normalizeStatus(req.frontmatter.status);
    statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
  }
  const statusEntries = [...statusCounts.entries()].sort((a, b) => b[1] - a[1]);

  const delivered = statusCounts.get("Solution Given Closed") ?? 0;
  const open = statusCounts.get("Open") ?? 0;
  const activeSprint = sprint?.current_sprint?.number ? sprint.current_sprint : null;
  const teamActivity = Object.entries(sprint?.team_activity ?? {})
    .filter(([, v]) => v.today_summary)
    .slice(0, 4);

  const stats = [
    {
      label: "Solutions Delivered",
      value: delivered,
      sub: "Solution Given Closed",
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-950",
    },
    {
      label: "Open Requests",
      value: open,
      sub: "Awaiting action",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-950",
    },
    {
      label: "Blueprints",
      value: blueprints.length,
      sub: "Pre-built solutions",
      icon: Layers,
      color: "text-sky-400",
      bg: "bg-sky-950",
    },
    {
      label: "Playbook Entries",
      value: playbook.length,
      sub: "Team learnings",
      icon: BookOpen,
      color: "text-violet-400",
      bg: "bg-violet-950",
    },
  ];

  // Recent requests (last 5, non-skeleton, reversed)
  const recentRequests = [...requests].reverse().slice(0, 5);

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-white text-2xl font-semibold">Overview</h1>
          <p className="text-gray-400 text-sm mt-1">Solutions Engineering · Vantage Circle</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-white text-2xl font-bold">{value}</p>
              <p className="text-gray-300 text-xs font-medium mt-0.5">{label}</p>
              <p className="text-gray-600 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Status breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-white font-medium">Request Status Breakdown</h2>
            <span className="text-gray-600 text-xs">{requests.length} total requests</span>
          </div>

          {/* Progress bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden mb-5 gap-px">
            {statusEntries.map(([status, count]) => {
              const pct = (count / requests.length) * 100;
              const c = STATUS_COLORS[status];
              return (
                <div
                  key={status}
                  style={{ width: `${pct}%` }}
                  className={`${c?.bg ?? "bg-gray-700"} transition-all`}
                  title={`${status}: ${count}`}
                />
              );
            })}
          </div>

          {/* Status legend grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {statusEntries.map(([status, count]) => {
              const c = STATUS_COLORS[status];
              const pct = Math.round((count / requests.length) * 100);
              return (
                <div key={status} className={`border rounded-lg p-3 ${c?.border ?? "border-gray-700"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold ${c?.text ?? "text-gray-400"}`}>{count}</span>
                    <span className="text-gray-600 text-xs">{pct}%</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1 leading-snug">{status}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom row: Sprint + Recent requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-medium mb-4">Active Sprint</h2>
            {activeSprint ? (
              <div>
                <p className="text-indigo-400 text-sm font-medium mb-1">Sprint {activeSprint.number}</p>
                {activeSprint.goals.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {activeSprint.goals.map((g, i) => (
                      <li key={i} className="text-gray-300 text-sm flex gap-2">
                        <span className="text-indigo-500">·</span>{g}
                      </li>
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

            {teamActivity.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-800">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-3">Today's Activity</p>
                <ul className="space-y-3">
                  {teamActivity.map(([member, data]) => (
                    <li key={member}>
                      <p className="text-gray-400 text-xs font-medium capitalize mb-0.5">{member.replace(/-/g, " ")}</p>
                      <p className="text-gray-300 text-sm line-clamp-2">{data.today_summary}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-medium mb-4">Recent Requests</h2>
            {recentRequests.length > 0 ? (
              <ul className="space-y-3">
                {recentRequests.map((req, i) => {
                  const fm = req.frontmatter;
                  const client = (fm.client ?? fm.client_name ?? "—") as string;
                  const status = normalizeStatus(fm.status);
                  const date = (fm.submitted_at ?? fm.submitted_by ?? "") as string;
                  const c = STATUS_COLORS[status];
                  return (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span className="text-gray-300 text-sm truncate">{client}</span>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs border ${c?.border ?? "border-gray-700"} ${c?.text ?? "text-gray-400"}`}>
                        {status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No requests found.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
