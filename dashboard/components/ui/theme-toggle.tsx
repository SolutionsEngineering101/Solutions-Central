"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

// The boot script (see app/layout.tsx) sets the class before hydration, so
// the real client value is often already "dark" — but SSR has no DOM to
// read, so this must return a fixed value matching what the server rendered.
function getServerSnapshot() {
  return false;
}

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex items-center gap-2 text-fg-secondary hover:text-fg-primary text-xs transition-colors duration-200 ease-in-out",
        className
      )}
    >
      {isDark ? <Sun size={13} /> : <Moon size={13} />}
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}
