"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";

export default function BudgetSheet({
  currentBudget,
  onSubmit,
  onClose,
}: {
  currentBudget: number;
  onSubmit: (amount: number) => Promise<void>;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(currentBudget ? String(currentBudget) : "");
  const [submitting, setSubmitting] = useState(false);
  const t = useT();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(Number(amount) || 0);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_0.25s_ease-out]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        <h2 className="mb-1 text-base font-bold text-ink">{t("finance.monthlyBudget")}</h2>
<p className="mb-4 text-xs text-ink-muted">{t("finance.budgetHint")}</p>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="mb-5 w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-lg font-semibold text-ink outline-none focus:border-ink"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-ink py-4 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-50"
        >
          {submitting ? t("app.saving") : t("finance.saveBudget")}
        </button>
      </form>
    </div>
  );
}
