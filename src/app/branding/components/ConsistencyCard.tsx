"use client";

import { useT } from "@/lib/i18n";

export default function ConsistencyCard({
  streak,
  postsThisWeek,
  last14Days,
}: {
  streak: number;
  postsThisWeek: number;
  last14Days: { date: string; posted: boolean }[];
}) {
  const t = useT();
  return (
    <div className="mx-5 rounded-3xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-400 p-5 text-white shadow-lg shadow-pink-500/20">
      <p className="text-xs font-medium text-white/80">{t("branding.consistency")}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">
        {streak > 0 ? t("home.streakDays", { count: streak }) : t("home.noStreak")}
      </p>
      <p className="mt-1 text-xs text-white/85">{t("branding.postsThisWeek", { count: postsThisWeek })}</p>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {last14Days.map((d) => (
          <div
            key={d.date}
            className={`aspect-square rounded-md ${d.posted ? "bg-white" : "bg-white/20"}`}
          />
        ))}
      </div>
      <p className="mt-2 text-[10px] text-white/70">{t("branding.last14Days")}</p>
    </div>
  );
}
