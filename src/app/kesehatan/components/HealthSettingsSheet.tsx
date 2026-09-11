"use client";

import { useState } from "react";
import {
  BODY_MODES,
  CYCLE_LENGTH_OPTIONS,
  EXERCISE_TYPES,
  PERIOD_LENGTH_OPTIONS,
  WATER_TARGET_OPTIONS,
  type ExercisePrefs,
  type HealthSettings,
} from "@/types/kesehatan";
import { todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n";

const FREQUENCIES: ExercisePrefs["frequency"][] = ["low", "mid", "high"];
const LEVELS: ExercisePrefs["level"][] = ["beginner", "intermediate", "regular"];
const ACTIVITIES: ExercisePrefs["activity"][] = ["sitting", "standing", "lifting"];

export default function HealthSettingsSheet({
  settings,
  onSave,
  onClose,
}: {
  settings: HealthSettings;
  onSave: (patch: Partial<HealthSettings>) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState<HealthSettings>(settings);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<HealthSettings>) => setDraft((prev) => ({ ...prev, ...patch }));
  const setPrefs = (patch: Partial<ExercisePrefs>) =>
    setDraft((prev) => ({ ...prev, exercisePrefs: { ...prev.exercisePrefs, ...patch } }));

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_0.25s_ease-out]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />

        <Section title={t("health.bodyMode")} hint={t("health.bodyModeHint")}>
          <Chips
            options={BODY_MODES}
            selected={draft.bodyMode}
            label={(m) => t(`health.mode.${m}`)}
            onSelect={(m) => set({ bodyMode: m })}
          />
        </Section>

        {draft.bodyMode === "cycle" && (
          <Section title={t("health.cycle")}>
            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                {t("health.lastPeriodStart")}
              </span>
              <input
                type="date"
                max={todayISO()}
                value={draft.cycleStart}
                onChange={(e) => set({ cycleStart: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm tabular-nums text-ink outline-none focus:border-ink"
              />
            </label>

            <p className="mb-1.5 text-xs font-medium text-ink-muted">{t("health.cycleLength")}</p>
            <Chips
              options={CYCLE_LENGTH_OPTIONS}
              selected={draft.cycleLength}
              label={(n) => String(n)}
              onSelect={(n) => set({ cycleLength: n })}
            />

            <p className="mb-1.5 mt-3 text-xs font-medium text-ink-muted">{t("health.periodLength")}</p>
            <Chips
              options={PERIOD_LENGTH_OPTIONS}
              selected={draft.periodLength}
              label={(n) => String(n)}
              onSelect={(n) => set({ periodLength: n })}
            />
          </Section>
        )}

        {draft.bodyMode === "pregnant" && (
          <Section title={t("health.pregnancy")}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("health.dueDate")}</span>
              <input
                type="date"
                value={draft.dueDate}
                onChange={(e) => set({ dueDate: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm tabular-nums text-ink outline-none focus:border-ink"
              />
            </label>
          </Section>
        )}

        <Section title={t("health.waterTarget")} hint={t("health.waterTargetHint")}>
          <Chips
            options={WATER_TARGET_OPTIONS}
            selected={draft.waterTarget}
            label={(n) => String(n)}
            onSelect={(n) => set({ waterTarget: n })}
          />
        </Section>

        <Section title={t("health.mealTimes")}>
          <div className="flex flex-col gap-2">
            {draft.meals.map((meal, i) => (
              <div key={meal.id} className="flex items-center gap-3">
                <span className="flex-1 text-sm font-semibold text-ink">
                  {t(`health.meal.${meal.id}`)}
                </span>
                <input
                  type="time"
                  value={meal.time}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const meals = draft.meals.map((m, j) =>
                      j === i ? { ...m, time: e.target.value } : m
                    );
                    set({ meals });
                  }}
                  className="rounded-xl border border-border bg-surface-card px-3 py-2 text-sm tabular-nums text-ink outline-none focus:border-ink"
                />
              </div>
            ))}
          </div>
        </Section>

        <Section title={t("health.exercisePrefs")}>
          <p className="mb-1.5 text-xs font-medium text-ink-muted">{t("health.prefType")}</p>
          <div className="flex flex-wrap gap-2">
            {EXERCISE_TYPES.map((type) => {
              const on = draft.exercisePrefs.types.includes(type);
              return (
                <button
                  key={type}
                  onClick={() =>
                    setPrefs({
                      types: on
                        ? draft.exercisePrefs.types.filter((x) => x !== type)
                        : [...draft.exercisePrefs.types, type],
                    })
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    on ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
                  }`}
                >
                  {t(`exerciseType.${type}`)}
                </button>
              );
            })}
          </div>

          <p className="mb-1.5 mt-3 text-xs font-medium text-ink-muted">{t("health.prefFrequency")}</p>
          <Chips
            options={FREQUENCIES}
            selected={draft.exercisePrefs.frequency}
            label={(f) => t(`health.frequency.${f}`)}
            onSelect={(frequency) => setPrefs({ frequency })}
          />

          <p className="mb-1.5 mt-3 text-xs font-medium text-ink-muted">{t("health.prefLevel")}</p>
          <Chips
            options={LEVELS}
            selected={draft.exercisePrefs.level}
            label={(l) => t(`health.level.${l}`)}
            onSelect={(level) => setPrefs({ level })}
          />

          <p className="mb-1.5 mt-3 text-xs font-medium text-ink-muted">{t("health.prefActivity")}</p>
          <Chips
            options={ACTIVITIES}
            selected={draft.exercisePrefs.activity}
            label={(a) => t(`health.activity.${a}`)}
            onSelect={(activity) => setPrefs({ activity })}
          />
        </Section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-2 w-full rounded-2xl bg-ink py-4 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-50"
        >
          {saving ? t("app.saving") : t("app.save")}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      {hint && <p className="mb-2 mt-0.5 text-[11px] text-ink-muted">{hint}</p>}
      <div className={hint ? "" : "mt-2"}>{children}</div>
    </div>
  );
}

function Chips<T extends string | number>({
  options,
  selected,
  label,
  onSelect,
}: {
  options: readonly T[];
  selected: T;
  label: (value: T) => string;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            selected === option ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
          }`}
        >
          {label(option)}
        </button>
      ))}
    </div>
  );
}
