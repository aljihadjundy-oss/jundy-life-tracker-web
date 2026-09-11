"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { completeOnboarding, setPillars } from "@/lib/profile";
import {
  GENDERS,
  PILLAR_EMOJI,
  PILLAR_KEYS,
  ALL_PILLARS_ON,
  type Gender,
  type Pillars,
} from "@/types/profile";
import { useT } from "@/lib/i18n";

/**
 * Three steps, asked once. The point is not to collect data for its own sake —
 * each answer switches something on or off, and the last step says so.
 */
export default function Onboarding() {
  const { user } = useAuth();
  const t = useT();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.displayName?.split(" ")[0] ?? "");
  const [gender, setGender] = useState<Gender>("unset");
  const [birthDate, setBirthDate] = useState("");
  const [occupation, setOccupation] = useState("");
  const [pillars, setPillarState] = useState<Pillars>(ALL_PILLARS_ON);
  const [saving, setSaving] = useState(false);

  const chosen = PILLAR_KEYS.filter((key) => pillars[key]);

  async function finish() {
    if (!user) return;
    setSaving(true);
    try {
      await setPillars(user.uid, pillars);
      await completeOnboarding(user.uid, {
        displayName: name.trim(),
        gender,
        birthDate,
        occupation: occupation.trim(),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        <div className="mb-8 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition ${
                i <= step ? "bg-ink" : "bg-surface-raised"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="flex flex-1 flex-col">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              {t("onboarding.hello")}
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted">{t("onboarding.helloSub")}</p>

            <label className="mt-7 block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                {t("onboarding.name")}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("onboarding.namePlaceholder")}
                className="w-full rounded-xl border border-border bg-surface-card px-4 py-3.5 text-base font-semibold text-ink outline-none focus:border-ink"
              />
            </label>

            <div className="mt-5">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                {t("onboarding.gender")}
              </span>
              <div className="flex gap-2">
                {GENDERS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setGender(option)}
                    className={`flex-1 rounded-xl px-3 py-3 text-xs font-semibold transition ${
                      gender === option ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
                    }`}
                  >
                    {t(`onboarding.gender.${option}`)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                {t("onboarding.genderWhy")}
              </p>
            </div>

            <label className="mt-5 block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                {t("onboarding.birthDate")} <span className="font-normal">{t("app.optional")}</span>
              </span>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-card px-4 py-3.5 text-sm tabular-nums text-ink outline-none focus:border-ink"
              />
            </label>

            <label className="mt-5 block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">
                {t("onboarding.occupation")} <span className="font-normal">{t("app.optional")}</span>
              </span>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder={t("onboarding.occupationPlaceholder")}
                className="w-full rounded-xl border border-border bg-surface-card px-4 py-3.5 text-sm text-ink outline-none focus:border-ink"
              />
            </label>

            <div className="flex-1" />
            <button
              onClick={() => setStep(1)}
              disabled={!name.trim()}
              className="mt-8 w-full rounded-2xl bg-ink py-4 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-40"
            >
              {t("onboarding.next")}
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-1 flex-col">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              {t("onboarding.pickPillars")}
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted">{t("onboarding.pickPillarsSub")}</p>

            <div className="mt-6 flex flex-col gap-2.5">
              {PILLAR_KEYS.map((key) => {
                const on = pillars[key];
                return (
                  <button
                    key={key}
                    onClick={() => setPillarState((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className={`flex items-center gap-3 rounded-2xl p-4 text-left transition ${
                      on ? "bg-surface-card ring-2 ring-ink" : "bg-surface-raised ring-1 ring-border"
                    }`}
                  >
                    <span className="text-2xl">{PILLAR_EMOJI[key]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ink">{t(`nav.${key}`)}</span>
                      <span className="block text-[11px] leading-snug text-ink-muted">
                        {t(`onboarding.pillar.${key}`)}
                      </span>
                    </span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        on ? "border-ink bg-ink text-surface" : "border-border text-transparent"
                      }`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-[11px] text-ink-muted">{t("onboarding.pillarsLater")}</p>

            <div className="flex-1" />
            <div className="mt-8 flex gap-2">
              <button
                onClick={() => setStep(0)}
                className="rounded-2xl bg-surface-raised px-5 py-4 text-sm font-bold text-ink-muted transition active:scale-95"
              >
                {t("onboarding.back")}
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={chosen.length === 0}
                className="flex-1 rounded-2xl bg-ink py-4 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-40"
              >
                {t("onboarding.next")}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-1 flex-col">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              {t("onboarding.ready", { name: name.trim() })}
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted">{t("onboarding.readySub")}</p>

            <div className="mt-6 rounded-2xl bg-surface-card p-4 ring-1 ring-border/60">
              <Summary label={t("onboarding.name")} value={name.trim()} />
              {gender !== "unset" && (
                <Summary label={t("onboarding.gender")} value={t(`onboarding.gender.${gender}`)} />
              )}
              {occupation.trim() && (
                <Summary label={t("onboarding.occupation")} value={occupation.trim()} />
              )}
              <Summary
                label={t("onboarding.activePillars")}
                value={chosen.map((key) => t(`nav.${key}`)).join(", ")}
              />
            </div>

            {/* Say plainly what the answers changed, so the questions read as
                setup rather than data collection. */}
            {pillars.health && (
              <p className="mt-4 rounded-2xl bg-surface-raised p-4 text-[11px] leading-relaxed text-ink-muted">
                {gender === "female"
                  ? t("onboarding.healthCycleOn")
                  : t("onboarding.healthCycleOff")}
              </p>
            )}

            <div className="flex-1" />
            <div className="mt-8 flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="rounded-2xl bg-surface-raised px-5 py-4 text-sm font-bold text-ink-muted transition active:scale-95"
              >
                {t("onboarding.back")}
              </button>
              <button
                onClick={finish}
                disabled={saving}
                className="flex-1 rounded-2xl bg-gradient-to-r from-brand-start via-brand-mid to-brand-end py-4 text-sm font-bold text-white transition active:scale-95 disabled:opacity-50"
              >
                {saving ? t("app.saving") : t("onboarding.start")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 last:border-none">
      <span className="shrink-0 text-[11px] text-ink-muted">{label}</span>
      <span className="min-w-0 truncate text-xs font-semibold text-ink">{value}</span>
    </div>
  );
}
