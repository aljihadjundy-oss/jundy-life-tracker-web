"use client";

import { useState } from "react";
import type { Transaction } from "@/types/finance";
import { formatCurrency } from "@/lib/format";
import { useT } from "@/lib/i18n";
import SelectCheckbox from "@/components/SelectCheckbox";
import { useLongPress } from "@/lib/useLongPress";

const CATEGORY_EMOJI: Record<string, string> = {
  Makan: "🍜",
  Transport: "🚗",
  Belanja: "🛍️",
  Tagihan: "🧾",
  Hiburan: "🎬",
  Kesehatan: "💊",
  Pendidikan: "📚",
  Gaji: "💼",
  Bonus: "🎁",
  Investasi: "📈",
  Hadiah: "🎀",
  Lainnya: "✨",
  "Kos / kontrakan": "🏠",
  Hutang: "🧧",
  Rokok: "🚬",
  Freelance: "💻",
};

export default function TransactionCard({
  transaction,
  accountName,
  onOpen,
  onDelete,
  selectMode,
  selected,
  onToggleSelect,
  onLongPress,
}: {
  transaction: Transaction;
  /** Name of the account it moved through, "" when unassigned. */
  accountName: string;
  onOpen: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onLongPress: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const t = useT();
  const longPress = useLongPress(() => onLongPress(transaction.id), !selectMode);
  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";

  return (
    <div
      {...longPress}
      onClick={() => selectMode && onToggleSelect(transaction.id)}
      className={`flex items-center gap-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 transition ${
        selected ? "ring-2 ring-accent-finance" : "ring-border/60"
      }`}
    >
      {selectMode ? (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
          <SelectCheckbox checked={selected} />
        </div>
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-raised text-lg">
          {isTransfer ? "⇄" : (CATEGORY_EMOJI[transaction.category] ?? "✨")}
        </div>
      )}

      <button
        onClick={() => (selectMode ? onToggleSelect(transaction.id) : onOpen(transaction))}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-sm font-semibold text-ink">
          {t(`category.${transaction.category}`)}
        </p>
        <p className="truncate text-xs text-ink-muted">
          {transaction.note || t("finance.noNote")}
          {accountName ? ` · ${accountName}` : ""}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {transaction.needWant && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                transaction.needWant === "need"
                  ? "bg-accent-finance/15 text-accent-finance"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              }`}
            >
              {t(`money.needWant.${transaction.needWant}`)}
            </span>
          )}
          {transaction.fixed && (
            <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-semibold text-ink-muted">
              {t("money.fixed")}
            </span>
          )}
          {transaction.status === "pending" && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              {t("money.status.pending")}
            </span>
          )}
        </div>
      </button>

      <div className="flex flex-col items-end gap-1">
        <span
          className={`text-sm font-bold ${
            isIncome ? "text-accent-finance" : isTransfer ? "text-accent-time" : "text-ink"
          }`}
        >
          {isIncome ? "+" : isTransfer ? "⇄ " : "−"}
          {formatCurrency(transaction.amount)}
        </span>
        {selectMode ? null : confirming ? (
          <div className="flex gap-2">
            <button
              onClick={() => onDelete(transaction.id)}
              className="text-[11px] font-semibold text-red-500"
            >
              {t("app.delete")}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-[11px] font-medium text-ink-muted"
            >
              {t("app.cancel")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-[11px] font-medium text-ink-muted underline-offset-2 hover:underline"
          >
            {t("app.delete")}
          </button>
        )}
      </div>
    </div>
  );
}
