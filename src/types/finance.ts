export type TransactionType = "income" | "expense" | "transfer";

export const TRANSACTION_TYPES: TransactionType[] = ["income", "expense", "transfer"];

/** Need vs want, the template's spending-discipline flag. "" = not tagged. */
export type NeedWant = "" | "need" | "want";

export type TransactionStatus = "done" | "pending";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO date (yyyy-mm-dd)
  /** Account the money left from (expense/transfer) or landed in (income). */
  accountId: string;
  /** Destination account — transfers only. */
  toAccountId: string;
  needWant: NeedWant;
  /** A recurring commitment rather than a one-off. Set by hand, or true when
   * logged from a RecurringTransaction template — either way it is just a
   * display tag; nothing regenerates this row automatically next month. */
  fixed: boolean;
  status: TransactionStatus;
  /** Set when this row is a contribution logged from GoalCard — "" otherwise. */
  goalId: string;
  /** Set when this row is an installment logged from DebtCard — "" otherwise. */
  debtId: string;
  /** Set when this row was one-tap logged from a RecurringTransaction template. */
  recurringId: string;
  createdAt: number; // epoch millis
};

export type NewTransaction = Omit<Transaction, "id" | "createdAt">;

// Categories are stored as these exact Indonesian strings — they are the
// canonical keys in Firestore, and translation is display-only, so data written
// by an earlier version stays readable. The list is the union of what this app
// already used and what the Money HQ template defines; nothing was dropped.
export const EXPENSE_CATEGORIES = [
  "Makan",
  "Transport",
  "Kos / kontrakan",
  "Belanja",
  "Tagihan",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Hutang",
  "Tabungan",
  "Rokok",
  "Lainnya",
] as const;

export const INCOME_CATEGORIES = [
  "Gaji",
  "Freelance",
  "Bonus",
  "Investasi",
  "Hadiah",
  "Lainnya",
] as const;

export const TRANSFER_CATEGORY = "Transfer antar rekening";

export function categoriesFor(type: TransactionType): readonly string[] {
  if (type === "income") return INCOME_CATEGORIES;
  if (type === "transfer") return [TRANSFER_CATEGORY];
  return EXPENSE_CATEGORIES;
}

/** Every category with a real `category.<name>` translation — a custom
 * category typed in by a user isn't in here, so it renders as-is instead of
 * through t(), which would otherwise show the raw, untranslated key. */
const KNOWN_CATEGORIES = new Set<string>([
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
  TRANSFER_CATEGORY,
]);

export function categoryLabel(category: string, t: (key: string) => string): string {
  return KNOWN_CATEGORIES.has(category) ? t(`category.${category}`) : category;
}

// ---------------------------------------------------------------------------
// Category groups — a rollup layer above the flat category list, so
// spending can be read as "essential vs lifestyle vs debt/savings" without
// making every transaction entry pick a group by hand.
// ---------------------------------------------------------------------------

export type CategoryGroup = "essential" | "lifestyle" | "debtSavings" | "other";

export const CATEGORY_GROUPS: CategoryGroup[] = ["essential", "lifestyle", "debtSavings", "other"];

/** Every built-in expense category's group — fixed, not user-editable, same
 * reasoning as EXPENSE_CATEGORIES itself being a canonical list. */
const BUILTIN_CATEGORY_GROUPS: Record<string, CategoryGroup> = {
  Makan: "essential",
  Transport: "essential",
  "Kos / kontrakan": "essential",
  Belanja: "lifestyle",
  Tagihan: "essential",
  Hiburan: "lifestyle",
  Kesehatan: "essential",
  Pendidikan: "essential",
  Hutang: "debtSavings",
  Tabungan: "debtSavings",
  Rokok: "lifestyle",
  Lainnya: "other",
};

/**
 * Which group a category rolls up into. Built-ins are fixed; a custom
 * category defaults to "other" until the user assigns one (done once, when
 * they create it — see TransactionForm's "+ Kategori baru" flow), not
 * re-asked on every transaction.
 */
export function categoryGroupOf(
  category: string,
  customGroups: Record<string, CategoryGroup>
): CategoryGroup {
  return BUILTIN_CATEGORY_GROUPS[category] ?? customGroups[category] ?? "other";
}

// ---------------------------------------------------------------------------
// Accounts (template's "Assets")
// ---------------------------------------------------------------------------

export type AccountType = "cash" | "bank" | "ewallet" | "investment" | "emoney";

export const ACCOUNT_TYPES: AccountType[] = ["cash", "bank", "ewallet", "investment", "emoney"];

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  /**
   * The balance as counted by hand on `asOf`. The figure shown in the app adds
   * every transaction dated after that, so the total stays live instead of
   * going stale the moment you spend something — see lib/money.ts.
   */
  openingBalance: number;
  asOf: string; // ISO date
  note: string;
  createdAt: number;
};

export type NewAccount = Omit<Account, "id" | "createdAt">;

// ---------------------------------------------------------------------------
// Budgets — one row per month per category
// ---------------------------------------------------------------------------

export type Budget = {
  id: string;
  month: string; // "yyyy-mm"
  category: string;
  planned: number;
  createdAt: number;
};

export type NewBudget = Omit<Budget, "id" | "createdAt">;

/** Mirrors the template's Status formula over Remaining. */
export type BudgetStatus = "safe" | "limit" | "over";

// ---------------------------------------------------------------------------
// Debts
// ---------------------------------------------------------------------------

export type DebtStatus = "active" | "paid" | "late";

export const DEBT_STATUSES: DebtStatus[] = ["active", "paid", "late"];

export type Debt = {
  id: string;
  name: string;
  creditor: string;
  principal: number;
  /** What is still owed. Falls back to principal when left blank. */
  remaining: number;
  installment: number;
  dueDate: string; // ISO date, "" when open-ended
  /** Annual interest, percent. 0 for an interest-free family loan. */
  interest: number;
  note: string;
  status: DebtStatus;
  createdAt: number;
};

export type NewDebt = Omit<Debt, "id" | "createdAt">;

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export type GoalPriority = "high" | "medium" | "low";
export type GoalType = "emergency" | "travel" | "investment" | "purchase";

export const GOAL_PRIORITIES: GoalPriority[] = ["high", "medium", "low"];
export const GOAL_TYPES: GoalType[] = ["emergency", "travel", "investment", "purchase"];

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO date, "" when open-ended
  priority: GoalPriority;
  type: GoalType;
  createdAt: number;
};

export type NewGoal = Omit<Goal, "id" | "createdAt">;

// ---------------------------------------------------------------------------
// Allocation plan — the template's static percentage table, made editable
// ---------------------------------------------------------------------------

export type AllocationPriority = "veryHigh" | "high" | "medium" | "low";

export const ALLOCATION_PRIORITIES: AllocationPriority[] = ["veryHigh", "high", "medium", "low"];

export type Allocation = {
  /** Free text so the plan isn't tied to the transaction category list. */
  label: string;
  emoji: string;
  percent: number;
  priority: AllocationPriority;
};

export type FinanceSettings = {
  /** Legacy single-number budget, kept so old data still renders. */
  monthlyBudget: number;
  /** Monthly take-home the percentages are applied to. */
  allocationBase: number;
  allocations: Allocation[];
  /**
   * Expense categories the user typed in themselves, beyond the fixed
   * EXPENSE_CATEGORIES list — that list is the app's canonical Firestore
   * keys, so this stays a separate, freely-editable add-on instead of
   * changing what those keys mean.
   */
  customCategories: string[];
  /** Group assignment for custom categories only — built-ins are fixed
   * (see BUILTIN_CATEGORY_GROUPS), keyed by the custom category's name. */
  categoryGroups: Record<string, CategoryGroup>;
};

/** The template's own split, used until the user edits it. */
export const DEFAULT_ALLOCATIONS: Allocation[] = [
  { label: "Bayar Hutang", emoji: "📗", percent: 30, priority: "veryHigh" },
  { label: "Kebutuhan Bulanan", emoji: "🛒", percent: 35, priority: "veryHigh" },
  { label: "Emergency Fund", emoji: "🚨", percent: 15, priority: "high" },
  { label: "Investasi", emoji: "📈", percent: 10, priority: "medium" },
  { label: "Hiburan", emoji: "🎉", percent: 10, priority: "low" },
];

export const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
  monthlyBudget: 0,
  allocationBase: 0,
  allocations: DEFAULT_ALLOCATIONS,
  customCategories: [],
  categoryGroups: {},
};

// ---------------------------------------------------------------------------
// Recurring transaction templates — the thing "fixed" on a Transaction used
// to promise but never did: a saved bill/income you can log again with one
// tap each month instead of re-typing it from scratch.
// ---------------------------------------------------------------------------

export type RecurringTransaction = {
  id: string;
  name: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  /** "" = not tied to a specific account. */
  accountId: string;
  createdAt: number;
};

export type NewRecurringTransaction = Omit<RecurringTransaction, "id" | "createdAt">;
