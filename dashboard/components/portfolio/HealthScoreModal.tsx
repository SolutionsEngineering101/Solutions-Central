"use client";
import { useEffect } from "react";
import { HealthScoreCircle } from "./HealthScoreBadge";
import { Button } from "@/components/ui/button";

interface HealthScoreModalProps {
  title: string;
  score: number;
  onClose: () => void;
  factors?: { statusFactor: number; timelineFactor: number; blockerFactor: number; confidenceFactor: number };
}

export function HealthScoreModal({ title, score, onClose, factors = { statusFactor: 75, timelineFactor: 85, blockerFactor: 90, confidenceFactor: 80 } }: HealthScoreModalProps) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const getLabel = (s: number) => s >= 80 ? "HEALTHY" : s >= 60 ? "AT RISK" : s >= 40 ? "CRITICAL" : "BLOCKED";
  const getColor = (s: number) => s >= 80 ? "var(--success-500)" : s >= 60 ? "var(--warning-400)" : "var(--error-500)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-modal)] backdrop-blur-sm">
      <div className="bg-surface-card border border-neutral-200 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 sticky top-0 bg-surface-card">
          <h2 className="text-xl font-bold text-fg-primary">{title} Health Score</h2>
          <button onClick={onClose} className="text-fg-secondary hover:text-fg-primary text-2xl leading-none transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-8 items-center">
            <HealthScoreCircle score={score} />
            <div>
              <div className="text-3xl font-bold text-fg-primary">{score}%</div>
              <div className="text-lg font-semibold mt-1" style={{ color: getColor(score) }}>{getLabel(score)}</div>
              <div className="text-sm text-fg-secondary mt-2">Based on status, timeline, and blocker factors</div>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-6">
            <h3 className="font-semibold text-fg-primary mb-4">Score Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: "Status Factor", value: factors.statusFactor, desc: "% of layers complete (Backend/Frontend/QA)", weight: "40%" },
                { label: "Timeline Factor", value: factors.timelineFactor, desc: "Days to deadline, velocity trend", weight: "35%" },
                { label: "Blocker Factor", value: factors.blockerFactor, desc: "Active dependencies and blockers", weight: "25%" },
              ].map(({ label, value, desc, weight }) => (
                <div key={label} className="bg-neutral-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-fg-primary">{label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-neutral-300 rounded-pill h-2 overflow-hidden">
                        <div className="h-full rounded-pill" style={{ backgroundColor: getColor(value), width: `${value}%` }} />
                      </div>
                      <span className="font-semibold text-fg-primary min-w-12">{value}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-xs text-fg-secondary">{desc}</p>
                    <span className="text-xs font-semibold text-fg-secondary">Weight: {weight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-neutral-200 bg-neutral-50 sticky bottom-0">
          <Button variant="neutral" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
