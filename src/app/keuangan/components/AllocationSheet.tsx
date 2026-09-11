"use client";

import { useState } from "react";
import {
  ALLOCATION_PRIORITIES,
  DEFAULT_ALLOCATIONS,
  type Allocation,
  type AllocationPriority,
  type FinanceSettings,
} from "@/types/finance";
import { allocationTotal } from "@/lib/money";
import { formatCurrency } from "@/lib/format";
import { useT } from "@/lib/i18n";
import Sheet, { AmountInput, Field, inputClass } from "./Sheet";

/**
 * The template ships this split as a hand-typed table with fixed Rupiah
 * amounts, which go wrong the moment income changes. Here the percentages are
 * the input and the amounts follow.
 */
export default function AllocationSheet({
  settings,
  onSubmit,
  onClose,
}: {
  settings: FinanceSettings;
  onSubmit: (patch: Partial<FinanceSettings>) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [base, setBase] = useState(String(settings.allocationBase || ""));
  const [rows, setRows] = useState<Allocation[]>(
    settings.allocations.length > 0 ? settings.allocations : DEFAULT_ALLOCATIONS
  );
  const [submitting, setSubmitting] = useState(false);

  const baseValue = Number(base) || 0;
  const total = allocationTotal(rows);

  function update(index: number, patch: Partial<Allocation>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function submit() {
    setSubmitting(true);
    try {
      await onSubmit({ allocationBase: baseValue, allocations: rows });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      title={t("money.allocationPlan")}
      onClose={onClose}
      onSubmit={submit}
      submitting={submitting}
    >
      <Field label={t("money.allocationBase")}>
        <AmountInput value={base} onChange={setBase} />
      </Field>

      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={index} className="rounded-2xl bg-surface-raised p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={row.emoji}
                onChange={(e) => update(index, { emoji: e.target.value.slice(0, 2) })}
                aria-label={t("money.allocationEmoji")}
                className="w-10 shrink-0 rounded-lg border border-border bg-surface-card py-2 text-center text-base outline-none focus:border-ink"
              />
              <input
                type="text"
                value={row.label}
                onChange={(e) => update(index, { label: e.target.value })}
                aria-label={t("money.allocationLabel")}
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface-card px-3 py-2 text-sm text-ink outline-none focus:border-ink"
              />
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                aria-label={t("app.delete")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-red-500/15 hover:text-red-500"
              >
                ×
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={row.percent}
                onChange={(e) => update(index, { percent: Number(e.target.value) || 0 })}
                aria-label={t("money.allocationPercent")}
                className="w-16 shrink-0 rounded-lg border border-border bg-surface-card px-2 py-2 text-sm tabular-nums text-ink outline-none focus:border-ink"
              />
              <span className="shrink-0 text-xs text-ink-muted">%</span>
              <select
                value={row.priority}
                onChange={(e) => update(index, { priority: e.target.value as AllocationPriority })}
                aria-label={t("money.allocationPriorityLabel")}
                className="min-w-0 flex-1 rounded-lg border border-border bg-surface-card px-2 py-2 text-xs text-ink outline-none focus:border-ink"
              >
                {ALLOCATION_PRIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {t(`money.allocationPriority.${value}`)}
                  </option>
                ))}
              </select>
              <span className="w-24 shrink-0 text-right text-[11px] font-bold tabular-nums text-ink">
                {formatCurrency(Math.round((baseValue * row.percent) / 100))}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          setRows((prev) => [...prev, { label: "", emoji: "💡", percent: 0, priority: "medium" }])
        }
        className={`${inputClass} mt-3 text-center font-semibold text-ink-muted`}
      >
        {t("money.addAllocation")}
      </button>

      <p
        className={`mt-3 rounded-xl px-3 py-2.5 text-[11px] ${
          total === 100
            ? "bg-surface-raised text-ink-muted"
            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        }`}
      >
        {total === 100
          ? t("money.allocationBalanced", { amount: formatCurrency(baseValue) })
          : t("money.allocationMismatch", { total })}
      </p>
    </Sheet>
  );
}
