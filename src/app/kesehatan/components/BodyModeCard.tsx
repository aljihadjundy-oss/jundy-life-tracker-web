"use client";

import type { HealthSettings } from "@/types/kesehatan";
import { cycleInfo, pregnancyInfo } from "@/lib/cycle";
import { formatDate, todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n";

/**
 * The headline card of the Tubuh tab: which day of the cycle it is, how far
 * along a pregnancy is, or a nudge to set things up first.
 */
export default function BodyModeCard({
  settings,
  onPeriodStartedToday,
  onOpenSettings,
}: {
  settings: HealthSettings;
  onPeriodStartedToday: () => void;
  onOpenSettings: () => void;
}) {
  const t = useT();
  const today = todayISO();

  if (settings.bodyMode === "none") {
    // Nothing cycle-shaped to show; the Body tab is just movement and habits.
    return (
      <Shell gradient="from-slate-600 via-slate-700 to-slate-800">
        <p className="text-xs font-medium text-white/75">{t("health.mode.none")}</p>
        <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-white">
          {t("health.noneHeadline")}
        </p>
        <p className="mt-1 text-sm text-white/85">{t("health.noneNote")}</p>
        <button
          onClick={onOpenSettings}
          className="mt-4 w-full rounded-2xl bg-white/20 py-3 text-sm font-bold text-white transition active:scale-95"
        >
          {t("health.openSettings")}
        </button>
      </Shell>
    );
  }

  if (settings.bodyMode === "pregnant") {
    if (!settings.dueDate) return <SetupCard t={t} onOpenSettings={onOpenSettings} keySuffix="dueDate" />;
    const { week, trimester } = pregnancyInfo(settings.dueDate, today);
    return (
      <Shell gradient="from-amber-500 via-orange-500 to-rose-500">
        <p className="text-xs font-medium text-white/75">{t("health.trimester", { n: trimester })}</p>
        <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-white">
          {t("health.weekN", { n: week })}
        </p>
        <p className="mt-1 text-sm text-white/85">
          {t("health.dueOn", { date: formatDate(settings.dueDate) })}
        </p>
      </Shell>
    );
  }

  if (settings.bodyMode === "breastfeeding") {
    return (
      <Shell gradient="from-emerald-500 via-teal-500 to-cyan-500">
        <p className="text-xs font-medium text-white/75">{t("health.mode.breastfeeding")}</p>
        <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-white">
          {t("health.waterGoalGlasses", { count: 10 })}
        </p>
        <p className="mt-1 text-sm text-white/85">{t("health.breastfeedingNote")}</p>
      </Shell>
    );
  }

  if (!settings.cycleStart) return <SetupCard t={t} onOpenSettings={onOpenSettings} keySuffix="cycle" />;

  const info = cycleInfo(settings, today);
  return (
    <Shell gradient="from-rose-500 via-pink-500 to-fuchsia-500">
      <p className="text-xs font-medium text-white/75">{t(`health.phase.${info.phase}`)}</p>
      <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-white">
        {t("health.cycleDay", { n: info.day })}
      </p>
      <p className="mt-1 text-sm text-white/85">
        {t("health.nextPeriod", { date: formatDate(info.nextPeriod), count: info.daysLeft })}
      </p>
      <p className="mt-3 text-[11px] leading-snug text-white/80">
        {t(`health.phaseNote.${info.phase}`)}
      </p>
      <button
        onClick={onPeriodStartedToday}
        className="mt-4 w-full rounded-2xl bg-white/20 py-3 text-sm font-bold text-white transition active:scale-95"
      >
        {t("health.periodStartedToday")}
      </button>
    </Shell>
  );
}

function Shell({ gradient, children }: { gradient: string; children: React.ReactNode }) {
  return (
    <div className={`mx-5 rounded-3xl bg-gradient-to-br ${gradient} p-5 shadow-lg`}>{children}</div>
  );
}

function SetupCard({
  t,
  onOpenSettings,
  keySuffix,
}: {
  t: (key: string) => string;
  onOpenSettings: () => void;
  keySuffix: string;
}) {
  return (
    <div className="mx-5 rounded-3xl bg-surface-raised p-6 text-center">
      <p className="text-sm text-ink-muted">{t(`health.setup.${keySuffix}`)}</p>
      <button
        onClick={onOpenSettings}
        className="mt-4 rounded-full bg-ink px-5 py-2.5 text-xs font-bold text-surface transition active:scale-95"
      >
        {t("health.openSettings")}
      </button>
    </div>
  );
}
