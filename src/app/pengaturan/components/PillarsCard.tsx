"use client";

import { PILLAR_EMOJI, PILLAR_KEYS, type Pillars } from "@/types/profile";
import { useT } from "@/lib/i18n";

/**
 * Switch a module off and it leaves the nav, the home screen and the router.
 * The last one on cannot be switched off — an app with no modules is just a
 * settings page.
 */
export default function PillarsCard({
  pillars,
  onChange,
}: {
  pillars: Pillars;
  onChange: (patch: Partial<Pillars>) => void;
}) {
  const t = useT();
  const activeCount = PILLAR_KEYS.filter((key) => pillars[key]).length;

  return (
    <div className="rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
      <h2 className="text-sm font-bold text-ink">{t("settings.pillarsTitle")}</h2>
      <p className="mt-1 text-xs text-ink-muted">{t("settings.pillarsHint")}</p>

      <div className="mt-3 flex flex-col">
        {PILLAR_KEYS.map((key) => {
          const on = pillars[key];
          const isLastOn = on && activeCount === 1;
          return (
            <div
              key={key}
              className="flex items-center gap-3 border-b border-border/60 py-3 last:border-none"
            >
              <span className="text-lg">{PILLAR_EMOJI[key]}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">{t(`nav.${key}`)}</span>
                <span className="block text-[11px] leading-snug text-ink-muted">
                  {isLastOn ? t("settings.lastPillar") : t(`onboarding.pillar.${key}`)}
                </span>
              </span>
              <button
                role="switch"
                aria-checked={on}
                aria-label={t(`nav.${key}`)}
                disabled={isLastOn}
                onClick={() => onChange({ [key]: !on })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${
                  on ? "bg-accent-finance" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    on ? "left-[1.375rem]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
