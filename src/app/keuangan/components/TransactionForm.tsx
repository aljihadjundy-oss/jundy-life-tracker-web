"use client";

import { useState } from "react";
import {
  TRANSACTION_TYPES,
  TRANSFER_CATEGORY,
  categoriesFor,
  type Account,
  type NeedWant,
  type NewTransaction,
  type Transaction,
  type TransactionStatus,
  type TransactionType,
} from "@/types/finance";
import { todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n";
import Sheet, { AmountInput, Field, inputClass } from "./Sheet";

const NEED_WANT: NeedWant[] = ["", "need", "want"];
const STATUSES: TransactionStatus[] = ["done", "pending"];

export default function TransactionForm({
  initial,
  accounts,
  onSubmit,
  onDelete,
  onClose,
}: {
  initial?: Transaction | null;
  accounts: Account[];
  onSubmit: (data: NewTransaction) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? "Makan");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [accountId, setAccountId] = useState(initial?.accountId ?? accounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(initial?.toAccountId ?? "");
  const [needWant, setNeedWant] = useState<NeedWant>(initial?.needWant ?? "");
  const [fixed, setFixed] = useState(initial?.fixed ?? false);
  const [status, setStatus] = useState<TransactionStatus>(initial?.status ?? "done");
  const [note, setNote] = useState(initial?.note ?? "");
  const [submitting, setSubmitting] = useState(false);

  const categories = categoriesFor(type);

  function changeType(next: TransactionType) {
    setType(next);
    // Keep the category valid for the new type.
    const list = categoriesFor(next);
    if (!list.includes(category)) setCategory(list[0]);
  }

  async function submit() {
    const value = Number(amount) || 0;
    if (value <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        type,
        amount: value,
        category: type === "transfer" ? TRANSFER_CATEGORY : category,
        note: note.trim(),
        date,
        accountId,
        toAccountId: type === "transfer" ? toAccountId : "",
        needWant: type === "expense" ? needWant : "",
        fixed,
        status,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      title={initial ? t("money.editTransaction") : t("finance.newTransaction")}
      onClose={onClose}
      onSubmit={submit}
      submitting={submitting}
      onDelete={
        initial && onDelete
          ? async () => {
              await onDelete(initial.id);
              onClose();
            }
          : undefined
      }
    >
      <div className="mb-4 flex gap-2">
        {TRANSACTION_TYPES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => changeType(option)}
            className={`flex-1 rounded-full px-3 py-2.5 text-xs font-bold transition ${
              type === option
                ? option === "income"
                  ? "bg-accent-finance text-white"
                  : option === "expense"
                    ? "bg-red-500 text-white"
                    : "bg-accent-time text-white"
                : "bg-surface-raised text-ink-muted"
            }`}
          >
            {t(`money.type.${option}`)}
          </button>
        ))}
      </div>

      <Field label={t("finance.amount")}>
        <AmountInput value={amount} onChange={setAmount} autoFocus={!initial} />
      </Field>

      {type !== "transfer" && (
        <div className="mb-4">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
            {t("finance.category")}
          </span>
          <div className="flex flex-wrap gap-2">
            {categories.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  category === option ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
                }`}
              >
                {t(`category.${option}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <Field label={t("finance.date")}>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`${inputClass} tabular-nums`}
        />
      </Field>

      {accounts.length > 0 && (
        <Field label={type === "transfer" ? t("money.fromAccount") : t("money.account")}>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className={inputClass}
          >
            <option value="">{t("money.noAccount")}</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {accounts.length > 0 && accountId === "" && (
        <p className="-mt-2 mb-4 rounded-xl bg-amber-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
          {t("money.noAccountWarning")}
        </p>
      )}

      {type === "transfer" && accounts.length > 0 && (
        <Field label={t("money.toAccount")}>
          <select
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            className={inputClass}
          >
            <option value="">{t("money.noAccount")}</option>
            {accounts
              .filter((account) => account.id !== accountId)
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
          </select>
        </Field>
      )}

      {type === "expense" && (
        <div className="mb-4">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
            {t("money.needWant")}
          </span>
          <div className="flex gap-2">
            {NEED_WANT.map((option) => (
              <button
                key={option || "none"}
                type="button"
                onClick={() => setNeedWant(option)}
                className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                  needWant === option ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
                }`}
              >
                {t(`money.needWant.${option || "none"}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {STATUSES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setStatus(option)}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
              status === option ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
            }`}
          >
            {t(`money.status.${option}`)}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setFixed((v) => !v)}
        className="mb-4 flex w-full items-center justify-between rounded-2xl bg-surface-raised p-4 text-left"
      >
        <span className="min-w-0 pr-3">
          <span className="block text-xs font-semibold text-ink">{t("money.fixed")}</span>
          <span className="block text-[11px] text-ink-muted">{t("money.fixedHint")}</span>
        </span>
        <span
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            fixed ? "bg-accent-time" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              fixed ? "left-[1.375rem]" : "left-0.5"
            }`}
          />
        </span>
      </button>

      <Field label={t("finance.note")}>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("finance.notePlaceholder")}
          className={inputClass}
        />
      </Field>
    </Sheet>
  );
}
