"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES, type Budget, type NewBudget } from "@/types/finance";
import { currentMonthKey, formatMonth, addMonths } from "@/lib/format";
import { useT } from "@/lib/i18n";
import Sheet, { AmountInput, Field, inputClass } from "./Sheet";

/** Twelve months around today, so a plan can be set ahead or backfilled. */
function monthOptions() {
  const base = currentMonthKey();
  return Array.from({ length: 15 }, (_, i) => addMonths(base, i - 3));
}

export default function BudgetForm({
  initial,
  defaultMonth,
  takenCategories,
  onSubmit,
  onDelete,
  onClose,
}: {
  initial?: Budget | null;
  defaultMonth: string;
  /** Categories that already have a budget this month — one row each. */
  takenCategories: string[];
  onSubmit: (data: NewBudget) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [month, setMonth] = useState(initial?.month ?? defaultMonth);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [planned, setPlanned] = useState(initial ? String(initial.planned) : "");
  const [submitting, setSubmitting] = useState(false);

  const available = EXPENSE_CATEGORIES.filter(
    (c) => c === initial?.category || !takenCategories.includes(c)
  );

  async function submit() {
    if (!category) return;
    setSubmitting(true);
    try {
      await onSubmit({ month, category, planned: Number(planned) || 0 });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      title={initial ? t("money.editBudget") : t("money.newBudget")}
      onClose={onClose}
      onSubmit={submit}
      submitting={submitting}
      onDelete={
        initial && onDelete
          ? async () => {
              await onDelete(initial.id);
              onClose();
            }
          : undefined
      }
    >
      <Field label={t("money.month")}>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={`${inputClass} capitalize`}
        >
          {monthOptions().map((option) => (
            <option key={option} value={option}>
              {formatMonth(option)}
            </option>
          ))}
        </select>
      </Field>

      <div className="mb-4">
        <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("finance.category")}</span>
        <div className="flex flex-wrap gap-2">
          {available.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCategory(option)}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                category === option ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
              }`}
            >
              {t(`category.${option}`)}
            </button>
          ))}
        </div>
        {available.length === 0 && (
          <p className="text-xs text-ink-muted">{t("money.allCategoriesBudgeted")}</p>
        )}
      </div>

      <Field label={t("money.planned")}>
        <AmountInput value={planned} onChange={setPlanned} />
      </Field>
    </Sheet>
  );
}
