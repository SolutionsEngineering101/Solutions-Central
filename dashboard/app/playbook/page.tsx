import { AppShell } from "@/components/layout/AppShell";
import { getMarkdownFiles } from "@/lib/github";
import { EntryLibrary } from "@/components/library/EntryLibrary";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlaybookPage() {
  const entries = await getMarkdownFiles("playbook/entries");
  return (
    <AppShell>
      <div className="mb-5">
        <Link href="/documents" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors">
          ← Documents
        </Link>
      </div>
      <EntryLibrary kind="playbook" entries={entries} />
    </AppShell>
  );
}
