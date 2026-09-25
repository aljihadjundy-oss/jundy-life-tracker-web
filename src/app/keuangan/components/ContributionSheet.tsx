"use client";

import { useState } from "react";
import type { Account } from "@/types/finance";
import { useT } from "@/lib/i18n";
import Sheet, { AmountInput, Field, inputClass } from "./Sheet";

/**
 * Shared by "+ Setor" on a goal and "+ Bayar" on a debt — both are just
 * "an amount left an account, toward this thing" with a different label.
 */
export default function ContributionSheet({
  title,
  hint,
  accounts,
  onSubmit,
  onClose,
}: {
  title: string;
  hint: string;
  accounts: Account[];
  onSubmit: (amount: number, accountId: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const value = Number(amount) || 0;
    if (value <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit(value, accountId);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet title={title} onClose={onClose} onSubmit={submit} submitting={submitting}>
      <p className="mb-4 text-[11px] leading-relaxed text-ink-muted">{hint}</p>
      <Field label={t("finance.amount")}>
        <AmountInput value={amount} onChange={setAmount} autoFocus />
      </Field>
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
