"use client";

import { useT } from "@/lib/i18n";

export default function WeightCard({
  weightKg,
  previous,
  onChange,
}: {
  weightKg: number;
  /** Most recent earlier logged weight + a display-ready date, if any. */
  previous: { weightKg: number; dateLabel: string } | null;
  onChange: (next: number) => void;
}) {
  const t = useT();
  const delta = weightKg > 0 && previous ? Math.round((weightKg - previous.weightKg) * 10) / 10 : null;

  return (
    <div className="mx-5 rounded-2xl bg-surface-card p-4 ring-1 ring-border/60">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{t("health.weight")}</p>

      <div className="mt-2 flex items-baseline gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={400}
          step={0.1}
          value={weightKg || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder="—"
          className="w-24 rounded-xl border border-border bg-surface-raised px-3 py-2 text-2xl font-extrabold tabular-nums text-ink outline-none focus:border-ink"
        />
        <span className="text-sm text-ink-muted">kg</span>
      </div>

      {delta !== null && previous && (
        <p className="mt-2 text-[11px] text-ink-muted">
          {t("health.weightDelta", {
            delta: delta > 0 ? `+${delta}` : String(delta),
            date: previous.dateLabel,
          })}
        </p>
      )}
    </div>
  );
}
