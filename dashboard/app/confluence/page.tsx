import { AppShell } from "@/components/layout/AppShell";
import { TechDocs } from "@/components/confluence/TechDocs";
import Link from "next/link";

export default function ConfluencePage() {
  return (
    <AppShell>
      <div className="mb-5">
        <Link href="/documents" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors">
          ← Documents
        </Link>
      </div>
      <TechDocs />
    </AppShell>
  );
}
