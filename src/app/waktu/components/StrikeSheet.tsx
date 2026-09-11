"use client";

import { MAX_STRIKES, type Task } from "@/types/waktu";
import { useT } from "@/lib/i18n";
import { StrikeDots } from "./StatusPill";

/**
 * Three strikes per delegate. Only owners who actually hold delegated tasks
 * show up — a strike against someone with nothing assigned is meaningless.
 */
export default function StrikeSheet({
  tasks,
  strikes,
  onCycle,
  onClose,
}: {
  tasks: Task[];
  strikes: Record<string, number>;
  onCycle: (owner: string, current: number) => void;
  onClose: () => void;
}) {
  const t = useT();
  const owners = [
    ...new Set(tasks.filter((task) => task.category === "delegation" && task.owner).map((x) => x.owner)),
  ].sort((a, b) => a.localeCompare(b, "id"));

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_0.25s_ease-out]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        <h2 className="text-base font-extrabold text-ink">{t("ops.strikeTracker")}</h2>
        <p className="mt-0.5 text-xs text-ink-muted">{t("ops.strikeHint")}</p>

        <div className="mt-4 flex flex-col">
          {owners.length === 0 && (
            <p className="rounded-2xl bg-surface-raised p-6 text-center text-sm text-ink-muted">
              {t("ops.noDelegation")}
            </p>
          )}

          {owners.map((owner) => {
            const count = strikes[owner] ?? 0;
            const openCount = tasks.filter(
              (task) => task.owner === owner && task.status !== "done" && task.status !== "ghosted"
            ).length;
            const tone =
              count === 0
                ? "text-accent-finance"
                : count < MAX_STRIKES
                  ? "text-amber-500"
                  : "text-red-500";
            const label =
              count === 0
                ? t("ops.strikeSafe")
                : count < MAX_STRIKES
                  ? t("ops.strikeN", { count })
                  : t("ops.cutoff");

            return (
              <div
                key={owner}
                className="flex items-center gap-3 border-b border-border/60 py-3 last:border-none"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{owner}</p>
                  <p className="text-[11px] text-ink-muted">
                    {t("ops.openTasks", { count: openCount })}
                  </p>
                </div>
                <StrikeDots count={count} onCycle={() => onCycle(owner, count)} />
                <span className={`w-24 shrink-0 text-right text-[11px] font-bold ${tone}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-ink py-3.5 text-sm font-bold text-surface transition active:scale-95"
        >
          {t("app.close")}
        </button>
      </div>
    </div>
  );
}
