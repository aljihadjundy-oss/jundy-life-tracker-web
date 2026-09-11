"use client";

import type { DailyMetrics, HealthSettings } from "@/types/kesehatan";
import { useT } from "@/lib/i18n";

/**
 * Read-only rollup of one day, built entirely from what was filled in on the
 * Hari Ini tab. Nothing here is editable on purpose — water, sleep and meals
 * used to be enterable in two places, which meant two numbers that could
 * disagree about the same day.
 */
export default function DaySummaryCard({
  metrics,
  settings,
  waterTarget,
  showWellbeing,
}: {
  metrics: DailyMetrics | null;
  settings: HealthSettings;
  waterTarget: number;
  /** Mood, energy and symptoms only apply when cycle tracking is on. */
  showWellbeing: boolean;
}) {
  const t = useT();

  const tiles = [
    {
      emoji: "💧",
      label: t("health.water"),
      value: metrics ? `${metrics.waterGlasses}/${waterTarget}` : "—",
    },
    {
      emoji: "😴",
      label: t("health.sleep"),
      value: metrics && metrics.sleepHours > 0 ? t("health.hours", { count: metrics.sleepHours }) : "—",
    },
    {
      emoji: "🍽️",
      label: t("health.meals"),
      value: metrics ? `${metrics.mealsDone.length}/${settings.meals.length}` : "—",
    },
    {
      emoji: "🏃",
      label: t("health.exercise"),
      value: metrics && metrics.exerciseMinutes > 0
        ? t("health.minutes", { count: metrics.exerciseMinutes })
        : "—",
    },
  ];

  return (
    <div className="mx-5 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">{t("health.daySummary")}</h3>
        <span className="text-[10px] text-ink-muted">{t("health.autoFromToday")}</span>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl bg-surface-raised p-2.5 text-center">
            <p className="text-base">{tile.emoji}</p>
            <p className="mt-1 truncate text-xs font-bold tabular-nums text-ink">{tile.value}</p>
            <p className="truncate text-[9px] text-ink-muted">{tile.label}</p>
          </div>
        ))}
      </div>

      {showWellbeing && metrics && (metrics.energy > 0 || metrics.mood || metrics.symptoms.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
          {metrics.energy > 0 && (
            <span className="rounded-full bg-brand-start/15 px-2 py-0.5 text-[10px] font-bold text-brand-start">
              {t("health.energyLevel", { n: metrics.energy })}
            </span>
          )}
          {metrics.mood && (
            <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-semibold text-ink">
              {t(`mood.${metrics.mood}`)}
            </span>
          )}
          {metrics.symptoms.map((symptom) => (
            <span
              key={symptom}
              className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-500"
            >
              {t(`symptom.${symptom}`)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
