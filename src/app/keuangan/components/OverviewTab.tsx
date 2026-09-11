"use client";

import { useMemo } from "react";
import type { Account, Debt, FinanceSettings, Goal, Transaction, Budget } from "@/types/finance";
import {
  allocationLines,
  allocationTotal,
  budgetLines,
  goalsByProgress,
  monthlyInstallments,
  monthSummary,
  needWantSplit,
  netWorth,
  overBudget,
  spendByCategory,
} from "@/lib/money";
import { currentMonthKey, formatCurrency, formatDate, formatMonth } from "@/lib/format";
import { useT } from "@/lib/i18n";

/**
 * The dashboard the template describes but never wires up. In Notion, Overview,
 * Warning Zone, Goals Progress and "This Month → Expenses" are literal typed
 * text — placeholders for linked views that were never created. Here they are
 * computed from the real data.
 */
export default function OverviewTab({
  transactions,
  accounts,
  budgets,
  debts,
  goals,
  settings,
  onGoTo,
}: {
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  debts: Debt[];
  goals: Goal[];
  settings: FinanceSettings;
  onGoTo: (tab: "transactions" | "budgets" | "accounts" | "debts" | "goals") => void;
}) {
  const t = useT();
  const month = currentMonthKey();

  const worth = useMemo(() => netWorth(accounts, transactions, debts), [accounts, transactions, debts]);
  const summary = useMemo(() => monthSummary(transactions, budgets, month), [transactions, budgets, month]);
  const monthBudgetLines = useMemo(
    () => budgetLines(budgets.filter((b) => b.month === month), transactions),
    [budgets, transactions, month]
  );
  const warnings = useMemo(() => overBudget(monthBudgetLines), [monthBudgetLines]);
  const topGoals = useMemo(() => goalsByProgress(goals).slice(0, 3), [goals]);
  const categories = useMemo(() => spendByCategory(transactions, month).slice(0, 5), [transactions, month]);
  const split = useMemo(() => needWantSplit(transactions, month), [transactions, month]);
  const installments = useMemo(() => monthlyInstallments(debts), [debts]);

  const recent = useMemo(
    () => transactions.filter((tx) => tx.date.slice(0, 7) === month).slice(0, 5),
    [transactions, month]
  );

  const allocations = useMemo(
    () => allocationLines(settings.allocations, settings.allocationBase),
    [settings]
  );
  const allocationSum = allocationTotal(settings.allocations);

  return (
    <div className="flex flex-col gap-4 px-5 pb-6">
      {/* Net worth — the template's Total Asset / Total Debt / Net Worth trio. */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-start via-brand-mid to-brand-end p-5 text-white shadow-lg shadow-brand-mid/20">
        <p className="text-xs font-medium text-white/80">{t("money.netWorth")}</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">{formatCurrency(worth.net)}</p>
        <div className="mt-4 flex gap-4">
          <button onClick={() => onGoTo("accounts")} className="flex-1 text-left">
            <p className="text-[11px] text-white/75">{t("money.totalAssets")}</p>
            <p className="text-sm font-bold">{formatCurrency(worth.assets)}</p>
          </button>
          <button onClick={() => onGoTo("debts")} className="flex-1 text-left">
            <p className="text-[11px] text-white/75">{t("money.totalDebt")}</p>
            <p className="text-sm font-bold">{formatCurrency(worth.debt)}</p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Kpi label={t("money.incomeThisMonth")} value={formatCurrency(summary.income)} tone="text-accent-finance" />
        <Kpi label={t("money.spendThisMonth")} value={formatCurrency(summary.expense)} tone="text-red-500" />
        <Kpi
          label={t("money.budgetLeft")}
          value={summary.planned > 0 ? formatCurrency(summary.budgetLeft) : "—"}
          tone={summary.budgetLeft < 0 ? "text-red-500" : "text-ink"}
        />
        <Kpi
          label={t("money.installmentsDue")}
          value={formatCurrency(installments)}
          tone="text-amber-500"
        />
      </div>

      {/* Warning Zone — budgets whose Remaining went negative. */}
      <Card title={t("money.warningZone")} onMore={() => onGoTo("budgets")}>
        {warnings.length === 0 ? (
          <Empty>{t("money.noWarnings")}</Empty>
        ) : (
          <div className="flex flex-col">
            {warnings.map((line) => (
              <div
                key={line.budget.id}
                className="flex items-center gap-2 border-b border-border/60 py-2 last:border-none"
              >
                <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-500">
                  {t("money.budgetStatus.over")}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-ink">
                  {t(`category.${line.budget.category}`)}
                </span>
                <span className="shrink-0 text-[11px] font-bold tabular-nums text-red-500">
                  {formatCurrency(-line.remaining)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={t("money.thisMonth", { month: formatMonth(month) })} onMore={() => onGoTo("transactions")}>
        {recent.length === 0 ? (
          <Empty>{t("money.noTransactionsMonth")}</Empty>
        ) : (
          <div className="flex flex-col">
            {recent.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-2 border-b border-border/60 py-2 last:border-none"
              >
                <span className="min-w-0 flex-1 truncate text-xs text-ink">
                  {tx.note || t(`category.${tx.category}`)}
                </span>
                <span className="shrink-0 text-[10px] text-ink-muted">{formatDate(tx.date)}</span>
                <span
                  className={`shrink-0 text-[11px] font-bold tabular-nums ${
                    tx.type === "income"
                      ? "text-accent-finance"
                      : tx.type === "transfer"
                        ? "text-accent-time"
                        : "text-ink"
                  }`}
                >
                  {tx.type === "income" ? "+" : tx.type === "expense" ? "−" : "⇄"}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {categories.length > 0 && (
        <Card title={t("money.topCategories")}>
          <div className="flex flex-col gap-2.5">
            {categories.map((entry) => (
              <div key={entry.category}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px]">
                  <span className="min-w-0 truncate font-semibold text-ink">
                    {t(`category.${entry.category}`)}
                  </span>
                  <span className="shrink-0 tabular-nums text-ink-muted">
                    {formatCurrency(entry.amount)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className="h-full rounded-full bg-accent-finance"
                    style={{ width: `${entry.ratio * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {split.total > 0 && (
            <div className="mt-4 border-t border-border/60 pt-3">
              <p className="mb-2 text-[11px] font-semibold text-ink-muted">{t("money.needVsWant")}</p>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-raised">
                {split.need > 0 && (
                  <div className="bg-accent-finance" style={{ width: `${(split.need / split.total) * 100}%` }} />
                )}
                {split.want > 0 && (
                  <div className="bg-amber-500" style={{ width: `${(split.want / split.total) * 100}%` }} />
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
                <Legend className="bg-accent-finance" label={`${t("money.needWant.need")} ${formatCurrency(split.need)}`} />
                <Legend className="bg-amber-500" label={`${t("money.needWant.want")} ${formatCurrency(split.want)}`} />
                {split.untagged > 0 && (
                  <Legend className="bg-border" label={`${t("money.untagged")} ${formatCurrency(split.untagged)}`} />
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Goals Progress — sorted descending, as the template's note asks. */}
      <Card title={t("money.goalsProgress")} onMore={() => onGoTo("goals")}>
        {topGoals.length === 0 ? (
          <Empty>{t("money.noGoals")}</Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {topGoals.map(({ goal, ratio }) => (
              <div key={goal.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px]">
                  <span className="min-w-0 truncate font-semibold text-ink">{goal.name}</span>
                  <span className="shrink-0 font-bold tabular-nums text-ink-muted">
                    {Math.round(ratio * 100)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-start to-brand-mid"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* The template's static percentage table, now doing arithmetic. */}
      <Card title={t("money.allocationPlan")}>
        {settings.allocationBase <= 0 ? (
          <Empty>{t("money.allocationEmpty")}</Empty>
        ) : (
          <>
            <div className="flex flex-col">
              {allocations.map((line) => (
                <div
                  key={line.label}
                  className="flex items-center gap-2.5 border-b border-border/60 py-2.5 last:border-none"
                >
                  <span className="shrink-0 text-base">{line.emoji}</span>
                  {/* Name over priority, so a long label keeps the full width
                      instead of fighting the numbers for room. */}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-ink">{line.label}</span>
                    <span className="block text-[10px] text-ink-muted">
                      {t(`money.allocationPriority.${line.priority}`)} · {line.percent}%
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs font-bold tabular-nums text-ink">
                    {formatCurrency(line.amount)}
                  </span>
                </div>
              ))}
            </div>
            {allocationSum !== 100 && (
              <p className="mt-2 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] text-amber-600 dark:text-amber-400">
                {t("money.allocationMismatch", { total: allocationSum })}
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-surface-card p-3.5 ring-1 ring-border/60">
      <p className={`truncate text-base font-extrabold tabular-nums ${tone}`}>{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-ink-muted">{label}</p>
    </div>
  );
}

function Card({
  title,
  onMore,
  children,
}: {
  title: string;
  onMore?: () => void;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <section className="rounded-2xl bg-surface-card p-4 ring-1 ring-border/60">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="min-w-0 truncate text-[11px] font-bold uppercase tracking-wide text-ink-muted">
          {title}
        </h2>
        {onMore && (
          <button onClick={onMore} className="shrink-0 text-[11px] font-semibold text-accent-time">
            {t("money.seeAll")}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-1 text-xs text-ink-muted">{children}</p>;
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}
