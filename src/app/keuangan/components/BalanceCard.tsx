"use client";

import { formatCurrency } from "@/lib/format";

export default function BalanceCard({
  balance,
  income,
  expense,
  monthlyBudget,
  monthSpent,
  onEditBudget,
}: {
  balance: number;
  income: number;
  expense: number;
  monthlyBudget: number;
  monthSpent: number;
  onEditBudget: () => void;
}) {
  const budgetRatio = monthlyBudget > 0 ? Math.min(monthSpent / monthlyBudget, 1) : 0;
  const overBudget = monthlyBudget > 0 && monthSpent > monthlyBudget;

  return (
    <div className="mx-5 rounded-3xl bg-gradient-to-br from-brand-start via-brand-mid to-brand-end p-5 text-white shadow-lg shadow-brand-mid/20">
      <p className="text-xs font-medium text-white/80">Saldo</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{formatCurrency(balance)}</p>

      <div className="mt-4 flex gap-4">
        <div className="flex-1">
          <p className="text-[11px] text-white/75">Pemasukan</p>
          <p className="text-sm font-bold">{formatCurrency(income)}</p>
        </div>
        <div className="flex-1">
          <p className="text-[11px] text-white/75">Pengeluaran</p>
          <p className="text-sm font-bold">{formatCurrency(expense)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-white/85">Budget bulan ini</span>
          <button onClick={onEditBudget} className="text-[11px] font-semibold underline underline-offset-2">
            {monthlyBudget > 0 ? "Ubah" : "Atur"}
          </button>
        </div>
        {monthlyBudget > 0 ? (
          <>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className={`h-full rounded-full transition-all ${overBudget ? "bg-red-300" : "bg-white"}`}
                style={{ width: `${budgetRatio * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-white/80">
              {formatCurrency(monthSpent)} dari {formatCurrency(monthlyBudget)}
              {overBudget ? " — lewat budget" : ""}
            </p>
          </>
        ) : (
          <p className="text-[11px] text-white/80">Belum diatur — tap &quot;Atur&quot; buat mulai tracking.</p>
        )}
      </div>
    </div>
  );
}
