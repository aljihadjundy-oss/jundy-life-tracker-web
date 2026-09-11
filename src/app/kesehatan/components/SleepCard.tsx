"use client";

import { sleepHours } from "@/lib/cycle";
import { addMinutesToHHmm, formatTime } from "@/lib/format";
import { useT } from "@/lib/i18n";

export default function SleepCard({
  bedtime,
  wakeTime,
  onChange,
}: {
  bedtime: string;
  wakeTime: string;
  onChange: (patch: { bedtime?: string; wakeTime?: string }) => void;
}) {
  const t = useT();
  const hours = sleepHours(bedtime, wakeTime);

  return (
    <div className="mx-5 rounded-2xl bg-surface-card p-4 ring-1 ring-border/60">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
        {t("health.sleep")}
      </p>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-extrabold tabular-nums text-ink">{hours}</span>
        <span className="text-sm text-ink-muted">{t("health.hoursLastNight")}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("health.bedtime")}</span>
          <input
            type="time"
            value={bedtime}
            onChange={(e) => e.target.value && onChange({ bedtime: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm tabular-nums text-ink outline-none focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("health.wakeTime")}</span>
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => e.target.value && onChange({ wakeTime: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm tabular-nums text-ink outline-none focus:border-ink"
          />
        </label>
      </div>

      <p className="mt-4 rounded-2xl bg-surface-raised p-3 text-[11px] leading-snug text-ink-muted">
        🔔 {t("health.sleepReminderNote", { time: formatTime(addMinutesToHHmm(bedtime, -30)) })}
      </p>
    </div>
  );
}
