"use client";

import { useState } from "react";
import type { Habit } from "@/types/kesehatan";
import { useT } from "@/lib/i18n";
import SelectCheckbox from "@/components/SelectCheckbox";
import { useLongPress } from "@/lib/useLongPress";

export default function HabitCard({
  habit,
  completed,
  weekCount,
  onToggle,
  onDelete,
  selectMode,
  selected,
  onToggleSelect,
  onLongPress,
}: {
  habit: Habit;
  completed: boolean;
  /** Times checked in the trailing 7 days ending on the selected date. */
  weekCount: number;
  onToggle: (id: string, next: boolean) => void;
  onDelete: (id: string) => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onLongPress: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const t = useT();
  const longPress = useLongPress(() => onLongPress(habit.id), !selectMode);

  return (
    <div
      {...longPress}
      onClick={() => selectMode && onToggleSelect(habit.id)}
      className={`flex items-center gap-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 transition ${
        selected ? "ring-2 ring-accent-health" : "ring-border/60"
      }`}
    >
      {selectMode ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center">
          <SelectCheckbox checked={selected} />
        </div>
      ) : (
        <button
          onClick={() => onToggle(habit.id, !completed)}
          aria-label={t("health.toggleHabit")}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${
            completed ? "border-accent-health bg-accent-health text-white" : "border-border text-transparent"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </button>
      )}

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${completed ? "text-ink-muted line-through" : "text-ink"}`}>
          {habit.name}
        </p>
        {habit.targetPerWeek < 7 && (
          <p className="mt-0.5 text-[11px] text-ink-muted">
            {t("health.weekProgress", { done: Math.min(weekCount, habit.targetPerWeek), target: habit.targetPerWeek })}
          </p>
        )}
      </div>

      {selectMode ? null : confirming ? (
        <div className="flex gap-2">
          <button onClick={() => onDelete(habit.id)} className="text-[11px] font-semibold text-red-500">
            {t("app.delete")}
          </button>
          <button onClick={() => setConfirming(false)} className="text-[11px] font-medium text-ink-muted">
            {t("app.cancel")}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-[11px] font-medium text-ink-muted underline-offset-2 hover:underline"
        >
          {t("app.delete")}
        </button>
      )}
    </div>
  );
}
