"use client";

import { useState } from "react";
import {
  categoriesFor,
  categoryLabel,
  type Account,
  type NewRecurringTransaction,
} from "@/types/finance";
import { useT } from "@/lib/i18n";
import Sheet, { AmountInput, Field, inputClass } from "./Sheet";

export default function RecurringTransactionForm({
  accounts,
  customCategories,
  onSubmit,
  onClose,
}: {
  accounts: Account[];
  customCategories: string[];
  onSubmit: (data: NewRecurringTransaction) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Tagihan");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);

  const categories = type === "expense" ? [...categoriesFor("expense"), ...customCategories] : categoriesFor("income");

  function changeType(next: "income" | "expense") {
    setType(next);
    const list = next === "expense" ? [...categoriesFor("expense"), ...customCategories] : categoriesFor("income");
    if (!list.includes(category)) setCategory(list[0]);
  }

  async function submit() {
    const value = Number(amount) || 0;
    if (!name.trim() || value <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), type, amount: value, category, accountId });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet title={t("money.newRecurring")} onClose={onClose} onSubmit={submit} submitting={submitting}>
      <p className="mb-4 text-[11px] leading-relaxed text-ink-muted">{t("money.newRecurringHint")}</p>

      <Field label={t("money.recurringName")}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("money.recurringNamePlaceholder")}
          className={inputClass}
        />
      </Field>

      <div className="mb-4 flex gap-2">
        {(["expense", "income"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => changeType(option)}
            className={`flex-1 rounded-full px-3 py-2.5 text-xs font-bold transition ${
              type === option
                ? option === "income"
                  ? "bg-accent-finance text-white"
                  : "bg-red-500 text-white"
                : "bg-surface-raised text-ink-muted"
            }`}
          >
            {t(`money.type.${option}`)}
          </button>
        ))}
      </div>

      <Field label={t("finance.amount")}>
        <AmountInput value={amount} onChange={setAmount} autoFocus />
      </Field>

      <div className="mb-4">
        <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("finance.category")}</span>
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
              {categoryLabel(option, t)}
            </button>
          ))}
        </div>
      </div>

      {accounts.length > 0 && (
        <Field label={t("money.account")}>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
            <option value="">{t("money.noAccount")}</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </Field>
      )}
    </Sheet>
  );
}
