import { useT } from "@/lib/i18n";

export default function HealthSummaryCard({
  streak,
  doneToday,
  totalHabits,
}: {
  streak: number;
  doneToday: number;
  totalHabits: number;
}) {
  const allDone = totalHabits > 0 && doneToday === totalHabits;
  const t = useT();

  return (
    <div className="mx-5 rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-500 p-5 text-white shadow-lg shadow-orange-500/20">
      <p className="text-xs font-medium text-white/80">{t("health.habitStreak")}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">
        {streak > 0 ? t("home.streakDays", { count: streak }) : t("home.noStreak")}
      </p>

      <div className="mt-4 rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-white/85">{t("health.habitToday")}</span>
          <span className="text-[11px] font-bold">
            {totalHabits > 0 ? `${doneToday}/${totalHabits}` : "0/0"}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className={`h-full rounded-full transition-all ${allDone ? "bg-white" : "bg-white/80"}`}
            style={{ width: totalHabits > 0 ? `${(doneToday / totalHabits) * 100}%` : "0%" }}
          />
        </div>
      </div>
    </div>
  );
}
