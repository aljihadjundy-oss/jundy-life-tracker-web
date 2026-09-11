"use client";

import type { TaskStatus } from "@/types/waktu";
import { useT } from "@/lib/i18n";

export const STATUS_STYLE: Record<TaskStatus, string> = {
  todo: "bg-surface-raised text-ink-muted",
  in_progress: "bg-accent-time/15 text-accent-time",
  blocked: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  done: "bg-accent-finance/15 text-accent-finance",
  ghosted: "bg-red-500/15 text-red-500",
};

export default function StatusPill({ status }: { status: TaskStatus }) {
  const t = useT();
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLE[status]}`}>
      {t(`status.${status}`)}
    </span>
  );
}

const CATEGORY_STYLE: Record<string, string> = {
  personal: "bg-accent-time/12 text-accent-time",
  delegation: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  crossbu: "bg-violet-500/15 text-violet-500",
};

export function CategoryPill({ category }: { category: string }) {
  const t = useT();
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        CATEGORY_STYLE[category] ?? "bg-surface-raised text-ink-muted"
      }`}
    >
      {t(`category.task.${category}`)}
    </span>
  );
}

/** Three dots, filled up to `count`. Tapping cycles 0 → 1 → 2 → 3 → 0. */
export function StrikeDots({
  count,
  onCycle,
}: {
  count: number;
  onCycle?: () => void;
}) {
  const t = useT();
  const dots = (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${i < count ? "bg-red-500" : "bg-border"}`}
        />
      ))}
    </>
  );

  if (!onCycle) return <span className="inline-flex items-center gap-1">{dots}</span>;

  return (
    <button
      onClick={onCycle}
      aria-label={t("ops.addStrike")}
      className="inline-flex items-center gap-1 rounded-full px-1 py-1 transition active:scale-90"
    >
      {dots}
    </button>
  );
}
