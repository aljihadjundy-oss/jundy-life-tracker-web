"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import {
  addTransaction,
  deleteTransaction,
  setMonthlyBudget,
  subscribeMonthlyBudget,
  subscribeTransactions,
} from "@/lib/finance";
import type { NewTransaction, Transaction } from "@/types/finance";
import { currentMonthKey } from "@/lib/format";
import TransactionCard from "./components/TransactionCard";
import TransactionForm from "./components/TransactionForm";
import BudgetSheet from "./components/BudgetSheet";
import BalanceCard from "./components/BalanceCard";
import { useT } from "@/lib/i18n";
import { awardXp } from "@/lib/gamification";
import { celebrate } from "@/lib/celebrate";

export default function KeuanganPage() {
  return (
    <AppShell>
      <KeuanganContent />
    </AppShell>
  );
}

function KeuanganContent() {
  const { user } = useAuth();
  const t = useT();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyBudget, setMonthlyBudgetState] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showBudgetSheet, setShowBudgetSheet] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubTx = subscribeTransactions(user.uid, (items) => {
      setTransactions(items);
      setLoading(false);
    });
    const unsubBudget = subscribeMonthlyBudget(user.uid, setMonthlyBudgetState);
    return () => {
      unsubTx();
      unsubBudget();
    };
  }, [user]);

  const { balance, income, expense, monthSpent } = useMemo(() => {
    const month = currentMonthKey();
    let income = 0;
    let expense = 0;
    let monthSpent = 0;
    for (const t of transactions) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
      if (t.type === "expense" && t.date.startsWith(month)) monthSpent += t.amount;
    }
    return { balance: income - expense, income, expense, monthSpent };
  }, [transactions]);

  async function handleAdd(data: NewTransaction) {
    if (!user) return;
    await addTransaction(user.uid, data);
    celebrate(await awardXp(user.uid, "transaction"));
  }

  async function handleDelete(id: string) {
    if (!user) return;
    await deleteTransaction(user.uid, id);
  }

  async function handleBudget(amount: number) {
    if (!user) return;
    await setMonthlyBudget(user.uid, amount);
  }

  return (
    <>
      <TopBar title={t("finance.title")} subtitle={t("finance.subtitle")} />

      <BalanceCard
        balance={balance}
        income={income}
        expense={expense}
        monthlyBudget={monthlyBudget}
        monthSpent={monthSpent}
        onEditBudget={() => setShowBudgetSheet(true)}
      />

      <div className="mt-6 flex items-center justify-between px-5">
        <h2 className="text-sm font-bold text-ink">{t("finance.recentTransactions")}</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-xs font-bold text-surface transition active:scale-95"
        >
          {t("app.add")}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2.5 px-5 pb-6">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-ink" />
          </div>
        )}

        {!loading && transactions.length === 0 && (
          <div className="rounded-2xl bg-surface-raised p-8 text-center">
            <p className="text-sm text-ink-muted">{t("finance.empty")}</p>
          </div>
        )}

        {transactions.map((tx) => (
          <TransactionCard key={tx.id} transaction={tx} onDelete={handleDelete} />
        ))}
      </div>

      {showForm && (
        <TransactionForm onSubmit={handleAdd} onClose={() => setShowForm(false)} />
      )}
      {showBudgetSheet && (
        <BudgetSheet
          currentBudget={monthlyBudget}
          onSubmit={handleBudget}
          onClose={() => setShowBudgetSheet(false)}
        />
      )}
    </>
  );
}
