import { AppShell } from "@/components/layout/AppShell";
import { RequestsTable } from "@/components/requests/RequestsTable";
import { getMarkdownFiles } from "@/lib/github";

export const dynamic = "force-dynamic";

export default async function SolutionRequestsPage() {
  const forms = await getMarkdownFiles("intake/solutions-forms");
  const requests = forms
    .filter((f) => !f.path.includes("skeleton-") && !f.path.endsWith("README.md"))
    .map((f) => ({
      path: f.path,
      frontmatter: f.frontmatter,
      content: f.content,
    }));

  return (
    <AppShell>
      <RequestsTable requests={requests} />
    </AppShell>
  );
}
