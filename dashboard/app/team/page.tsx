import { AppShell } from "@/components/layout/AppShell";
import { getMarkdownFiles } from "@/lib/github";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const profiles = await getMarkdownFiles("skills/member");
  const members = profiles.filter((p) => !p.path.includes("_template"));

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-fg-primary text-2xl font-semibold">Team & Skills</h1>
          <p className="text-fg-secondary text-sm mt-1">6 members · Vantage Circle Solutions Engineering</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map((m) => {
            const { name, role, email } = m.frontmatter as Record<string, string>;
            const initials = (name ?? "")
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            const coreSkills = m.content
              .split("\n")
              .filter((l) => l.startsWith("- ") && l.length > 2)
              .slice(0, 4)
              .map((l) => l.replace("- ", "").trim());

            return (
              <Card key={m.path} compact>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand-500 rounded-pill flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-semibold">{initials}</span>
                  </div>
                  <div>
                    <p className="text-fg-primary text-sm font-medium">{name ?? "—"}</p>
                    <p className="text-fg-secondary text-xs">{role || "Role not set"}</p>
                    {email && <p className="text-fg-secondary text-xs">{email}</p>}
                  </div>
                </div>
                {coreSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {coreSkills.map((s) => (
                      <Badge key={s} variant="neutral">{s}</Badge>
                    ))}
                  </div>
                )}
                {coreSkills.length === 0 && (
                  <p className="text-fg-secondary text-xs">Profile not filled in yet</p>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
