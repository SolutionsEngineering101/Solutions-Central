import { AppShell } from "@/components/layout/AppShell";
import { KnowledgeHub } from "@/components/knowledge/KnowledgeHub";
import { getJSON } from "@/lib/github";
import type { KnowledgeIndex } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

export interface KnowledgeStats {
  chunkCount: number;
  builtAt: string;
  bySource: { form: number; playbook: number; blueprint: number; rfp: number; spec: number; confluence: number };
}

export default async function KnowledgePage() {
  const index = await getJSON<KnowledgeIndex>("dashboard-data/knowledge-index.json");

  const stats: KnowledgeStats | null = index
    ? {
        chunkCount: index.chunkCount,
        builtAt: index.builtAt,
        bySource: {
          form: index.chunks.filter((c) => c.source === "form").length,
          playbook: index.chunks.filter((c) => c.source === "playbook").length,
          blueprint: index.chunks.filter((c) => c.source === "blueprint").length,
          rfp: index.chunks.filter((c) => c.source === "rfp").length,
          spec: index.chunks.filter((c) => c.source === "spec").length,
          confluence: index.chunks.filter((c) => c.source === "confluence").length,
        },
      }
    : null;

  return (
    <AppShell>
      <KnowledgeHub initialStats={stats} />
    </AppShell>
  );
}
