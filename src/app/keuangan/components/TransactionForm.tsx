"use client";

import { useState } from "react";
import type { NewTransaction, TransactionType } from "@/types/finance";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/types/finance";
import { todayISO } from "@/lib/format";

export default function TransactionForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: NewTransaction) => Promise<void>;
  onClose: () => void;
}) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function switchType(next: TransactionType) {
    setType(next);
    setCategory(next === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;

    setSubmitting(true);
    try {
      await onSubmit({ type, amount: numericAmount, category, note: note.trim(), date });
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

        <div className="mb-4 flex rounded-xl bg-surface-raised p-1">
          <button
            type="button"
            onClick={() => switchType("expense")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              type === "expense" ? "bg-surface-card text-ink shadow-sm" : "text-ink-muted"
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => switchType("income")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              type === "income" ? "bg-surface-card text-ink shadow-sm" : "text-ink-muted"
            }`}
          >
            Pemasukan
          </button>
        </div>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Jumlah (Rp)</span>
          <input
            type="number"
            inputMode="numeric"
            required
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-lg font-semibold text-ink outline-none focus:border-ink"
          />
        </label>

        <div className="mb-4">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Kategori</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  category === c
                    ? "bg-ink text-surface"
                    : "bg-surface-raised text-ink-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Tanggal</span>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-ink outline-none focus:border-ink"
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Catatan (opsional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="mis. makan siang tim"
            className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-ink outline-none focus:border-ink"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-ink py-4 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-50"
        >
          {submitting ? "Menyimpan..." : "Simpan Transaksi"}
        </button>
      </form>
    </div>
  );
}
