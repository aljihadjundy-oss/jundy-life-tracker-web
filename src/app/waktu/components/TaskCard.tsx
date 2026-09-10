"use client";

import { useState } from "react";
import type { Task } from "@/types/waktu";
import { nextStatus } from "@/types/waktu";
import { formatDate, todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n";

const STATUS_STYLE: Record<Task["status"], string> = {
  todo: "bg-surface-raised text-ink-muted",
  in_progress: "bg-accent-time/15 text-accent-time",
  done: "bg-accent-finance/15 text-accent-finance",
};

export default function TaskCard({
  task,
  onCycleStatus,
  onDelete,
}: {
  task: Task;
  onCycleStatus: (id: string, next: Task["status"]) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const t = useT();
  const isDone = task.status === "done";
  const isOverdue = !isDone && task.dueDate < todayISO();

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
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

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${isDone ? "text-ink-muted line-through" : "text-ink"}`}>
          {task.title}
        </p>
        <p className="truncate text-xs text-ink-muted">
          {task.note || formatDate(task.dueDate)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${isOverdue ? "bg-red-500/15 text-red-500" : STATUS_STYLE[task.status]}`}>
          {isOverdue ? t("time.late") : t(`status.${task.status}`)}
        </span>
        {confirming ? (
          <div className="flex gap-2">
            <button onClick={() => onDelete(task.id)} className="text-[11px] font-semibold text-red-500">
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
    </div>
  );
}
