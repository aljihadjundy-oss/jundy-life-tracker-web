"use client";

import { useMemo } from "react";
import { STATUS_ORDER, TASK_COLOR, type Task, type TaskStatus } from "@/types/waktu";
import { breakdown, opsStats, type Breakdown } from "@/lib/ops";
import { useT } from "@/lib/i18n";
import { formatDate, todayISO } from "@/lib/format";

/**
 * Full-screen read-only rollup — the shareable half of the ops tracker. It
 * prints cleanly, which is how the original exported a PDF.
 */
export default function OverviewSheet({
  tasks,
  strikes,
  onClose,
}: {
  tasks: Task[];
  strikes: Record<string, number>;
  onClose: () => void;
}) {
  const t = useT();
  const stats = useMemo(() => opsStats(tasks), [tasks]);
  const byUnit = useMemo(() => breakdown(tasks, "unit", t("ops.noUnit")), [tasks, t]);
  const byOwner = useMemo(
    () => breakdown(tasks.filter((task) => task.owner), "owner", t("ops.noOwner")),
    [tasks, t]
  );

  const alerts = useMemo(() => {
    const strikeRows = Object.entries(strikes)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    return {
      strikeRows,
      ghosted: tasks.filter((task) => task.status === "ghosted"),
      blocked: tasks.filter((task) => task.status === "blocked"),
    };
  }, [tasks, strikes]);

  const anyAlert =
    alerts.strikeRows.length > 0 || alerts.ghosted.length > 0 || alerts.blocked.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-surface">
      <div className="mx-auto max-w-md px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-ink">{t("ops.overview")}</h1>
            <p className="mt-0.5 text-xs text-ink-muted">
              {t("ops.overviewAsOf", { date: formatDate(todayISO()) })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-bold text-surface transition active:scale-95"
          >
            {t("app.close")}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <Kpi value={stats.total} label={t("ops.statTotal")} tone="text-ink" />
          <Kpi value={stats.open} label={t("ops.statOpen")} tone="text-accent-time" />
          <Kpi value={stats.done} label={t("ops.statDone")} tone="text-accent-finance" />
          <Kpi value={stats.blocked} label={t("status.blocked")} tone="text-amber-500" />
          <Kpi value={stats.ghosted} label={t("status.ghosted")} tone="text-red-500" />
          <Kpi
            value={alerts.strikeRows.length}
            label={t("ops.statStrikes")}
            tone="text-red-500"
          />
        </div>

        <Card title={t("ops.statusSplit")}>
          <Donut counts={stats.byStatus} total={stats.total} emptyLabel={t("ops.noData")} />
        </Card>

        <Card title={t("ops.completionRate")}>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-accent-finance">
              {stats.completionRate}%
            </span>
            <span className="text-xs text-ink-muted">
              {t("ops.doneOfTotal", { done: stats.done, total: stats.total })}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full bg-accent-finance"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            {t("ops.openSummary", {
              open: stats.open,
              blocked: stats.blocked,
              ghosted: stats.ghosted,
            })}
          </p>
        </Card>

        <Card title={t("ops.perUnit")}>
          <Bars rows={byUnit} emptyLabel={t("ops.noData")} />
        </Card>

        <Card title={t("ops.perOwner")}>
          <Bars rows={byOwner} emptyLabel={t("ops.noData")} />
        </Card>

        <Card title={t("ops.needsAttention")}>
          {!anyAlert && <p className="text-xs text-ink-muted">{t("ops.allClear")}</p>}

          {alerts.strikeRows.map(([owner, count]) => (
            <AlertRow
              key={`s-${owner}`}
              tag={count >= 3 ? t("ops.cutoff") : t("ops.strikeN", { count })}
              tone={count >= 3 ? "bg-red-500/15 text-red-500" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"}
              label={owner}
              meta={t("category.task.delegation")}
            />
          ))}
          {alerts.ghosted.map((task) => (
            <AlertRow
              key={`g-${task.id}`}
              tag={t("status.ghosted")}
              tone="bg-red-500/15 text-red-500"
              label={task.title}
              meta={task.owner || "—"}
            />
          ))}
          {alerts.blocked.map((task) => (
            <AlertRow
              key={`b-${task.id}`}
              tag={t("status.blocked")}
              tone="bg-amber-500/15 text-amber-600 dark:text-amber-400"
              label={task.title}
              meta={task.owner || "—"}
            />
          ))}
        </Card>
      </div>
    </div>
  );
}

function Kpi({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-surface-card p-3 ring-1 ring-border/60">
      <p className={`text-2xl font-extrabold tracking-tight tabular-nums ${tone}`}>{value}</p>
      <p className="mt-0.5 text-[10px] font-medium leading-tight text-ink-muted">{label}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl bg-surface-card p-4 ring-1 ring-border/60">
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-muted">{title}</h2>
      {children}
    </section>
  );
}

function Donut({
  counts,
  total,
  emptyLabel,
}: {
  counts: Record<TaskStatus, number>;
  total: number;
  emptyLabel: string;
}) {
  const t = useT();
  if (total === 0) return <p className="text-xs text-ink-muted">{emptyLabel}</p>;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // Arc lengths and their running offsets are worked out up front so the JSX
  // below stays a pure map.
  const arcs: { status: TaskStatus; length: number; offset: number }[] = [];
  let cursor = 0;
  for (const status of STATUS_ORDER) {
    const value = counts[status];
    if (value === 0) continue;
    const length = (value / total) * circumference;
    arcs.push({ status, length, offset: cursor });
    cursor += length;
  }

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 130 130" className="h-[110px] w-[110px] shrink-0">
        {arcs.map(({ status, length, offset }) => (
          <circle
            key={status}
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke={TASK_COLOR[status]}
            strokeWidth="18"
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 65 65)"
          />
        ))}
        <text x="65" y="62" textAnchor="middle" fontSize="22" fontWeight="800" fill="currentColor" className="text-ink">
          {total}
        </text>
        <text x="65" y="80" textAnchor="middle" fontSize="10" fill="currentColor" className="text-ink-muted">
          TASK
        </text>
      </svg>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {STATUS_ORDER.filter((status) => counts[status] > 0).map((status) => (
          <div key={status} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: TASK_COLOR[status] }}
            />
            <span className="min-w-0 flex-1 truncate text-ink">{t(`status.${status}`)}</span>
            <span className="shrink-0 font-bold tabular-nums text-ink-muted">{counts[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bars({ rows, emptyLabel }: { rows: Breakdown[]; emptyLabel: string }) {
  const t = useT();
  if (rows.length === 0) return <p className="text-xs text-ink-muted">{emptyLabel}</p>;

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span className="min-w-0 truncate font-semibold text-ink">{row.key}</span>
            <span className="shrink-0 text-ink-muted">
              {t("ops.groupCount", { done: row.done, total: row.total })}
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-surface-raised">
            {STATUS_ORDER.map((status) => {
              const value = row.byStatus[status];
              if (value === 0) return null;
              return (
                <div
                  key={status}
                  style={{ width: `${(value / row.total) * 100}%`, background: TASK_COLOR[status] }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertRow({
  tag,
  tone,
  label,
  meta,
}: {
  tag: string;
  tone: string;
  label: string;
  meta: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border/60 py-2 last:border-none">
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}>{tag}</span>
      <span className="min-w-0 flex-1 truncate text-xs text-ink">{label}</span>
      <span className="shrink-0 text-[11px] text-ink-muted">{meta}</span>
    </div>
  );
}
