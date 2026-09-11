"use client";

import type { Task } from "@/types/waktu";
import { isTimed, nextStatus } from "@/types/waktu";
import { addMinutesToHHmm, formatDate, formatTime, todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n";
import SelectCheckbox from "@/components/SelectCheckbox";
import { useLongPress } from "@/lib/useLongPress";
import StatusPill, { CategoryPill, StrikeDots } from "./StatusPill";

export default function TaskCard({
  task,
  strikes,
  onCycleStatus,
  onOpen,
  selectMode,
  selected,
  onToggleSelect,
  onLongPress,
}: {
  task: Task;
  /** Strike count for this task's owner, 0 when none. */
  strikes: number;
  onCycleStatus: (id: string, next: Task["status"]) => void;
  onOpen: (task: Task) => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onLongPress: (id: string) => void;
}) {
  const t = useT();
  const isDone = task.status === "done";
  const isOverdue = task.status !== "done" && task.status !== "ghosted" && task.dueDate < todayISO();

  // Press-and-hold is the second way into selection mode.
  const longPress = useLongPress(() => onLongPress(task.id), !selectMode);

  const timeLabel = isTimed(task)
    ? `${formatTime(task.startTime)} – ${formatTime(addMinutesToHHmm(task.startTime, task.durationMinutes))}`
    : formatDate(task.dueDate);

  const showStrikes = task.category === "delegation" && task.owner !== "" && strikes > 0;

  return (
    <div
      {...longPress}
      className={`flex items-start gap-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 transition ${
        selected ? "ring-2 ring-accent-time" : "ring-border/60"
      }`}
    >
      {selectMode ? (
        <button
          onClick={() => onToggleSelect(task.id)}
          aria-label={t("bulk.select")}
          className="mt-0.5 shrink-0"
        >
          <SelectCheckbox checked={selected} />
        </button>
      ) : (
        <button
          onClick={() => onCycleStatus(task.id, nextStatus(task.status))}
          aria-label={t("time.changeStatus")}
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${
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
        <div className="flex items-start justify-between gap-2">
          <p
            className={`min-w-0 flex-1 text-sm font-semibold ${
              isDone ? "text-ink-muted line-through" : "text-ink"
            }`}
          >
            {task.title}
          </p>
          {isOverdue ? (
            <span className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold text-red-500">
              {t("time.late")}
            </span>
          ) : (
            <span className="shrink-0">
              <StatusPill status={task.status} />
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-xs text-ink-muted">
          {timeLabel}
          {task.note ? ` · ${task.note}` : ""}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <CategoryPill category={task.category} />
          {task.unit && (
            <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-semibold text-ink-muted">
              {task.unit}
            </span>
          )}
          {task.owner && (
            <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-semibold text-ink">
              {task.owner}
            </span>
          )}
          {showStrikes && <StrikeDots count={strikes} />}
          {isTimed(task) && task.reminderMinutes > 0 && !isDone && (
            <span className="text-[10px] font-medium text-ink-muted">
              🔔 {t("time.reminderBefore", { count: task.reminderMinutes })}
            </span>
          )}
        </div>
      </button>

      {task.link && !selectMode && (
        <a
          href={task.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={t("ops.openLink")}
          className="mt-0.5 shrink-0 rounded-full bg-surface-raised px-2.5 py-1.5 text-[11px] font-bold text-accent-time"
        >
          ↗
        </a>
      )}
    </div>
  );
}
