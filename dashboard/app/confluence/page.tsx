import { AppShell } from "@/components/layout/AppShell";
import { TechDocs } from "@/components/confluence/TechDocs";
import Link from "next/link";

export default function ConfluencePage() {
  return (
    <AppShell>
      <div className="mb-5">
        <Link href="/documents" className="inline-flex items-center gap-1.5 text-sm text-fg-secondary hover:text-fg-primary transition-colors duration-200 ease-in-out">
          ← Documents
        </Link>
      </div>
      <TechDocs />
    </AppShell>
  );
}
