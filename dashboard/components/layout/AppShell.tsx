"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { AssistantProvider } from "@/components/ai/AssistantProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const devMode = process.env.NEXT_PUBLIC_DEV_NO_AUTH === "1";

  useEffect(() => {
    if (!devMode && status === "unauthenticated") router.push("/login");
  }, [status, router, devMode]);

  if (!devMode && status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!devMode && !session) return null;

  return (
    <AssistantProvider>
      <div className="flex h-screen bg-gray-950">
        <Sidebar />
        <main className="ml-56 flex-1 h-screen overflow-y-auto p-5">{children}</main>
      </div>
    </AssistantProvider>
  );
}
