"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bell, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ActionRequiredItem } from "@/app/api/github/action-required/route";

export function ActionRequiredBell() {
  const { data: session } = useSession();
  const devMode = process.env.NEXT_PUBLIC_DEV_NO_AUTH === "1";
  const [items, setItems] = useState<ActionRequiredItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user && !devMode) return;
    let cancelled = false;
    fetch("/api/github/action-required")
      .then((res) => res.json())
      .then((data: { items: ActionRequiredItem[] }) => { if (!cancelled) setItems(data.items ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [session, devMode]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!session?.user && !devMode) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`${items.length} requests need action`}
        className="relative flex items-center justify-center w-8 h-8 rounded-[8px] text-fg-secondary hover:text-fg-primary hover:bg-neutral-200 transition-colors duration-200 ease-in-out"
      >
        <Bell size={16} />
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-pill bg-[var(--color-error)] text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-30 w-80 bg-surface-card border border-neutral-200 rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200">
            <p className="text-fg-primary text-sm font-semibold">Action Required</p>
            <p className="text-fg-secondary text-xs mt-0.5">
              {items.length === 0 ? "You're all caught up" : `${items.length} of your requests need an update`}
            </p>
          </div>

          {items.length > 0 && (
            <div className="max-h-72 overflow-y-auto">
              {items.map((it) => (
                <div key={it.formId} className="flex items-start gap-2.5 px-4 py-2.5 border-b border-neutral-100 last:border-0">
                  <AlertCircle size={14} className="text-[var(--color-warning)] shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-fg-secondary text-[11px] font-mono">{it.formId}</span>
                      <span className="text-fg-primary text-xs font-medium truncate">{it.client}</span>
                    </div>
                    <p className="text-fg-secondary text-[11px] mt-0.5">
                      {it.reason}{it.submittedAt && ` · submitted ${formatDate(it.submittedAt)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/solution-requests"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-center text-brand-500 text-xs font-semibold hover:bg-neutral-100 transition-colors"
          >
            View Solution Requests
          </Link>
        </div>
      )}
    </div>
  );
}
