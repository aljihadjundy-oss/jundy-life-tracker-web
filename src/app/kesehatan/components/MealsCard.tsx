"use client";

import type { Meal } from "@/types/kesehatan";
import { formatTime } from "@/lib/format";
import { useT } from "@/lib/i18n";

/** Regularity, not calories — Rima's framing, kept deliberately. */
export default function MealsCard({
  meals,
  done,
  onToggle,
}: {
  meals: Meal[];
  done: string[];
  onToggle: (id: string) => void;
}) {
  const t = useT();

  return (
    <div className="mx-5 rounded-2xl bg-surface-card p-4 ring-1 ring-border/60">
      <p className="text-[11px] font-bold uppercase tracking-wide text-accent-health">
        {t("health.meals")}
      </p>

      <div className="mt-2 flex flex-col gap-2">
        {meals.map((meal) => {
          const eaten = done.includes(meal.id);
          return (
            <button
              key={meal.id}
              onClick={() => onToggle(meal.id)}
              className={`flex items-center gap-3 rounded-2xl p-3 text-left transition ${
                eaten ? "bg-accent-health/10" : "bg-surface-raised"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  eaten ? "border-accent-health bg-accent-health text-white" : "border-border text-transparent"
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="flex-1 text-sm font-semibold text-ink">{t(`health.meal.${meal.id}`)}</span>
              <span className="text-xs tabular-nums text-ink-muted">{formatTime(meal.time)}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-ink-muted">{t("health.mealsNote")}</p>
    </div>
  );
}
