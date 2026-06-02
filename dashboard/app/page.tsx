import { AppShell } from "@/components/layout/AppShell";
import { getMarkdownFiles } from "@/lib/github";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle2, Clock, TrendingUp, ArrowUpRight, Users, BookOpen, Layers } from "lucide-react";
import { QuarterlyBreakdown } from "@/components/overview/QuarterlyBreakdown";
import { ComplexityDonut } from "@/components/overview/ComplexityDonut";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  "Solution Given Closed": { label: "Delivered",   color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  "To Product Closed":     { label: "To Product",  color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  "Open":                  { label: "Open",        color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  "Rejected":              { label: "Rejected",    color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  "No Response Closed":    { label: "No Response", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
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
            <h1 className="text-white text-xl font-semibold">Overview</h1>
            <p className="text-gray-500 text-xs mt-0.5">Solutions Engineering · Vantage Circle</p>
          </div>
          <p className="text-gray-600 text-xs">{total} requests tracked</p>
        </div>

        {/* ── 3 KPI cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Delivered", value: delivered, sub: `of ${total} requests`,    color: "#34d399", iconBg: "rgba(52,211,153,0.12)",  Icon: CheckCircle2 },
            { label: "Win Rate",        value: `${winRate}%`, sub: "delivery rate",        color: "#818cf8", iconBg: "rgba(129,140,248,0.12)", Icon: TrendingUp   },
            { label: "Open Now",        value: open,      sub: "awaiting action",           color: "#fbbf24", iconBg: "rgba(251,191,36,0.12)",  Icon: Clock        },
          ].map(({ label, value, sub, color, iconBg, Icon }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{label}</p>
                <p className="text-2xl font-bold leading-tight" style={{ color }}>{value}</p>
                <p className="text-[11px] text-gray-600">{sub}</p>
              </div>
            </div>
          ))}
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
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Users size={13} className="text-gray-500" />
              <h2 className="text-white font-semibold text-sm">Team Leaderboard</h2>
            </div>
            <div className="space-y-2.5">
              {leaderboard.map(([name, count], i) => {
                const pct    = Math.round((count / leaderMax) * 100);
                const medals = ["#fbbf24", "#9ca3af", "#a16207"];
                return (
                  <div key={name}>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
                        style={i < 3
                          ? { backgroundColor: `${medals[i]}20`, color: medals[i] }
                          : { backgroundColor: "#1f2937", color: "#6b7280" }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-xs text-gray-300 flex-1">{name}</span>
                      <span className="text-xs font-bold text-white tabular-nums">{count}</span>
                    </div>
                    <div className="ml-6 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: i === 0 ? "#818cf8" : i === 1 ? "#6366f1" : "#4338ca" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800 grid grid-cols-2 gap-2">
              <div className="bg-gray-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
                <BookOpen size={11} className="text-violet-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-violet-400 leading-none">{playbook.length}</p>
                  <p className="text-[10px] text-gray-500">Playbook</p>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
                <Layers size={11} className="text-sky-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-sky-400 leading-none">{blueprints.length}</p>
                  <p className="text-[10px] text-gray-500">Blueprints</p>
                </div>
              </div>
            </div>
          </div>

          {/* Complexity donut */}
          <ComplexityDonut low={cx.Low} medium={cx.Medium} high={cx.High} />

          {/* Recent requests */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold text-sm">Recent Requests</h2>
              <Link href="/solution-requests" className="flex items-center gap-0.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
                View all <ArrowUpRight size={10} />
              </Link>
            </div>
            <div className="space-y-0">
              {recent.map((req, i) => {
                const fm     = req.frontmatter;
                const client = String(fm.client ?? fm.client_name ?? "—");
                const status = normalizeStatus(fm.status);
                const meta   = STATUS_META[status] ?? { label: status, color: "#6b7280", bg: "rgba(107,114,128,0.12)" };
                const date   = String(fm.submitted_at ?? fm.date ?? "");
                return (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-800 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                    <span className="text-xs text-gray-300 truncate flex-1">{client}</span>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ color: meta.color, backgroundColor: meta.bg }}>
                        {meta.label}
                      </span>
                      {date && <span className="text-[10px] text-gray-600">{formatDate(date)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
