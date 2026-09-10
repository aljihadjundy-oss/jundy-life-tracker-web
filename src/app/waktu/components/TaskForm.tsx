"use client";

import { useState } from "react";
import type { NewTask, TaskStatus } from "@/types/waktu";
import { STATUS_ORDER } from "@/types/waktu";
import { useT } from "@/lib/i18n";

export default function TaskForm({
  defaultDate,
  onSubmit,
  onClose,
}: {
  defaultDate: string;
  onSubmit: (data: NewTask) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(defaultDate);
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const t = useT();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), dueDate, status, note: note.trim() });
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
        className="w-full rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_0.25s_ease-out]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("time.taskTitle")}</span>
          <input
            type="text"
            required
            autoFocus
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
      </form>
    </div>
  );
}
