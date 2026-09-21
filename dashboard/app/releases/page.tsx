import { AppShell } from "@/components/layout/AppShell";
import ReleaseTracker from "@/components/releases/ReleaseTracker";

export const revalidate = 60;

export default function ReleasesPage() {
  return (
    <AppShell>
      <ReleaseTracker />
    </AppShell>
  );
}
