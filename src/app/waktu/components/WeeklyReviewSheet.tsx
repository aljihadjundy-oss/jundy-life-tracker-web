"use client";

import { useMemo } from "react";
import type { Task } from "@/types/waktu";
import { MAX_STRIKES } from "@/types/waktu";
import { weeklyReview } from "@/lib/ops";
import { formatDate, toISODate } from "@/lib/format";
import { useT } from "@/lib/i18n";

export default function WeeklyReviewSheet({
  tasks,
  strikes,
  onClose,
}: {
  tasks: Task[];
  strikes: Record<string, number>;
  onClose: () => void;
}) {
  const t = useT();
  const noUnit = t("ops.noUnit");
  const review = useMemo(() => weeklyReview(tasks, noUnit), [tasks, noUnit]);

  const strikeRows = Object.entries(strikes).filter(([, count]) => count > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_0.25s_ease-out]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        <h2 className="text-base font-extrabold text-ink">{t("ops.weeklyReview")}</h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          {formatDate(toISODate(new Date(review.from)))} — {formatDate(toISODate(new Date(review.to)))}
        </p>

        <Section title={t("ops.completionRate")}>
          <Row>
            {/* A week with no new tasks has no rate to report — showing 0%
                alongside finished work reads as a failure that didn't happen. */}
            {review.created === 0 ? (
              t("ops.reviewNoneCreated", { done: review.completed })
            ) : (
              <>
                <strong className="text-ink">{review.rate}%</strong>{" "}
                {t("ops.reviewRate", { done: review.completed, created: review.created })}
              </>
            )}
          </Row>
        </Section>

        <Section title={t("ops.perUnit")}>
          {review.units.length === 0 && <Row>{t("ops.noData")}</Row>}
          {review.units.map((unit) => (
            <Row key={unit.key}>
              <strong className="text-ink">{unit.key}</strong>:{" "}
              {t("ops.groupCount", { done: unit.done, total: unit.total })}
            </Row>
          ))}
        </Section>

        <Section title={t("ops.strikesSection")}>
          {strikeRows.length === 0 && <Row>{t("ops.noStrikes")}</Row>}
          {strikeRows.map(([owner, count]) => (
            <Row key={owner}>
              {owner} — {t("ops.strikeN", { count })}
              {count >= MAX_STRIKES ? ` (${t("ops.cutoff")})` : ""}
            </Row>
          ))}
        </Section>

        <Section title={t("ops.bottleneck")}>
          {review.bottlenecks.length === 0 && <Row>{t("ops.noBottleneck")}</Row>}
          {review.bottlenecks.map((task) => (
            <Row key={task.id}>
              <strong className="text-ink">{task.title}</strong> — {task.owner || t("ops.noOwner")} (
              {t(`status.${task.status}`)}, {formatDate(toISODate(new Date(task.createdAt)))})
            </Row>
          ))}
        </Section>

        <button
          onClick={onClose}
          className="mt-2 w-full rounded-2xl bg-ink py-3.5 text-sm font-bold text-surface transition active:scale-95"
        >
          {t("app.close")}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">{title}</h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-surface-raised px-3 py-2 text-xs leading-relaxed text-ink-muted">
      {children}
    </p>
  );
}
