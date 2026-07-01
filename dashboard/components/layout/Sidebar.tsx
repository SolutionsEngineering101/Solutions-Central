"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
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
  Sun,
  Moon,
  FileSpreadsheet,
} from "lucide-react";
import { useTheme } from "@/lib/theme";

type NavItem = { href: string; label: string; icon: React.ElementType };
type NavGroup = { group: string; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

const nav: NavEntry[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/solution-requests", label: "Solution Requests", icon: FileText },
  { href: "/sprint", label: "Project Tracker", icon: BarChart2 },
  { href: "/releases", label: "Releases", icon: Rocket },
  {
    group: "Documents",
    items: [
      { href: "/confluence", label: "Tech Docs", icon: BookOpen },
      { href: "/playbook", label: "Playbook", icon: BookOpen },
      { href: "/blueprints", label: "Blueprints", icon: Layers },
      { href: "/rfp", label: "RFPs", icon: FileSpreadsheet },
    ],
  },
  { href: "/knowledge", label: "Knowledge Hub", icon: BrainCircuit },
  { href: "/team", label: "Team & Skills", icon: Users },
  { href: "/worklogs", label: "Worklogs", icon: ClipboardList },
  { href: "/profile", label: "My Profile", icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-gray-900 border-r border-gray-700 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-700">
        <p className="text-white font-semibold text-sm tracking-wide">Solutions Central</p>
        <p className="text-gray-500 text-xs mt-0.5">SE Team Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((entry) => {
          if ("group" in entry) {
            return (
              <div key={entry.group} className="pt-3">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                  {entry.group}
                </p>
                <div className="space-y-0.5">
                  {entry.items.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        pathname === href
                          ? "bg-indigo-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      )}
                    >
                      <Icon size={15} />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          }
          const { href, label, icon: Icon } = entry;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === href
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      {session?.user && (
        <div className="px-4 py-4 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            {session.user.image && (
              <img src={session.user.image} className="w-7 h-7 rounded-full" alt="" />
            )}
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{session.user.name}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-gray-500 hover:text-white text-xs transition-colors"
            >
              <LogOut size={13} />
              Sign out
            </button>
            <button
              onClick={toggle}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
            >
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
