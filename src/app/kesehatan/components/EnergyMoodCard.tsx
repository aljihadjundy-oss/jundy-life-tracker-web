"use client";

import { MOODS } from "@/types/kesehatan";
import { useT } from "@/lib/i18n";

/**
 * Energy 1–5 plus a mood chip, with the last seven days as a sparkline and a
 * one-line read on the week. Rima holds back the insight until three days are
 * logged, which keeps it from asserting a pattern that isn't there yet.
 */
export default function EnergyMoodCard({
  energy,
  mood,
  week,
  onEnergy,
  onMood,
}: {
  energy: number;
  mood: string;
  /** Seven entries, oldest first; null where nothing was logged. */
  week: (number | null)[];
  onEnergy: (value: number) => void;
  onMood: (value: string) => void;
}) {
  const t = useT();
  const logged = week.filter((v): v is number => v != null);
  const average = logged.length > 0 ? (logged.reduce((a, b) => a + b, 0) / logged.length).toFixed(1) : "0";

  return (
    <div className="mx-5 rounded-2xl bg-surface-card p-4 ring-1 ring-border/60">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-start">
        {t("health.energyMood")}
      </p>
      <p className="mt-1 text-xs text-ink-muted">{t("health.energyQuestion")}</p>

      <div className="mt-3 flex items-end gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onEnergy(energy === n ? 0 : n)}
            aria-label={t("health.energyLevel", { n })}
            className={`flex-1 rounded-xl border transition ${
              n <= energy ? "border-brand-start bg-brand-start" : "border-border bg-surface-raised"
            }`}
            style={{ height: 12 + n * 7 }}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m}
            onClick={() => onMood(mood === m ? "" : m)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              mood === m ? "bg-brand-start text-white" : "bg-surface-raised text-ink-muted"
            }`}
          >
            {t(`mood.${m}`)}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-surface-raised p-3">
        <p className="text-xs leading-relaxed text-ink">
          {logged.length < 3
            ? t("health.insightTooEarly", { count: 3 - logged.length })
            : t("health.insightAverage", { average, days: logged.length })}
        </p>
        <div className="mt-3 flex h-12 items-end gap-1.5">
          {week.map((value, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-md ${
                value == null
                  ? "bg-brand-start/15"
                  : i === week.length - 1
                    ? "bg-brand-start"
                    : "bg-brand-start/40"
              }`}
              style={{ height: value ? `${(value / 5) * 100}%` : "8%" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
