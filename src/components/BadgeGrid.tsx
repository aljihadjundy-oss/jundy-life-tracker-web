"use client";

import { earnedBadges } from "@/lib/gamification";
import { BADGES, type GameStats } from "@/types/gamification";
import { useT } from "@/lib/i18n";

export default function BadgeGrid({ stats }: { stats: GameStats }) {
  const t = useT();
  const earned = new Set([...stats.unlockedBadges, ...earnedBadges(stats)]);

  return (
    <section className="mt-6 px-5 pb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">{t("game.achievements")}</h2>
        <span className="text-xs font-medium text-ink-muted">
          {earned.size}/{BADGES.length}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {BADGES.map((badge) => {
          const unlocked = earned.has(badge.id);
          return (
            <div
              key={badge.id}
              title={t(`badge.${badge.id}`)}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl p-1.5 text-center transition ${
                unlocked
                  ? "bg-surface-card shadow-sm ring-1 ring-border/60"
                  : "bg-surface-raised opacity-40"
              }`}
            >
              <span className={`text-xl ${unlocked ? "" : "grayscale"}`}>{badge.emoji}</span>
              <span className="line-clamp-2 text-[9px] font-medium leading-tight text-ink-muted">
                {t(`badge.${badge.id}`)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
