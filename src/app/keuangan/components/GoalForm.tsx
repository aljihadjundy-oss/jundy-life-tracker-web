"use client";

import { useState } from "react";
import {
  GOAL_PRIORITIES,
  GOAL_TYPES,
  type Goal,
  type GoalPriority,
  type GoalType,
  type NewGoal,
} from "@/types/finance";
import { useT } from "@/lib/i18n";
import Sheet, { AmountInput, Chips, Field, inputClass } from "./Sheet";

export default function GoalForm({
  initial,
  onSubmit,
  onDelete,
  onClose,
}: {
  initial?: Goal | null;
  onSubmit: (data: NewGoal) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [target, setTarget] = useState(initial ? String(initial.targetAmount) : "");
  const [current, setCurrent] = useState(initial ? String(initial.currentAmount) : "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [priority, setPriority] = useState<GoalPriority>(initial?.priority ?? "medium");
  const [type, setType] = useState<GoalType>(initial?.type ?? "purchase");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        targetAmount: Number(target) || 0,
        currentAmount: Number(current) || 0,
        deadline,
        priority,
        type,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      title={initial ? t("money.editGoal") : t("money.newGoal")}
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
      <Field label={t("money.goalName")}>
        <input
          type="text"
          required
          autoFocus={!initial}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("money.goalPlaceholder")}
          className={inputClass}
        />
      </Field>

      <Field label={t("money.targetAmount")}>
        <AmountInput value={target} onChange={setTarget} />
      </Field>

      <Field label={t("money.currentAmount")}>
        <AmountInput value={current} onChange={setCurrent} />
      </Field>

      <Field label={`${t("money.deadline")} ${t("app.optional")}`}>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={`${inputClass} tabular-nums`}
        />
      </Field>

      <div className="mb-4">
        <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("money.goalType")}</span>
        <Chips
          options={GOAL_TYPES}
          selected={type}
          label={(value) => t(`money.goalType.${value}`)}
          onSelect={setType}
        />
      </div>

      <div className="mb-4">
        <span className="mb-1.5 block text-xs font-medium text-ink-muted">{t("money.priority")}</span>
        <Chips
          options={GOAL_PRIORITIES}
          selected={priority}
          label={(value) => t(`money.priority.${value}`)}
          onSelect={setPriority}
        />
      </div>
    </Sheet>
  );
}
