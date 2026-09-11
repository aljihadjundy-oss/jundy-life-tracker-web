"use client";

import { useT } from "@/lib/i18n";

/** The bottom sheet every finance form shares. */
export default function Sheet({
  title,
  onClose,
  onSubmit,
  onDelete,
  submitting,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
  submitting: boolean;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-6" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_0.25s_ease-out] md:max-w-lg md:rounded-3xl md:pb-5 md:animate-[popIn_0.18s_ease-out]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        <h2 className="mb-4 text-base font-extrabold text-ink">{title}</h2>

        {children}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-2xl bg-ink py-4 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-50"
        >
          {submitting ? t("app.saving") : t("app.save")}
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="mt-3 w-full rounded-2xl py-3 text-sm font-semibold text-red-500 transition active:scale-95"
          >
            {t("app.delete")}
          </button>
        )}
      </form>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-ink outline-none focus:border-ink";

export function Chips<T extends string | number>({
  options,
  selected,
  label,
  onSelect,
}: {
  options: readonly T[];
  selected: T;
  label: (value: T) => string;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
            selected === option ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
          }`}
        >
          {label(option)}
        </button>
      ))}
    </div>
  );
}

/** Amount input that shows thousands separators while you type. */
export function AmountInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (next: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoFocus={autoFocus}
      value={value === "" ? "" : Number(value).toLocaleString("id-ID")}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      placeholder="0"
      className={`${inputClass} text-lg font-bold tabular-nums`}
    />
  );
}
