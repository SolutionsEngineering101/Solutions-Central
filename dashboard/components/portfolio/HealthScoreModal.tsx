"use client";
import { useEffect } from "react";
import { HealthScoreCircle } from "./HealthScoreBadge";

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
  const getColor = (s: number) => s >= 80 ? "#34d399" : s >= 60 ? "#fbbf24" : "#f87171";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h2 className="text-xl font-bold text-white">{title} Health Score</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-8 items-center">
            <HealthScoreCircle score={score} />
            <div>
              <div className="text-3xl font-bold text-white">{score}%</div>
              <div className="text-lg font-semibold mt-1" style={{ color: getColor(score) }}>{getLabel(score)}</div>
              <div className="text-sm text-gray-400 mt-2">Based on status, timeline, and blocker factors</div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h3 className="font-semibold text-white mb-4">Score Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: "Status Factor", value: factors.statusFactor, desc: "% of layers complete (Backend/Frontend/QA)", weight: "40%" },
                { label: "Timeline Factor", value: factors.timelineFactor, desc: "Days to deadline, velocity trend", weight: "35%" },
                { label: "Blocker Factor", value: factors.blockerFactor, desc: "Active dependencies and blockers", weight: "25%" },
              ].map(({ label, value, desc, weight }) => (
                <div key={label} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-200">{label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full" style={{ backgroundColor: getColor(value), width: `${value}%` }} />
                      </div>
                      <span className="font-semibold text-white min-w-12">{value}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-xs text-gray-500">{desc}</p>
                    <span className="text-xs font-semibold text-gray-500">Weight: {weight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-800 bg-gray-900/50 sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
