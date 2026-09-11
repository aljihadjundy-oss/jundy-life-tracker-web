import { currentMonthKey } from "./format";
import type {
  Account,
  Allocation,
  Budget,
  BudgetStatus,
  Debt,
  Goal,
  Transaction,
} from "@/types/finance";

/** A transfer just moves money between your own accounts — it is not spending. */
export function isSpending(tx: Transaction) {
  return tx.type === "expense";
}

export function monthOf(isoDate: string) {
  return isoDate.slice(0, 7);
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

/**
 * The live balance of an account: what was counted by hand on `asOf`, plus
 * everything that moved through it since.
 *
 * The template stores Balance as a plain number next to a "Last Update" date,
 * which means the figure is only true on the day you typed it. Keeping the
 * hand-counted figure as a starting point and deriving the rest is what makes
 * "Total Asset" on the dashboard worth looking at.
 */
export function accountBalance(account: Account, transactions: Transaction[]) {
  let balance = account.openingBalance;
  for (const tx of transactions) {
    // Anything dated on or before the count is already inside openingBalance.
    if (account.asOf && tx.date <= account.asOf) continue;
    if (tx.status === "pending") continue;

    if (tx.accountId === account.id) {
      if (tx.type === "income") balance += tx.amount;
      else balance -= tx.amount; // expense, or money leaving on a transfer
    }
    if (tx.type === "transfer" && tx.toAccountId === account.id) {
      balance += tx.amount;
    }
  }
  return balance;
}

export function totalAssets(accounts: Account[], transactions: Transaction[]) {
  return accounts.reduce((sum, account) => sum + accountBalance(account, transactions), 0);
}

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

export type BudgetLine = {
  budget: Budget;
  /** Actual spend — the Sum the template's rollup should have used. */
  actual: number;
  remaining: number;
  status: BudgetStatus;
  /** 0–1, clamped, for the progress bar. */
  ratio: number;
};

/**
 * Mirrors the template's Remaining and Status formulas:
 *   Remaining = Planned - Actual
 *   Status    = Remaining < 0 ? "Over Budget" : Remaining == 0 ? "Limit" : "Safe"
 *
 * Actual is a Sum here. In the shipped template that rollup is set to "Show
 * original", which returns an array and makes Remaining fail with
 * "Cannot do math on number and array" — so Status never renders either.
 */
export function budgetLine(budget: Budget, transactions: Transaction[]): BudgetLine {
  let actual = 0;
  for (const tx of transactions) {
    if (!isSpending(tx)) continue;
    if (tx.category !== budget.category) continue;
    if (monthOf(tx.date) !== budget.month) continue;
    actual += tx.amount;
  }

  const remaining = budget.planned - actual;
  const status: BudgetStatus = remaining < 0 ? "over" : remaining === 0 ? "limit" : "safe";
  const ratio = budget.planned > 0 ? Math.min(actual / budget.planned, 1) : 0;
  return { budget, actual, remaining, status, ratio };
}

export function budgetLines(budgets: Budget[], transactions: Transaction[]) {
  return budgets.map((budget) => budgetLine(budget, transactions));
}

/** Budgets already in the red — the template's "Warning Zone". */
export function overBudget(lines: BudgetLine[]) {
  return lines.filter((line) => line.remaining < 0);
}

// ---------------------------------------------------------------------------
// Debts & goals
// ---------------------------------------------------------------------------

export function totalDebt(debts: Debt[]) {
  return debts
    .filter((debt) => debt.status !== "paid")
    .reduce((sum, debt) => sum + debt.remaining, 0);
}

/** Installments falling due this month, for the monthly review. */
export function monthlyInstallments(debts: Debt[]) {
  return debts
    .filter((debt) => debt.status !== "paid")
    .reduce((sum, debt) => sum + debt.installment, 0);
}

export type GoalProgress = { goal: Goal; ratio: number; remaining: number };

/**
 * Current / Target, guarded. The template divides straight through, which
 * yields 0 when both sides are empty and would blow up on a zero target.
 */
export function goalProgress(goal: Goal): GoalProgress {
  const ratio = goal.targetAmount > 0 ? Math.min(goal.currentAmount / goal.targetAmount, 1) : 0;
  return { goal, ratio, remaining: Math.max(0, goal.targetAmount - goal.currentAmount) };
}

export function goalsByProgress(goals: Goal[]) {
  return goals.map(goalProgress).sort((a, b) => b.ratio - a.ratio);
}

// ---------------------------------------------------------------------------
// Month summary & net worth
// ---------------------------------------------------------------------------

export type MonthSummary = {
  month: string;
  income: number;
  expense: number;
  net: number;
  planned: number;
  actual: number;
  budgetLeft: number;
};

export function monthSummary(
  transactions: Transaction[],
  budgets: Budget[],
  month = currentMonthKey()
): MonthSummary {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (monthOf(tx.date) !== month) continue;
    if (tx.type === "income") income += tx.amount;
    else if (tx.type === "expense") expense += tx.amount;
  }

  const monthBudgets = budgets.filter((budget) => budget.month === month);
  const lines = budgetLines(monthBudgets, transactions);
  const planned = monthBudgets.reduce((sum, budget) => sum + budget.planned, 0);
  const actual = lines.reduce((sum, line) => sum + line.actual, 0);

  return { month, income, expense, net: income - expense, planned, actual, budgetLeft: planned - actual };
}

export type NetWorth = { assets: number; debt: number; net: number };

export function netWorth(
  accounts: Account[],
  transactions: Transaction[],
  debts: Debt[]
): NetWorth {
  const assets = totalAssets(accounts, transactions);
  const debt = totalDebt(debts);
  return { assets, debt, net: assets - debt };
}

// ---------------------------------------------------------------------------
// Allocation plan
// ---------------------------------------------------------------------------

export type AllocationLine = Allocation & { amount: number };

export function allocationLines(allocations: Allocation[], base: number): AllocationLine[] {
  return allocations.map((allocation) => ({
    ...allocation,
    amount: Math.round((base * allocation.percent) / 100),
  }));
}

export function allocationTotal(allocations: Allocation[]) {
  return allocations.reduce((sum, allocation) => sum + allocation.percent, 0);
}

// ---------------------------------------------------------------------------
// Spending breakdowns
// ---------------------------------------------------------------------------

export type CategorySpend = { category: string; amount: number; ratio: number };

export function spendByCategory(transactions: Transaction[], month: string): CategorySpend[] {
  const totals = new Map<string, number>();
  let grand = 0;
  for (const tx of transactions) {
    if (!isSpending(tx) || monthOf(tx.date) !== month) continue;
    totals.set(tx.category, (totals.get(tx.category) ?? 0) + tx.amount);
    grand += tx.amount;
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount, ratio: grand > 0 ? amount / grand : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

/** Need vs want split, the point of the template's Need/Want flag. */
export function needWantSplit(transactions: Transaction[], month: string) {
  let need = 0;
  let want = 0;
  let untagged = 0;
  for (const tx of transactions) {
    if (!isSpending(tx) || monthOf(tx.date) !== month) continue;
    if (tx.needWant === "need") need += tx.amount;
    else if (tx.needWant === "want") want += tx.amount;
    else untagged += tx.amount;
  }
  return { need, want, untagged, total: need + want + untagged };
}
