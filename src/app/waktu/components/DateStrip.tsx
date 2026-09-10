"use client";

import { addDaysISO, todayISO, weekdayShort } from "@/lib/format";

const RANGE_BEFORE = 2;
const RANGE_AFTER = 11;

export default function DateStrip({
  selected,
  onSelect,
  countByDate,
}: {
  selected: string;
  onSelect: (date: string) => void;
  countByDate: Record<string, number>;
}) {
  const today = todayISO();
  const days = Array.from({ length: RANGE_BEFORE + RANGE_AFTER + 1 }, (_, i) =>
    addDaysISO(today, i - RANGE_BEFORE)
  );

  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-2 pt-1">
      {days.map((date) => {
        const isSelected = date === selected;
        const isToday = date === today;
        const count = countByDate[date] ?? 0;
        const dayNum = Number(date.slice(-2));

        return (
          <button
            key={date}
            onClick={() => onSelect(date)}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl text-xs font-bold transition ${
                isSelected
                  ? "bg-gradient-to-br from-accent-time to-blue-600 text-white shadow-md shadow-accent-time/30"
                  : isToday
                    ? "bg-surface-raised text-ink ring-1 ring-accent-time/50"
                    : "bg-surface-raised text-ink-muted"
              }`}
            >
              <span className="text-[9px] font-medium uppercase opacity-80">
                {weekdayShort(date)}
              </span>
              <span>{dayNum}</span>
            </div>
            <div className={`h-1.5 w-1.5 rounded-full ${count > 0 ? "bg-accent-time" : "bg-transparent"}`} />
          </button>
        );
      })}
    </div>
  );
}
