"use client";

import { useT } from "@/lib/i18n";

/** Collapsible section header with a done/total counter, like the ops table. */
export default function GroupHeader({
  label,
  done,
  total,
  collapsed,
  onToggle,
}: {
  label: string;
  done: number;
  total: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2 rounded-xl bg-surface-raised px-3 py-2.5 text-left"
    >
      <span className={`text-[11px] text-ink-muted transition ${collapsed ? "" : "rotate-90"}`}>▶</span>
      <span className="min-w-0 flex-1 truncate text-xs font-extrabold uppercase tracking-wide text-ink">
        {label}
      </span>
      <span className="shrink-0 text-[11px] font-semibold text-ink-muted">
        {t("ops.groupCount", { done, total })}
      </span>
    </button>
  );
}
