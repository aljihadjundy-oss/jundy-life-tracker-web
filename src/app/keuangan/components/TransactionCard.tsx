"use client";

import { useState } from "react";
import type { Transaction } from "@/types/finance";
import { formatCurrency } from "@/lib/format";
import { useT } from "@/lib/i18n";

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
};

export default function TransactionCard({
  transaction,
  onDelete,
}: {
  transaction: Transaction;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const t = useT();
  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-raised text-lg">
        {CATEGORY_EMOJI[transaction.category] ?? "✨"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{t(`category.${transaction.category}`)}</p>
        <p className="truncate text-xs text-ink-muted">
          {transaction.note || t("finance.noNote")}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className={`text-sm font-bold ${isIncome ? "text-accent-finance" : "text-ink"}`}>
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </span>
        {confirming ? (
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
