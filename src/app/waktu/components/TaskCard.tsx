"use client";

import type { Task } from "@/types/waktu";
import { isTimed, nextStatus } from "@/types/waktu";
import { addMinutesToHHmm, formatDate, formatTime, todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n";
import SelectCheckbox from "@/components/SelectCheckbox";
import { useLongPress } from "@/lib/useLongPress";

const STATUS_STYLE: Record<Task["status"], string> = {
  todo: "bg-surface-raised text-ink-muted",
  in_progress: "bg-accent-time/15 text-accent-time",
  done: "bg-accent-finance/15 text-accent-finance",
};

export default function TaskCard({
  task,
  onCycleStatus,
  onOpen,
  selectMode,
  selected,
  onToggleSelect,
  onLongPress,
}: {
  task: Task;
  onCycleStatus: (id: string, next: Task["status"]) => void;
  onOpen: (task: Task) => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onLongPress: (id: string) => void;
}) {
  const t = useT();
  const isDone = task.status === "done";
  const isOverdue = !isDone && task.dueDate < todayISO();

  // Press-and-hold is the second way into selection mode.
  const longPress = useLongPress(() => onLongPress(task.id), !selectMode);

  const subtitle = isTimed(task)
    ? `${formatTime(task.startTime)} – ${formatTime(addMinutesToHHmm(task.startTime, task.durationMinutes))}`
    : formatDate(task.dueDate);

  return (
    <div
      {...longPress}
      className={`flex items-center gap-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 transition ${
        selected ? "ring-2 ring-accent-time" : "ring-border/60"
      }`}
    >
      {selectMode ? (
        <button onClick={() => onToggleSelect(task.id)} aria-label={t("bulk.select")} className="shrink-0">
          <SelectCheckbox checked={selected} />
        </button>
      ) : (
        <button
          onClick={() => onCycleStatus(task.id, nextStatus(task.status))}
          aria-label={t("time.changeStatus")}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${
            isDone ? "border-accent-finance bg-accent-finance text-white" : "border-border text-transparent"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </button>
      )}

      <button
        onClick={() => (selectMode ? onToggleSelect(task.id) : onOpen(task))}
        className="min-w-0 flex-1 text-left"
      >
        <p className={`truncate text-sm font-semibold ${isDone ? "text-ink-muted line-through" : "text-ink"}`}>
          {task.title}
        </p>
        <p className="truncate text-xs text-ink-muted">
          {subtitle}
          {task.note ? ` · ${task.note}` : ""}
        </p>
      </button>

      <div className="flex flex-col items-end gap-1">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
            isOverdue ? "bg-red-500/15 text-red-500" : STATUS_STYLE[task.status]
          }`}
        >
          {isOverdue ? t("time.late") : t(`status.${task.status}`)}
        </span>
        {isTimed(task) && task.reminderMinutes > 0 && !isDone && (
          <span className="text-[10px] font-medium text-ink-muted">
            🔔 {t("time.reminderBefore", { count: task.reminderMinutes })}
          </span>
        )}
      </div>
    </div>
  );
}
