"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { UserConfigProvider, useUserConfig } from "@/lib/user-context";
import { pillarForPath } from "@/types/profile";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";
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
    <div className="min-h-dvh bg-surface pb-24 md:pb-0 md:pl-[4.5rem] lg:pl-56">
      {/*
        max-w-md dulu dipasang tanpa syarat, dan itulah yang membuat aplikasi
        tetap selebar ponsel di layar 27 inci. Sekarang kolomnya tumbuh
        bertahap: ponsel tetap satu kolom sempit, tablet sedikit lebih lega,
        desktop memakai lebar baca yang nyaman — bukan seluruh layar, karena
        baris teks sepanjang 1900px justru lebih sulit dibaca daripada 900px.
        Berhenti di 4xl (896px): isi halaman ini tumpukan kartu satu kolom, dan
        kartu selebar 1200px hanya membuat isinya terlihat hilang di tengah.
      */}
      <div className="mx-auto w-full max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
        {children}
      </div>
      <BottomNav />
      <SideNav />
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
