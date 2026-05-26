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
  LogOut,
} from "lucide-react";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/solution-requests", label: "Solution Requests", icon: FileText },
  { href: "/sprint", label: "Solutions Tech Tracker", icon: BarChart2 },
  { href: "/playbook", label: "Playbook", icon: BookOpen },
  { href: "/blueprints", label: "Blueprints", icon: Layers },
  { href: "/team", label: "Team & Skills", icon: Users },
  { href: "/worklogs", label: "Worklogs", icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-gray-950 border-r border-gray-800 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-800">
        <p className="text-white font-semibold text-sm tracking-wide">Solutions Central</p>
        <p className="text-gray-500 text-xs mt-0.5">SE Team Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
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
      </nav>

      {session?.user && (
        <div className="px-4 py-4 border-t border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            {session.user.image && (
              <img src={session.user.image} className="w-7 h-7 rounded-full" alt="" />
            )}
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{session.user.name}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-gray-500 hover:text-white text-xs transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
