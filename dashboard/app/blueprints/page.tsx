import { AppShell } from "@/components/layout/AppShell";
import { getMarkdownFiles } from "@/lib/github";
import { EntryLibrary } from "@/components/library/EntryLibrary";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BlueprintsPage() {
  const blueprints = await getMarkdownFiles("pre-built-solutions/blueprints");
  return (
    <AppShell>
      <div className="mb-5">
        <Link href="/documents" className="inline-flex items-center gap-1.5 text-sm text-fg-secondary hover:text-fg-primary transition-colors duration-200 ease-in-out">
          ← Documents
        </Link>
      </div>
      <EntryLibrary kind="blueprint" entries={blueprints} />
    </AppShell>
  );
}
