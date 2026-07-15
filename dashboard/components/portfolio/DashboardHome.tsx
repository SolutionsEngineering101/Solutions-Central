"use client";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { calculatePortfolioHealth, getAtRiskItemsCount, getBlockedItemsCount, calculateRealVelocityTrend } from "./utils/healthScoring";
import type { Project, PortfolioItem } from "./types";
import { HealthScoreCircle } from "./HealthScoreBadge";
import { HealthScoreModal } from "./HealthScoreModal";
import { Card, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        <h1 className="text-fg-primary text-[length:var(--font-size-2xl)] font-semibold">Project Tracker</h1>
        <p className="text-fg-secondary text-[length:var(--font-size-md)] mt-1">Backend · Frontend · QA status across all projects</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Portfolio Health"
          value={`${portfolioHealth}%`}
          tone="success"
          icon="🟢"
          onClick={() => setHealthModalOpen(true)}
        />
        <StatCard
          label="Completion"
          value={isEmpty ? "—" : `${completionPct}%`}
          subtext={isEmpty ? "No items yet" : `${completedCount} / ${allItems.length} items`}
          tone="neutral"
          icon="📊"
        />
        <StatCard
          label="At-Risk Items"
          value={atRiskCount}
          subtext={`${blockedCount} blocked`}
          tone="error"
          icon="🚨"
          onClick={onAtRiskClick}
        />
      </div>

      {/* Health overview + Active projects */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardTitle className="mb-5">Health Overview</CardTitle>
          <div className="flex justify-center mb-6">
            <HealthScoreCircle score={portfolioHealth} />
          </div>
          <div className="space-y-0">
            {[
              { label: "Completed", value: completedCount, className: "text-[var(--color-success)]" },
              { label: "In Progress", value: inProgressCount, className: "text-brand-400" },
              { label: "Not Started", value: notStartedCount, className: "text-fg-secondary" },
            ].map(({ label, value, className }) => (
              <div key={label} className="flex items-center justify-between h-8 border-b border-neutral-200 last:border-0">
                <span className="text-[length:var(--font-size-md)] text-fg-secondary">{label}</span>
                <span className={cn("text-[length:var(--font-size-md)] font-semibold", className)}>{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-5">Active Projects</CardTitle>
          <div className="flex-1 flex flex-col">
            {activeProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <div className="text-3xl mb-1">📂</div>
                <p className="text-[length:var(--font-size-md)] font-semibold text-fg-primary">No active projects</p>
                <p className="text-[length:var(--font-size-xs)] text-fg-secondary">Upload a CSV to start tracking</p>
              </div>
            ) : (
              activeProjects.slice(0, 4).map(project => {
                const items = allItems.filter(i => i.projectId === project.id);
                const done = items.filter(i => i.status.backend === "done" && i.status.frontend === "done" && i.status.qa === "done").length;
                const pct = items.length ? Math.round((done / items.length) * 100) : 0;
                return (
                  <div
                    key={project.id}
                    className="py-3 border-b border-neutral-200 last:border-0 cursor-pointer hover:bg-neutral-200 px-2 rounded-[8px] transition-colors duration-200 ease-in-out"
                    onClick={() => onProjectClick?.(project.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[length:var(--font-size-md)] font-semibold text-fg-primary">{project.name}</span>
                      <Badge variant="success">On track</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-neutral-300 rounded-pill overflow-hidden">
                        <div className="h-full bg-[var(--color-success)] rounded-pill transition-all duration-300 ease-out" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[length:var(--font-size-xs)] text-fg-secondary font-medium min-w-fit">{pct}%</span>
                    </div>
                    <div className="text-[length:var(--font-size-xs)] text-fg-secondary">{done} of {items.length} tasks</div>
                  </div>
                );
              })
            )}
            {!isEmpty && (
              <Button variant="neutral" className="w-full mt-4" onClick={onViewAllProjects}>
                View all projects →
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Trend chart */}
      <Card>
        <CardTitle className="mb-5">Completion Trend</CardTitle>
        {isEmpty ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 rounded-lg bg-neutral-200/50 border border-dashed border-neutral-300">
            <div className="text-3xl">📈</div>
            <p className="text-[length:var(--font-size-md)] font-semibold text-fg-primary">No trend data yet</p>
            <p className="text-[length:var(--font-size-xs)] text-fg-secondary">Upload a CSV to see completion trends</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="0" stroke="var(--neutral-200)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--neutral-300)" style={{ fontSize: "12px" }} tick={{ fill: "var(--neutral-500)" }} />
                <YAxis stroke="var(--neutral-300)" style={{ fontSize: "12px" }} tick={{ fill: "var(--neutral-500)" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--neutral-100)", border: "1px solid var(--neutral-300)", borderRadius: "10px", color: "var(--text-primary)" }}
                  labelStyle={{ color: "var(--neutral-500)" }}
                />
                <Legend wrapperStyle={{ color: "var(--neutral-500)", fontSize: "12px" }} />
                <Line type="monotone" dataKey="completed" stroke="var(--success-400)" strokeWidth={2} dot={false} name="Completed" />
                <Line type="monotone" dataKey="inProgress" stroke="var(--brand-400)" strokeWidth={2} dot={false} name="In Progress" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center justify-between text-[length:var(--font-size-xs)] text-fg-secondary">
              <span>{completedCount} completed · {inProgressCount} in progress · {notStartedCount} not started</span>
              <span className="font-medium text-fg-secondary">{allItems.length} total items</span>
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
