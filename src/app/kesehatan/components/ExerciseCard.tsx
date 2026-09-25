"use client";

import { useState } from "react";
import type { ExerciseLog, ExerciseRoutine } from "@/types/kesehatan";
import type { Suggestion } from "@/lib/cycle";
import { useT } from "@/lib/i18n";

/**
 * Suggestions adapted to the current phase, plus the user's own saved
 * routines (built from scratch, not limited to the phase/type suggestion
 * bank), plus what was already logged today.
 */
export default function ExerciseCard({
  heading,
  suggestions,
  routines,
  logged,
  onLog,
  onAddRoutine,
  onDeleteRoutine,
  onDeleteLog,
}: {
  heading: string;
  suggestions: Suggestion[];
  routines: ExerciseRoutine[];
  logged: ExerciseLog[];
  onLog: (entry: ExerciseLog) => void;
  onAddRoutine: () => void;
  onDeleteRoutine: (id: string) => void;
  onDeleteLog: (index: number) => void;
}) {
  const t = useT();
  const [confirmingRoutine, setConfirmingRoutine] = useState<string | null>(null);

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

      {/* Rutinitas kamu sendiri — dibangun dari nol lewat "+ Tambah rutinitas",
          bukan turunan saran fase/jenis di atas. */}
      <div className="mt-4 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            {t("health.yourRoutines")}
          </p>
          <button onClick={onAddRoutine} className="text-[11px] font-bold text-accent-finance">
            + {t("health.addRoutine")}
          </button>
        </div>

        {routines.length === 0 ? (
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">{t("health.noRoutines")}</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {routines.map((routine) => (
              <div key={routine.id} className="flex items-center gap-3 rounded-2xl bg-surface-raised p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{routine.name}</p>
                  {confirmingRoutine === routine.id ? (
                    <div className="mt-0.5 flex gap-2">
                      <button
                        onClick={() => {
                          onDeleteRoutine(routine.id);
                          setConfirmingRoutine(null);
                        }}
                        className="text-[11px] font-semibold text-red-500"
                      >
                        {t("app.delete")}
                      </button>
                      <button
                        onClick={() => setConfirmingRoutine(null)}
                        className="text-[11px] font-medium text-ink-muted"
                      >
                        {t("app.cancel")}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingRoutine(routine.id)}
                      aria-label={t("health.deleteRoutine")}
                      className="text-[11px] font-medium text-ink-muted underline-offset-2 hover:underline"
                    >
                      {t("app.delete")}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => onLog({ name: routine.name, minutes: routine.minutes, custom: true })}
                  className="shrink-0 rounded-full bg-accent-finance px-3 py-2 text-xs font-bold text-white transition active:scale-95"
                >
                  {routine.minutes} {t("health.min")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {logged.length > 0 && (
        <div className="mt-4 border-t border-border/60 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            {t("health.loggedToday")}
          </p>
          <div className="mt-1.5 flex flex-col gap-1">
            {logged.map((entry, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate text-ink">
                  {entry.custom ? entry.name : t(`exercise.${entry.name}`)}
                </span>
                <span className="shrink-0 tabular-nums text-ink-muted">
                  {entry.minutes} {t("health.min")}
                </span>
                <button
                  onClick={() => onDeleteLog(i)}
                  aria-label={t("health.deleteLogged")}
                  className="shrink-0 text-ink-muted/70 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
