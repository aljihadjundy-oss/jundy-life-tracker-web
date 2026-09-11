"use client";

import type { ExerciseLog } from "@/types/kesehatan";
import type { Suggestion } from "@/lib/cycle";
import { useT } from "@/lib/i18n";

/** Suggestions adapted to the current phase, plus what was already logged. */
export default function ExerciseCard({
  heading,
  suggestions,
  logged,
  onLog,
}: {
  heading: string;
  suggestions: Suggestion[];
  logged: ExerciseLog[];
  onLog: (entry: ExerciseLog) => void;
}) {
  const t = useT();

  return (
    <div className="mx-5 rounded-2xl bg-surface-card p-4 ring-1 ring-border/60">
      <p className="text-[11px] font-bold uppercase tracking-wide text-accent-finance">{heading}</p>

      <div className="mt-2.5 flex flex-col gap-2">
        {suggestions.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-surface-raised p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-finance/15 text-base">
              🏃
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{t(`exercise.${s.id}`)}</p>
              <p className="text-xs leading-snug text-ink-muted">{t(`exerciseWhy.${s.id}`)}</p>
            </div>
            <button
              onClick={() => onLog({ name: s.id, minutes: s.minutes })}
              className="shrink-0 rounded-full bg-accent-finance px-3 py-2 text-xs font-bold text-white transition active:scale-95"
            >
              {s.minutes} {t("health.min")}
            </button>
          </div>
        ))}
      </div>

      {logged.length > 0 && (
        <div className="mt-4 border-t border-border/60 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            {t("health.loggedToday")}
          </p>
          <div className="mt-1.5 flex flex-col gap-1">
            {logged.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-ink">{t(`exercise.${entry.name}`)}</span>
                <span className="tabular-nums text-ink-muted">
                  {entry.minutes} {t("health.min")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
