import type { DailyMetrics } from "@/types/kesehatan";
import { useT } from "@/lib/i18n";

export default function MetricsCard({
  metrics,
  onEdit,
}: {
  metrics: DailyMetrics | null;
  onEdit: () => void;
}) {
  const t = useT();
  return (
    <div className="mx-5 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">{t("health.todayMetrics")}</h3>
        <button onClick={onEdit} className="text-xs font-semibold text-accent-health underline-offset-2 hover:underline">
          {metrics ? t("finance.change") : t("health.logNow")}
        </button>
      </div>
      <div className="flex gap-2.5">
        <MetricTile emoji="😴" label={t("health.sleep")} value={metrics ? t("health.hours", { count: metrics.sleepHours }) : "—"} />
        <MetricTile emoji="🏃" label={t("health.exercise")} value={metrics ? t("health.minutes", { count: metrics.exerciseMinutes }) : "—"} />
        <MetricTile emoji="💧" label={t("health.water")} value={metrics ? t("health.glasses", { count: metrics.waterGlasses }) : "—"} />
      </div>
    </div>
  );
}

function MetricTile({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex-1 rounded-xl bg-surface-raised p-3 text-center">
      <p className="text-lg">{emoji}</p>
      <p className="mt-1 text-sm font-bold text-ink">{value}</p>
      <p className="text-[10px] text-ink-muted">{label}</p>
    </div>
  );
}
