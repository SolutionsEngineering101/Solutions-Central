"use client";

import { PieChart, Pie, Cell, Tooltip, Sector, ResponsiveContainer } from "recharts";

interface Props {
  low: number;
  medium: number;
  high: number;
}

const SLICES = [
  { key: "Low",    color: "#34d399" },
  { key: "Medium", color: "#fbbf24" },
  { key: "High",   color: "#f87171" },
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
  const color = SLICES.find(s => s.key === name)?.color ?? "#fff";
  return (
    <div
      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl"
      style={{ zIndex: 9999 }}
    >
      <p className="text-xs font-semibold" style={{ color }}>{name} Complexity</p>
      <p className="text-xs text-gray-400 mt-0.5">
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col">

      {/* Header: title left · legend right */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-white font-semibold text-sm">By Complexity</h2>
        <div className="flex items-center gap-3">
          {SLICES.map(({ key, color }) => {
            const count = key === "Low" ? low : key === "Medium" ? medium : high;
            const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[11px] text-gray-400">{key}</span>
                <span className="text-[11px] font-bold" style={{ color }}>{pct}%</span>
              </div>
            );
          })}
        </div>
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
                  fill={SLICES.find(s => s.key === entry.name)?.color ?? "#6b7280"}
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
          <p className="text-xl font-bold text-white">{total}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">total</p>
        </div>
      </div>
    </div>
  );
}
