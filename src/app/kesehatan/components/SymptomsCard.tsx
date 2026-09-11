"use client";

import { CYCLE_SYMPTOMS, PREGNANCY_SYMPTOMS, type BodyMode } from "@/types/kesehatan";
import { useT } from "@/lib/i18n";

export default function SymptomsCard({
  mode,
  selected,
  onToggle,
}: {
  mode: BodyMode;
  selected: string[];
  onToggle: (symptom: string) => void;
}) {
  const t = useT();
  const list = mode === "pregnant" ? PREGNANCY_SYMPTOMS : CYCLE_SYMPTOMS;

  return (
    <div className="mx-5 rounded-2xl bg-surface-card p-4 ring-1 ring-border/60">
      <p className="text-[11px] font-bold uppercase tracking-wide text-rose-500">
        {t("health.symptomsToday")}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {list.map((symptom) => {
          const on = selected.includes(symptom);
          return (
            <button
              key={symptom}
              onClick={() => onToggle(symptom)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                on ? "bg-rose-500 text-white" : "bg-surface-raised text-ink-muted"
              }`}
            >
              {t(`symptom.${symptom}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
