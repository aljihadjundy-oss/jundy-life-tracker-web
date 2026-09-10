"use client";

import { useEffect, useState } from "react";
import { onCelebrate } from "@/lib/celebrate";
import { BADGES } from "@/types/gamification";
import { useT } from "@/lib/i18n";

type Toast = { id: number; text: string };

// Only the celebrations that take over the screen; the small XP pops render as toasts.
type Overlay = { kind: "level"; level: number } | { kind: "badge"; badgeId: string };

let nextId = 1;

export default function CelebrationLayer() {
  const t = useT();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [overlay, setOverlay] = useState<Overlay | null>(null);

  useEffect(() => {
    return onCelebrate((c) => {
      if (c.kind === "xp" || c.kind === "goal") {
        const id = nextId++;
        const text =
          c.kind === "goal"
            ? t("game.goalReached", { xp: c.xp })
            : t("game.xpGained", { xp: c.xp });
        setToasts((prev) => [...prev, { id, text }]);
        setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 2200);
      } else {
        setOverlay(c);
      }
    });
  }, [t]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-[floatUp_2.2s_ease-out_forwards] rounded-full bg-gradient-to-r from-brand-start to-brand-mid px-4 py-2 text-sm font-extrabold text-white shadow-lg"
          >
            {toast.text}
          </div>
        ))}
      </div>

      {overlay && (
        <button
          onClick={() => setOverlay(null)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-8 backdrop-blur-sm"
        >
          <div className="animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)] w-full max-w-xs rounded-3xl bg-surface p-7 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-start via-brand-mid to-brand-end text-5xl shadow-lg">
              {overlay.kind === "level" ? "🎉" : badgeEmoji(overlay.badgeId)}
            </div>
            <h2 className="text-lg font-extrabold text-ink">
              {overlay.kind === "level"
                ? t("game.levelUp", { level: overlay.level })
                : t("game.badgeUnlocked")}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {overlay.kind === "level"
                ? t("game.levelUpHint")
                : t(`badge.${overlay.badgeId}`)}
            </p>
            <div className="mt-5 w-full rounded-2xl bg-ink py-3 text-sm font-bold text-surface">
              {t("game.nice")}
            </div>
          </div>
        </button>
      )}
    </>
  );
}

function badgeEmoji(badgeId: string) {
  return BADGES.find((b) => b.id === badgeId)?.emoji ?? "🏅";
}
