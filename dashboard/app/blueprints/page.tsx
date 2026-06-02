import { AppShell } from "@/components/layout/AppShell";
import { getMarkdownFiles } from "@/lib/github";
import { EntryLibrary } from "@/components/library/EntryLibrary";

export const dynamic = "force-dynamic";

export default async function BlueprintsPage() {
  const blueprints = await getMarkdownFiles("pre-built-solutions/blueprints");

  return (
    <AppShell>
      <EntryLibrary kind="blueprint" entries={blueprints} />
    </AppShell>
  );
}
