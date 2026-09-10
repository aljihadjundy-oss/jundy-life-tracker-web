"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-ink" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <div className="mx-auto max-w-md">{children}</div>
      <BottomNav />
    </div>
  );
}
