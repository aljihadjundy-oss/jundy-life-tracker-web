"use client";

import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/lib/auth-context";

export default function TopBar({
  title,
  subtitle,
  extra,
}: {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
}) {
  const { signOut } = useAuth();

  return (
    <header className="flex items-center justify-between px-5 pb-2 pt-6">
      <div>
        <h1 className="text-xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {extra}
        <ThemeToggle />
        <button
          onClick={signOut}
          aria-label="Keluar"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-ink-muted transition active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
