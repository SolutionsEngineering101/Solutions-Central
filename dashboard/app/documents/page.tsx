import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";
import { BookOpen, Layers, FileSpreadsheet, FileText, Coins, type LucideIcon } from "lucide-react";

interface Section {
  href: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  border: string;
  external?: boolean;
}

const sections: Section[] = [
  {
    href: "/confluence",
    label: "Tech Docs",
    description: "Confluence space pages — technical documentation, specs, and guides.",
    Icon: BookOpen,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-600",
    border: "hover:border-brand-300",
  },
  {
    href: "/playbook",
    label: "Playbook",
    description: "Team learnings, best practices, and reusable processes from past work.",
    Icon: FileText,
    iconBg: "bg-warning-50",
    iconColor: "text-warning-600",
    border: "hover:border-warning-300",
  },
  {
    href: "/blueprints",
    label: "Blueprints",
    description: "Pre-built solution templates reusable across clients and engagements.",
    Icon: Layers,
    iconBg: "bg-success-50",
    iconColor: "text-success-600",
    border: "hover:border-success-300",
  },
  {
    href: "/rfp",
    label: "RFPs",
    description: "Requests for proposal — uploaded Excel files, fully searchable by AI.",
    Icon: FileSpreadsheet,
    iconBg: "bg-info-50",
    iconColor: "text-info-600",
    border: "hover:border-info-300",
  },
  {
    href: "/rate-explorer",
    label: "Rate Explorer",
    description: "Points ⇄ currency conversion rates for every client and country — interactive lookup and converter.",
    Icon: Coins,
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-600",
    border: "hover:border-neutral-400",
    external: true,
  },
];

export default function DocumentsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-fg-primary text-[length:var(--font-size-2xl)] font-semibold">Documents</h1>
          <p className="text-fg-secondary text-sm mt-1">Team knowledge base — docs, playbooks, blueprints, and RFPs.</p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {sections.map(({ href, label, description, Icon, iconBg, iconColor, border, external }) => {
            const cardClass = `group bg-surface-card border border-neutral-200 ${border} rounded-xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-[box-shadow,border-color] duration-200 ease-in-out`;
            const inner = (
              <>
                <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon size={20} className={iconColor} />
                </div>
                <div>
                  <p className="text-fg-primary font-semibold text-base">{label}</p>
                  <p className="text-fg-secondary text-sm mt-1 leading-relaxed">{description}</p>
                </div>
              </>
            );
            // Route handlers (raw HTML apps) can't be client-navigated — use a
            // plain anchor in a new tab instead of a Next.js Link.
            return external ? (
              <a key={href} href={href} target="_blank" rel="noopener" className={cardClass}>
                {inner}
              </a>
            ) : (
              <Link key={href} href={href} className={cardClass}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
