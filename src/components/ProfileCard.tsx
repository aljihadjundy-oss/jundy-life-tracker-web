"use client";

import Link from "next/link";
import { ageFrom, type Profile } from "@/types/profile";
import { useT } from "@/lib/i18n";

/** Who the app thinks you are, and a way straight to changing it. */
export default function ProfileCard({
  profile,
  photoURL,
  activePillars,
}: {
  profile: Profile;
  photoURL: string | null;
  activePillars: number;
}) {
  const t = useT();
  const age = ageFrom(profile.birthDate);

  const facts = [
    profile.occupation,
    age !== null ? t("home.ageYears", { count: age }) : "",
    t("home.pillarsActive", { count: activePillars }),
  ].filter(Boolean);

  return (
    <Link
      href="/pengaturan"
      className="mx-5 flex items-center gap-3 rounded-2xl bg-surface-card p-3.5 ring-1 ring-border/60 transition active:scale-[0.99]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-start via-brand-mid to-brand-end text-sm font-bold text-white">
        {photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoURL} alt="" className="h-full w-full object-cover" />
        ) : (
          (profile.displayName || "?").slice(0, 1).toUpperCase()
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-ink">
          {profile.displayName || t("home.noName")}
        </span>
        <span className="block truncate text-[11px] text-ink-muted">{facts.join(" · ")}</span>
      </span>

      <span className="shrink-0 text-xs text-ink-muted">›</span>
    </Link>
  );
}
