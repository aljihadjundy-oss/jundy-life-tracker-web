"use client";

import { useState } from "react";
import { ACCOUNT_TYPES, type Account, type AccountType, type NewAccount } from "@/types/finance";
import { todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n";
import Sheet, { AmountInput, Chips, Field, inputClass } from "./Sheet";

export default function AccountForm({
  initial,
  onSubmit,
  onDelete,
  onClose,
}: {
  initial?: Account | null;
  onSubmit: (data: NewAccount) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AccountType>(initial?.type ?? "bank");
  const [balance, setBalance] = useState(initial ? String(initial.openingBalance) : "");
  const [asOf, setAsOf] = useState(initial?.asOf || todayISO());
  const [note, setNote] = useState(initial?.note ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        openingBalance: Number(balance) || 0,
        asOf,
        note: note.trim(),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      title={initial ? t("money.editAccount") : t("money.newAccount")}
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
      <Field label={t("money.accountName")}>
        <input
          type="text"
          required
          autoFocus={!initial}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("money.accountPlaceholder")}
          className={inputClass}
        />
      </Field>

      <div className="mb-4">
        <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("money.accountType")}</span>
        <Chips
          options={ACCOUNT_TYPES}
          selected={type}
          label={(value) => t(`money.accountType.${value}`)}
          onSelect={setType}
        />
      </div>

      <Field label={t("money.balanceAsOf")}>
        <AmountInput value={balance} onChange={setBalance} />
      </Field>

      <Field label={t("money.countedOn")}>
        <input
          type="date"
          value={asOf}
          max={todayISO()}
          onChange={(e) => setAsOf(e.target.value)}
          className={`${inputClass} tabular-nums`}
        />
      </Field>

      <p className="-mt-2 mb-4 rounded-xl bg-surface-raised px-3 py-2.5 text-[11px] leading-relaxed text-ink-muted">
        {t("money.balanceHint")}
      </p>

      <Field label={t("finance.note")}>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
        />
      </Field>
    </Sheet>
  );
}
