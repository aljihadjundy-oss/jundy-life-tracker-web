"use client";

import { useMemo } from "react";
import type { HealthSettings } from "@/types/kesehatan";
import { markForDate } from "@/lib/cycle";
import { addMonths, formatMonth, monthMatrix, todayISO, weekdayInitials } from "@/lib/format";
import { useT } from "@/lib/i18n";

/** Month grid shading the predicted period and fertile window. */
export default function CycleCalendar({
  settings,
  monthKey,
  onMonthChange,
}: {
  settings: HealthSettings;
  monthKey: string;
  onMonthChange: (monthKey: string) => void;
}) {
  const t = useT();
  const today = todayISO();
  const weeks = useMemo(() => monthMatrix(monthKey), [monthKey]);
  const initials = useMemo(() => weekdayInitials(), []);

  return (
    <div className="mx-5 rounded-2xl bg-surface-card p-3 ring-1 ring-border/60">
      <div className="mb-2 flex items-center justify-between px-1">
        <button
          onClick={() => onMonthChange(addMonths(monthKey, -1))}
          aria-label={t("time.prevMonth")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-ink-muted transition active:scale-90"
        >
          ‹
        </button>
        <p className="text-sm font-bold capitalize text-ink">{formatMonth(monthKey)}</p>
        <button
          onClick={() => onMonthChange(addMonths(monthKey, 1))}
          aria-label={t("time.nextMonth")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-ink-muted transition active:scale-90"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {initials.map((day, i) => (
          <span key={i} className="pb-1 text-center text-[10px] font-semibold uppercase text-ink-muted">
            {day}
          </span>
        ))}

        {weeks.flat().map((date) => {
          const mark = markForDate(settings, date);
          const inMonth = date.startsWith(monthKey);
          const isToday = date === today;
          return (
            <div
              key={date}
              className={`flex aspect-square items-center justify-center rounded-xl text-xs font-semibold tabular-nums ${
                mark === "period"
                  ? "bg-rose-500 text-white"
                  : mark === "fertile"
                    ? "bg-amber-400/25 text-ink"
                    : "text-ink"
              } ${inMonth ? "" : "opacity-30"} ${isToday ? "ring-2 ring-ink" : ""}`}
            >
              {Number(date.slice(-2))}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/60 pt-3 text-[11px] text-ink-muted">
        <Legend className="bg-rose-500" label={t("health.legend.period")} />
        <Legend className="bg-amber-400/70" label={t("health.legend.fertile")} />
        <Legend className="bg-ink" label={t("health.legend.today")} />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}
