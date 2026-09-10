import type { DailyMetrics } from "@/types/kesehatan";

export default function MetricsCard({
  metrics,
  onEdit,
}: {
  metrics: DailyMetrics | null;
  onEdit: () => void;
}) {
  return (
    <div className="mx-5 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">Metrik Hari Ini</h3>
        <button onClick={onEdit} className="text-xs font-semibold text-accent-health underline-offset-2 hover:underline">
          {metrics ? "Ubah" : "Log Sekarang"}
        </button>
      </div>
      <div className="flex gap-2.5">
        <MetricTile emoji="😴" label="Tidur" value={metrics ? `${metrics.sleepHours} jam` : "—"} />
        <MetricTile emoji="🏃" label="Olahraga" value={metrics ? `${metrics.exerciseMinutes} mnt` : "—"} />
        <MetricTile emoji="💧" label="Air" value={metrics ? `${metrics.waterGlasses} gelas` : "—"} />
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
