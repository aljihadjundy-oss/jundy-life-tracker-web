"use client";

import { useState } from "react";
import type { DailyMetrics } from "@/types/kesehatan";

export default function MetricsForm({
  date,
  initial,
  onSubmit,
  onClose,
}: {
  date: string;
  initial: DailyMetrics | null;
  onSubmit: (data: DailyMetrics) => Promise<void>;
  onClose: () => void;
}) {
  const [sleepHours, setSleepHours] = useState(initial ? String(initial.sleepHours) : "");
  const [exerciseMinutes, setExerciseMinutes] = useState(initial ? String(initial.exerciseMinutes) : "");
  const [waterGlasses, setWaterGlasses] = useState(initial ? String(initial.waterGlasses) : "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        date,
        sleepHours: Number(sleepHours) || 0,
        exerciseMinutes: Number(exerciseMinutes) || 0,
        waterGlasses: Number(waterGlasses) || 0,
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
        className="w-full rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_0.25s_ease-out]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        <h2 className="mb-4 text-base font-bold text-ink">Log Metrik</h2>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">😴 Jam Tidur</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={24}
            step={0.5}
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-base font-semibold text-ink outline-none focus:border-ink"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">🏃 Olahraga (menit)</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={exerciseMinutes}
            onChange={(e) => setExerciseMinutes(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-base font-semibold text-ink outline-none focus:border-ink"
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">💧 Air Minum (gelas)</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={waterGlasses}
            onChange={(e) => setWaterGlasses(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-base font-semibold text-ink outline-none focus:border-ink"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-ink py-4 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-50"
        >
          {submitting ? "Menyimpan..." : "Simpan Metrik"}
        </button>
      </form>
    </div>
  );
}
