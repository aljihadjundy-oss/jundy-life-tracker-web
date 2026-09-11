"use client";

import type { Account, Debt, GoalPriority } from "@/types/finance";
import type { BudgetLine, GoalProgress } from "@/lib/money";
import { formatCurrency, formatDate, formatMonth, todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n";
import SelectCheckbox from "@/components/SelectCheckbox";
import { useLongPress } from "@/lib/useLongPress";

/** Shared row chrome: selection tick, long-press, ring when picked. */
function Row({
  id,
  selectMode,
  selected,
  onToggleSelect,
  onLongPress,
  onOpen,
  ring,
  children,
}: {
  id: string;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onLongPress: (id: string) => void;
  onOpen: () => void;
  ring: string;
  children: React.ReactNode;
}) {
  const t = useT();
  const longPress = useLongPress(() => onLongPress(id), !selectMode);

  return (
    <div
      {...longPress}
      className={`flex items-start gap-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 transition ${
        selected ? `ring-2 ${ring}` : "ring-border/60"
      }`}
    >
      {selectMode && (
        <button
          onClick={() => onToggleSelect(id)}
          aria-label={t("bulk.select")}
          className="mt-0.5 shrink-0"
        >
          <SelectCheckbox checked={selected} />
        </button>
      )}
      <button
        onClick={() => (selectMode ? onToggleSelect(id) : onOpen())}
        className="min-w-0 flex-1 text-left"
      >
        {children}
      </button>
    </div>
  );
}

const ACCOUNT_EMOJI: Record<string, string> = {
  cash: "💵",
  bank: "🏦",
  ewallet: "📱",
  investment: "📈",
  emoney: "💳",
};

export function AccountCard({
  account,
  balance,
  ...row
}: {
  account: Account;
  balance: number;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onLongPress: (id: string) => void;
  onOpen: () => void;
}) {
  const t = useT();
  return (
    <Row id={account.id} ring="ring-accent-finance" {...row}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-raised text-lg">
          {ACCOUNT_EMOJI[account.type] ?? "💰"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{account.name}</p>
          <p className="truncate text-[11px] text-ink-muted">
            {t(`money.accountType.${account.type}`)}
            {account.asOf ? ` · ${t("money.since", { date: formatDate(account.asOf) })}` : ""}
          </p>
        </div>
        <span
          className={`shrink-0 text-sm font-bold tabular-nums ${
            balance < 0 ? "text-red-500" : "text-ink"
          }`}
        >
          {formatCurrency(balance)}
        </span>
      </div>
    </Row>
  );
}

const BUDGET_TONE: Record<string, string> = {
  safe: "bg-accent-finance",
  limit: "bg-amber-500",
  over: "bg-red-500",
};

const BUDGET_TEXT: Record<string, string> = {
  safe: "text-accent-finance",
  limit: "text-amber-500",
  over: "text-red-500",
};

export function BudgetCard({
  line,
  showMonth,
  ...row
}: {
  line: BudgetLine;
  showMonth?: boolean;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onLongPress: (id: string) => void;
  onOpen: () => void;
}) {
  const t = useT();
  const { budget, actual, remaining, status, ratio } = line;

  return (
    <Row id={budget.id} ring="ring-accent-finance" {...row}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold text-ink">
          {t(`category.${budget.category}`)}
        </p>
        <span className={`shrink-0 text-[11px] font-bold ${BUDGET_TEXT[status]}`}>
          {t(`money.budgetStatus.${status}`)}
        </span>
      </div>

      {showMonth && (
        <p className="mt-0.5 text-[11px] capitalize text-ink-muted">{formatMonth(budget.month)}</p>
      )}

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-raised">
        <div
          className={`h-full rounded-full transition-all ${BUDGET_TONE[status]}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-2 text-[11px] tabular-nums">
        <span className="text-ink-muted">
          {formatCurrency(actual)} / {formatCurrency(budget.planned)}
        </span>
        <span className={`font-bold ${remaining < 0 ? "text-red-500" : "text-ink-muted"}`}>
          {remaining < 0
            ? t("money.overBy", { amount: formatCurrency(-remaining) })
            : t("money.leftOver", { amount: formatCurrency(remaining) })}
        </span>
      </div>
    </Row>
  );
}

const DEBT_TEXT: Record<string, string> = {
  active: "text-accent-finance",
  paid: "text-ink-muted",
  late: "text-amber-500",
};

export function DebtCard({
  debt,
  ...row
}: {
  debt: Debt;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onLongPress: (id: string) => void;
  onOpen: () => void;
}) {
  const t = useT();
  const paid = debt.principal > 0 ? 1 - debt.remaining / debt.principal : 0;
  const overdue = debt.status === "active" && debt.dueDate !== "" && debt.dueDate < todayISO();

  return (
    <Row id={debt.id} ring="ring-red-500" {...row}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold text-ink">{debt.name}</p>
        <span
          className={`shrink-0 text-[11px] font-bold ${
            overdue ? "text-red-500" : DEBT_TEXT[debt.status]
          }`}
        >
          {overdue ? t("money.debtStatus.late") : t(`money.debtStatus.${debt.status}`)}
        </span>
      </div>

      <p className="mt-0.5 truncate text-[11px] text-ink-muted">
        {debt.creditor || t("money.noCreditor")}
        {debt.installment > 0
          ? ` · ${t("money.perMonth", { amount: formatCurrency(debt.installment) })}`
          : ""}
        {debt.dueDate ? ` · ${formatDate(debt.dueDate)}` : ""}
      </p>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-raised">
        <div
          className="h-full rounded-full bg-accent-finance transition-all"
          style={{ width: `${Math.max(0, Math.min(paid, 1)) * 100}%` }}
        />
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-2 text-[11px] tabular-nums">
        <span className="text-ink-muted">
          {t("money.ofPrincipal", { amount: formatCurrency(debt.principal) })}
        </span>
        <span className="font-bold text-ink">{formatCurrency(debt.remaining)}</span>
      </div>
    </Row>
  );
}

const PRIORITY_TONE: Record<GoalPriority, string> = {
  high: "bg-red-500/15 text-red-500",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  low: "bg-surface-raised text-ink-muted",
};

const GOAL_EMOJI: Record<string, string> = {
  emergency: "🚨",
  travel: "✈️",
  investment: "📈",
  purchase: "🛍️",
};

export function GoalCard({
  progress,
  ...row
}: {
  progress: GoalProgress;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onLongPress: (id: string) => void;
  onOpen: () => void;
}) {
  const t = useT();
  const { goal, ratio, remaining } = progress;

  return (
    <Row id={goal.id} ring="ring-brand-start" {...row}>
      <div className="flex items-center gap-2">
        <span className="text-base">{GOAL_EMOJI[goal.type] ?? "🎯"}</span>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{goal.name}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_TONE[goal.priority]}`}>
          {t(`money.priority.${goal.priority}`)}
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-raised">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-start to-brand-mid transition-all"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-2 text-[11px] tabular-nums">
        <span className="text-ink-muted">
          {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
        </span>
        <span className="font-bold text-ink">{Math.round(ratio * 100)}%</span>
      </div>

      <p className="mt-1 text-[11px] text-ink-muted">
        {remaining > 0
          ? t("money.goalRemaining", { amount: formatCurrency(remaining) })
          : t("money.goalReached")}
        {goal.deadline ? ` · ${formatDate(goal.deadline)}` : ""}
      </p>
    </Row>
  );
}
