"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { UserConfigProvider, useUserConfig } from "@/lib/user-context";
import { pillarForPath } from "@/types/profile";
import BottomNav from "./BottomNav";
import Onboarding from "./Onboarding";

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) return <Spinner />;

  return (
    <UserConfigProvider>
      <Gate>{children}</Gate>
    </UserConfigProvider>
  );
}

/**
 * Sits between auth and the page: runs onboarding on a first sign-in, and keeps
 * a switched-off pillar unreachable even by typing its URL.
 */
function Gate({ children }: { children: ReactNode }) {
  const { profile, pillars, ready } = useUserConfig();
  const pathname = usePathname();
  const router = useRouter();

  const pillar = pillarForPath(pathname);
  const blocked = ready && profile.onboardedAt !== null && pillar !== null && !pillars[pillar];

  useEffect(() => {
    if (blocked) router.replace("/");
  }, [blocked, router]);

  if (!ready) return <Spinner />;
  if (profile.onboardedAt === null) return <Onboarding />;
  if (blocked) return <Spinner />;

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <div className="mx-auto max-w-md">{children}</div>
      <BottomNav />
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-ink" />
    </div>
  );
}
