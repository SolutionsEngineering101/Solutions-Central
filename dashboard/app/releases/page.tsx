import { AppShell } from "@/components/layout/AppShell";
import ReleaseTracker from "@/components/releases/ReleaseTracker";

export const dynamic = "force-dynamic";

export default function ReleasesPage() {
  return (
    <AppShell>
      <ReleaseTracker />
    </AppShell>
  );
}
