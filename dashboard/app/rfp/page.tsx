import { AppShell } from "@/components/layout/AppShell";
import { getMarkdownFiles } from "@/lib/github";
import { EntryLibrary } from "@/components/library/EntryLibrary";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RFPPage() {
  const entries = await getMarkdownFiles("rfps/entries");
  return (
    <AppShell>
      <div className="mb-5">
        <Link href="/documents" className="inline-flex items-center gap-1.5 text-sm text-fg-secondary hover:text-fg-primary transition-colors">
          ← Documents
        </Link>
      </div>
      <EntryLibrary kind="rfp" entries={entries} />
    </AppShell>
  );
}
