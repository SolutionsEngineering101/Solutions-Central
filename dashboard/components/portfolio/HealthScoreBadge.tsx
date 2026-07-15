"use client";
import type { ItemHealthScore } from "./types";

function getEmoji(score: number) {
  if (score >= 80) return "🟢";
  if (score >= 60) return "🟠";
  if (score >= 40) return "🟡";
  return "🔴";
}

function getColor(score: number) {
  if (score >= 80) return "var(--success-500)";
  if (score >= 60) return "var(--warning-400)";
  if (score >= 40) return "var(--warning-600)";
  return "var(--error-500)";
}

export function HealthScoreBadge({ score, onClick, size = "md", showLabel = true }: {
  score: ItemHealthScore;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const sizeClasses = { sm: "text-xs px-2 py-1", md: "text-sm px-3 py-2", lg: "text-base px-4 py-3" };
  const textSizeClasses = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" };
  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-lg font-semibold transition-all hover:opacity-80 cursor-pointer inline-flex items-center gap-2`}
      style={{ backgroundColor: `${score.healthColor}20`, color: score.healthColor }}
      title={`Health: ${score.overallScore}% — ${score.healthLabel}`}
    >
      <span className={textSizeClasses[size]}>{getEmoji(score.overallScore)}</span>
      <div className="text-left">
        <div className="font-bold">{score.overallScore}%</div>
        {showLabel && <div className="text-xs opacity-75">{score.healthLabel}</div>}
      </div>
    </button>
  );
}

export function HealthScoreCircle({ score }: { score: number }) {
  const color = getColor(score);
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="absolute w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--neutral-300)" strokeWidth="2" />
        <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(score / 100) * 283} 283`} strokeLinecap="round"
          transform="rotate(-90 50 50)" />
      </svg>
      <div className="text-center">
        <div className="text-5xl mb-2">{getEmoji(score)}</div>
        <div className="text-3xl font-bold" style={{ color }}>{score}%</div>
      </div>
    </div>
  );
}
