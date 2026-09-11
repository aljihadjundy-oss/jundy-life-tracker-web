"use client";

import { useState } from "react";
import { GENDERS, type Gender, type Profile } from "@/types/profile";
import { useT } from "@/lib/i18n";

export default function ProfileSheet({
  profile,
  onSubmit,
  onClose,
}: {
  profile: Profile;
  onSubmit: (patch: Partial<Profile>) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [occupation, setOccupation] = useState(profile.occupation);
  const [saving, setSaving] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-ink outline-none focus:border-ink";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        displayName: displayName.trim(),
        gender,
        birthDate,
        occupation: occupation.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_0.25s_ease-out]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        <h2 className="mb-4 text-base font-extrabold text-ink">{t("settings.profileTitle")}</h2>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
            {t("onboarding.name")}
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="mb-4">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
            {t("onboarding.gender")}
          </span>
          <div className="flex gap-2">
            {GENDERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setGender(option)}
                className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
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

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
            {t("onboarding.birthDate")}
          </span>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
            {t("onboarding.occupation")}
          </span>
          <input
            type="text"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-ink py-4 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-50"
        >
          {saving ? t("app.saving") : t("app.save")}
        </button>
      </form>
    </div>
  );
}
