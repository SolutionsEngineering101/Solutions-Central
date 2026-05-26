import { AppShell } from "@/components/layout/AppShell";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { getMarkdownFiles, getJSON } from "@/lib/github";

interface SolutionsFile {
  solutions?: Record<string, unknown>[];
}

export default async function PipelinePage() {
  const [forms, solutionsFile] = await Promise.all([
    getMarkdownFiles("intake/solutions-forms"),
    getJSON<SolutionsFile>("dashboard-data/solutions-provided.json"),
  ]);

  const solutions = solutionsFile?.solutions ?? [];

  const rawForms = forms.filter((f) => !f.path.includes("skeleton-"));
  const skeletons = forms.filter((f) => f.path.includes("skeleton-"));

  const deliveredClients = new Set(
    solutions.map((s) => s.client as string).filter(Boolean)
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-white text-2xl font-semibold">Pipeline</h1>
          <p className="text-gray-400 text-sm mt-1">Track solutions from intake to delivery</p>
        </div>
        <PipelineBoard
          forms={rawForms}
          skeletons={skeletons}
          delivered={solutions}
          deliveredClients={deliveredClients}
        />
      </div>
    </AppShell>
  );
}
