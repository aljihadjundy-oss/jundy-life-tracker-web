"use client";

import { useState } from "react";
import { DEBT_STATUSES, type Debt, type DebtStatus, type NewDebt } from "@/types/finance";
import { useT } from "@/lib/i18n";
import Sheet, { AmountInput, Chips, Field, inputClass } from "./Sheet";

export default function DebtForm({
  initial,
  onSubmit,
  onDelete,
  onClose,
}: {
  initial?: Debt | null;
  onSubmit: (data: NewDebt) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [creditor, setCreditor] = useState(initial?.creditor ?? "");
  const [principal, setPrincipal] = useState(initial ? String(initial.principal) : "");
  const [remaining, setRemaining] = useState(initial ? String(initial.remaining) : "");
  const [installment, setInstallment] = useState(initial ? String(initial.installment) : "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [interest, setInterest] = useState(initial ? String(initial.interest) : "0");
  const [note, setNote] = useState(initial?.note ?? "");
  const [status, setStatus] = useState<DebtStatus>(initial?.status ?? "active");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const principalValue = Number(principal) || 0;
      await onSubmit({
        name: name.trim(),
        creditor: creditor.trim(),
        principal: principalValue,
        // Blank means nothing has been paid off yet.
        remaining: remaining === "" ? principalValue : Number(remaining) || 0,
        installment: Number(installment) || 0,
        dueDate,
        interest: Number(interest) || 0,
        note: note.trim(),
        status,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      title={initial ? t("money.editDebt") : t("money.newDebt")}
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
      <Field label={t("money.debtName")}>
        <input
          type="text"
          required
          autoFocus={!initial}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("money.debtPlaceholder")}
          className={inputClass}
        />
      </Field>

      <Field label={t("money.creditor")}>
        <input
          type="text"
          value={creditor}
          onChange={(e) => setCreditor(e.target.value)}
          placeholder={t("money.creditorPlaceholder")}
          className={inputClass}
        />
      </Field>

      <Field label={t("money.principal")}>
        <AmountInput value={principal} onChange={setPrincipal} />
      </Field>

      <Field label={t("money.remainingDebt")}>
        <AmountInput value={remaining} onChange={setRemaining} />
      </Field>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
            {t("money.installment")}
          </span>
          <AmountInput value={installment} onChange={setInstallment} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
            {t("money.interest")}
          </span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className={`${inputClass} tabular-nums`}
          />
        </label>
      </div>

      <Field label={`${t("money.dueDate")} ${t("app.optional")}`}>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={`${inputClass} tabular-nums`}
        />
      </Field>

      <div className="mb-4">
        <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("time.status")}</span>
        <Chips
          options={DEBT_STATUSES}
          selected={status}
          label={(value) => t(`money.debtStatus.${value}`)}
          onSelect={setStatus}
        />
      </div>

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
