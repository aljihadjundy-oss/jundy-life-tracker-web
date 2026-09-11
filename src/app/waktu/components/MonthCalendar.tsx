"use client";

import { useMemo } from "react";
import type { Task } from "@/types/waktu";
import { TASK_COLOR } from "@/types/waktu";
import { addMonths, formatMonth, monthMatrix, todayISO, weekdayInitials } from "@/lib/format";
import { useT } from "@/lib/i18n";

const MAX_DOTS = 3;

export default function MonthCalendar({
  monthKey,
  selected,
  tasks,
  onMonthChange,
  onSelect,
}: {
  monthKey: string;
  selected: string;
  tasks: Task[];
  onMonthChange: (monthKey: string) => void;
  onSelect: (date: string) => void;
}) {
  const t = useT();
  const today = todayISO();
  const weeks = useMemo(() => monthMatrix(monthKey), [monthKey]);
  const initials = useMemo(() => weekdayInitials(), []);

  const byDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const list = map.get(task.dueDate);
      if (list) list.push(task);
      else map.set(task.dueDate, [task]);
    }
    return map;
  }, [tasks]);

  return (
    <div className="mx-5 rounded-2xl bg-surface-card p-3 ring-1 ring-border/60">
      <div className="mb-2 flex items-center justify-between px-1">
        <button
          onClick={() => onMonthChange(addMonths(monthKey, -1))}
          aria-label={t("time.prevMonth")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-ink-muted transition active:scale-90"
        >
          <Chevron direction="left" />
        </button>
        <p className="text-sm font-bold capitalize text-ink">{formatMonth(monthKey)}</p>
        <button
          onClick={() => onMonthChange(addMonths(monthKey, 1))}
          aria-label={t("time.nextMonth")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-ink-muted transition active:scale-90"
        >
          <Chevron direction="right" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {initials.map((day, i) => (
          <span key={i} className="pb-1 text-center text-[10px] font-semibold uppercase text-ink-muted">
            {day}
          </span>
        ))}

        {weeks.flat().map((date) => {
          const inMonth = date.startsWith(monthKey);
          const isSelected = date === selected;
          const isToday = date === today;
          const dayTasks = byDate.get(date) ?? [];

          return (
            <button
              key={date}
              onClick={() => onSelect(date)}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition ${
                isSelected
                  ? "bg-gradient-to-br from-accent-time to-blue-600 text-white shadow-md shadow-accent-time/30"
                  : isToday
                    ? "bg-surface-raised text-ink ring-1 ring-accent-time/60"
                    : inMonth
                      ? "text-ink"
                      : "text-ink-muted/40"
              }`}
            >
              <span className="tabular-nums leading-none">{Number(date.slice(-2))}</span>
              <span className="flex h-1.5 items-center gap-0.5">
                {dayTasks.slice(0, MAX_DOTS).map((task) => (
                  <span
                    key={task.id}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: isSelected ? "rgba(255,255,255,0.9)" : TASK_COLOR[task.status],
                    }}
                  />
                ))}
                {dayTasks.length > MAX_DOTS && (
                  <span
                    className={`text-[8px] font-bold leading-none ${
                      isSelected ? "text-white/90" : "text-ink-muted"
                    }`}
                  >
                    +
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: direction === "left" ? "rotate(180deg)" : undefined }}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
