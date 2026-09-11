"use client";

import { useT } from "@/lib/i18n";

/** Tap any glass to jump straight to that count, or step with the buttons. */
export default function WaterCard({
  glasses,
  target,
  onChange,
}: {
  glasses: number;
  target: number;
  onChange: (next: number) => void;
}) {
  const t = useT();
  const slots = Math.max(target, glasses);

  return (
    <div className="mx-5 rounded-2xl bg-surface-card p-4 ring-1 ring-border/60">
      <p className="text-[11px] font-bold uppercase tracking-wide text-accent-time">
        {t("health.water")}
      </p>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-extrabold tabular-nums text-ink">{glasses}</span>
        <span className="text-sm text-ink-muted">{t("health.ofNGlasses", { count: target })}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {Array.from({ length: slots }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(glasses === i + 1 ? i : i + 1)}
            aria-label={t("health.nGlasses", { count: i + 1 })}
            className={`h-8 w-6 rounded-md border-[1.5px] transition ${
              i < glasses ? "border-accent-time bg-accent-time" : "border-border bg-transparent"
            }`}
          />
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onChange(Math.max(0, glasses - 1))}
          className="w-14 rounded-2xl bg-surface-raised py-3 text-sm font-bold text-ink transition active:scale-95"
        >
          −
        </button>
        <button
          onClick={() => onChange(glasses + 1)}
          className="flex-1 rounded-2xl bg-accent-time py-3 text-sm font-bold text-white transition active:scale-95"
        >
          + {t("health.addGlass")}
        </button>
      </div>
    </div>
  );
}
