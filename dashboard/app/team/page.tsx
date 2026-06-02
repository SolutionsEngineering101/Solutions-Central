import { AppShell } from "@/components/layout/AppShell";
import { getMarkdownFiles } from "@/lib/github";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const profiles = await getMarkdownFiles("skills/member");
  const members = profiles.filter((p) => !p.path.includes("_template"));

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-white text-2xl font-semibold">Team & Skills</h1>
          <p className="text-gray-400 text-sm mt-1">6 members · Vantage Circle Solutions Engineering</p>
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
              <div key={m.path} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-semibold">{initials}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{name ?? "—"}</p>
                    <p className="text-gray-500 text-xs">{role || "Role not set"}</p>
                    {email && <p className="text-gray-600 text-xs">{email}</p>}
                  </div>
                </div>
                {coreSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {coreSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                )}
                {coreSkills.length === 0 && (
                  <p className="text-gray-700 text-xs">Profile not filled in yet</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
