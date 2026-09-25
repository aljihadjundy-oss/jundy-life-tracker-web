"use client";

import { useState } from "react";
import { categoryLabel, type RecurringTransaction, type Transaction } from "@/types/finance";
import { formatCurrency, currentMonthKey } from "@/lib/format";
import { useT } from "@/lib/i18n";

/**
 * "Rutin" templates — the thing the old `fixed` checkbox implied but never
 * did. Each template can be one-tap logged for the current month instead of
 * re-typed from scratch; this shows which ones already have this month's
 * entry (matched by recurringId) and which are still waiting.
 */
export default function RecurringSection({
  items,
  transactions,
  onLog,
  onDelete,
  onAdd,
}: {
  items: RecurringTransaction[];
  transactions: Transaction[];
  onLog: (item: RecurringTransaction) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const t = useT();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const month = currentMonthKey();
  const loggedIds = new Set(
    transactions.filter((tx) => tx.recurringId && tx.date.slice(0, 7) === month).map((tx) => tx.recurringId)
  );

  if (items.length === 0) {
    return (
      <button
        onClick={onAdd}
        className="mb-2.5 w-full rounded-2xl bg-surface-raised p-4 text-left text-xs font-semibold text-ink-muted"
      >
        + {t("money.newRecurring")}
      </button>
    );
  }

  return (
    <div className="mb-2.5 rounded-2xl bg-surface-card p-4 ring-1 ring-border/60">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
          {t("money.recurringThisMonth")}
        </h2>
        <button onClick={onAdd} className="text-[11px] font-semibold text-accent-time">
          + {t("app.add")}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const done = loggedIds.has(item.id);
          return (
            <div key={item.id} className="flex items-center gap-2 border-b border-border/60 py-2 last:border-none">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-ink">{item.name}</p>
                <p className="truncate text-[10px] text-ink-muted">
                  {categoryLabel(item.category, t)} · {formatCurrency(item.amount)}
                </p>
              </div>
              {done ? (
                <span className="shrink-0 rounded-full bg-accent-finance/15 px-2.5 py-1.5 text-[10px] font-bold text-accent-finance">
                  ✓ {t("money.loggedThisMonth")}
                </span>
              ) : (
                <button
                  onClick={() => onLog(item)}
                  className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-[10px] font-bold text-surface transition active:scale-95"
                >
                  {t("money.logNow")}
                </button>
              )}
              {confirmingId === item.id ? (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => {
                      onDelete(item.id);
                      setConfirmingId(null);
                    }}
                    className="text-[10px] font-semibold text-red-500"
                  >
                    {t("app.delete")}
                  </button>
                  <button onClick={() => setConfirmingId(null)} className="text-[10px] text-ink-muted">
                    {t("app.cancel")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingId(item.id)}
                  aria-label={t("app.delete")}
                  className="shrink-0 text-ink-muted/70 hover:text-red-500"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
