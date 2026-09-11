"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import {
  addAccount,
  addBudget,
  addDebt,
  addGoal,
  addTransaction,
  addTransactionsBatch,
  updateTransaction,
  copyBudgets,
  deleteAccounts,
  deleteBudgets,
  deleteDebts,
  deleteGoals,
  deleteTransaction,
  deleteTransactions,
  saveFinanceSettings,
  subscribeAccounts,
  subscribeBudgets,
  subscribeDebts,
  subscribeFinanceSettings,
  subscribeGoals,
  subscribeTransactions,
  updateAccount,
  updateBudget,
  updateDebt,
  updateGoal,
} from "@/lib/finance";
import {
  DEFAULT_FINANCE_SETTINGS,
  type Account,
  type Budget,
  type Debt,
  type FinanceSettings,
  type Goal,
  type NewAccount,
  type NewBudget,
  type NewDebt,
  type NewGoal,
  type NewTransaction,
  type Transaction,
} from "@/types/finance";
import { accountBalance, budgetLines, goalsByProgress, unassignedTransactions } from "@/lib/money";
import { addMonths, currentMonthKey, formatMonth } from "@/lib/format";
import TransactionCard from "./components/TransactionCard";
import TransactionForm from "./components/TransactionForm";
import ImportSheet from "./components/ImportSheet";
import OverviewTab from "./components/OverviewTab";
import AccountForm from "./components/AccountForm";
import BudgetForm from "./components/BudgetForm";
import DebtForm from "./components/DebtForm";
import GoalForm from "./components/GoalForm";
import AllocationSheet from "./components/AllocationSheet";
import { AccountCard, BudgetCard, DebtCard, GoalCard } from "./components/MoneyCards";
import { useT } from "@/lib/i18n";
import SelectionBar from "@/components/SelectionBar";
import { useSelection } from "@/lib/useSelection";
import { awardXpInBackground } from "@/lib/gamification";

type Tab = "overview" | "transactions" | "budgets" | "accounts" | "debts" | "goals";

const TABS: Tab[] = ["overview", "transactions", "budgets", "accounts", "debts", "goals"];

type Editing =
  | { kind: "transaction"; item: Transaction | null }
  | { kind: "account"; item: Account | null }
  | { kind: "budget"; item: Budget | null }
  | { kind: "debt"; item: Debt | null }
  | { kind: "goal"; item: Goal | null }
  | { kind: "import" }
  | { kind: "allocation" }
  | null;

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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [settings, setSettings] = useState<FinanceSettings>(DEFAULT_FINANCE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [month, setMonth] = useState(currentMonthKey());
  const [editing, setEditing] = useState<Editing>(null);
  const selection = useSelection();

  useEffect(() => {
    if (!user) return;
    const unsubs = [
      subscribeTransactions(user.uid, (items) => {
        setTransactions(items);
        setLoading(false);
      }),
      subscribeAccounts(user.uid, setAccounts),
      subscribeBudgets(user.uid, setBudgets),
      subscribeDebts(user.uid, setDebts),
      subscribeGoals(user.uid, setGoals),
      subscribeFinanceSettings(user.uid, setSettings),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [user]);

  // Switching tabs while rows are ticked would let a delete hit the wrong list.
  function goTo(next: Tab) {
    selection.stop();
    setTab(next);
  }

  const accountNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const account of accounts) map.set(account.id, account.name);
    return map;
  }, [accounts]);

  const monthBudgets = useMemo(() => budgets.filter((b) => b.month === month), [budgets, month]);
  const monthLines = useMemo(
    () => budgetLines(monthBudgets, transactions),
    [monthBudgets, transactions]
  );
  const goalRows = useMemo(() => goalsByProgress(goals), [goals]);
  const orphans = useMemo(() => unassignedTransactions(transactions), [transactions]);

  const uid = user?.uid;

  async function save<T>(fn: (uid: string) => Promise<T>) {
    if (!uid) return;
    await fn(uid);
  }

  // Deliberately not awaited. Firestore applies the write to its local cache
  // straight away and the snapshot listener re-renders from it, so the row is
  // on screen before the server has even been asked; awaiting only held the
  // sheet open for a round trip. A write that ultimately fails is rolled back
  // out of the cache and the same listener corrects the list.
  function handleAddTransaction(data: NewTransaction) {
    if (!uid) return;
    if (editing?.kind === "transaction" && editing.item) {
      void updateTransaction(uid, editing.item.id, data);
      return;
    }
    void addTransaction(uid, data);
    awardXpInBackground(uid, "transaction");
  }

  const visibleIds = useMemo(() => {
    if (tab === "transactions") return transactions.map((x) => x.id);
    if (tab === "budgets") return monthBudgets.map((x) => x.id);
    if (tab === "accounts") return accounts.map((x) => x.id);
    if (tab === "debts") return debts.map((x) => x.id);
    if (tab === "goals") return goals.map((x) => x.id);
    return [];
  }, [tab, transactions, monthBudgets, accounts, debts, goals]);

  async function handleBulkDelete(ids: string[]) {
    if (!uid) return;
    if (tab === "transactions") await deleteTransactions(uid, ids);
    else if (tab === "budgets") await deleteBudgets(uid, ids);
    else if (tab === "accounts") await deleteAccounts(uid, ids);
    else if (tab === "debts") await deleteDebts(uid, ids);
    else if (tab === "goals") await deleteGoals(uid, ids);
  }

  const rowProps = (id: string) => ({
    selectMode: selection.active,
    selected: selection.isSelected(id),
    onToggleSelect: selection.toggle,
    onLongPress: selection.start,
  });

  return (
    <>
      <TopBar title={t("finance.title")} subtitle={t("finance.subtitle")} />

      <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto px-5">
        {TABS.map((item) => (
          <button
            key={item}
            onClick={() => goTo(item)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
              tab === item ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
            }`}
          >
            {t(`money.tab.${item}`)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-ink" />
        </div>
      )}

      {!loading && tab === "overview" && (
        <div className="mt-4">
          <OverviewTab
            transactions={transactions}
            accounts={accounts}
            budgets={budgets}
            debts={debts}
            goals={goals}
            settings={settings}
            onGoTo={goTo}
          />
          <div className="px-5 pb-6">
            <button
              onClick={() => setEditing({ kind: "allocation" })}
              className="w-full rounded-2xl bg-surface-raised py-3 text-xs font-bold text-ink-muted transition active:scale-95"
            >
              {t("money.editAllocation")}
            </button>
          </div>
        </div>
      )}

      {!loading && tab !== "overview" && (
        <>
          {tab === "budgets" && (
            <div className="mt-4 flex items-center gap-2 px-5">
              <button
                onClick={() => setMonth(addMonths(month, -1))}
                aria-label={t("time.prevMonth")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-ink-muted transition active:scale-90"
              >
                ‹
              </button>
              <p className="min-w-0 flex-1 truncate text-center text-sm font-bold capitalize text-ink">
                {formatMonth(month)}
              </p>
              <button
                onClick={() => setMonth(addMonths(month, 1))}
                aria-label={t("time.nextMonth")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-ink-muted transition active:scale-90"
              >
                ›
              </button>
            </div>
          )}

          <Toolbar
            selection={selection}
            onAdd={() => {
              if (tab === "transactions") setEditing({ kind: "transaction", item: null });
              if (tab === "budgets") setEditing({ kind: "budget", item: null });
              if (tab === "accounts") setEditing({ kind: "account", item: null });
              if (tab === "debts") setEditing({ kind: "debt", item: null });
              if (tab === "goals") setEditing({ kind: "goal", item: null });
            }}
            extra={
              tab === "transactions" ? (
                <button
                  onClick={() => setEditing({ kind: "import" })}
                  className="shrink-0 rounded-full bg-surface-raised px-3.5 py-2 text-xs font-bold text-ink-muted transition active:scale-95"
                >
                  {t("import.button")}
                </button>
              ) : tab === "budgets" && monthBudgets.length === 0 ? (
                <button
                  onClick={() =>
                    save((id) =>
                      copyBudgets(
                        id,
                        budgets.filter((b) => b.month === addMonths(month, -1)),
                        month
                      )
                    )
                  }
                  className="shrink-0 rounded-full bg-surface-raised px-3.5 py-2 text-xs font-bold text-ink-muted transition active:scale-95"
                >
                  {t("money.copyLastMonth")}
                </button>
              ) : null
            }
          />

          <div className="mt-3 flex flex-col gap-2.5 px-5 pb-24">
            {tab === "transactions" &&
              (transactions.length === 0 ? (
                <EmptyState>{t("finance.empty")}</EmptyState>
              ) : (
                transactions.map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    accountName={accountNames.get(tx.accountId) ?? ""}
                    onOpen={(item) => setEditing({ kind: "transaction", item })}
                    onDelete={(id) => save((u) => deleteTransaction(u, id))}
                    {...rowProps(tx.id)}
                  />
                ))
              ))}

            {tab === "budgets" &&
              (monthLines.length === 0 ? (
                <EmptyState>{t("money.noBudgets")}</EmptyState>
              ) : (
                monthLines.map((line) => (
                  <BudgetCard
                    key={line.budget.id}
                    line={line}
                    onOpen={() => setEditing({ kind: "budget", item: line.budget })}
                    {...rowProps(line.budget.id)}
                  />
                ))
              ))}

            {tab === "accounts" && orphans.length > 0 && (
              <button
                onClick={() => goTo("transactions")}
                className="rounded-2xl bg-amber-500/10 p-4 text-left"
              >
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {t("money.unassigned", { count: orphans.length })}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                  {t("money.unassignedHint")}
                </p>
              </button>
            )}

            {tab === "accounts" &&
              (accounts.length === 0 ? (
                <EmptyState>{t("money.noAccounts")}</EmptyState>
              ) : (
                accounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    balance={accountBalance(account, transactions)}
                    onOpen={() => setEditing({ kind: "account", item: account })}
                    {...rowProps(account.id)}
                  />
                ))
              ))}

            {tab === "debts" &&
              (debts.length === 0 ? (
                <EmptyState>{t("money.noDebts")}</EmptyState>
              ) : (
                debts.map((debt) => (
                  <DebtCard
                    key={debt.id}
                    debt={debt}
                    onOpen={() => setEditing({ kind: "debt", item: debt })}
                    {...rowProps(debt.id)}
                  />
                ))
              ))}

            {tab === "goals" &&
              (goalRows.length === 0 ? (
                <EmptyState>{t("money.noGoals")}</EmptyState>
              ) : (
                goalRows.map((progress) => (
                  <GoalCard
                    key={progress.goal.id}
                    progress={progress}
                    onOpen={() => setEditing({ kind: "goal", item: progress.goal })}
                    {...rowProps(progress.goal.id)}
                  />
                ))
              ))}
          </div>

          <SelectionBar selection={selection} allIds={visibleIds} onDelete={handleBulkDelete} />
        </>
      )}

      {editing?.kind === "transaction" && (
        <TransactionForm
          initial={editing.item}
          accounts={accounts}
          onSubmit={handleAddTransaction}
          onDelete={(id) => save((u) => deleteTransaction(u, id))}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.kind === "account" && (
        <AccountForm
          initial={editing.item}
          onSubmit={(data: NewAccount) =>
            save((u) => (editing.item ? updateAccount(u, editing.item.id, data) : addAccount(u, data)))
          }
          onDelete={(id) => save((u) => deleteAccounts(u, [id]))}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.kind === "budget" && (
        <BudgetForm
          initial={editing.item}
          defaultMonth={month}
          takenCategories={monthBudgets.map((b) => b.category)}
          onSubmit={(data: NewBudget) =>
            save((u) => (editing.item ? updateBudget(u, editing.item.id, data) : addBudget(u, data)))
          }
          onDelete={(id) => save((u) => deleteBudgets(u, [id]))}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.kind === "debt" && (
        <DebtForm
          initial={editing.item}
          onSubmit={(data: NewDebt) =>
            save((u) => (editing.item ? updateDebt(u, editing.item.id, data) : addDebt(u, data)))
          }
          onDelete={(id) => save((u) => deleteDebts(u, [id]))}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.kind === "goal" && (
        <GoalForm
          initial={editing.item}
          onSubmit={(data: NewGoal) =>
            save((u) => (editing.item ? updateGoal(u, editing.item.id, data) : addGoal(u, data)))
          }
          onDelete={(id) => save((u) => deleteGoals(u, [id]))}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.kind === "import" && (
        <ImportSheet
          accounts={accounts}
          onImport={(items) => save((u) => addTransactionsBatch(u, items))}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.kind === "allocation" && (
        <AllocationSheet
          settings={settings}
          onSubmit={(patch) => save((u) => saveFinanceSettings(u, patch))}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function Toolbar({
  selection,
  onAdd,
  extra,
}: {
  selection: ReturnType<typeof useSelection>;
  onAdd: () => void;
  extra?: React.ReactNode;
}) {
  const t = useT();
  return (
    <div className="mt-4 flex items-center justify-end gap-2 px-5">
      {extra}
      <button
        onClick={() => (selection.active ? selection.stop() : selection.start())}
        className="shrink-0 rounded-full bg-surface-raised px-3.5 py-2 text-xs font-bold text-ink-muted transition active:scale-95"
      >
        {selection.active ? t("app.cancel") : t("bulk.select")}
      </button>
      <button
        onClick={onAdd}
        className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-bold text-surface transition active:scale-95"
      >
        {t("app.add")}
      </button>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-raised p-8 text-center">
      <p className="text-sm text-ink-muted">{children}</p>
    </div>
  );
}
