"use client";

import { useState } from "react";
import { RecordModal } from "./RecordModal";
import { cn, formatDate } from "@/lib/utils";
import { CheckCircle, Circle, FileText } from "lucide-react";

interface FormFile {
  path: string;
  frontmatter: Record<string, unknown>;
  content: string;
}

interface Props {
  forms: FormFile[];
  skeletons: FormFile[];
  delivered: Record<string, unknown>[];
  deliveredClients: Set<string>;
}

const STAGES = ["Intake", "In Progress", "Delivered", "Recorded"] as const;

function Card({ title, date, tags, onClick, action }: {
  title: string;
  date?: string;
  tags?: string[];
  onClick?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-lg p-4 cursor-pointer hover:border-gray-600 transition-colors"
      onClick={onClick}
    >
      <p className="text-white text-sm font-medium">{title}</p>
      {date && <p className="text-gray-500 text-xs mt-1">{date}</p>}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((t) => (
            <span key={t} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full">{t}</span>
          ))}
        </div>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function PipelineBoard({ forms, skeletons, delivered, deliveredClients }: Props) {
  const [selected, setSelected] = useState<FormFile | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordTarget, setRecordTarget] = useState<FormFile | null>(null);

  const columns = [
    {
      stage: "Intake" as const,
      color: "border-gray-700",
      label: "text-gray-400",
      items: forms.filter((f) => {
        const client = (f.frontmatter.client as string) ?? (f.frontmatter.client_name as string) ?? f.path.split("/").pop() ?? "";
        return !deliveredClients.has(client);
      }),
    },
    {
      stage: "In Progress" as const,
      color: "border-amber-800",
      label: "text-amber-400",
      items: skeletons,
    },
    {
      stage: "Delivered" as const,
      color: "border-indigo-800",
      label: "text-indigo-400",
      items: delivered.map((d) => ({
        path: "",
        frontmatter: d,
        content: "",
      })),
    },
    {
      stage: "Recorded" as const,
      color: "border-emerald-800",
      label: "text-emerald-400",
      items: [],
    },
  ];

  return (
    <>
      <div className="grid grid-cols-4 gap-4 min-h-[60vh]">
        {columns.map(({ stage, color, label, items }) => (
          <div key={stage} className={cn("border rounded-xl p-4", color)}>
            <div className={cn("text-xs font-semibold uppercase tracking-widest mb-4", label)}>
              {stage} <span className="text-gray-600 font-normal">({items.length})</span>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => {
                const title =
                  (item.frontmatter.client as string) ??
                  (item.frontmatter.client_name as string) ??
                  (item.frontmatter.title as string) ??
                  item.path.split("/").pop()?.replace(".md", "") ??
                  "Untitled";
                const date =
                  (item.frontmatter.date as string) ??
                  (item.frontmatter.recorded_at as string);

                return (
                  <Card
                    key={i}
                    title={title}
                    date={date ? formatDate(date) : undefined}
                    onClick={() => setSelected(item)}
                    action={
                      stage === "Delivered" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecordTarget(item);
                            setRecordOpen(true);
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Record to playbook / blueprint →
                        </button>
                      ) : undefined
                    }
                  />
                );
              })}
              {items.length === 0 && (
                <p className="text-gray-700 text-xs text-center py-8">Empty</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 z-40 flex items-center justify-end"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-gray-900 border-l border-gray-800 w-full max-w-xl h-full overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-sm mb-6">← Close</button>
            <h2 className="text-white text-lg font-semibold mb-1">
              {(selected.frontmatter.client as string) ?? (selected.frontmatter.client_name as string) ?? (selected.frontmatter.title as string) ?? "Detail"}
            </h2>
            <p className="text-gray-500 text-xs mb-4">{selected.path}</p>
            <pre className="text-gray-300 text-xs whitespace-pre-wrap font-mono bg-gray-950 rounded-lg p-4">
              {selected.content || JSON.stringify(selected.frontmatter, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Record modal */}
      {recordOpen && recordTarget && (
        <RecordModal
          item={recordTarget}
          onClose={() => { setRecordOpen(false); setRecordTarget(null); }}
        />
      )}
    </>
  );
}
