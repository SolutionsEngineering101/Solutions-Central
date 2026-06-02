import { AppShell } from "@/components/layout/AppShell";
import { getMarkdownFiles } from "@/lib/github";
import { EntryLibrary } from "@/components/library/EntryLibrary";

export const dynamic = "force-dynamic";

export default async function PlaybookPage() {
  const entries = await getMarkdownFiles("playbook/entries");

  return (
    <AppShell>
      <EntryLibrary kind="playbook" entries={entries} />
    </AppShell>
  );
}
