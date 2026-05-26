"use client";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { calculatePortfolioHealth, getAtRiskItemsCount, getBlockedItemsCount, calculateRealVelocityTrend } from "./utils/healthScoring";
import type { Project, PortfolioItem } from "./types";
import { HealthScoreCircle } from "./HealthScoreBadge";
import { HealthScoreModal } from "./HealthScoreModal";

interface DashboardHomeProps {
  projects: Project[];
  onProjectClick?: (projectId: string) => void;
  onViewAllProjects?: () => void;
  onAtRiskClick?: () => void;
}

function buildTrendData(items: PortfolioItem[]) {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const start = sorted[0].dueDate;
  const end = sorted[sorted.length - 1].dueDate;
  const points: { date: string; completed: number; inProgress: number }[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const cutoff = new Date(cur);
    const label = cutoff.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const completed = items.filter(i => i.dueDate <= cutoff && i.status.backend === "done" && i.status.frontend === "done" && i.status.qa === "done").length;
    const inProgress = items.filter(i => i.dueDate <= cutoff && !(i.status.backend === "done" && i.status.frontend === "done" && i.status.qa === "done")).length;
    points.push({ date: label, completed, inProgress });
    cur.setDate(cur.getDate() + 7);
  }
  const lastLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (!points.length || points[points.length - 1].date !== lastLabel) {
    const completed = items.filter(i => i.status.backend === "done" && i.status.frontend === "done" && i.status.qa === "done").length;
    points.push({ date: lastLabel, completed, inProgress: items.length - completed });
  }
  return points;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col">
      {children}
    </div>
  );
}

function KPICard({ label, value, subtext, status, icon, onClick }: {
  label: string; value: string | number; subtext?: string;
  status: "healthy" | "error" | "neutral"; icon: string; onClick?: () => void;
}) {
  const colors = {
    healthy: { bg: "rgba(52,211,153,0.08)", text: "#34d399", icon: "rgba(52,211,153,0.15)" },
    error:   { bg: "rgba(248,113,113,0.08)", text: "#f87171", icon: "rgba(248,113,113,0.15)" },
    neutral: { bg: "rgba(156,163,175,0.08)", text: "#9ca3af", icon: "rgba(156,163,175,0.15)" },
  }[status];

  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col min-h-[116px] transition-shadow"
      style={{ cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
      onMouseEnter={onClick ? e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#4f46e5"; } : undefined}
      onMouseLeave={onClick ? e => { (e.currentTarget as HTMLDivElement).style.borderColor = ""; } : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: colors.icon }}>{icon}</div>
      </div>
      <p className="text-[34px] font-bold leading-none" style={{ color: colors.text }}>{value}</p>
      {subtext && <p className="text-sm text-gray-500 mt-2">{subtext}</p>}
    </div>
  );
}

export function DashboardHome({ projects, onProjectClick, onViewAllProjects, onAtRiskClick }: DashboardHomeProps) {
  const [healthModalOpen, setHealthModalOpen] = useState(false);

  const allItems = projects.flatMap(p => p.items);
  const isEmpty = allItems.length === 0;
  const velocityTrend = calculateRealVelocityTrend(allItems);
  const portfolioHealth = isEmpty ? 0 : calculatePortfolioHealth(allItems, allItems, velocityTrend);
  const atRiskCount = isEmpty ? 0 : getAtRiskItemsCount(allItems, allItems, velocityTrend);
  const blockedCount = isEmpty ? 0 : getBlockedItemsCount(allItems);

  const completedCount = allItems.filter(i => i.status.backend === "done" && i.status.frontend === "done" && i.status.qa === "done").length;
  const notStartedCount = allItems.filter(i => i.status.backend === "not_started" && i.status.frontend === "not_started" && i.status.qa === "not_started").length;
  const inProgressCount = allItems.length - completedCount - notStartedCount;
  const completionPct = isEmpty ? 0 : Math.round((completedCount / allItems.length) * 100);
  const activeProjects = projects.filter(p => p.items.length > 0);
  const trendData = buildTrendData(allItems);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-semibold">Project Tracker</h1>
        <p className="text-gray-500 text-sm mt-1">Backend · Frontend · QA status across all projects</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Portfolio Health" value={`${portfolioHealth}%`} status="healthy" icon="🟢" onClick={() => setHealthModalOpen(true)} />
        <KPICard label="Completion" value={isEmpty ? "—" : `${completionPct}%`} subtext={isEmpty ? "No items yet" : `${completedCount} / ${allItems.length} items`} status="neutral" icon="📊" />
        <KPICard label="At-Risk Items" value={atRiskCount} subtext={`${blockedCount} blocked`} status="error" icon="🚨" onClick={onAtRiskClick} />
      </div>

      {/* Health overview + Active projects */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h2 className="text-white font-medium mb-5">Health Overview</h2>
          <div className="flex justify-center mb-6">
            <HealthScoreCircle score={portfolioHealth} />
          </div>
          <div className="space-y-0">
            {[
              { label: "Completed", value: completedCount, color: "#34d399" },
              { label: "In Progress", value: inProgressCount, color: "#818cf8" },
              { label: "Not Started", value: notStartedCount, color: "#6b7280" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between h-8 border-b border-gray-800 last:border-0">
                <span className="text-sm text-gray-400">{label}</span>
                <span className="text-sm font-semibold" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-white font-medium mb-5">Active Projects</h2>
          <div className="flex-1 flex flex-col">
            {activeProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <div className="text-3xl mb-1">📂</div>
                <p className="text-sm font-semibold text-gray-300">No active projects</p>
                <p className="text-xs text-gray-600">Upload a CSV to start tracking</p>
              </div>
            ) : (
              activeProjects.slice(0, 4).map(project => {
                const items = allItems.filter(i => i.projectId === project.id);
                const done = items.filter(i => i.status.backend === "done" && i.status.frontend === "done" && i.status.qa === "done").length;
                const pct = items.length ? Math.round((done / items.length) * 100) : 0;
                return (
                  <div key={project.id} className="py-3 border-b border-gray-800 last:border-0 cursor-pointer hover:bg-gray-800/50 px-2 rounded transition-colors" onClick={() => onProjectClick?.(project.id)}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{project.name}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400">On track</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 font-medium min-w-fit">{pct}%</span>
                    </div>
                    <div className="text-xs text-gray-600">{done} of {items.length} tasks</div>
                  </div>
                );
              })
            )}
            {!isEmpty && (
              <button onClick={onViewAllProjects} className="w-full h-9 mt-4 rounded-lg bg-gray-800 text-indigo-400 font-medium text-sm hover:bg-gray-700 transition-colors">
                View all projects →
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* Trend chart */}
      <Card>
        <h2 className="text-white font-medium mb-5">Completion Trend</h2>
        {isEmpty ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 rounded-lg bg-gray-800/50 border border-dashed border-gray-700">
            <div className="text-3xl">📈</div>
            <p className="text-sm font-semibold text-gray-300">No trend data yet</p>
            <p className="text-xs text-gray-600">Upload a CSV to see completion trends</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="0" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" stroke="#4b5563" style={{ fontSize: "12px" }} tick={{ fill: "#6b7280" }} />
                <YAxis stroke="#4b5563" style={{ fontSize: "12px" }} tick={{ fill: "#6b7280" }} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "10px", color: "#fff" }} labelStyle={{ color: "#9ca3af" }} />
                <Legend wrapperStyle={{ color: "#9ca3af", fontSize: "12px" }} />
                <Line type="monotone" dataKey="completed" stroke="#34d399" strokeWidth={2} dot={false} name="Completed" />
                <Line type="monotone" dataKey="inProgress" stroke="#818cf8" strokeWidth={2} dot={false} name="In Progress" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>{completedCount} completed · {inProgressCount} in progress · {notStartedCount} not started</span>
              <span className="font-medium text-gray-400">{allItems.length} total items</span>
            </div>
          </>
        )}
      </Card>

      {healthModalOpen && (
        <HealthScoreModal title="Portfolio" score={portfolioHealth} onClose={() => setHealthModalOpen(false)} />
      )}
    </div>
  );
}
