import { AppShell } from "@/components/layout/AppShell";
import { ConfluenceViewer } from "@/components/confluence/ConfluenceViewer";

export default function ConfluencePage() {
  return (
    <AppShell>
      <ConfluenceViewer />
    </AppShell>
  );
}
