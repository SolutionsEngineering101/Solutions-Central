import { AppShell } from "@/components/layout/AppShell";
import { ProjectTracker } from "@/components/project-tracker/ProjectTracker";
import Link from "next/link";

export default function TrackerPage() {
  return (
    <AppShell>
      <div className="mb-5">
        <Link
          href="/sprint"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
        >
          ← Project Tracker
        </Link>
      </div>
      <ProjectTracker />
    </AppShell>
  );
}
