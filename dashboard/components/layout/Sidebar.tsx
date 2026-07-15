"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Layers,
  Users,
  ClipboardList,
  BarChart2,
  UserCog,
  LogOut,
  Rocket,
  BrainCircuit,
  FileSpreadsheet,
} from "lucide-react";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/solution-requests", label: "Solution Requests", icon: FileText },
  { href: "/sprint", label: "Project Tracker", icon: BarChart2 },
  { href: "/releases", label: "Releases", icon: Rocket },
  { href: "/documents", label: "Documents", icon: BookOpen },
  { href: "/knowledge", label: "Knowledge Hub", icon: BrainCircuit },
  { href: "/team", label: "Team & Skills", icon: Users },
  { href: "/worklogs", label: "Worklogs", icon: ClipboardList },
  { href: "/profile", label: "My Profile", icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-neutral-100 border-r border-neutral-300 flex flex-col">
      <div className="px-5 py-5 border-b border-neutral-300">
        <p className="text-fg-primary font-semibold text-sm tracking-wide">Solutions Central</p>
        <p className="text-fg-secondary text-xs mt-0.5">SE Team Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm font-medium transition-colors duration-200 ease-in-out",
              pathname === href || (href === "/documents" && ["/confluence", "/playbook", "/blueprints", "/rfp"].includes(pathname))
                ? "bg-brand-500 text-white"
                : "text-fg-secondary hover:text-fg-primary hover:bg-neutral-200"
            )}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-neutral-300">
        <ThemeToggle />
      </div>

      {session?.user && (
        <div className="px-4 py-4 border-t border-neutral-300">
          <div className="flex items-center gap-2 mb-3">
            {session.user.image && (
              <img src={session.user.image} className="w-7 h-7 rounded-pill" alt="" />
            )}
            <div className="min-w-0">
              <p className="text-fg-primary text-xs font-medium truncate">{session.user.name}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-fg-secondary hover:text-fg-primary text-xs transition-colors duration-200 ease-in-out"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
