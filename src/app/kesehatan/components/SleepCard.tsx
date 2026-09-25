"use client";

import { sleepHours } from "@/lib/cycle";
import { addMinutesToHHmm, formatTime } from "@/lib/format";
import { useT } from "@/lib/i18n";

/**
 * Logs what actually happened last night — separate from the recurring
 * bedtime/wake schedule in Settings, which only exists to time the reminder
 * notification. Conflating the two used to mean "sleep hours" was really
 * just restating the schedule every day, never what actually happened.
 */
export default function SleepCard({
  actualBedtime,
  actualWakeTime,
  scheduleBedtime,
  onChange,
}: {
  actualBedtime: string;
  actualWakeTime: string;
  scheduleBedtime: string;
  onChange: (patch: { actualBedtime?: string; actualWakeTime?: string }) => void;
}) {
  const t = useT();
  const logged = Boolean(actualBedtime && actualWakeTime);
  const hours = logged ? sleepHours(actualBedtime, actualWakeTime) : null;

  return (
    <div className="mx-5 rounded-2xl bg-surface-card p-4 ring-1 ring-border/60">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
        {t("health.sleep")}
      </p>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-extrabold tabular-nums text-ink">{hours ?? "—"}</span>
        <span className="text-sm text-ink-muted">{t("health.hoursLastNight")}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("health.bedtime")}</span>
          <input
            type="time"
            value={actualBedtime}
            onChange={(e) => e.target.value && onChange({ actualBedtime: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm tabular-nums text-ink outline-none focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("health.wakeTime")}</span>
          <input
            type="time"
            value={actualWakeTime}
            onChange={(e) => e.target.value && onChange({ actualWakeTime: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm tabular-nums text-ink outline-none focus:border-ink"
          />
        </label>
      </div>

      {!logged && <p className="mt-3 text-[11px] text-ink-muted">{t("health.sleepNotLoggedYet")}</p>}

      <p className="mt-4 rounded-2xl bg-surface-raised p-3 text-[11px] leading-snug text-ink-muted">
        🔔 {t("health.sleepReminderNote", { time: formatTime(addMinutesToHHmm(scheduleBedtime, -30)) })}
      </p>
    </div>
  );
}
