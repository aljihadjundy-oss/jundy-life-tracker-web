"use client";

import { useState } from "react";
import type { NewTask, Task, TaskStatus } from "@/types/waktu";
import {
  DEFAULT_DURATION_MINUTES,
  DEFAULT_REMINDER_MINUTES,
  DURATION_OPTIONS,
  REMINDER_OPTIONS,
  STATUS_ORDER,
} from "@/types/waktu";
import { addMinutesToHHmm, formatDuration, formatTime } from "@/lib/format";
import { useT } from "@/lib/i18n";

export default function TaskForm({
  defaultDate,
  defaultTime = "",
  initial,
  onSubmit,
  onDelete,
  onClose,
}: {
  defaultDate: string;
  defaultTime?: string;
  initial?: Task | null;
  onSubmit: (data: NewTask) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? defaultDate);
  const [startTime, setStartTime] = useState(initial?.startTime ?? defaultTime);
  const [durationMinutes, setDurationMinutes] = useState(
    initial?.durationMinutes ?? DEFAULT_DURATION_MINUTES
  );
  const [reminderMinutes, setReminderMinutes] = useState(
    initial?.reminderMinutes ?? DEFAULT_REMINDER_MINUTES
  );
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "todo");
  const [note, setNote] = useState(initial?.note ?? "");
  const [submitting, setSubmitting] = useState(false);

  const timed = startTime !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        dueDate,
        startTime,
        durationMinutes: timed ? durationMinutes : DEFAULT_DURATION_MINUTES,
        reminderMinutes: timed ? reminderMinutes : 0,
        status,
        note: note.trim(),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_0.25s_ease-out]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("time.taskTitle")}</span>
          <input
            type="text"
            required
            autoFocus={!initial}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("time.taskPlaceholder")}
            className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-base font-semibold text-ink outline-none focus:border-ink"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("time.dueDate")}</span>
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-ink outline-none focus:border-ink"
          />
        </label>

        <div className="mb-4 rounded-2xl bg-surface-raised p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">{t("time.setTime")}</span>
            <button
              type="button"
              role="switch"
              aria-checked={timed}
              aria-label={t("time.setTime")}
              onClick={() => setStartTime(timed ? "" : defaultTime || "09:00")}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                timed ? "bg-accent-time" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  timed ? "left-[1.375rem]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {timed && (
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                  {t("time.startTime")}
                </span>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value || "09:00")}
                  className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-ink outline-none focus:border-ink"
                />
              </label>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                  {t("time.duration")}
                </span>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setDurationMinutes(minutes)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        durationMinutes === minutes
                          ? "bg-ink text-surface"
                          : "bg-surface-card text-ink-muted ring-1 ring-border"
                      }`}
                    >
                      {formatDuration(minutes)}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-ink-muted">
                  {formatTime(startTime)} – {formatTime(addMinutesToHHmm(startTime, durationMinutes))}
                </p>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                  {t("time.reminder")}
                </span>
                <div className="flex flex-wrap gap-2">
                  {REMINDER_OPTIONS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setReminderMinutes(minutes)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        reminderMinutes === minutes
                          ? "bg-ink text-surface"
                          : "bg-surface-card text-ink-muted ring-1 ring-border"
                      }`}
                    >
                      {minutes === 0 ? t("time.reminderOff") : t("time.reminderBefore", { count: minutes })}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("time.status")}</span>
          <div className="flex gap-2">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                  status === s ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
                }`}
              >
                {t(`status.${s}`)}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-5 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("finance.note")}</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("time.notePlaceholder")}
            className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-ink outline-none focus:border-ink"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-ink py-4 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-50"
        >
          {submitting ? t("app.saving") : t("time.saveTask")}
        </button>

        {initial && onDelete && (
          <button
            type="button"
            onClick={async () => {
              await onDelete(initial.id);
              onClose();
            }}
            className="mt-3 w-full rounded-2xl py-3 text-sm font-semibold text-red-500 transition active:scale-95"
          >
            {t("app.delete")}
          </button>
        )}
      </form>
    </div>
  );
}
