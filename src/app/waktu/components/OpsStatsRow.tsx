"use client";

import type { OpsStats } from "@/lib/ops";
import { useT } from "@/lib/i18n";

/** The four headline numbers from the ops tracker, scrollable on a phone. */
export default function OpsStatsRow({
  stats,
  strikeOwners,
  onOpenStrikes,
}: {
  stats: OpsStats;
  strikeOwners: number;
  onOpenStrikes: () => void;
}) {
  const t = useT();

  const cards = [
    { key: "total", value: stats.total, label: t("ops.statTotal"), tone: "text-ink" },
    { key: "open", value: stats.open, label: t("ops.statOpen"), tone: "text-accent-time" },
    { key: "week", value: stats.doneThisWeek, label: t("ops.statDoneWeek"), tone: "text-accent-finance" },
    { key: "strike", value: strikeOwners, label: t("ops.statStrikes"), tone: "text-red-500" },
  ];

  return (
    <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-5 pb-1">
      {cards.map((card) => (
        <button
          key={card.key}
          onClick={card.key === "strike" ? onOpenStrikes : undefined}
          className="min-w-[7.5rem] shrink-0 rounded-2xl bg-surface-card p-3.5 text-left ring-1 ring-border/60"
        >
          <p className={`text-2xl font-extrabold tracking-tight tabular-nums ${card.tone}`}>
            {card.value}
          </p>
          <p className="mt-0.5 text-[11px] font-medium leading-tight text-ink-muted">{card.label}</p>
        </button>
      ))}
    </div>
  );
}
