"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";

interface Props {
  item: { path: string; frontmatter: Record<string, unknown>; content: string };
  onClose: () => void;
}

type RecordType = "playbook" | "blueprint" | "both";

export function RecordModal({ item, onClose }: Props) {
  const { data: session } = useSession();
  const [type, setType] = useState<RecordType>("playbook");
  const [title, setTitle] = useState((item.frontmatter.client as string) ?? "");
  const [tags, setTags] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const author = session?.user?.name ?? "SE Team";
    const content = item.content || JSON.stringify(item.frontmatter, null, 2);

    const requests = [];
    if (type === "playbook" || type === "both") {
      requests.push(
        fetch("/api/github/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "playbook", title, tags, content, author }),
        })
      );
    }
    if (type === "blueprint" || type === "both") {
      requests.push(
        fetch("/api/github/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "blueprint", title, tags, domain, content, author }),
        })
      );
    }

    await Promise.all(requests);
    setLoading(false);
    setDone(true);
    setTimeout(onClose, 1500);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">Record Solution</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {done ? (
          <p className="text-emerald-400 text-sm text-center py-4">✓ Recorded successfully</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">Record to</label>
              <div className="flex gap-2">
                {(["playbook", "blueprint", "both"] as RecordType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      type === t
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">Tags (comma separated)</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. api, integration, hr-tech"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {(type === "blueprint" || type === "both") && (
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">Domain / Product</label>
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. Rewards & Recognition"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !title}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2"
            >
              {loading ? "Recording…" : "Record"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
