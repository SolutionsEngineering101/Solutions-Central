"use client";

import { PieChart, Pie, Cell, Tooltip, Sector, ResponsiveContainer } from "recharts";
import { Card, CardTitle } from "@/components/ui/card";

interface Props {
  low: number;
  medium: number;
  high: number;
}

const SLICES = [
  { key: "Low",    color: "var(--success-400)" },
  { key: "Medium", color: "var(--warning-400)" },
  { key: "High",   color: "var(--error-400)" },
];

// ── Tooltip ───────────────────────────────────────────────────────────────────

interface TooltipEntry {
  name: string;
  value: number;
  payload: { name: string; value: number; pct: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
  if (!active || !payload?.length) return null;
  const { name, value, pct } = payload[0].payload;
  const color = SLICES.find(s => s.key === name)?.color ?? "var(--color-white)";
  return (
    <div
      className="bg-neutral-100 border border-neutral-300 rounded-lg px-3 py-2 shadow-xl"
      style={{ zIndex: 9999 }}
    >
      <p className="text-[length:var(--font-size-xs)] font-semibold" style={{ color }}>{name} Complexity</p>
      <p className="text-[length:var(--font-size-xs)] text-fg-secondary mt-0.5">
        {value} requests · <span style={{ color }} className="font-semibold">{pct}%</span>
      </p>
    </div>
  );
}

// ── Active shape — controlled +5px expansion, no overlap ─────────────────────

interface SectorProps {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
}

function ActiveShape(props: SectorProps) {
  const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0, startAngle = 0, endAngle = 0, fill = "" } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.95}
      />
    </g>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ComplexityDonut({ low, medium, high }: Props) {
  const total = low + medium + high;

  const data = [
    { name: "Low",    value: low,    pct: total > 0 ? Math.round((low    / total) * 100) : 0 },
    { name: "Medium", value: medium, pct: total > 0 ? Math.round((medium / total) * 100) : 0 },
    { name: "High",   value: high,   pct: total > 0 ? Math.round((high   / total) * 100) : 0 },
  ].filter(d => d.value > 0);

  return (
    <Card compact className="flex flex-col">

      {/* Title — on its own line, separated from the legend */}
      <CardTitle className="text-[length:var(--font-size-dense)] pb-2.5 mb-3 border-b border-neutral-200 shrink-0">
        By Complexity
      </CardTitle>

      {/* Legend — vertical stack */}
      <div className="flex flex-col gap-2 mb-3 shrink-0">
        {SLICES.map(({ key, color }) => {
          const count = key === "Low" ? low : key === "Medium" ? medium : high;
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-pill shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[length:var(--font-size-xs)] text-fg-secondary">{key}</span>
              <span className="text-[length:var(--font-size-xs)] font-bold ml-auto tabular-nums" style={{ color }}>{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Donut — fills remaining card height */}
      <div className="relative flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="70%"
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              activeShape={ActiveShape}
            >
              {data.map(entry => (
                <Cell
                  key={entry.name}
                  fill={SLICES.find(s => s.key === entry.name)?.color ?? "var(--neutral-500)"}
                />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ zIndex: 9999, outline: "none" }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Centre label — z-index below tooltip */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <p className="text-[length:var(--font-size-xl)] font-bold text-fg-primary">{total}</p>
          <p className="text-[length:var(--font-size-xs)] text-fg-secondary mt-0.5">total</p>
        </div>
      </div>
    </Card>
  );
}
