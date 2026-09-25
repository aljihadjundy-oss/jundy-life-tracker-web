"use client";

import { useState, type FormEvent } from "react";
import type { NewExerciseRoutine } from "@/types/kesehatan";
import { useT } from "@/lib/i18n";

export default function ExerciseRoutineForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: NewExerciseRoutine) => void | Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [submitting, setSubmitting] = useState(false);
  const t = useT();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsedMinutes = Number(minutes);
    if (!name.trim() || !(parsedMinutes > 0)) return;

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), minutes: parsedMinutes });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-6" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_0.25s_ease-out] md:max-w-lg md:rounded-3xl md:animate-[popIn_0.18s_ease-out]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("health.routineName")}</span>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("health.routineNamePlaceholder")}
            className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-base font-semibold text-ink outline-none focus:border-ink"
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("health.routineMinutes")}</span>
          <input
            type="number"
            required
            min={1}
            max={600}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-base font-semibold tabular-nums text-ink outline-none focus:border-ink"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-ink py-4 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-50"
        >
          {submitting ? t("app.saving") : t("health.saveRoutine")}
        </button>
      </form>
    </div>
  );
}
