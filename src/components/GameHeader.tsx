"use client";

import { computeStreak } from "@/lib/gamification";
import { levelProgress, type GameStats } from "@/types/gamification";
import { todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n";

export default function GameHeader({ stats }: { stats: GameStats }) {
  const t = useT();
  const { level, into, needed, ratio } = levelProgress(stats.totalXp);
  const streak = computeStreak(stats);
  const todayXp = stats.xpByDate[todayISO()] ?? 0;
  const goalRatio = stats.dailyGoal > 0 ? Math.min(todayXp / stats.dailyGoal, 1) : 0;
  const goalMet = todayXp >= stats.dailyGoal;

  return (
    <div className="mx-5 rounded-3xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
      <div className="flex items-center gap-4">
        <GoalRing ratio={goalRatio} met={goalMet} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gradient-to-r from-brand-start to-brand-mid px-2.5 py-0.5 text-[11px] font-extrabold text-white">
              {t("game.level", { level })}
            </span>
            <span className="text-sm font-bold text-ink">
              {streak > 0 ? `🔥 ${streak}` : "🔥 0"}
            </span>
          </div>

          <p className="mt-1.5 text-[11px] font-medium text-ink-muted">
            {t("game.dailyProgress", { xp: todayXp, goal: stats.dailyGoal })}
          </p>

          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-start to-brand-mid transition-all"
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-ink-muted">
            {t("game.toNextLevel", { into, needed })}
          </p>
        </div>
      </div>
    </div>
  );
}

function GoalRing({ ratio, met }: { ratio: number; met: boolean }) {
  const size = 64;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-surface-raised"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className={met ? "stroke-accent-finance" : "stroke-brand-mid"}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xl">
        {met ? "✅" : "⚡"}
      </div>
    </div>
  );
}
