"use client";

import { useMemo, useState } from "react";
import { CoverflowCarousel, type CoverflowSlide } from "@/components/ui/coverflow-carousel";
import { earnedBadges } from "@/lib/gamification";
import { BADGES, type GameStats } from "@/types/gamification";
import { useT } from "@/lib/i18n";

/** A distinct gradient per badge so the trophy case reads as a collection. */
const GRADIENTS = [
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-yellow-400 to-amber-500",
  "from-orange-500 to-red-500",
  "from-sky-400 to-cyan-500",
  "from-lime-400 to-emerald-500",
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-fuchsia-500 to-purple-500",
  "from-brand-start to-brand-mid",
];

export default function BadgeCoverflow({ stats }: { stats: GameStats }) {
  const t = useT();
  const [selected, setSelected] = useState(0);

  const earned = useMemo(
    () => new Set([...stats.unlockedBadges, ...earnedBadges(stats)]),
    [stats]
  );

  const slides: CoverflowSlide[] = useMemo(
    () =>
      BADGES.map((badge, index) => {
        const unlocked = earned.has(badge.id);
        return {
          title: t(`badge.${badge.id}`),
          subtitle: unlocked ? t("game.badgeEarned") : t("game.badgeLocked"),
          content: (
            <div
              className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${
                unlocked ? GRADIENTS[index % GRADIENTS.length] : "from-surface-raised to-surface-raised"
              }`}
            >
              <span className={`text-5xl ${unlocked ? "" : "opacity-30 grayscale"}`}>
                {badge.emoji}
              </span>
              {!unlocked && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                  {t("game.badgeLocked")}
                </span>
              )}
            </div>
          ),
        };
      }),
    [earned, t]
  );

  return (
    <section className="mt-6 pb-6">
      <div className="mb-1 flex items-center justify-between px-5">
        <h2 className="text-sm font-bold text-ink">{t("game.achievements")}</h2>
        <span className="text-xs font-medium text-ink-muted">
          {earned.size}/{BADGES.length}
        </span>
      </div>
      <p className="px-5 text-[11px] text-ink-muted">{t("game.trophyHint")}</p>

      {/* Inset from the screen edges so the drag never starts in the zone iOS
          reserves for its back-swipe. */}
      <div className="px-6">
        <CoverflowCarousel
          slides={slides}
          cardWidth="clamp(132px, 40vw, 180px)"
          showCaption
          showPagination
          onSelect={setSelected}
          label={t("game.achievements")}
          className="-mt-4"
        />
      </div>

      <p className="sr-only" aria-live="polite">
        {slides[selected]?.title}
      </p>
    </section>
  );
}
