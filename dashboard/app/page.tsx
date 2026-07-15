import { AppShell } from "@/components/layout/AppShell";
import { getMarkdownFiles } from "@/lib/github";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle2, Clock, TrendingUp, ArrowUpRight, Users, BookOpen, Layers } from "lucide-react";
import { QuarterlyBreakdown } from "@/components/overview/QuarterlyBreakdown";
import { ComplexityDonut } from "@/components/overview/ComplexityDonut";
import { Card, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, type BadgeProps } from "@/components/ui/badge";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; variant: NonNullable<BadgeProps["variant"]>; dot: string }> = {
  "Solution Given Closed": { label: "Delivered",   variant: "success", dot: "var(--success-400)" },
  "To Product Closed":     { label: "To Product",  variant: "brand",   dot: "var(--brand-400)" },
  "Open":                  { label: "Open",        variant: "warning", dot: "var(--warning-400)" },
  "Rejected":              { label: "Rejected",    variant: "error",   dot: "var(--error-400)" },
  "No Response Closed":    { label: "No Response", variant: "neutral", dot: "var(--neutral-500)" },
};

const SPOC_KEYS: Record<string, string> = {
  nilimpa: "Nilimpa", garima: "Garima", hemanga: "Hemanga",
  pankaj: "Pankaj",  kongkana: "Kongkana", bhargav: "Bhargav",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeStatus(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s || s === "—") return "Unknown";
  if (s.toLowerCase() === "new") return "Open";
  return s;
}

function normalizeComplexity(raw: unknown): "Low" | "Medium" | "High" | "Other" {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("low"))  return "Low";
  if (s.includes("med"))  return "Medium";
  if (s.includes("high")) return "High";
  return "Other";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [forms, playbook, blueprints] = await Promise.all([
    getMarkdownFiles("intake/solutions-forms"),
    getMarkdownFiles("playbook/entries"),
    getMarkdownFiles("pre-built-solutions/blueprints"),
  ]);

  const requests = forms.filter(
    f => !f.path.includes("skeleton-") && !f.path.endsWith("README.md")
  );
  const total = requests.length;

  const statusCounts: Record<string, number> = {};
  for (const r of requests) {
    const s = normalizeStatus(r.frontmatter.status);
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }
  const delivered = statusCounts["Solution Given Closed"] ?? 0;
  const open      = statusCounts["Open"] ?? 0;
  const winRate   = total > 0 ? Math.round((delivered / total) * 100) : 0;

  // SPOC leaderboard
  const spocCounts: Record<string, number> = {};
  for (const r of requests) {
    const raw = String(r.frontmatter.solution_spoc ?? "").toLowerCase();
    raw.split(/[,&]/).map(s => s.trim()).forEach(part => {
      const key = Object.keys(SPOC_KEYS).find(k => part.includes(k));
      if (key) spocCounts[SPOC_KEYS[key]] = (spocCounts[SPOC_KEYS[key]] ?? 0) + 1;
    });
  }
  const leaderboard = Object.entries(spocCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const leaderMax   = leaderboard[0]?.[1] ?? 1;

  // Complexity
  const cx: Record<string, number> = { Low: 0, Medium: 0, High: 0 };
  for (const r of requests) {
    const c = normalizeComplexity(r.frontmatter.complexity);
    if (c !== "Other") cx[c]++;
  }

  // Recent requests (last 5)
  const recent = [...requests]
    .sort((a, b) => {
      const da = String(a.frontmatter.submitted_at ?? a.frontmatter.date ?? "");
      const db = String(b.frontmatter.submitted_at ?? b.frontmatter.date ?? "");
      return db > da ? 1 : -1;
    })
    .slice(0, 5);

  return (
    <AppShell>
      <div className="flex flex-col gap-3 h-full">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-fg-primary text-[length:var(--font-size-xl)] font-semibold">Overview</h1>
            <p className="text-fg-secondary text-[length:var(--font-size-xs)] mt-0.5">Solutions Engineering · Vantage Circle</p>
          </div>
          <p className="text-fg-secondary text-[length:var(--font-size-xs)]">{total} requests tracked</p>
        </div>

        {/* ── 3 KPI cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Delivered" value={delivered} subtext={`of ${total} requests`} tone="success" icon={<CheckCircle2 size={16} />} />
          <StatCard label="Completion Rate" value={`${winRate}%`} subtext="delivery rate" tone="brand" icon={<TrendingUp size={16} />} />
          <StatCard label="Open Now" value={open} subtext="awaiting action" tone="warning" icon={<Clock size={16} />} />
        </div>

        {/* ── Quarterly breakdown ──────────────────────────────────────────── */}
        <QuarterlyBreakdown
          requests={requests.map(r => ({
            submittedAt: String(r.frontmatter.submitted_at ?? r.frontmatter.date ?? ""),
            status: normalizeStatus(r.frontmatter.status),
          }))}
        />

        {/* ── Bottom row — flex-1 fills remaining viewport height ────────── */}
        <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">

          {/* Team leaderboard */}
          <Card compact className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Users size={13} className="text-fg-secondary" />
              <CardTitle className="text-[length:var(--font-size-dense)]">Team Leaderboard</CardTitle>
            </div>
            <div className="space-y-2.5">
              {leaderboard.map(([name, count], i) => {
                const pct = Math.round((count / leaderMax) * 100);
                // Rank medals (gold/silver/bronze) have no equivalent status
                // token — they're a decorative rank cue, not a semantic state.
                const medals = ["#fbbf24", "#9ca3af", "#a16207"];
                const barColor = i === 0 ? "var(--brand-400)" : i === 1 ? "var(--brand-500)" : "var(--brand-600)";
                return (
                  <div key={name}>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-4 h-4 rounded-pill flex items-center justify-center shrink-0 text-[9px] font-bold"
                        style={i < 3
                          ? { backgroundColor: `${medals[i]}20`, color: medals[i] }
                          : { backgroundColor: "var(--neutral-200)", color: "var(--neutral-500)" }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[length:var(--font-size-xs)] text-fg-primary flex-1">{name}</span>
                      <span className="text-[length:var(--font-size-xs)] font-bold text-fg-primary tabular-nums">{count}</span>
                    </div>
                    <div className="ml-6 h-1 bg-neutral-300 rounded-pill overflow-hidden">
                      <div className="h-full rounded-pill" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-200 grid grid-cols-2 gap-2">
              <div className="bg-neutral-200/50 rounded-md px-3 py-2 flex items-center gap-2">
                <BookOpen size={11} className="text-brand-400 shrink-0" />
                <div>
                  <p className="text-[length:var(--font-size-md)] font-bold text-brand-400 leading-none">{playbook.length}</p>
                  <p className="text-[length:var(--font-size-xs)] text-fg-secondary">Playbook</p>
                </div>
              </div>
              <div className="bg-neutral-200/50 rounded-md px-3 py-2 flex items-center gap-2">
                <Layers size={11} className="text-info-400 shrink-0" />
                <div>
                  <p className="text-[length:var(--font-size-md)] font-bold text-info-400 leading-none">{blueprints.length}</p>
                  <p className="text-[length:var(--font-size-xs)] text-fg-secondary">Blueprints</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Complexity donut */}
          <ComplexityDonut low={cx.Low} medium={cx.Medium} high={cx.High} />

          {/* Recent requests */}
          <Card compact className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-[length:var(--font-size-dense)]">Recent Requests</CardTitle>
              <Link href="/solution-requests" className="flex items-center gap-0.5 text-[length:var(--font-size-xs)] text-brand-400 hover:text-brand-300 transition-colors duration-150 ease-in-out">
                View all <ArrowUpRight size={10} />
              </Link>
            </div>
            <div className="space-y-0">
              {recent.map((req, i) => {
                const fm     = req.frontmatter;
                const client = String(fm.client ?? fm.client_name ?? "—");
                const status = normalizeStatus(fm.status);
                const meta   = STATUS_META[status] ?? { label: status, variant: "neutral" as const, dot: "var(--neutral-500)" };
                const date   = String(fm.submitted_at ?? fm.date ?? "");
                return (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-neutral-200 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-pill shrink-0" style={{ backgroundColor: meta.dot }} />
                    <span className="text-[length:var(--font-size-xs)] text-fg-primary truncate flex-1">{client}</span>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {date && <span className="text-[length:var(--font-size-xs)] text-fg-secondary">{formatDate(date)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

        </div>
      </div>
    </AppShell>
  );
}
