import { AppShell } from "@/components/layout/AppShell";
import { getMarkdownFiles } from "@/lib/github";
import { RFPLibrary } from "@/components/rfp/RFPLibrary";

export const dynamic = "force-dynamic";

export default async function RFPPage() {
  const entries = await getMarkdownFiles("rfps/entries");
  return (
    <AppShell>
      <RFPLibrary entries={entries} />
    </AppShell>
  );
}
