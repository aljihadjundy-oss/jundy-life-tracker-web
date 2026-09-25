"use client";

/** Small 2-column stat tiles, same visual language as OverviewTab's KPI
 * row — used on tabs that used to be a bare list with no at-a-glance totals. */
export default function StatGrid({
  items,
}: {
  items: { label: string; value: string; tone?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-surface-card p-3.5 ring-1 ring-border/60">
          <p className={`truncate text-base font-extrabold tabular-nums ${item.tone ?? "text-ink"}`}>
            {item.value}
          </p>
          <p className="mt-0.5 text-[11px] leading-tight text-ink-muted">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
